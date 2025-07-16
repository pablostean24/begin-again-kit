
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Star } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type MenuItem = Tables<'menu_items'>;

interface MenuItemCardProps {
  item: MenuItem;
}

const MenuItemCard = ({ item }: MenuItemCardProps) => {
  const { addItem } = useCart();
  const { user } = useAuth();

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Debes iniciar sesión para agregar productos al carrito');
      return;
    }

    addItem(item);
    toast.success(`${item.name} agregado al carrito`);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-white relative">
      {/* Rating Badge - Fixed positioning */}
      {item.rating && item.rating > 0 && (
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow-sm border">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium text-gray-700">{item.rating.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl text-gray-300">🍽️</div>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title and Price */}
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
            <p className="text-2xl font-bold text-orange-600">${item.price.toFixed(2)}</p>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
          )}

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={!item.is_available}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium"
          >
            {item.is_available ? (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Agregar al Pedido
              </>
            ) : (
              'No disponible'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MenuItemCard;
