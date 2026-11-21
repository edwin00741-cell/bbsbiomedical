-- Deleting a customer must never detach its existing commercial documents.
alter table public.quotes drop constraint quotes_client_id_fkey,
  add constraint quotes_client_id_fkey foreign key(client_id) references public.clients(id) on delete restrict;
alter table public.invoices drop constraint invoices_client_id_fkey,
  add constraint invoices_client_id_fkey foreign key(client_id) references public.clients(id) on delete restrict;
alter table public.credit_notes drop constraint credit_notes_client_id_fkey,
  add constraint credit_notes_client_id_fkey foreign key(client_id) references public.clients(id) on delete restrict;
alter table public.payments drop constraint payments_client_id_fkey,
  add constraint payments_client_id_fkey foreign key(client_id) references public.clients(id) on delete restrict;
alter table public.refunds drop constraint refunds_client_id_fkey,
  add constraint refunds_client_id_fkey foreign key(client_id) references public.clients(id) on delete restrict;

