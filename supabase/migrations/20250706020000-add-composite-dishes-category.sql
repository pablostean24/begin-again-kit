
-- Crear categoría específica para platos compuestos
INSERT INTO public.menu_categories (id, name, description, is_active, display_order, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Platos Personalizables',
  'Platos que puedes personalizar según tus preferencias',
  true,
  0,  -- Orden 0 para que aparezca primero
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Actualizar el orden de las categorías existentes para hacer espacio
UPDATE public.menu_categories 
SET display_order = display_order + 1 
WHERE name != 'Platos Personalizables';
