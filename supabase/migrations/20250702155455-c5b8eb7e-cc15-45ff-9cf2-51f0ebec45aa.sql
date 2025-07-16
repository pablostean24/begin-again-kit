
-- Crear tabla para platos compuestos
CREATE TABLE public.composite_dishes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  category_id UUID REFERENCES public.menu_categories(id),
  is_available BOOLEAN DEFAULT true,
  preparation_time TEXT DEFAULT '20-25 min',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para productos base del plato (obligatorios)
CREATE TABLE public.dish_base_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dish_id UUID NOT NULL REFERENCES public.composite_dishes(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para elementos opcionales del plato
CREATE TABLE public.dish_optional_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dish_id UUID NOT NULL REFERENCES public.composite_dishes(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  is_included_by_default BOOLEAN DEFAULT true,
  additional_price NUMERIC DEFAULT 0,
  element_type TEXT DEFAULT 'side', -- 'side', 'drink', 'bread', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para productos de reemplazo disponibles
CREATE TABLE public.dish_replacement_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  optional_element_id UUID NOT NULL REFERENCES public.dish_optional_elements(id) ON DELETE CASCADE,
  replacement_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  price_difference NUMERIC DEFAULT 0, -- diferencia de precio al reemplazar
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para personalización de pedidos de platos compuestos
CREATE TABLE public.order_dish_customizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  optional_element_id UUID NOT NULL REFERENCES public.dish_optional_elements(id),
  is_included BOOLEAN DEFAULT true,
  replacement_item_id UUID REFERENCES public.menu_items(id), -- si se reemplazó
  price_adjustment NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para todas las tablas
ALTER TABLE public.composite_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_base_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_optional_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_replacement_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_dish_customizations ENABLE ROW LEVEL SECURITY;

-- Políticas para composite_dishes
CREATE POLICY "Anyone can view available composite dishes" 
  ON public.composite_dishes 
  FOR SELECT 
  USING (is_available = true);

CREATE POLICY "Restaurant users can manage composite dishes" 
  ON public.composite_dishes 
  FOR ALL 
  USING (has_role(auth.uid(), 'restaurant'::app_role));

-- Políticas para dish_base_products
CREATE POLICY "Anyone can view dish base products" 
  ON public.dish_base_products 
  FOR SELECT 
  USING (true);

CREATE POLICY "Restaurant users can manage dish base products" 
  ON public.dish_base_products 
  FOR ALL 
  USING (has_role(auth.uid(), 'restaurant'::app_role));

-- Políticas para dish_optional_elements
CREATE POLICY "Anyone can view dish optional elements" 
  ON public.dish_optional_elements 
  FOR SELECT 
  USING (true);

CREATE POLICY "Restaurant users can manage dish optional elements" 
  ON public.dish_optional_elements 
  FOR ALL 
  USING (has_role(auth.uid(), 'restaurant'::app_role));

-- Políticas para dish_replacement_options
CREATE POLICY "Anyone can view dish replacement options" 
  ON public.dish_replacement_options 
  FOR SELECT 
  USING (true);

CREATE POLICY "Restaurant users can manage dish replacement options" 
  ON public.dish_replacement_options 
  FOR ALL 
  USING (has_role(auth.uid(), 'restaurant'::app_role));

-- Políticas para order_dish_customizations
CREATE POLICY "Users can view their own dish customizations" 
  ON public.order_dish_customizations 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.order_items oi 
    JOIN public.orders o ON oi.order_id = o.id 
    WHERE oi.id = order_dish_customizations.order_item_id 
    AND o.user_id = auth.uid()
  ));

CREATE POLICY "Users can create dish customizations for their orders" 
  ON public.order_dish_customizations 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.order_items oi 
    JOIN public.orders o ON oi.order_id = o.id 
    WHERE oi.id = order_dish_customizations.order_item_id 
    AND o.user_id = auth.uid()
  ));

CREATE POLICY "Restaurant admins can view all dish customizations" 
  ON public.order_dish_customizations 
  FOR SELECT 
  USING (has_role(auth.uid(), 'restaurant'::app_role));

-- Agregar campo para identificar platos compuestos en la tabla order_items
ALTER TABLE public.order_items ADD COLUMN composite_dish_id UUID REFERENCES public.composite_dishes(id);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_dish_base_products_dish_id ON public.dish_base_products(dish_id);
CREATE INDEX idx_dish_optional_elements_dish_id ON public.dish_optional_elements(dish_id);
CREATE INDEX idx_dish_replacement_options_optional_element_id ON public.dish_replacement_options(optional_element_id);
CREATE INDEX idx_order_dish_customizations_order_item_id ON public.order_dish_customizations(order_item_id);

-- Trigger para actualizar updated_at en composite_dishes
CREATE TRIGGER update_composite_dishes_updated_at
  BEFORE UPDATE ON public.composite_dishes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
