-- Enable realtime for admin_audit_logs table
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_audit_logs;