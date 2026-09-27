-- Removes the purchase requests: the trigger and its function, the three
-- functions, both tables (lines first) and the two limit rows. Every stored
-- request is dropped: a request is transient (an hour pending, a day kept).
drop trigger purchase_requests_broadcast on public.purchase_requests;
drop function public.purchase_requests_broadcast();
drop function public.decline_purchase_request(uuid);
drop function public.apply_purchase_request(uuid, boolean);
drop function public.create_purchase_request(uuid, text, jsonb);
drop table public.purchase_request_lines;
drop table public.purchase_requests;
-- Overrides of the two keys go with them (on delete cascade).
delete from public.limit_defaults where key in ('request_lines', 'pending_requests_per_list');
