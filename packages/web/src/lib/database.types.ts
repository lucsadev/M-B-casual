/**
 * Database type definitions for Supabase client.
 *
 * Maps Postgres tables to their TypeScript row types.
 * Generated types should replace this file when `supabase gen types`
 * is run against the production database.
 *
 * For now, these are manually aligned with the SQL schema
 * and the @mbt/shared type interfaces.
 */

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          compare_price: number | null;
          images: string[];
          tags: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          slug: string;
          description?: string | null;
          price: number;
          compare_price?: number | null;
          images?: string[];
          tags?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          compare_price?: number | null;
          images?: string[];
          tags?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          size: string | null;
          color: string | null;
          color_hex: string | null;
          stock: number;
          sku: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          size?: string | null;
          color?: string | null;
          color_hex?: string | null;
          stock?: number;
          sku?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          size?: string | null;
          color?: string | null;
          color_hex?: string | null;
          stock?: number;
          sku?: string | null;
          created_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          variant_id?: string | null;
          quantity: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          variant_id?: string | null;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          address: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          address?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          address?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          status: string;
          total: number;
          shipping_cost: number;
          discount: number;
          payment_method: string | null;
          payment_status: string;
          notes: string | null;
          shipping_address: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          status?: string;
          total: number;
          shipping_cost?: number;
          discount?: number;
          payment_method?: string | null;
          payment_status?: string;
          notes?: string | null;
          shipping_address?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          status?: string;
          total?: number;
          shipping_cost?: number;
          discount?: number;
          payment_method?: string | null;
          payment_status?: string;
          notes?: string | null;
          shipping_address?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          unit_price: number;
          subtotal: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          variant_id?: string | null;
          quantity: number;
          unit_price: number;
          subtotal: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          variant_id?: string | null;
          quantity?: number;
          unit_price?: number;
          subtotal?: number;
        };
      };
      purchases: {
        Row: {
          id: string;
          supplier_name: string;
          invoice_number: string | null;
          total: number;
          notes: string | null;
          purchase_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          supplier_name: string;
          invoice_number?: string | null;
          total: number;
          notes?: string | null;
          purchase_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          supplier_name?: string;
          invoice_number?: string | null;
          total?: number;
          notes?: string | null;
          purchase_date?: string;
          created_at?: string;
        };
      };
      purchase_items: {
        Row: {
          id: string;
          purchase_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          unit_cost: number;
          subtotal: number;
        };
        Insert: {
          id?: string;
          purchase_id: string;
          product_id: string;
          variant_id?: string | null;
          quantity: number;
          unit_cost: number;
          subtotal: number;
        };
        Update: {
          id?: string;
          purchase_id?: string;
          product_id?: string;
          variant_id?: string | null;
          quantity?: number;
          unit_cost?: number;
          subtotal?: number;
        };
      };
      expenses: {
        Row: {
          id: string;
          description: string;
          amount: number;
          category: string;
          expense_date: string;
          receipt_url: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          description: string;
          amount: number;
          category: string;
          expense_date?: string;
          receipt_url?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          description?: string;
          amount?: number;
          category?: string;
          expense_date?: string;
          receipt_url?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      cash_movements: {
        Row: {
          id: string;
          type: string;
          amount: number;
          description: string;
          reference_type: string | null;
          reference_id: string | null;
          movement_date: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          amount: number;
          description: string;
          reference_type?: string | null;
          reference_id?: string | null;
          movement_date?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          amount?: number;
          description?: string;
          reference_type?: string | null;
          reference_id?: string | null;
          movement_date?: string;
          created_by?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      monthly_sales: {
        Row: {
          month: string;
          total_orders: number;
          revenue: number;
          avg_ticket: number;
        };
      };
      low_stock: {
        Row: {
          product_name: string;
          size: string | null;
          color: string | null;
          stock: number;
        };
      };
      daily_sales: {
        Row: {
          day: string;
          total_orders: number;
          revenue: number;
          unique_customers: number;
        };
      };
      top_products: {
        Row: {
          id: string;
          name: string;
          price: number;
          units_sold: number;
          order_count: number;
          total_revenue: number;
        };
      };
      product_profitability: {
        Row: {
          id: string;
          name: string;
          price: number;
          units_sold: number;
          total_revenue: number;
          estimated_cogs: number;
          margin_percent: number;
          gross_profit: number;
        };
      };
      customer_summary: {
        Row: {
          id: string;
          first_name: string;
          last_name: string | null;
          phone: string | null;
          customer_since: string;
          total_orders: number;
          total_spent: number;
          last_order_date: string | null;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      set_admin_role: {
        Args: { target_user_id: string };
        Returns: void;
      };
      remove_admin_role: {
        Args: { target_user_id: string };
        Returns: void;
      };
      get_admin_users: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          email: string;
          created_at: string;
        }[];
      };
      ensure_storage_buckets: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: {
      order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    };
  };
}
