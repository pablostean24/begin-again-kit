
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import CustomizationDialog from './CustomizationDialog';
import type { CompositeDish } from '@/hooks/useCompositeDishes';

interface CompositeDishCardProps {
  dish: CompositeDish;
}

const CompositeDishCard = ({ dish }: CompositeDishCardProps) => {
  const { user } = useAuth();
  const [showCustomization, setShowCustomization] = useState(false);

  const handleCustomize = () => {
    if (!user) {
      toast.error('Debes iniciar sesión para personalizar productos');
      return;
    }
    setShowCustomization(true);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-white relative">
        {/* Customizable Badge */}
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            ✨ Personalizable
          </Badge>
        </div>


        {/* Image */}
        <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
          {dish.image_url ? (
            <img
              src={dish.image_url}
              alt={dish.name}
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
              <h3 className="font-semibold text-gray-900 line-clamp-1">{dish.name}</h3>
              <p className="text-2xl font-bold text-orange-600">desde ${dish.base_price.toFixed(2)}</p>
            </div>

            {/* Description */}
            {dish.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{dish.description}</p>
            )}

            {/* Base Products Preview */}
            {dish.dish_base_products && dish.dish_base_products.length > 0 && (
              <div className="text-xs text-gray-500">
                <span className="font-medium">Incluye: </span>
                {dish.dish_base_products.slice(0, 2).map((bp, index) => (
                  <span key={bp.id}>
                    {bp.menu_items.name}
                    {index < Math.min(dish.dish_base_products.length, 2) - 1 && ', '}
                  </span>
                ))}
                {dish.dish_base_products.length > 2 && (
                  <span> y {dish.dish_base_products.length - 2} más...</span>
                )}
              </div>
            )}

            {/* Customize Button */}
            <Button
              onClick={handleCustomize}
              disabled={!dish.is_available}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium"
            >
              {dish.is_available ? (
                <>
                  <Settings className="h-4 w-4 mr-1" />
                  Personalizar Plato
                </>
              ) : (
                'No disponible'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customization Dialog */}
      <CustomizationDialog
        dish={dish}
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
      />
    </>
  );
};

export default CompositeDishCard;
