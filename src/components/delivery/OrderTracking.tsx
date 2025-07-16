import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Phone, 
  User,
  Package,
  CheckCircle,
  Truck,
  Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OrderTrackingProps {
  orderId: string;
  customerLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

interface OrderWithDriver {
  id: string;
  status: string;
  delivery_addresses: Array<{
    latitude: number;
    longitude: number;
    street_address: string;
  }> | null;
  order_assignments: Array<{
    driver_id: string;
    picked_up_at?: string;
    delivered_at?: string;
    delivery_drivers: {
      full_name: string;
      phone: string;
      vehicle_type: string;
    };
  }>;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ 
  orderId, 
  customerLocation 
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const customerMarkerRef = useRef<google.maps.Marker | null>(null);
  const routeRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // Get order details with driver info
  const { data: order, isLoading } = useQuery({
    queryKey: ['order-tracking', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_addresses (
            street_address,
            latitude,
            longitude
          ),
          order_assignments (
            *,
            delivery_drivers (
              full_name,
              phone,
              vehicle_type
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data as any; // Use any to avoid type conversion issues
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const driverId = order?.order_assignments?.[0]?.driver_id;
  
  // Subscribe to driver location updates
  useEffect(() => {
    if (!driverId) return;

    const subscription = supabase
      .channel('driver-location-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${driverId}`
        },
        (payload) => {
          const newLocation = payload.new as any;
          setDriverLocation({
            latitude: newLocation.latitude,
            longitude: newLocation.longitude
          });
          
          if (mapInstanceRef.current && driverMarkerRef.current && window.google) {
            const position = new window.google.maps.LatLng(
              newLocation.latitude, 
              newLocation.longitude
            );
            driverMarkerRef.current.setPosition(position);
            updateRoute();
          }
        }
      )
      .subscribe();

    // Get initial driver location
    const getInitialDriverLocation = async () => {
      const { data } = await supabase
        .from('driver_locations')
        .select('latitude, longitude')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setDriverLocation({
          latitude: data.latitude,
          longitude: data.longitude
        });
      }
    };

    getInitialDriverLocation();

    return () => {
      subscription.unsubscribe();
    };
  }, [driverId]);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      const center = {
        lat: customerLocation.latitude,
        lng: customerLocation.longitude
      };

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 14,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Add customer marker
      customerMarkerRef.current = new window.google.maps.Marker({
        position: center,
        map: mapInstanceRef.current,
        title: 'Tu ubicación',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="blue" width="24" height="24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(30, 30)
        }
      });

      // Add driver marker if location is available
      if (driverLocation) {
        addDriverMarker();
      }

      setMapLoaded(true);
    };

    // Load Google Maps script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=directions`;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, [customerLocation]);

  const addDriverMarker = () => {
    if (!driverLocation || !mapInstanceRef.current || !window.google) return;

    const position = {
      lat: driverLocation.latitude,
      lng: driverLocation.longitude
    };

    driverMarkerRef.current = new window.google.maps.Marker({
      position,
      map: mapInstanceRef.current,
      title: 'Repartidor',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="green" width="24" height="24">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(30, 30)
      }
    });

    updateRoute();
  };

  const updateRoute = () => {
    if (!driverLocation || !customerLocation || !window.google) return;

    const directionsService = new window.google.maps.DirectionsService();
    
    if (!routeRendererRef.current) {
      routeRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#4F46E5',
          strokeWeight: 4
        }
      });
      routeRendererRef.current.setMap(mapInstanceRef.current);
    }

    directionsService.route({
      origin: new window.google.maps.LatLng(driverLocation.latitude, driverLocation.longitude),
      destination: new window.google.maps.LatLng(customerLocation.latitude, customerLocation.longitude),
      travelMode: window.google.maps.TravelMode.DRIVING
    }, (result: google.maps.DirectionsResult, status: google.maps.DirectionsStatus) => {
      if (status === 'OK') {
        routeRendererRef.current!.setDirections(result);
      }
    });
  };

  // Update driver marker when location changes
  useEffect(() => {
    if (driverLocation && mapLoaded) {
      if (!driverMarkerRef.current) {
        addDriverMarker();
      } else if (window.google) {
        const position = new window.google.maps.LatLng(
          driverLocation.latitude,
          driverLocation.longitude
        );
        driverMarkerRef.current.setPosition(position);
        updateRoute();
      }
    }
  }, [driverLocation, mapLoaded]);

  const getStatusInfo = (status: string) => {
    const statusMap = {
      confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      preparing: { label: 'Preparando', color: 'bg-orange-100 text-orange-800', icon: Package },
      ready: { label: 'En camino', color: 'bg-green-100 text-green-800', icon: Truck },
      delivered: { label: 'Entregado', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle }
    };
    
    return statusMap[status as keyof typeof statusMap] || 
      { label: status, color: 'bg-gray-100 text-gray-800', icon: Clock };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Cargando información del pedido...</p>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          No se encontró información del pedido
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;
  const driver = order.order_assignments?.[0]?.delivery_drivers;
  const assignment = order.order_assignments?.[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Seguimiento del Pedido #{order.id.slice(-8)}</span>
            <Badge className={statusInfo.color}>
              <StatusIcon className="w-4 h-4 mr-1" />
              {statusInfo.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Driver Info */}
          {driver && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Tu Repartidor
              </h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{driver.full_name}</p>
                  <p className="text-sm text-gray-600">
                    Vehículo: {driver.vehicle_type}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`tel:${driver.phone}`)}
                >
                  <Phone className="w-4 h-4 mr-1" />
                  Llamar
                </Button>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-3">
            <h4 className="font-medium">Estado del pedido:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Pedido confirmado</span>
              </div>
              
              {assignment?.picked_up_at && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">
                    Recogido - {new Date(assignment.picked_up_at).toLocaleTimeString()}
                  </span>
                </div>
              )}
              
              {order.status === 'ready' && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">En camino hacia tu ubicación</span>
                </div>
              )}
              
              {assignment?.delivered_at && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">
                    Entregado - {new Date(assignment.delivered_at).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium mb-1 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              Dirección de entrega
            </h4>
            <p className="text-sm">{customerLocation.address}</p>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Seguimiento en tiempo real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-80 w-full rounded-lg overflow-hidden">
            <div ref={mapRef} className="w-full h-full" />
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Cargando mapa...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Tu ubicación</span>
            </div>
            {driverLocation && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Repartidor</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderTracking;
