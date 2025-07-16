
import React from 'react';
import { type Order } from './types';

interface OrderItemsProps {
  order: Order;
}

const OrderItems = ({ order }: OrderItemsProps) => {
  return (
    <div className="mb-4">
      <h4 className="font-medium mb-2">Productos</h4>
      <div className="space-y-3">
        {order.order_items?.map((item) => {
          // Determinar el nombre del producto según si es plato regular o compuesto
          const itemName = item.menu_items?.name || 
                          (item.composite_dish_id ? 
                            (item.composite_dishes?.name || 'Plato Personalizado') : 
                            'Producto desconocido');
          
          return (
            <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {item.quantity}x {itemName}
                    </span>
                    {item.composite_dish_id && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                        Personalizado
                      </span>
                    )}
                  </div>
                  
                  {/* Mostrar customizaciones si es un plato compuesto */}
                  {item.composite_dish_id && item.order_dish_customizations && item.order_dish_customizations.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      <div className="font-medium text-gray-700">Personalizaciones:</div>
                      {item.order_dish_customizations.map((customization) => (
                        <div key={customization.id} className="ml-2 flex items-center gap-2">
                          {customization.is_included ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-red-600">✗</span>
                          )}
                          <span>
                            {customization.replacement_item_id ? (
                              <>
                                {customization.dish_optional_elements?.menu_items.name} → {' '}
                                <span className="font-medium">
                                  {customization.replacement_menu_items?.name}
                                </span>
                              </>
                            ) : (
                              customization.dish_optional_elements?.menu_items.name
                            )}
                          </span>
                          {customization.price_adjustment !== 0 && (
                            <span className={`text-xs ${customization.price_adjustment > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                              ({customization.price_adjustment > 0 ? '+' : ''}${customization.price_adjustment.toFixed(2)})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="font-medium text-right">${item.total_price.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderItems;
