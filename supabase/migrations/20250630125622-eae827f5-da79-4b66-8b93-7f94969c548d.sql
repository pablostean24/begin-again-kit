
-- Crear políticas para que los administradores puedan ver todos los pedidos
CREATE POLICY "Admins can view all orders" 
  ON public.orders 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'restaurant'
    )
  );

-- Crear políticas para que los administradores puedan actualizar todos los pedidos
CREATE POLICY "Admins can update all orders" 
  ON public.orders 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'restaurant'
    )
  );

-- Crear políticas para que los administradores puedan ver todos los items de pedidos
CREATE POLICY "Admins can view all order items" 
  ON public.order_items 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'restaurant'
    )
  );

-- Crear políticas para que los administradores puedan ver todos los perfiles
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'restaurant'
    )
  );

-- Crear políticas para que los administradores puedan ver todas las direcciones
CREATE POLICY "Admins can view all delivery addresses" 
  ON public.delivery_addresses 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'restaurant'
    )
  );

-- Crear políticas para que los administradores puedan ver todas las asignaciones
CREATE POLICY "Admins can view all order assignments" 
  ON public.order_assignments 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'restaurant'
    )
  );
