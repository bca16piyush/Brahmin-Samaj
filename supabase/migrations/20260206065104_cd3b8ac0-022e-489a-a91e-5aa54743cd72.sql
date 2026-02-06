-- Allow admins to delete pandit bookings
CREATE POLICY "Admins can delete pandit bookings"
ON public.pandit_bookings
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete in-kind donations
CREATE POLICY "Admins can delete in-kind donations"
ON public.in_kind_donations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete room bookings
CREATE POLICY "Admins can delete room bookings"
ON public.room_bookings
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete event registrations (already has user delete policy, add admin)
CREATE POLICY "Admins can delete event registrations"
ON public.event_registrations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));