
-- Add mesero role to the app_role enum
ALTER TYPE public.app_role ADD VALUE 'mesero';

-- Insert test user for mesero role
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'mesero@test.com',
  crypt('mesero', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Update the handle_new_user function to assign the mesero role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.email)
  );
  
  -- Asignar rol por defecto basado en el email o metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    CASE 
      WHEN new.email = 'restaurant@test.com' THEN 'restaurant'::app_role
      WHEN new.email = 'delivery@test.com' THEN 'delivery'::app_role
      WHEN new.email = 'mesero@test.com' THEN 'mesero'::app_role
      ELSE 'cliente'::app_role
    END
  );
  
  RETURN new;
END;
$$;
