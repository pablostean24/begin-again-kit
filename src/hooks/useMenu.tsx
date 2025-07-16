
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type MenuCategory = Tables<'menu_categories'> & {
  menu_items: (Tables<'menu_items'> & { display_order?: number })[];
  display_order?: number;
};

export const useMenu = () => {
  return useQuery({
    queryKey: ['menu'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select(`
          *,
          menu_items (*)
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      // Sort menu items within each category by display_order
      const sortedData = data.map(category => ({
        ...category,
        menu_items: category.menu_items.sort((a: any, b: any) => 
          (a.display_order || 0) - (b.display_order || 0)
        )
      }));
      
      return sortedData as MenuCategory[];
    }
  });
};
