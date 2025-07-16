
-- Crear tabla para notificaciones de repartidores
CREATE TABLE public.driver_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES public.delivery_drivers(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'new_order',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  response TEXT, -- 'accepted', 'rejected', null
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Crear tabla para seguimiento de ubicación del repartidor
CREATE TABLE public.driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES public.delivery_drivers(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(6, 2),
  speed DECIMAL(6, 2),
  heading DECIMAL(6, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para confirmaciones de entrega
CREATE TABLE public.delivery_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.delivery_drivers(id) ON DELETE CASCADE NOT NULL,
  confirmation_type TEXT NOT NULL, -- 'code', 'signature', 'photo'
  confirmation_data TEXT, -- código, base64 de firma, URL de foto
  delivery_notes TEXT,
  delivery_issues TEXT,
  confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para estadísticas de repartidores
CREATE TABLE public.driver_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES public.delivery_drivers(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_deliveries INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  total_distance DECIMAL(8, 2) DEFAULT 0, -- en kilómetros
  average_delivery_time INTEGER DEFAULT 0, -- en minutos
  customer_rating DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(driver_id, date)
);

-- Agregar columnas a la tabla orders para mejor seguimiento
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS pickup_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivery_code TEXT,
ADD COLUMN IF NOT EXISTS driver_earnings DECIMAL(8, 2) DEFAULT 0;

-- Agregar columnas a order_assignments para mejor seguimiento
ALTER TABLE public.order_assignments 
ADD COLUMN IF NOT EXISTS estimated_pickup_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_distance DECIMAL(8, 2);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.driver_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_stats ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para driver_notifications
CREATE POLICY "Drivers can view their own notifications" 
  ON public.driver_notifications 
  FOR SELECT 
  USING (driver_id IN (SELECT id FROM public.delivery_drivers WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Drivers can update their own notifications" 
  ON public.driver_notifications 
  FOR UPDATE 
  USING (driver_id IN (SELECT id FROM public.delivery_drivers WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Restaurant admins can manage all notifications" 
  ON public.driver_notifications 
  FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'restaurant'));

-- Políticas RLS para driver_locations
CREATE POLICY "Drivers can manage their own locations" 
  ON public.driver_locations 
  FOR ALL 
  USING (driver_id IN (SELECT id FROM public.delivery_drivers WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Restaurant admins can view all locations" 
  ON public.driver_locations 
  FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'restaurant'));

-- Políticas RLS para delivery_confirmations
CREATE POLICY "Drivers can manage their own confirmations" 
  ON public.delivery_confirmations 
  FOR ALL 
  USING (driver_id IN (SELECT id FROM public.delivery_drivers WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Restaurant admins can view all confirmations" 
  ON public.delivery_confirmations 
  FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'restaurant'));

-- Políticas RLS para driver_stats
CREATE POLICY "Drivers can view their own stats" 
  ON public.driver_stats 
  FOR SELECT 
  USING (driver_id IN (SELECT id FROM public.delivery_drivers WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Restaurant admins can view all stats" 
  ON public.driver_stats 
  FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'restaurant'));

-- Función para generar códigos de entrega aleatorios
CREATE OR REPLACE FUNCTION generate_delivery_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$;

-- Trigger para generar código de entrega automáticamente
CREATE OR REPLACE FUNCTION set_delivery_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.delivery_code IS NULL THEN
    NEW.delivery_code := generate_delivery_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_delivery_code_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION set_delivery_code();

-- Función para actualizar estadísticas de repartidores
CREATE OR REPLACE FUNCTION update_driver_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  driver_id_val UUID;
  delivery_date DATE;
  earnings DECIMAL(8, 2);
BEGIN
  -- Obtener el driver_id del pedido
  SELECT oa.driver_id INTO driver_id_val
  FROM public.order_assignments oa
  WHERE oa.order_id = NEW.id;
  
  IF driver_id_val IS NOT NULL AND NEW.status = 'delivered' THEN
    delivery_date := NEW.updated_at::DATE;
    earnings := COALESCE(NEW.driver_earnings, 0);
    
    -- Insertar o actualizar estadísticas
    INSERT INTO public.driver_stats (driver_id, date, total_deliveries, total_earnings)
    VALUES (driver_id_val, delivery_date, 1, earnings)
    ON CONFLICT (driver_id, date)
    DO UPDATE SET
      total_deliveries = driver_stats.total_deliveries + 1,
      total_earnings = driver_stats.total_earnings + earnings,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_driver_stats_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_driver_stats();
