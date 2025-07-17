
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DriverOrder } from '@/types/driver';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export const useDriverOrders = (driverId?: string) => {
  const queryClient = useQueryClient();

  // Fetch assigned orders (orders specifically assigned to this driver)
  const { data: assignedOrders, isLoading: isLoadingAssigned, error: assignedError } = useQuery({
    queryKey: ['driver-orders', driverId],
    queryFn: async () => {
      if (!driverId) return [];
      
      console.log('Fetching assigned orders for driver:', driverId);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (
            full_name,
            phone
          ),
          delivery_addresses (
            street_address,
            city,
            postal_code
          ),
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            menu_items (
              name
            )
          ),
          order_assignments!inner (
            id,
            assigned_at,
            picked_up_at,
            delivered_at,
            estimated_pickup_time,
            estimated_delivery_time,
            actual_distance
          )
        `)
        .eq('order_assignments.driver_id', driverId)
        .in('status', ['confirmed', 'preparing', 'ready'])
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching assigned orders:', error);
        throw error;
      }
      
      console.log('Fetched assigned orders:', data);
      return data as DriverOrder[];
    },
    enabled: !!driverId,
    retry: 2,
    retryDelay: 1000
  });

  // Fetch available orders (orders with status "ready" that are NOT assigned to any driver)
  const { data: availableOrders, isLoading: isLoadingAvailable, error: availableError } = useQuery({
    queryKey: ['available-orders'],
    queryFn: async () => {
      console.log('Fetching available orders with status ready');
      console.log('Supabase URL:', supabase.supabaseUrl);
      console.log('Supabase Key:', supabase.supabaseKey?.substring(0, 20) + '...');
      
      // First, get all order IDs that are already assigned to drivers
      const { data: assignedOrderIds, error: assignedError } = await supabase
        .from('order_assignments')
        .select('order_id');
      
      if (assignedError) {
        console.error('Error fetching assigned order IDs:', assignedError);
        throw assignedError;
      }
      
      const excludeOrderIds = assignedOrderIds?.map(a => a.order_id) || [];
      console.log('Excluding order IDs that are already assigned:', excludeOrderIds);
      
      // Now fetch orders with status "ready" that are NOT in the assigned list
      let query = supabase
        .from('orders')
        .select(`
          *,
          profiles (
            full_name,
            phone
          ),
          delivery_addresses (
            street_address,
            city,
            postal_code
          ),
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            menu_items (
              name
            )
          )
        `)
        .eq('status', 'ready')
        .order('created_at', { ascending: false });
      
      // Only exclude if there are assigned orders
      if (excludeOrderIds.length > 0) {
        query = query.not('id', 'in', `(${excludeOrderIds.join(',')})`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching available orders:', error);
        throw error;
      }
      
      console.log('Fetched available orders:', data);
      return data as DriverOrder[];
    },
    retry: 2,
    retryDelay: 1000
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ 
      orderId, 
      status, 
      assignmentUpdate 
    }: { 
      orderId: string; 
      status: OrderStatus;
      assignmentUpdate?: {
        picked_up_at?: string;
        delivered_at?: string;
      };
    }) => {
      console.log('Updating order status:', { orderId, status, assignmentUpdate });
      
      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderError) {
        console.error('Error updating order status:', orderError);
        throw orderError;
      }

      // Update assignment if provided
      if (assignmentUpdate) {
        const { error: assignmentError } = await supabase
          .from('order_assignments')
          .update(assignmentUpdate)
          .eq('order_id', orderId);

        if (assignmentError) {
          console.error('Error updating assignment:', assignmentError);
          throw assignmentError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
      queryClient.invalidateQueries({ queryKey: ['available-orders'] });
      toast.success('Estado del pedido actualizado');
    },
    onError: (error) => {
      console.error('Error in updateOrderStatus:', error);
      toast.error('Error al actualizar pedido: ' + error.message);
    }
  });

  const assignOrderToDriver = useMutation({
    mutationFn: async ({ orderId, driverId }: { orderId: string; driverId: string }) => {
      console.log('Assigning order to driver:', { orderId, driverId });
      
      // Check if assignment already exists
      const { data: existingAssignment } = await supabase
        .from('order_assignments')
        .select('id')
        .eq('order_id', orderId)
        .single();

      if (existingAssignment) {
        // Update existing assignment
        const { error } = await supabase
          .from('order_assignments')
          .update({
            driver_id: driverId,
            assigned_at: new Date().toISOString()
          })
          .eq('order_id', orderId);

        if (error) throw error;
      } else {
        // Create new assignment
        const { error } = await supabase
          .from('order_assignments')
          .insert({
            order_id: orderId,
            driver_id: driverId,
            assigned_at: new Date().toISOString()
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
      queryClient.invalidateQueries({ queryKey: ['available-orders'] });
      toast.success('Pedido asignado correctamente');
    },
    onError: (error) => {
      console.error('Error assigning order:', error);
      toast.error('Error al asignar pedido: ' + error.message);
    }
  });

  const pickupOrder = (orderId: string) => {
    updateOrderStatus.mutate({
      orderId,
      status: 'ready' as OrderStatus,
      assignmentUpdate: {
        picked_up_at: new Date().toISOString()
      }
    });
  };

  const deliverOrder = (orderId: string) => {
    updateOrderStatus.mutate({
      orderId,
      status: 'delivered' as OrderStatus,
      assignmentUpdate: {
        delivered_at: new Date().toISOString()
      }
    });
  };

  // Log any errors for debugging
  useEffect(() => {
    if (assignedError) {
      console.error('Assigned orders query error:', assignedError);
    }
    if (availableError) {
      console.error('Available orders query error:', availableError);
    }
  }, [assignedError, availableError]);

  return {
    assignedOrders,
    availableOrders,
    isLoading: isLoadingAssigned || isLoadingAvailable,
    error: assignedError || availableError,
    updateOrderStatus,
    assignOrderToDriver,
    pickupOrder,
    deliverOrder
  };
};
