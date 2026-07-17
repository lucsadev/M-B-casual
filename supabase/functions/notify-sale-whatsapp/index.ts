import { createClient } from '@supabase/supabase-js';

type NotificationStatus = 'sent' | 'failed' | 'skipped';

interface NotifyRequest {
  order_id?: string;
}

interface OrderRow {
  id: string;
  customer_id: string;
  customer_name: string | null;
  status: string;
  total: number;
  payment_method: string | null;
  created_at: string;
  customers: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface WhatsAppResponse {
  messages?: { id?: string }[];
  error?: { message?: string };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function getOptionalEnv(name: string, fallback: string): string {
  return Deno.env.get(name) ?? fallback;
}

function getSupabaseSecretKey(): string {
  const legacyServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacyServiceRoleKey) return legacyServiceRoleKey;

  const secretKeysJson = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (!secretKeysJson) throw new Error('Missing Supabase secret key');

  const secretKeys = JSON.parse(secretKeysJson) as Record<string, string>;
  if (!secretKeys.default) throw new Error('Missing default Supabase secret key');

  return secretKeys.default;
}

function getSupabasePublishableKey(): string {
  const legacyAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (legacyAnonKey) return legacyAnonKey;

  const publishableKeysJson = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  if (!publishableKeysJson) throw new Error('Missing Supabase publishable key');

  const publishableKeys = JSON.parse(publishableKeysJson) as Record<string, string>;
  if (!publishableKeys.default) throw new Error('Missing default Supabase publishable key');

  return publishableKeys.default;
}

function parseAdminNumbers(): string[] {
  return getEnv('ADMIN_WHATSAPP_NUMBERS')
    .split(',')
    .map((number) => number.trim().replace(/[^\d]/g, ''))
    .filter(Boolean);
}

function formatCurrencyARS(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

function getCustomerName(order: OrderRow): string {
  if (order.customer_name?.trim()) return order.customer_name.trim();

  const firstName = order.customers?.first_name ?? '';
  const lastName = order.customers?.last_name ?? '';
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || 'Cliente sin nombre';
}

async function insertNotificationLog(
  supabaseAdmin: ReturnType<typeof createClient>,
  input: {
    orderId: string;
    recipient?: string;
    status: NotificationStatus;
    providerMessageId?: string;
    providerResponse?: unknown;
    errorMessage?: string;
  },
) {
  await supabaseAdmin.from('notification_logs').insert({
    order_id: input.orderId,
    channel: 'whatsapp',
    event: 'pending_order_admin',
    recipient: input.recipient ?? null,
    status: input.status,
    provider_message_id: input.providerMessageId ?? null,
    provider_response: input.providerResponse ?? null,
    error_message: input.errorMessage ?? null,
  });
}

async function sendWhatsAppTemplate(input: {
  to: string;
  order: OrderRow;
  accessToken: string;
  phoneNumberId: string;
  apiVersion: string;
  templateName: string;
  templateLanguage: string;
}): Promise<WhatsAppResponse> {
  const response = await fetch(
    `https://graph.facebook.com/${input.apiVersion}/${input.phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: input.to,
        type: 'template',
        template: {
          name: input.templateName,
          language: { code: input.templateLanguage },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: input.order.id.slice(0, 8) },
                { type: 'text', text: getCustomerName(input.order) },
                { type: 'text', text: formatCurrencyARS(input.order.total) },
              ],
            },
          ],
        },
      }),
    },
  );

  const result = (await response.json()) as WhatsAppResponse;

  if (!response.ok) {
    throw new Error(result.error?.message ?? `WhatsApp API error ${response.status}`);
  }

  return result;
}

Deno.serve(async (req) => {
  let requestOrderId: string | undefined;

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405, headers: corsHeaders },
    );
  }

  try {
    const body = (await req.json()) as NotifyRequest;
    const orderId = body.order_id;
    requestOrderId = orderId;
    if (!orderId) {
      return Response.json(
        { error: 'order_id is required' },
        { status: 400, headers: corsHeaders },
      );
    }

    const supabaseUrl = getEnv('SUPABASE_URL');
    const authorization = req.headers.get('Authorization') ?? '';

    const supabaseUser = createClient(supabaseUrl, getSupabasePublishableKey(), {
      global: { headers: { Authorization: authorization } },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData.user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, getSupabaseSecretKey());

    const { data: existingOrder, error: existingOrderError } = await supabaseAdmin
      .from('orders')
      .select('id, customer_id, status, customers(user_id)')
      .eq('id', orderId)
      .maybeSingle<{ id: string; customer_id: string; status: string; customers: { user_id: string } | null }>();

    if (existingOrderError) throw existingOrderError;
    if (!existingOrder) {
      return Response.json(
        { error: 'Order not found' },
        { status: 404, headers: corsHeaders },
      );
    }

    const isAdmin = userData.user.app_metadata?.role === 'admin';
    const isOwner = existingOrder.customers?.user_id === userData.user.id;
    if (!isAdmin && !isOwner) {
      return Response.json(
        { error: 'Forbidden' },
        { status: 403, headers: corsHeaders },
      );
    }

    const now = new Date().toISOString();
    const { data: order, error: claimError } = await supabaseAdmin
      .from('orders')
      .update({
        whatsapp_pending_notification_status: 'sending',
        whatsapp_pending_notification_attempted_at: now,
        whatsapp_pending_notification_error: null,
      })
      .eq('id', orderId)
      .eq('status', 'pending')
      .in('whatsapp_pending_notification_status', ['not_sent', 'failed'])
      .select('id, customer_id, customer_name, status, total, payment_method, created_at, customers(user_id, first_name, last_name)')
      .maybeSingle<OrderRow>();

    if (claimError) throw claimError;
    if (!order) {
      await insertNotificationLog(supabaseAdmin, {
        orderId,
        status: 'skipped',
        errorMessage: 'Order is not pending or notification was already claimed',
      });

      return Response.json(
        { status: 'skipped' },
        { status: 200, headers: corsHeaders },
      );
    }

    const recipients = parseAdminNumbers();
    if (recipients.length === 0) {
      throw new Error('ADMIN_WHATSAPP_NUMBERS has no valid phone numbers');
    }

    const accessToken = getEnv('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = getEnv('WHATSAPP_PHONE_NUMBER_ID');
    const apiVersion = getOptionalEnv('WHATSAPP_API_VERSION', 'v23.0');
    const templateName = getOptionalEnv('WHATSAPP_TEMPLATE_NAME', 'new_pending_order_admin');
    const templateLanguage = getOptionalEnv('WHATSAPP_TEMPLATE_LANGUAGE', 'es_AR');

    const { data: sentLogs, error: sentLogsError } = await supabaseAdmin
      .from('notification_logs')
      .select('recipient')
      .eq('order_id', order.id)
      .eq('channel', 'whatsapp')
      .eq('event', 'pending_order_admin')
      .eq('status', 'sent');

    if (sentLogsError) throw sentLogsError;

    const alreadySentRecipients = new Set(
      (sentLogs ?? [])
        .map((log) => log.recipient)
        .filter((recipient): recipient is string => Boolean(recipient)),
    );

    const pendingRecipients = recipients.filter(
      (recipient) => !alreadySentRecipients.has(recipient),
    );

    const failures: string[] = [];

    for (const recipient of pendingRecipients) {
      try {
        const result = await sendWhatsAppTemplate({
          to: recipient,
          order,
          accessToken,
          phoneNumberId,
          apiVersion,
          templateName,
          templateLanguage,
        });

        await insertNotificationLog(supabaseAdmin, {
          orderId,
          recipient,
          status: 'sent',
          providerMessageId: result.messages?.[0]?.id,
          providerResponse: result,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        failures.push(`${recipient}: ${message}`);

        await insertNotificationLog(supabaseAdmin, {
          orderId,
          recipient,
          status: 'failed',
          errorMessage: message,
        });
      }
    }

    if (failures.length > 0) {
      throw new Error(failures.join('; '));
    }

    await supabaseAdmin
      .from('orders')
      .update({
        whatsapp_pending_notification_status: 'sent',
        whatsapp_pending_notified_at: new Date().toISOString(),
        whatsapp_pending_notification_error: null,
      })
      .eq('id', orderId);

    return Response.json(
      { status: 'sent', recipients: recipients.length },
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    try {
      if (requestOrderId) {
        const supabaseAdmin = createClient(getEnv('SUPABASE_URL'), getSupabaseSecretKey());
        await supabaseAdmin
          .from('orders')
          .update({
            whatsapp_pending_notification_status: 'failed',
            whatsapp_pending_notification_error: message,
          })
          .eq('id', requestOrderId)
          .eq('whatsapp_pending_notification_status', 'sending');

        await insertNotificationLog(supabaseAdmin, {
          orderId: requestOrderId,
          status: 'failed',
          errorMessage: message,
        });
      }
    } catch {
      // Avoid masking the original error while best-effort logging.
    }

    return Response.json(
      { error: message },
      { status: 500, headers: corsHeaders },
    );
  }
});
