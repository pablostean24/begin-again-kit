
-- Crear tabla para el inventario
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 10,
  max_stock INTEGER DEFAULT 1000,
  unit_cost NUMERIC(10,2),
  supplier_info TEXT,
  last_restocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para promociones y descuentos
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount', 'buy_x_get_y')) NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  max_discount_amount NUMERIC(10,2),
  applicable_items UUID[], -- Array de IDs de menu_items
  promo_code TEXT UNIQUE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para repartidores
CREATE TABLE public.delivery_drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  vehicle_type TEXT CHECK (vehicle_type IN ('bike', 'motorcycle', 'car', 'walking')),
  license_plate TEXT,
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  current_orders_count INTEGER DEFAULT 0,
  max_concurrent_orders INTEGER DEFAULT 3,
  rating NUMERIC(3,2) DEFAULT 5.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para asignación de pedidos a repartidores
CREATE TABLE public.order_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.delivery_drivers(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  assignment_type TEXT CHECK (assignment_type IN ('internal', 'rappi', 'uber_eats', 'didi_food')) DEFAULT 'internal',
  external_tracking_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para cupones utilizados
CREATE TABLE public.order_promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  promotion_id UUID REFERENCES public.promotions(id) ON DELETE CASCADE,
  discount_applied NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en todas las nuevas tablas
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_promotions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para el inventario (solo administradores pueden ver/editar)
CREATE POLICY "Admin can manage inventory" ON public.inventory FOR ALL TO authenticated USING (true);

-- Políticas RLS para promociones (solo administradores pueden ver/editar)
CREATE POLICY "Admin can manage promotions" ON public.promotions FOR ALL TO authenticated USING (true);

-- Políticas RLS para repartidores (solo administradores pueden ver/editar)
CREATE POLICY "Admin can manage drivers" ON public.delivery_drivers FOR ALL TO authenticated USING (true);

-- Políticas RLS para asignaciones (solo administradores pueden ver/editar)
CREATE POLICY "Admin can manage assignments" ON public.order_assignments FOR ALL TO authenticated USING (true);

-- Políticas RLS para cupones utilizados (solo administradores pueden ver)
CREATE POLICY "Admin can view order promotions" ON public.order_promotions FOR ALL TO authenticated USING (true);

-- Habilitar realtime para gestión de pedidos en tiempo real
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;
ALTER TABLE public.order_assignments REPLICA IDENTITY FULL;

-- Agregar tablas a la publicación de realtime
ALTER publication supabase_realtime ADD TABLE public.orders;
ALTER publication supabase_realtime ADD TABLE public.order_items;
ALTER publication supabase_realtime ADD TABLE public.order_assignments;

-- Crear función para obtener estadísticas de ventas
CREATE OR REPLACE FUNCTION public.get_sales_stats(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_DATE - INTERVAL '30 days'),
  end_date TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_DATE + INTERVAL '1 day')
)
RETURNS TABLE (
  total_orders INTEGER,
  total_revenue NUMERIC,
  avg_order_value NUMERIC,
  top_selling_items JSONB,
  peak_hours JSONB,
  daily_sales JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH order_stats AS (
    SELECT 
      COUNT(*)::INTEGER as total_orders,
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COALESCE(AVG(total_amount), 0) as avg_order_value
    FROM public.orders 
    WHERE created_at BETWEEN start_date AND end_date
      AND status NOT IN ('cancelled')
  ),
  top_items AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'item_name', mi.name,
        'total_quantity', SUM(oi.quantity),
        'total_revenue', SUM(oi.total_price)
      ) ORDER BY SUM(oi.quantity) DESC
    ) as items
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    JOIN public.menu_items mi ON oi.menu_item_id = mi.id
    WHERE o.created_at BETWEEN start_date AND end_date
      AND o.status NOT IN ('cancelled')
    LIMIT 10
  ),
  peak_times AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'hour', hour_of_day,
        'order_count', order_count
      ) ORDER BY order_count DESC
    ) as hours
    FROM (
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour_of_day,
        COUNT(*) as order_count
      FROM public.orders
      WHERE created_at BETWEEN start_date AND end_date
        AND status NOT IN ('cancelled')
      GROUP BY EXTRACT(HOUR FROM created_at)
    ) hourly_stats
  ),
  daily_revenue AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'date', date_day,
        'revenue', daily_total,
        'orders', daily_orders
      ) ORDER BY date_day
    ) as daily_data
    FROM (
      SELECT 
        DATE(created_at) as date_day,
        SUM(total_amount) as daily_total,
        COUNT(*) as daily_orders
      FROM public.orders
      WHERE created_at BETWEEN start_date AND end_date
        AND status NOT IN ('cancelled')
      GROUP BY DATE(created_at)
    ) daily_stats
  )
  SELECT 
    os.total_orders,
    os.total_revenue,
    os.avg_order_value,
    COALESCE(ti.items, '[]'::jsonb) as top_selling_items,
    COALESCE(pt.hours, '[]'::jsonb) as peak_hours,
    COALESCE(dr.daily_data, '[]'::jsonb) as daily_sales
  FROM order_stats os
  CROSS JOIN top_items ti
  CROSS JOIN peak_times pt
  CROSS JOIN daily_revenue dr;
END;
$$;
