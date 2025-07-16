
-- Crear bucket para almacenar imágenes de productos del menú
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-items', 'menu-items', true);

-- Crear política para permitir que usuarios autenticados suban imágenes
CREATE POLICY "Authenticated users can upload menu item images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-items');

-- Crear política para permitir que todos vean las imágenes (público)
CREATE POLICY "Anyone can view menu item images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'menu-items');

-- Crear política para permitir que usuarios autenticados actualicen imágenes
CREATE POLICY "Authenticated users can update menu item images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'menu-items');

-- Crear política para permitir que usuarios autenticados eliminen imágenes
CREATE POLICY "Authenticated users can delete menu item images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'menu-items');
