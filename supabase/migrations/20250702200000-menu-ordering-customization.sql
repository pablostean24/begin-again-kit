
-- Add ordering fields to menu categories and items
ALTER TABLE public.menu_categories ADD COLUMN display_order INTEGER DEFAULT 0;
ALTER TABLE public.menu_items ADD COLUMN display_order INTEGER DEFAULT 0;

-- Update existing categories with default ordering
UPDATE public.menu_categories SET display_order = CASE 
  WHEN name ILIKE '%entrada%' OR name ILIKE '%appetizer%' THEN 1
  WHEN name ILIKE '%principal%' OR name ILIKE '%main%' THEN 2
  WHEN name ILIKE '%bebida%' OR name ILIKE '%drink%' THEN 3
  WHEN name ILIKE '%postre%' OR name ILIKE '%dessert%' THEN 4
  ELSE 5
END;

-- Create indexes for better performance
CREATE INDEX idx_menu_categories_display_order ON public.menu_categories(display_order);
CREATE INDEX idx_menu_items_display_order ON public.menu_items(display_order);
CREATE INDEX idx_menu_items_category_display_order ON public.menu_items(category_id, display_order);
