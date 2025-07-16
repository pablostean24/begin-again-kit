
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAvailableOrders = (driverId?: string) => {
  const queryClient = useQueryClient();

  const { data: availableOrders, isLoading, error } = useQuery({
    queryKey: ['available-orders', driverId],
    queryFn: async () => {
      if (!driverId) return [];
      
      console.log('Fetching available orders for driver:', driverId);
      
      // Get orders that are pending and not assigned yet
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!inner (
            full_name,
            phone
          ),
          delivery_addresses!inner (
            street_address,
            city,
            latitude,
            longitude
          ),
          order_items (
            id,
            quantity,
            menu_items (
              name
            ),
            composite_dishes (
              name
            )
          )
        `)
        .eq('status', 'pending')
        .is('delivery_address_id', null) // Only delivery orders
        .not('order_assignments', 'cs', '{}') // No existing assignments
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching available orders:', error);
        throw error;
      }
      
      // Filter out orders that already have assignments
      const filteredOrders = [];
      
      for (const order of data || []) {
        const { data: assignments } = await supabase
          .from('order_assignments')
          .select('id')
          .eq('order_id', order.id);
        
        if (!assignments || assignments.length === 0) {
          filteredOrders.push(order);
        }
      }
      
      console.log('Available orders:', filteredOrders);
      return filteredOrders;
    },
    enabled: !!driverId,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 2,
    retryDelay: 1000
  });

  // Real-time subscription for new orders
  useEffect(() => {
    if (!driverId) return;

    console.log('Setting up real-time subscription for new orders');

    const channel = supabase
      .channel('new-orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New order detected:', payload.new);
          
          // Only refetch if it's a delivery order (no table info in notes)
          const order = payload.new as any;
          if (order.status === 'pending' && !order.notes?.includes('Mesa:')) {
            queryClient.invalidateQueries({ queryKey: ['available-orders'] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order updated:', payload.new);
          queryClient.invalidateQueries({ queryKey: ['available-orders'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [driverId, queryClient]);

  // Log any errors for debugging
  useEffect(() => {
    if (error) {
      console.error('Available orders query error:', error);
    }
  }, [error]);

  return {
    availableOrders,
    isLoading,
    error
  };
};
