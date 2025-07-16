
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CompositeDish } from './useCompositeDishes';

export const usePublicCompositeDishes = () => {
  return useQuery({
    queryKey: ['public-composite-dishes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('composite_dishes')
        .select(`
          *,
          dish_base_products (
            *,
            menu_items (*)
          ),
          dish_optional_elements (
            *,
            menu_items (*),
            dish_replacement_options (
              *,
              replacement_menu_items:menu_items!dish_replacement_options_replacement_item_id_fkey (*)
            )
          )
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CompositeDish[];
    }
  });
};
