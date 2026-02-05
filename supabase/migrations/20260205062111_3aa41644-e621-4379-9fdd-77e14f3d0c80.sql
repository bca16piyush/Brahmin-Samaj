-- Drop the existing permissive INSERT policy on admin_audit_logs
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.admin_audit_logs;

-- Create a new restrictive INSERT policy that denies all client access
-- Service role automatically bypasses RLS, so this is safe
CREATE POLICY "No client access for audit log inserts"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (false);

-- The rate_limits table already has a deny-all policy, verify it's correct
-- No changes needed there as it already uses USING (false) and WITH CHECK (false)