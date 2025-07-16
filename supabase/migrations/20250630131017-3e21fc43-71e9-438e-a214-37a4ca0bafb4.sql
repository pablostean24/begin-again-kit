
-- Crear tabla para métodos de pago del restaurante
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('Pago Móvil', 'Transferencia Bancaria', 'Zelle', 'Otro')),
  account_number TEXT NOT NULL,
  phone_number TEXT,
  owner_id TEXT NOT NULL,
  destination_bank TEXT NOT NULL,
  account_holder_name TEXT,
  other_type_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para verificaciones de pago manual
CREATE TABLE public.manual_payment_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  payment_method_type TEXT NOT NULL,
  origin_bank TEXT NOT NULL,
  phone_number_used TEXT,
  amount_paid NUMERIC NOT NULL,
  reference_number TEXT NOT NULL,
  payment_proof_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_payment_verifications ENABLE ROW LEVEL SECURITY;

-- Políticas para payment_methods
CREATE POLICY "Everyone can view active payment methods"
  ON public.payment_methods
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Restaurant admins can manage payment methods"
  ON public.payment_methods
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'restaurant'
    )
  );

-- Políticas para manual_payment_verifications
CREATE POLICY "Users can view their own payment verifications"
  ON public.manual_payment_verifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = manual_payment_verifications.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create payment verifications for their orders"
  ON public.manual_payment_verifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = manual_payment_verifications.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant admins can view all payment verifications"
  ON public.manual_payment_verifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'restaurant'
    )
  );

CREATE POLICY "Restaurant admins can update payment verifications"
  ON public.manual_payment_verifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'restaurant'
    )
  );

-- Crear bucket de storage para comprobantes de pago
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true);

-- Política para permitir que usuarios autenticados suban archivos
CREATE POLICY "Users can upload payment proofs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid() IS NOT NULL);

-- Política para permitir que usuarios vean sus propios archivos
CREATE POLICY "Users can view payment proofs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'payment-proofs');
