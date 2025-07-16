import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DriverNotification } from '@/types/driver';

export const useDriverNotifications = (driverId?: string) => {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['driver-notifications', driverId],
    queryFn: async () => {
      if (!driverId) return [];
      
      console.log('Fetching notifications for driver:', driverId);
      
      const { data, error } = await supabase
        .from('driver_notifications')
        .select(`
          *,
          orders (
            id,
            total_amount,
            delivery_address_id,
            delivery_addresses (
              street_address,
              city
            )
          )
        `)
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching driver notifications:', error);
        throw error;
      }
      
      console.log('Fetched driver notifications:', data);
      return data as DriverNotification[];
    },
    enabled: !!driverId,
    retry: 2,
    retryDelay: 1000
  });

  const respondToNotification = useMutation({
    mutationFn: async ({ 
      notificationId, 
      response 
    }: { 
      notificationId: string; 
      response: 'accepted' | 'rejected' 
    }) => {
      console.log('Responding to notification:', { notificationId, response });
      
      const { error } = await supabase
        .from('driver_notifications')
        .update({
          response,
          responded_at: new Date().toISOString(),
          is_read: true
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error responding to notification:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-notifications'] });
      toast.success('Respuesta enviada exitosamente');
    },
    onError: (error) => {
      console.error('Error in respondToNotification:', error);
      toast.error('Error al responder notificación: ' + error.message);
    }
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      console.log('Marking notification as read:', notificationId);
      
      const { error } = await supabase
        .from('driver_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-notifications'] });
    },
    onError: (error) => {
      console.error('Error in markAsRead:', error);
    }
  });

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!driverId) return;

    console.log('Setting up real-time subscription for driver:', driverId);

    const channel = supabase
      .channel('driver-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_notifications',
          filter: `driver_id=eq.${driverId}`
        },
        (payload) => {
          console.log('Real-time notification change:', payload);
          queryClient.invalidateQueries({ queryKey: ['driver-notifications'] });
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
      console.error('Driver notifications query error:', error);
    }
  }, [error]);

  return {
    notifications,
    isLoading,
    error,
    respondToNotification,
    markAsRead
  };
};