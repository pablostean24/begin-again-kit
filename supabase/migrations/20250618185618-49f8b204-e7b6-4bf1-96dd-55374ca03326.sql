
-- Crear tabla de categorías de menú
CREATE TABLE public.menu_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de productos del menú
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  preparation_time TEXT DEFAULT '15-20 min',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de perfiles de usuario
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de direcciones de entrega
CREATE TABLE public.delivery_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear enum para estados de pedido
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');

-- Crear tabla de pedidos
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  delivery_address_id UUID REFERENCES public.delivery_addresses(id),
  status public.order_status DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 3.50,
  notes TEXT,
  estimated_delivery_time INTEGER DEFAULT 35, -- minutos
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de items del pedido
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Políticas para categorías de menú (público para lectura)
CREATE POLICY "Anyone can view menu categories" 
  ON public.menu_categories 
  FOR SELECT 
  USING (is_active = true);

-- Políticas para items del menú (público para lectura)
CREATE POLICY "Anyone can view menu items" 
  ON public.menu_items 
  FOR SELECT 
  USING (is_available = true);

-- Políticas para perfiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Políticas para direcciones de entrega
CREATE POLICY "Users can view their own addresses" 
  ON public.delivery_addresses 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own addresses" 
  ON public.delivery_addresses 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" 
  ON public.delivery_addresses 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" 
  ON public.delivery_addresses 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas para pedidos
CREATE POLICY "Users can view their own orders" 
  ON public.orders 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" 
  ON public.orders 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" 
  ON public.orders 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Políticas para items del pedido
CREATE POLICY "Users can view their order items" 
  ON public.order_items 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for their orders" 
  ON public.order_items 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Función para manejar nuevos usuarios
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
  RETURN new;
END;
$$;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insertar datos de ejemplo para categorías
INSERT INTO public.menu_categories (name, description, display_order) VALUES
('Platos Principales', 'Nuestros deliciosos platos principales', 1),
('Entrantes', 'Perfectos para comenzar tu comida', 2),
('Postres', 'Dulces tentaciones para terminar', 3),
('Bebidas', 'Refrescos y bebidas calientes', 4);

-- Insertar datos de ejemplo para items del menú
INSERT INTO public.menu_items (category_id, name, description, price, rating, preparation_time) VALUES
((SELECT id FROM public.menu_categories WHERE name = 'Platos Principales'), 'Paella Valenciana', 'Arroz con pollo, conejo, verduras y azafrán', 18.50, 4.8, '25-30 min'),
((SELECT id FROM public.menu_categories WHERE name = 'Platos Principales'), 'Salmón a la Plancha', 'Salmón fresco con verduras al vapor y salsa de limón', 22.00, 4.6, '15-20 min'),
((SELECT id FROM public.menu_categories WHERE name = 'Platos Principales'), 'Pasta Carbonara', 'Pasta italiana con salsa carbonara tradicional', 15.50, 4.7, '12-15 min'),
((SELECT id FROM public.menu_categories WHERE name = 'Entrantes'), 'Croquetas de Jamón', '6 unidades de croquetas caseras de jamón ibérico', 8.50, 4.9, '10 min'),
((SELECT id FROM public.menu_categories WHERE name = 'Entrantes'), 'Ensalada César', 'Lechuga, pollo, parmesano y salsa césar', 12.00, 4.5, '8 min'),
((SELECT id FROM public.menu_categories WHERE name = 'Postres'), 'Tiramisú', 'Postre italiano tradicional', 6.50, 4.8, '5 min'),
((SELECT id FROM public.menu_categories WHERE name = 'Bebidas'), 'Agua Mineral', 'Botella de agua mineral 500ml', 2.50, 5.0, '1 min'),
((SELECT id FROM public.menu_categories WHERE name = 'Bebidas'), 'Coca Cola', 'Refresco de cola 330ml', 3.00, 4.5, '1 min');
