
-- Primero, eliminamos el constraint existente si existe
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS check_item_type;

-- Aseguramos que menu_item_id pueda ser NULL
ALTER TABLE public.order_items ALTER COLUMN menu_item_id DROP NOT NULL;

-- Creamos un nuevo constraint más flexible que permite:
-- 1. Solo menu_item_id (plato regular): menu_item_id NOT NULL AND composite_dish_id IS NULL
-- 2. Solo composite_dish_id (plato compuesto): menu_item_id IS NULL AND composite_dish_id IS NOT NULL
ALTER TABLE public.order_items ADD CONSTRAINT check_item_type_v2 
CHECK (
  (menu_item_id IS NOT NULL AND composite_dish_id IS NULL) OR 
  (menu_item_id IS NULL AND composite_dish_id IS NOT NULL)
);

-- Aseguramos que el campo composite_dish_id existe (por si no se creó anteriormente)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' 
                   AND column_name = 'composite_dish_id') THEN
        ALTER TABLE public.order_items ADD COLUMN composite_dish_id UUID REFERENCES public.composite_dishes(id);
    END IF;
END $$;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON public.order_items(menu_item_id) WHERE menu_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_composite_dish_id ON public.order_items(composite_dish_id) WHERE composite_dish_id IS NOT NULL;

-- Actualizar las políticas RLS para incluir composite dishes
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

-- Política para que los administradores puedan ver todos los order items
DROP POLICY IF EXISTS "Restaurant admins can view all order items" ON public.order_items;
CREATE POLICY "Restaurant admins can view all order items" 
  ON public.order_items 
  FOR SELECT 
  USING (has_role(auth.uid(), 'restaurant'::app_role));
