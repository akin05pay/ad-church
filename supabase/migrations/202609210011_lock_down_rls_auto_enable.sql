-- Harden Supabase's automatic RLS event-trigger helper.
-- Keep the internal event trigger intact, but prevent Data API roles from invoking
-- the SECURITY DEFINER helper as an RPC.

revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;
