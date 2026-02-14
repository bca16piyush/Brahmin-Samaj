-- Allow volunteers to insert event_logs (for QR scanning)
CREATE POLICY "Volunteers can insert event logs"
ON public.event_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'volunteer'::app_role));

-- Allow volunteers to read event_logs (for duplicate check)
CREATE POLICY "Volunteers can view event logs"
ON public.event_logs
FOR SELECT
USING (has_role(auth.uid(), 'volunteer'::app_role));
