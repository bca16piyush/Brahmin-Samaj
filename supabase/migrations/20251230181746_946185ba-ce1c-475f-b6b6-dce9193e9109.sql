-- Allow admins to delete pandits
CREATE POLICY "Admins can delete pandits"
ON public.pandits
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));