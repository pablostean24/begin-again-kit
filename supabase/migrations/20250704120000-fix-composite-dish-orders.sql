
-- Modificar la tabla order_items para hacer menu_item_id opcional cuando hay composite_dish_id
ALTER TABLE public.order_items ALTER COLUMN menu_item_id DROP NOT NULL;

-- Agregar constraint para asegurar que al menos uno de menu_item_id o composite_dish_id esté presente
ALTER TABLE public.order_items ADD CONSTRAINT check_item_type 
CHECK (
  (menu_item_id IS NOT NULL AND composite_dish_id IS NULL) OR 
  (menu_item_id IS NULL AND composite_dish_id IS NOT NULL)
);

-- Crear índice para mejorar el rendimiento de consultas con composite_dish_id
CREATE INDEX IF NOT EXISTS idx_order_items_composite_dish_id ON public.order_items(composite_dish_id);

-- Actualizar la política RLS para incluir composite dishes
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
CREATE POLICY "Users can view their own order items" 
  ON public.order_items 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_items.order_id 
    AND o.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can create order items for their orders" ON public.order_items;
CREATE POLICY "Users can create order items for their orders" 
  ON public.order_items 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_items.order_id 
    AND o.user_id = auth.uid()
  ));
