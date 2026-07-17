-- =============================================================
-- M&B Trend — WhatsApp notifications for pending orders
-- Migration: 20260716180344_order_whatsapp_notifications.sql
-- Description: Adds idempotent notification state and audit logs
--              for Meta WhatsApp Cloud API order notifications.
-- =============================================================

-- -------------------------------------------------------------
-- 1. Order-level idempotency state
-- -------------------------------------------------------------
alter table orders
  add column if not exists whatsapp_pending_notification_status text
    not null
    default 'not_sent'
    check (
      whatsapp_pending_notification_status in (
        'not_sent',
        'sending',
        'sent',
        'failed'
      )
    ),
  add column if not exists whatsapp_pending_notification_attempted_at timestamptz,
  add column if not exists whatsapp_pending_notified_at timestamptz,
  add column if not exists whatsapp_pending_notification_error text;

comment on column orders.whatsapp_pending_notification_status is
  'Idempotency state for admin WhatsApp notification when the order is pending';
comment on column orders.whatsapp_pending_notification_attempted_at is
  'Last time the pending-order WhatsApp notification was attempted';
comment on column orders.whatsapp_pending_notified_at is
  'Time when the pending-order WhatsApp notification was successfully sent';
comment on column orders.whatsapp_pending_notification_error is
  'Last error returned while sending the pending-order WhatsApp notification';

-- -------------------------------------------------------------
-- 2. Notification audit log
-- -------------------------------------------------------------
create table if not exists notification_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  channel text not null check (channel in ('whatsapp')),
  event text not null,
  recipient text,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  provider_message_id text,
  provider_response jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

comment on table notification_logs is
  'Audit log for external notifications such as admin WhatsApp order alerts';

create index if not exists idx_notification_logs_order
  on notification_logs (order_id, created_at desc);

create index if not exists idx_notification_logs_event_status
  on notification_logs (channel, event, status, created_at desc);

-- -------------------------------------------------------------
-- 3. RLS
-- -------------------------------------------------------------
alter table notification_logs enable row level security;

drop policy if exists "Admin can view notification logs" on notification_logs;
create policy "Admin can view notification logs"
  on notification_logs for select
  to authenticated
  using (is_admin());

drop policy if exists "Admin can manage notification logs" on notification_logs;
create policy "Admin can manage notification logs"
  on notification_logs for all
  to authenticated
  using (is_admin())
  with check (is_admin());

grant select on notification_logs to authenticated;

-- =============================================================
-- END OF MIGRATION
-- =============================================================
