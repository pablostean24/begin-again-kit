
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, ArrowRight, X } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import type { CompositeDish } from '@/hooks/useCompositeDishes';
import type { Tables } from '@/integrations/supabase/types';

type MenuItem = Tables<'menu_items'>;

interface CustomizationDialogProps {
  dish: CompositeDish;
  isOpen: boolean;
  onClose: () => void;
}

interface OptionalElementCustomization {
  elementId: string;
  isIncluded: boolean;
  replacementItemId?: string;
  priceAdjustment: number;
}

const CustomizationDialog = ({ dish, isOpen, onClose }: CustomizationDialogProps) => {
  const { addItem } = useCart();
  const [customizations, setCustomizations] = useState<OptionalElementCustomization[]>([]);
  const [totalPrice, setTotalPrice] = useState(dish.base_price);

  useEffect(() => {
    // Initialize customizations with default values
    const initialCustomizations = dish.dish_optional_elements?.map(element => ({
      elementId: element.id,
      isIncluded: element.is_included_by_default,
      priceAdjustment: element.is_included_by_default ? (element.additional_price || 0) : 0
    })) || [];
    
    setCustomizations(initialCustomizations);
    
    // Calculate initial total price correctly
    const optionalPrice = initialCustomizations.reduce((sum, custom) => 
      sum + (custom.isIncluded ? custom.priceAdjustment : 0), 0
    );
    const calculatedTotal = dish.base_price + optionalPrice;
    setTotalPrice(calculatedTotal);
    
    console.log('CustomizationDialog - Initial state:', {
      dishName: dish.name,
      basePrice: dish.base_price,
      initialCustomizations,
      optionalPrice,
      totalPrice: calculatedTotal
    });
  }, [dish]);

  const recalculateTotalPrice = (updatedCustomizations: OptionalElementCustomization[]) => {
    const optionalPrice = updatedCustomizations.reduce((sum, custom) => 
      sum + (custom.isIncluded ? custom.priceAdjustment : 0), 0
    );
    const newTotal = dish.base_price + optionalPrice;
    
    console.log('CustomizationDialog - Price recalculation:', {
      basePrice: dish.base_price,
      optionalPrice,
      newTotal,
      customizations: updatedCustomizations.filter(c => c.isIncluded)
    });
    
    setTotalPrice(newTotal);
    return newTotal;
  };

  const toggleOptionalElement = (elementId: string, element: any) => {
    console.log('CustomizationDialog - Toggling element:', {
      elementId,
      elementName: element.menu_items.name,
      currentState: customizations.find(c => c.elementId === elementId)
    });
    
    setCustomizations(prev => {
      const updated = prev.map(custom => {
        if (custom.elementId === elementId) {
          const newIsIncluded = !custom.isIncluded;
          const newPriceAdjustment = newIsIncluded ? (element.additional_price || 0) : 0;
          
          console.log('CustomizationDialog - Toggle calculation:', {
            elementId,
            newIsIncluded,
            additionalPrice: element.additional_price,
            newPriceAdjustment
          });
          
          return {
            ...custom,
            isIncluded: newIsIncluded,
            replacementItemId: undefined, // Reset replacement when toggling
            priceAdjustment: newPriceAdjustment
          };
        }
        return custom;
      });
      
      recalculateTotalPrice(updated);
      return updated;
    });
  };

  const replaceOptionalElement = (elementId: string, replacementItem: MenuItem, originalElement: any) => {
    console.log('CustomizationDialog - Replacing element:', {
      elementId,
      originalItemName: originalElement.menu_items.name,
      originalItemPrice: originalElement.menu_items.price,
      replacementItemName: replacementItem.name,
      replacementItemPrice: replacementItem.price,
      additionalPrice: originalElement.additional_price
    });
    
    setCustomizations(prev => {
      const updated = prev.map(custom => {
        if (custom.elementId === elementId) {
          // Find the replacement option to get the correct price difference
          const replacementOption = originalElement.dish_replacement_options?.find(
            option => option.replacement_menu_items.id === replacementItem.id
          );
          
          // Use the price_difference from the replacement option instead of calculating it
          const priceDifferenceFromOption = replacementOption?.price_difference || 0;
          
          // The price adjustment should be the base additional price plus the price difference
          const baseAdditionalPrice = originalElement.additional_price || 0;
          const newPriceAdjustment = baseAdditionalPrice + priceDifferenceFromOption;
          
          console.log('CustomizationDialog - Replacement calculation:', {
            elementId,
            priceDifferenceFromOption,
            baseAdditionalPrice,
            newPriceAdjustment
          });
          
          return {
            ...custom,
            isIncluded: true,
            replacementItemId: replacementItem.id,
            priceAdjustment: newPriceAdjustment
          };
        }
        return custom;
      });
      
      recalculateTotalPrice(updated);
      return updated;
    });
  };

  const removeReplacement = (elementId: string, originalElement: any) => {
    console.log('CustomizationDialog - Removing replacement for element:', {
      elementId,
      originalElementName: originalElement.menu_items.name
    });
    
    setCustomizations(prev => {
      const updated = prev.map(custom => {
        if (custom.elementId === elementId) {
          return {
            ...custom,
            isIncluded: true,
            replacementItemId: undefined,
            priceAdjustment: originalElement.additional_price || 0
          };
        }
        return custom;
      });
      
      recalculateTotalPrice(updated);
      return updated;
    });
  };

  const handleAddToCart = async () => {
    console.log('CustomizationDialog - Adding to cart:', {
      dishName: dish.name,
      basePrice: dish.base_price,
      totalPrice,
      customizations: customizations.filter(c => c.isIncluded)
    });
    
    // Create a MenuItem-compatible object for the customized dish
    const customizedDish = {
      id: `${dish.id}-${Date.now()}`, // Unique ID for customized version
      name: dish.name,
      price: totalPrice, // Use the calculated total price
      description: dish.description || '',
      image_url: dish.image_url || '',
      is_available: dish.is_available,
      category_id: dish.category_id || '',
      created_at: dish.created_at || new Date().toISOString(),
      preparation_time: dish.preparation_time || '',
      rating: 0,
      updated_at: dish.updated_at || new Date().toISOString()
    };

    console.log('CustomizationDialog - Customized dish object:', customizedDish);

    // Store customizations in localStorage for later use during order creation
    const customizationData = {
      dishId: dish.id,
      customizations: customizations.filter(c => c.isIncluded),
      totalPrice: totalPrice, // Store the calculated total price
      basePrice: dish.base_price
    };
    
    localStorage.setItem(`dish-customization-${customizedDish.id}`, JSON.stringify(customizationData));

    addItem(customizedDish);
    toast.success(`${dish.name} personalizado agregado al carrito`);
    onClose();
  };

  const getCustomizationForElement = (elementId: string) => {
    return customizations.find(c => c.elementId === elementId);
  };

  const getReplacementItem = (elementId: string) => {
    const customization = getCustomizationForElement(elementId);
    if (!customization?.replacementItemId) return null;
    
    const element = dish.dish_optional_elements?.find(e => e.id === elementId);
    return element?.dish_replacement_options?.find(
      option => option.replacement_menu_items.id === customization.replacementItemId
    )?.replacement_menu_items;
  };

  // Group elements by type for better organization
  const groupedElements = dish.dish_optional_elements?.reduce((groups, element) => {
    const type = element.element_type || 'other';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(element);
    return groups;
  }, {} as Record<string, typeof dish.dish_optional_elements>) || {};

  const getTypeLabel = (type: string) => {
    const labels = {
      drink: '🥤 Bebidas',
      side: '🍟 Acompañamientos',
      bread: '🍞 Pan',
      sauce: '🥄 Salsas',
      dessert: '🍰 Postres',
      other: '🍽️ Otros'
    };
    return labels[type] || '🍽️ Otros';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personalizar {dish.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Base Products (Non-modifiable) */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Productos Base (Incluidos)</h3>
            <div className="space-y-2">
              {dish.dish_base_products?.map((baseProduct) => (
                <div key={baseProduct.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{baseProduct.quantity}x</Badge>
                    <span>{baseProduct.menu_items.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">Incluido</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Optional Elements (Modifiable) - Grouped by type */}
          {Object.keys(groupedElements).length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Elementos Opcionales</h3>
              <div className="space-y-6">
                {Object.entries(groupedElements).map(([type, elements]) => (
                  <div key={type}>
                    <h4 className="font-medium text-base mb-3 text-orange-600">
                      {getTypeLabel(type)}
                    </h4>
                    <div className="space-y-4">
                      {elements.map((element) => {
                        const customization = getCustomizationForElement(element.id);
                        const replacementItem = getReplacementItem(element.id);
                        
                        return (
                          <Card key={element.id} className="border-l-4 border-l-orange-200">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">
                                  {replacementItem ? replacementItem.name : element.menu_items.name}
                                </CardTitle>
                                <Button
                                  variant={customization?.isIncluded ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => toggleOptionalElement(element.id, element)}
                                  className={customization?.isIncluded ? "bg-orange-600 hover:bg-orange-700" : ""}
                                >
                                  {customization?.isIncluded ? <Minus className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                                  {customization?.isIncluded ? 'Quitar' : 'Agregar'}
                                </Button>
                              </div>
                            </CardHeader>
                            
                            <CardContent className="pt-0">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  {replacementItem && (
                                    <div className="text-sm text-blue-600 flex items-center gap-1 mb-1">
                                      <span>{element.menu_items.name}</span>
                                      <ArrowRight className="h-3 w-3" />
                                      <span>{replacementItem.name}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeReplacement(element.id, element)}
                                        className="h-6 w-6 p-0 ml-2"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold">
                                    {customization?.priceAdjustment && customization.priceAdjustment > 0 ? 
                                      `+$${customization.priceAdjustment.toFixed(2)}` : 
                                      customization?.priceAdjustment && customization.priceAdjustment < 0 ?
                                      `$${customization.priceAdjustment.toFixed(2)}` :
                                      'Gratis'
                                    }
                                  </div>
                                </div>
                              </div>
                              
                              {/* Replacement Options */}
                              {customization?.isIncluded && element.dish_replacement_options && element.dish_replacement_options.length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-sm font-medium text-gray-700">Cambiar por:</div>
                                  <div className="grid grid-cols-1 gap-2">
                                    {element.dish_replacement_options.map((option) => (
                                      <button
                                        key={option.id}
                                        className={`text-left p-2 rounded border text-sm transition-colors ${
                                          customization.replacementItemId === option.replacement_menu_items.id
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                        onClick={() => replaceOptionalElement(element.id, option.replacement_menu_items, element)}
                                      >
                                        <div className="flex justify-between items-center">
                                          <span>{option.replacement_menu_items.name}</span>
                                          <span className={option.price_difference > 0 ? 'text-orange-600' : option.price_difference < 0 ? 'text-green-600' : 'text-gray-600'}>
                                            {option.price_difference > 0 ? `+$${option.price_difference.toFixed(2)}` : 
                                             option.price_difference < 0 ? `-$${Math.abs(option.price_difference).toFixed(2)}` : 'Sin costo'}
                                          </span>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Order Summary */}
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Resumen del Pedido</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Precio base:</span>
                <span>${dish.base_price.toFixed(2)}</span>
              </div>
              
              {customizations.filter(c => c.isIncluded && c.priceAdjustment !== 0).map((custom) => {
                const element = dish.dish_optional_elements?.find(e => e.id === custom.elementId);
                const replacementItem = getReplacementItem(custom.elementId);
                
                return (
                  <div key={custom.elementId} className="flex justify-between text-sm">
                    <span>
                      {replacementItem ? replacementItem.name : element?.menu_items.name}
                    </span>
                    <span className={custom.priceAdjustment > 0 ? 'text-orange-600' : 'text-green-600'}>
                      {custom.priceAdjustment > 0 ? '+' : ''}${custom.priceAdjustment.toFixed(2)}
                    </span>
                  </div>
                );
              })}
              
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleAddToCart} className="flex-1 bg-orange-600 hover:bg-orange-700">
              Agregar al Carrito - ${totalPrice.toFixed(2)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomizationDialog;
