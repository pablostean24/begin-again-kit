
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useWaiterContext } from '@/hooks/useWaiterContext';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useCreateWaiterOrder } from '@/hooks/useTables';
import TableSelector from '@/components/TableSelector';

export const Cart = () => {
  const { items, updateQuantity, removeItem, clearCart, totalItems, totalPrice } = useCart();
  const { user, userRole } = useAuth();
  const { selectedTable, setSelectedTable } = useWaiterContext();
  const navigate = useNavigate();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showTableSelector, setShowTableSelector] = useState(false);
  const createWaiterOrder = useCreateWaiterOrder();

  const isWaiter = userRole === 'mesero';

  const createOrderItemWithCustomizations = async (orderId: string, item: any) => {
    // Check if it's a customized composite dish (has timestamp in ID)
    const isCustomizedDish = item.id.includes('-') && item.id.split('-').length > 5;
    
    if (isCustomizedDish) {
      // Extract original dish ID (all parts except the last timestamp part)
      const idParts = item.id.split('-');
      const originalDishId = idParts.slice(0, -1).join('-');
      
      // Get customization data from localStorage
      const customizationData = localStorage.getItem(`dish-customization-${item.id}`);
      let finalPrice = item.price;
      
      if (customizationData) {
        try {
          const { totalPrice } = JSON.parse(customizationData);
          // Use the stored total price to ensure accuracy
          finalPrice = totalPrice || item.price;
          console.log('Cart - Using stored customization price:', { totalPrice, finalPrice });
        } catch (error) {
          console.error('Cart - Error parsing customization data:', error);
        }
      }
      
      // Try to find as composite dish first
      const { data: compositeDish, error: compositeError } = await supabase
        .from('composite_dishes')
        .select('id, name')
        .eq('id', originalDishId)
        .single();
      
      if (!compositeError && compositeDish) {
        const { data: orderItem, error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: orderId,
            menu_item_id: null,
            composite_dish_id: compositeDish.id,
            quantity: item.quantity,
            unit_price: finalPrice, // Use the calculated final price
            total_price: finalPrice * item.quantity
          })
          .select()
          .single();
        
        if (itemError) throw itemError;
        
        // Save customizations if available
        if (customizationData && orderItem) {
          try {
            const { customizations } = JSON.parse(customizationData);
            
            for (const customization of customizations) {
              await supabase
                .from('order_dish_customizations')
                .insert({
                  order_item_id: orderItem.id,
                  optional_element_id: customization.elementId,
                  is_included: customization.isIncluded,
                  replacement_item_id: customization.replacementItemId || null,
                  price_adjustment: customization.priceAdjustment
                });
            }
            
            // Clean up localStorage
            localStorage.removeItem(`dish-customization-${item.id}`);
            
          } catch (error) {
            console.error('Cart - Error processing customizations:', error);
          }
        }
        return;
      }
      
      // Fall back to regular menu item
      const { data: menuItem, error: menuError } = await supabase
        .from('menu_items')
        .select('id, name')
        .eq('id', originalDishId)
        .single();
      
      if (menuError) throw new Error(`Item no encontrado: ${item.name}`);
      
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderId,
          menu_item_id: menuItem.id,
          composite_dish_id: null,
          quantity: item.quantity,
          unit_price: finalPrice, // Use the calculated final price
          total_price: finalPrice * item.quantity
        });
      
      if (itemError) throw itemError;
      return;
    }
    
    // Regular item - try composite first, then menu items
    const { data: compositeDish, error: compositeError } = await supabase
      .from('composite_dishes')
      .select('id, name')
      .eq('id', item.id)
      .single();
    
    if (!compositeError && compositeDish) {
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderId,
          menu_item_id: null,
          composite_dish_id: compositeDish.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        });
      
      if (itemError) throw itemError;
      return;
    }
    
    // Regular menu item
    const { error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        menu_item_id: item.id,
        composite_dish_id: null,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      });
    
    if (itemError) throw itemError;
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para hacer un pedido');
      return;
    }

    if (items.length === 0) {
      toast.error('Tu carrito está vacío');
      return;
    }

    // For waiters, check if table is selected
    if (isWaiter && !selectedTable) {
      setShowTableSelector(true);
      toast.error('Debes seleccionar una mesa antes de realizar el pedido');
      return;
    }

    setIsPlacingOrder(true);

    try {
      if (isWaiter && selectedTable) {
        // Waiter flow - create table order
        await createWaiterOrder.mutateAsync({
          items: items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            name: item.name
          })),
          tableId: selectedTable.id,
          totalAmount: totalPrice
        });

        clearCart();
        setSelectedTable(null);
        setShowTableSelector(false);
      } else {
        // Regular customer flow
        const deliveryFee = 3.50;
        const finalTotal = totalPrice + deliveryFee;

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            total_amount: finalTotal,
            delivery_fee: deliveryFee,
            status: 'pending'
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Process each item with customizations
        for (const item of items) {
          await createOrderItemWithCustomizations(order.id, item);
        }

        toast.success('¡Pedido realizado exitosamente!');
        clearCart();
        
        // Redirect to payment page
        navigate(`/payment/${order.id}`);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al realizar el pedido: ${errorMessage}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Tu Carrito ({totalItems} productos)</SheetTitle>
        </SheetHeader>
        
        <div className="mt-8 space-y-4">
          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Tu carrito está vacío</p>
          ) : (
            <>
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-600">${item.price.toFixed(2)} c/u</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <span className="w-8 text-center">{item.quantity}</span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Table selector for waiters */}
              {isWaiter && showTableSelector && (
                <div className="border-t pt-4">
                  <TableSelector
                    selectedTableId={selectedTable?.id}
                    onTableSelect={(table) => {
                      setSelectedTable(table);
                      setShowTableSelector(false);
                    }}
                  />
                </div>
              )}
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                
                {!isWaiter && (
                  <>
                    <div className="flex justify-between">
                      <span>Envío:</span>
                      <span>$3.50</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${(totalPrice + 3.50).toFixed(2)}</span>
                    </div>
                  </>
                )}
                
                {isWaiter && (
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              {/* Show selected table for waiters */}
              {isWaiter && selectedTable && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    Mesa seleccionada: <strong>Mesa {selectedTable.table_number}</strong>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setShowTableSelector(true)}
                  >
                    Cambiar mesa
                  </Button>
                </div>
              )}
              
              <Button 
                onClick={handlePlaceOrder}
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={isPlacingOrder || !user}
              >
                {isPlacingOrder ? 'Procesando...' : 
                  isWaiter ? 'Enviar a Cocina' : 'Realizar Pedido'}
              </Button>
              
              {!user && (
                <p className="text-sm text-red-600 text-center">
                  Debes iniciar sesión para realizar un pedido
                </p>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
