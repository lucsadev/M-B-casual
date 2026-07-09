/**
 * Admin Create User — Supabase Edge Function
 *
 * Creates a new user in auth.users with the admin role.
 * Only callable by existing admin users (verified via JWT).
 *
 * POST /functions/v1/admin-create-user
 * {
 *   "email": "admin@mbtrend.com",
 *   "password": "secure-password",
 *   "first_name": "Marianela",
 *   "last_name": "Admin"
 * }
 *
 * Response: { "id": "user-uuid", "email": "admin@mbtrend.com" }
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

interface CreateUserRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

interface ErrorResponse {
  error: string;
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
    // Only allow POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' } satisfies ErrorResponse),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization') ?? '' },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' } satisfies ErrorResponse),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (user.app_metadata?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' } satisfies ErrorResponse),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Parse request body after authorization succeeds.
    const body: CreateUserRequest = await req.json();

    // Validate required fields
    if (!body.email || !body.password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' } satisfies ErrorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' } satisfies ErrorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Validate password length
    if (body.password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' } satisfies ErrorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Create Supabase admin client (uses service_role key from environment)
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Create the user in auth
    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        first_name: body.first_name ?? '',
        last_name: body.last_name ?? '',
      },
      app_metadata: {
        role: 'admin',
        provider: 'email',
      },
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message } satisfies ErrorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Update the customer profile with name
    if (authUser.user && (body.first_name || body.last_name)) {
      const { error: customerError } = await supabaseAdmin
        .from('customers')
        .update({
          first_name: body.first_name ?? '',
          last_name: body.last_name ?? '',
        })
        .eq('user_id', authUser.user.id);

      if (customerError) {
        console.error('Failed to update customer profile:', customerError);
      }
    }

    return new Response(
      JSON.stringify({
        id: authUser.user?.id,
        email: authUser.user?.email,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' } satisfies ErrorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
