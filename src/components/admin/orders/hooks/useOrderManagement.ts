
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { type Order, type OrderStatus, extractTableId } from '../types';

export const useOrderManagement = () => {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (
            full_name,
            phone,
            email
          ),
          delivery_addresses (
            street_address,
            city,
            postal_code
          ),
          order_items (
            *,
            menu_items (
              name,
              price
            ),
            composite_dishes (
              name,
              base_price
            ),
            order_dish_customizations (
              *,
              dish_optional_elements (
                menu_items (
                  name
                )
              ),
              replacement_menu_items:replacement_item_id (
                name
              )
            )
          ),
          order_assignments (
            *,
            delivery_drivers (
              full_name,
              phone
            )
          ),
          manual_payment_verifications (
            *
          )
        `)
        .order('created_at', { ascending: false });

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Para cada pedido, si tiene notas de mesa, obtener la información de la mesa
      const ordersWithTables = await Promise.all(
        (data || []).map(async (order) => {
          const tableId = extractTableId(order.notes);
          
          if (tableId) {
            const { data: tableData } = await supabase
              .from('restaurant_tables')
              .select('table_number, zone')
              .eq('id', tableId)
              .single();
            
            return {
              ...order,
              restaurant_table: tableData
            };
          }
          
          return order;
        })
      );

      return ordersWithTables as Order[];
    }
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Estado del pedido actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar el estado del pedido');
      console.error('Error updating order status:', error);
    }
  });

  const handleStatusChange = (orderId: string, status: string) => {
    updateOrderStatus.mutate({ orderId, status: status as OrderStatus });
  };

  return {
    orders,
    isLoading,
    selectedStatus,
    setSelectedStatus,
    handleStatusChange
  };
};
