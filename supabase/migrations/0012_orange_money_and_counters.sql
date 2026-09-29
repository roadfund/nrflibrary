-- Orange Money collections and atomic catalogue counters.
--
-- Subscription activation still happens only through the service role, after
-- this app re-checks the transaction with the Teeket status endpoint.
-- Subscribers cannot write payment_txn_id themselves.

alter table public.subscriptions
  add column payment_txn_id text;

create or replace function public.prevent_subscription_self_activation()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_staff() then
    if new.id is distinct from old.id
      or new.owner_type is distinct from old.owner_type
      or new.owner_id is distinct from old.owner_id
      or new.status is distinct from old.status
      or new.seats is distinct from old.seats
      or new.seats_used is distinct from old.seats_used
      or new.payment_method_type is distinct from old.payment_method_type
      or new.payment_reference is distinct from old.payment_reference
      or new.payment_txn_id is distinct from old.payment_txn_id
      or new.current_period_start is distinct from old.current_period_start
      or new.current_period_end is distinct from old.current_period_end
      or new.created_at is distinct from old.created_at
      or new.granted_by is distinct from old.granted_by
      or new.grant_category is distinct from old.grant_category
      or new.grant_note is distinct from old.grant_note then
      raise exception 'Only plan, billing interval, and cancellation can be changed on your own subscription.';
    end if;
    if old.granted_by is not null then
      raise exception 'Granted subscriptions can only be changed by staff.';
    end if;
  end if;
  return new;
end;
$$;

create table public.content_view_days (
  content_item_id text not null references public.content_items (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  view_date date not null,
  primary key (content_item_id, viewer_id, view_date)
);

alter table public.content_view_days enable row level security;

create or replace function public.increment_content_download_count(item_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count integer;
begin
  update public.content_items
  set download_count = download_count + 1
  where id = item_id
  returning download_count into next_count;

  if next_count is null then
    raise exception 'content item not found';
  end if;
  return next_count;
end;
$$;

create or replace function public.record_content_view(item_id text, viewer uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id text;
begin
  if not exists (
    select 1 from public.content_items
    where id = item_id and status = 'PUBLISHED'
  ) then
    return false;
  end if;

  insert into public.content_view_days (content_item_id, viewer_id, view_date)
  values (item_id, viewer, (timezone('utc', now()))::date)
  on conflict do nothing
  returning content_item_id into inserted_id;

  if inserted_id is null then
    return false;
  end if;

  update public.content_items
  set view_count = view_count + 1
  where id = item_id;

  return true;
end;
$$;

revoke all on function public.increment_content_download_count(text) from public, anon, authenticated;
revoke all on function public.record_content_view(text, uuid) from public, anon, authenticated;
grant execute on function public.increment_content_download_count(text) to service_role;
grant execute on function public.record_content_view(text, uuid) to service_role;
