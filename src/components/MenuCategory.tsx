
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCart, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type MenuItem = Tables<'menu_items'>;
type MenuCategory = Tables<'menu_categories'> & {
  menu_items: MenuItem[];
};

interface MenuCategoryProps {
  category: MenuCategory;
}

const MenuCategory = ({ category }: MenuCategoryProps) => {
  const { addItem } = useCart();
  const { user } = useAuth();

  const handleAddToCart = (item: MenuItem) => {
    if (!user) {
      toast.error('Debes iniciar sesión para agregar productos al carrito');
      return;
    }

    addItem(item);
    toast.success(`${item.name} agregado al carrito`);
  };

  if (!category.menu_items || category.menu_items.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{category.name}</h2>
      {category.description && (
        <p className="text-gray-600 mb-6">{category.description}</p>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {category.menu_items.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {item.image_url && (
              <div className="aspect-video overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-orange-600">
                  ${item.price.toFixed(2)}
                </span>
                {item.rating && item.rating > 0 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span>⭐ {item.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {item.description && (
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>
              )}
              
              <div className="flex items-center justify-between">
                {item.preparation_time && (
                  <span className="text-sm text-gray-500">
                    🕒 {item.preparation_time}
                  </span>
                )}
                
                <Button
                  onClick={() => handleAddToCart(item)}
                  className="bg-orange-600 hover:bg-orange-700"
                  size="sm"
                  disabled={!item.is_available}
                >
                  {item.is_available ? (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar
                    </>
                  ) : (
                    'No disponible'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MenuCategory;
