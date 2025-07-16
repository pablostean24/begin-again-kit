
-- Crear enum para los roles de la aplicación
CREATE TYPE public.app_role AS ENUM ('restaurant', 'cliente', 'delivery');

-- Crear tabla para los roles de usuario
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS en la tabla de roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Crear función para verificar roles (SECURITY DEFINER para evitar problemas de RLS recursivo)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Política RLS para que los usuarios puedan ver sus propios roles
CREATE POLICY "Users can view their own roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para que los admins puedan gestionar roles (por ahora cualquier usuario autenticado)
CREATE POLICY "Authenticated users can manage roles" 
  ON public.user_roles 
  FOR ALL 
  TO authenticated 
  USING (true);

-- Actualizar la función handle_new_user para asignar rol por defecto
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
      ELSE 'cliente'::app_role
    END
  );
  
  RETURN new;
END;
$$;

-- Crear usuarios de prueba (esto creará los usuarios directamente en auth.users)
-- Nota: En producción, estos usuarios deberían crearse a través del proceso normal de registro
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
  'restaurant@test.com',
  crypt('restaurant', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
), (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'cliente@test.com',
  crypt('cliente', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
), (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'delivery@test.com',
  crypt('delivery', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);
