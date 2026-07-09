/**
 * Stock Check — Supabase Edge Function
 *
 * Returns inventory alerts for low-stock and out-of-stock products.
 * Also returns total stock value and product counts.
 * Only callable by admin users.
 *
 * GET /functions/v1/stock-check
 *
 * Response:
 * {
 *   "low_stock": [ ... ],
 *   "out_of_stock": [ ... ],
 *   "summary": {
 *     "total_products": 10,
 *     "low_stock_count": 2,
 *     "out_of_stock_count": 1,
 *     "total_stock_value": 250000
 *   }
 * }
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// ---------------------------------------------------------------------------
// CORS headers
// ---------------------------------------------------------------------------

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StockAlert {
  product_id: string;
  product_name: string;
  variant_id: string;
  size: string | null;
  color: string | null;
  stock: number;
  sku: string | null;
}

interface StockSummary {
  total_products: number;
  total_variants: number;
  low_stock_count: number;
  out_of_stock_count: number;
  in_stock_count: number;
  total_stock_value: number;
}

interface StockCheckResponse {
  low_stock: StockAlert[];
  out_of_stock: StockAlert[];
  summary: StockSummary;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with user's auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      },
    );

    // Verify admin role
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const isAdmin = user.app_metadata?.role === 'admin';
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Fetch all variants with product info
    const { data: variants, error: variantsError } = await supabaseClient
      .from('product_variants')
      .select('id, product_id, size, color, stock, sku, products!inner(id, name, price, is_active)')
      .eq('products.is_active', true)
      .order('stock', { ascending: true });

    if (variantsError) {
      throw variantsError;
    }

    // Categorize variants
    const lowStock: StockAlert[] = [];
    const outOfStock: StockAlert[] = [];
    let totalStockValue = 0;
    const productIds = new Set<string>();

    for (const v of variants ?? []) {
      const product = (v as any).products;
      if (!product) continue;

      productIds.add(product.id);
      totalStockValue += product.price * v.stock;

      const alert: StockAlert = {
        product_id: v.product_id,
        product_name: product.name,
        variant_id: v.id,
        size: v.size,
        color: v.color,
        stock: v.stock,
        sku: v.sku,
      };

      if (v.stock === 0) {
        outOfStock.push(alert);
      } else if (v.stock < 5) {
        lowStock.push(alert);
      }
    }

    // Count categories
    const lowStockProductIds = new Set(lowStock.map((a) => a.product_id));
    const outOfStockProductIds = new Set(outOfStock.map((a) => a.product_id));

    const response: StockCheckResponse = {
      low_stock: lowStock.sort((a, b) => a.stock - b.stock),
      out_of_stock: outOfStock,
      summary: {
        total_products: productIds.size,
        total_variants: (variants ?? []).length,
        low_stock_count: lowStockProductIds.size,
        out_of_stock_count: outOfStockProductIds.size,
        in_stock_count: productIds.size - lowStockProductIds.size - outOfStockProductIds.size,
        total_stock_value: totalStockValue,
      },
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Stock check error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
