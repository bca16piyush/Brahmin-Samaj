-- First drop any existing constraint with this name, then add new one
ALTER TABLE public.in_kind_donations 
DROP CONSTRAINT IF EXISTS in_kind_donations_user_id_fkey;

ALTER TABLE public.in_kind_donations 
ADD CONSTRAINT fk_in_kind_donations_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;