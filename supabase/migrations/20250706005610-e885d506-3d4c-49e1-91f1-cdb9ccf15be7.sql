
-- Create table to store dish customizations for orders
CREATE TABLE public.order_dish_customizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  optional_element_id UUID NOT NULL REFERENCES public.dish_optional_elements(id),
  is_included BOOLEAN DEFAULT true,
  replacement_item_id UUID REFERENCES public.menu_items(id),
  price_adjustment NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.order_dish_customizations ENABLE ROW LEVEL SECURITY;

-- Create policies for order dish customizations
CREATE POLICY "Users can view their own dish customizations" 
  ON public.order_dish_customizations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON oi.order_id = o.id
      WHERE oi.id = order_dish_customizations.order_item_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create dish customizations for their orders" 
  ON public.order_dish_customizations 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON oi.order_id = o.id
      WHERE oi.id = order_dish_customizations.order_item_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant admins can view all dish customizations" 
  ON public.order_dish_customizations 
  FOR SELECT 
  USING (has_role(auth.uid(), 'restaurant'::app_role));
