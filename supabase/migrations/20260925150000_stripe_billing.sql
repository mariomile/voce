-- Stripe billing: the date a cancelled subscription ends. Written only by the webhook, like the rest
-- of the row: users keep read access (the table grant covers the new column) and no write access.
alter table public.subscriptions add column cancel_at timestamptz;

-- When the webhook started reading this state from Stripe. Two webhooks running together can finish
-- in any order: a write whose read started earlier than the saved one is older and is dropped.
alter table public.subscriptions add column stripe_synced_at timestamptz;
