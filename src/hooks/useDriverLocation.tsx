
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDriverLocation = (driverId?: string) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const updateLocation = useMutation({
    mutationFn: async ({
      latitude,
      longitude,
      orderId,
      accuracy,
      speed,
      heading
    }: {
      latitude: number;
      longitude: number;
      orderId?: string;
      accuracy?: number;
      speed?: number;
      heading?: number;
    }) => {
      if (!driverId) throw new Error('Driver ID required');

      const { error } = await supabase
        .from('driver_locations')
        .insert({
          driver_id: driverId,
          order_id: orderId,
          latitude,
          longitude,
          accuracy,
          speed,
          heading
        });

      if (error) throw error;
    },
    onError: (error) => {
      console.error('Error updating location:', error);
    }
  });

  const startTracking = (orderId?: string) => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no disponible');
      return;
    }

    setIsTracking(true);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        
        setCurrentLocation({ latitude, longitude });
        
        updateLocation.mutate({
          latitude,
          longitude,
          orderId,
          accuracy: accuracy || undefined,
          speed: speed || undefined,
          heading: heading || undefined
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Error obteniendo ubicación');
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 27000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setIsTracking(false);
    };
  };

  const stopTracking = () => {
    setIsTracking(false);
  };

  return {
    isTracking,
    currentLocation,
    startTracking,
    stopTracking,
    updateLocation
  };
};
