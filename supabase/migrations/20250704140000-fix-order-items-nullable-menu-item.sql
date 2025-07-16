
-- Eliminar constraint existente si existe
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS check_item_type_v2;
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS check_item_type;

-- Hacer menu_item_id nullable
ALTER TABLE public.order_items ALTER COLUMN menu_item_id DROP NOT NULL;

-- Asegurar que composite_dish_id existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' 
                   AND column_name = 'composite_dish_id') THEN
        ALTER TABLE public.order_items ADD COLUMN composite_dish_id UUID REFERENCES public.composite_dishes(id);
    END IF;
END $$;

-- Crear el constraint correcto: exactamente uno de los dos campos debe estar presente
ALTER TABLE public.order_items ADD CONSTRAINT check_exactly_one_item_type 
CHECK (
  (menu_item_id IS NOT NULL AND composite_dish_id IS NULL) OR 
  (menu_item_id IS NULL AND composite_dish_id IS NOT NULL)
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON public.order_items(menu_item_id) WHERE menu_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_composite_dish_id ON public.order_items(composite_dish_id) WHERE composite_dish_id IS NOT NULL;

-- Actualizar políticas RLS
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

DROP POLICY IF EXISTS "Restaurant admins can view all order items" ON public.order_items;
CREATE POLICY "Restaurant admins can view all order items" 
  ON public.order_items 
  FOR SELECT 
  USING (has_role(auth.uid(), 'restaurant'::app_role));

-- Política adicional para permitir a meseros crear order items
DROP POLICY IF EXISTS "Waiters can create order items" ON public.order_items;
CREATE POLICY "Waiters can create order items" 
  ON public.order_items 
  FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'mesero'::app_role));
