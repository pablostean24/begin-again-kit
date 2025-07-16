
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Table {
  id: string;
  table_number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'cleaning';
  zone?: string;
  created_at: string;
  updated_at: string;
}

export const useTables = () => {
  return useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .order('table_number');

      if (error) throw error;

      // Transform the data to match our Table interface
      return data?.map(table => ({
        id: table.id,
        table_number: table.table_number,
        capacity: table.capacity,
        status: table.status as 'available' | 'occupied' | 'cleaning',
        zone: table.zone,
        created_at: table.created_at,
        updated_at: table.updated_at
      })) || [];
    }
  });
};

const validateOrderItem = (item: any) => {
  if (!item.id || !item.name || !item.price || !item.quantity) {
    throw new Error(`Item inválido: falta información requerida`);
  }
  if (item.quantity <= 0) {
    throw new Error(`Cantidad inválida para ${item.name}`);
  }
  if (item.price <= 0) {
    throw new Error(`Precio inválido para ${item.name}`);
  }
};

const createOrderItem = async (orderId: string, item: any) => {
  console.log('Creating order item for:', item);
  
  // Validar el item antes de procesarlo
  validateOrderItem(item);
  
  // Check if it's a customized composite dish (has timestamp in ID)
  const isCustomizedDish = item.id.includes('-') && item.id.split('-').length > 5;
  
  if (isCustomizedDish) {
    // Extract original dish ID (all parts except the last timestamp part)
    const idParts = item.id.split('-');
    const originalDishId = idParts.slice(0, -1).join('-');
    console.log('Processing customized composite dish, original ID:', originalDishId);
    
    // Get customization data from localStorage
    const customizationData = localStorage.getItem(`dish-customization-${item.id}`);
    let finalPrice = item.price;
    
    if (customizationData) {
      try {
        const { totalPrice, basePrice } = JSON.parse(customizationData);
        // Use the stored total price to ensure accuracy
        finalPrice = totalPrice || item.price;
        console.log('Using stored customization price:', { totalPrice, basePrice, finalPrice });
      } catch (error) {
        console.error('Error parsing customization data:', error);
      }
    }
    
    // Try to find as composite dish first
    const { data: compositeDish, error: compositeError } = await supabase
      .from('composite_dishes')
      .select('id, name')
      .eq('id', originalDishId)
      .single();
    
    if (!compositeError && compositeDish) {
      console.log('Found composite dish:', compositeDish);
      
      // Create order item for composite dish with correct price
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
      
      if (itemError) {
        console.error('Error creating composite dish order item:', itemError);
        throw itemError;
      }
      
      console.log('Successfully created composite dish order item:', orderItem);
      
      // Save customizations to the database if available
      if (customizationData && orderItem) {
        try {
          const { customizations } = JSON.parse(customizationData);
          console.log('Found customizations to save:', customizations);
          
          // Save customizations to the database
          for (const customization of customizations) {
            const { error: customError } = await supabase
              .from('order_dish_customizations')
              .insert({
                order_item_id: orderItem.id,
                optional_element_id: customization.elementId,
                is_included: customization.isIncluded,
                replacement_item_id: customization.replacementItemId || null,
                price_adjustment: customization.priceAdjustment
              });
            
            if (customError) {
              console.error('Error saving customization:', customError);
              // Don't throw here, just log the error
            }
          }
          
          // Clean up localStorage
          localStorage.removeItem(`dish-customization-${item.id}`);
          console.log('Customizations saved and localStorage cleaned');
          
        } catch (error) {
          console.error('Error processing customizations:', error);
        }
      }
      
      return;
    }
    
    // If not found as composite dish, try as regular menu item
    console.log('Not found as composite dish, trying as regular menu item with original ID');
    const { data: menuItem, error: menuError } = await supabase
      .from('menu_items')
      .select('id, name')
      .eq('id', originalDishId)
      .single();
    
    if (menuError) {
      console.error('Menu item not found with original ID:', menuError);
      throw new Error(`Item no encontrado: ${item.name}`);
    }
    
    // Create order item for regular menu item with correct price
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
    
    if (itemError) {
      console.error('Error creating regular menu item order item:', itemError);
      throw itemError;
    }
    console.log('Successfully created regular menu item order item');
    return;
  }
  
  // Regular item processing - first try composite dishes, then menu items
  console.log('Processing regular item:', item.name);
  
  // First try to find in composite dishes by ID
  const { data: compositeDish, error: compositeError } = await supabase
    .from('composite_dishes')
    .select('id, name')
    .eq('id', item.id)
    .single();
  
  if (!compositeError && compositeDish) {
    console.log('Found composite dish:', compositeDish);
    // Create order item for composite dish
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
    
    if (itemError) {
      console.error('Error creating composite dish order item:', itemError);
      throw itemError;
    }
    console.log('Successfully created composite dish order item');
    return;
  }
  
  // Try to find in regular menu items by ID
  const { data: menuItem, error: menuError } = await supabase
    .from('menu_items')
    .select('id, name')
    .eq('id', item.id)
    .single();
  
  if (menuError) {
    console.error('Menu item not found by ID:', menuError);
    throw new Error(`Item no encontrado: ${item.name}`);
  }
  
  console.log('Found regular menu item:', menuItem);
  // Create order item for regular menu item
  const { error: itemError } = await supabase
    .from('order_items')
    .insert({
      order_id: orderId,
      menu_item_id: menuItem.id,
      composite_dish_id: null,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity
    });
  
  if (itemError) {
    console.error('Error creating regular menu item order item:', itemError);
    throw itemError;
  }
  console.log('Successfully created regular menu item order item');
};

export const useCreateWaiterOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      items, 
      tableId, 
      totalAmount 
    }: { 
      items: Array<{ id: string; quantity: number; price: number; name: string }>, 
      tableId: string, 
      totalAmount: number 
    }) => {
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      console.log('Creating waiter order with items:', items);
      console.log('Table ID:', tableId);
      console.log('Total amount:', totalAmount);

      // Validar que hay items en el pedido
      if (!items || items.length === 0) {
        throw new Error('No hay items en el pedido');
      }

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          status: 'pending',
          notes: `Mesa: ${tableId}`
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }

      console.log('Order created:', order);

      // Process each item individually using the helper function
      for (const item of items) {
        await createOrderItem(order.id, item);
      }

      console.log('Order creation completed successfully');
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Éxito",
        description: "Pedido enviado a cocina correctamente",
      });
    },
    onError: (error) => {
      console.error('Error creating waiter order:', error);
      toast({
        title: "Error",
        description: `No se pudo crear el pedido: ${error.message}`,
        variant: "destructive",
      });
    }
  });
};
