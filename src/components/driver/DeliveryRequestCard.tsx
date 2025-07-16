
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Navigation, 
  Phone, 
  User,
  Package,
  CheckCircle,
  X,
  Loader2
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeliveryRequest {
  id: string;
  total_amount: number;
  delivery_fee: number;
  estimated_delivery_time: number;
  created_at: string;
  notes?: string;
  
  profiles: {
    full_name: string;
    phone: string;
  };
  
  delivery_addresses: {
    street_address: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  
  order_items: Array<{
    id: string;
    quantity: number;
    menu_items?: { name: string };
    composite_dishes?: { name: string };
  }>;
}

interface DeliveryRequestCardProps {
  request: DeliveryRequest;
  driverId: string;
  driverLocation?: { latitude: number; longitude: number };
}

const DeliveryRequestCard: React.FC<DeliveryRequestCardProps> = ({
  request,
  driverId,
  driverLocation
}) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Calculate distance if driver location is available
  React.useEffect(() => {
    if (driverLocation && request.delivery_addresses) {
      const calculateDistance = () => {
        const R = 6371; // Earth's radius in km
        const dLat = (request.delivery_addresses.latitude - driverLocation.latitude) * Math.PI / 180;
        const dLon = (request.delivery_addresses.longitude - driverLocation.longitude) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(driverLocation.latitude * Math.PI / 180) * 
          Math.cos(request.delivery_addresses.latitude * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const dist = R * c;
        setDistance(Math.round(dist * 10) / 10);
      };
      
      calculateDistance();
    }
  }, [driverLocation, request.delivery_addresses]);

  const acceptOrder = useMutation({
    mutationFn: async () => {
      // Create order assignment
      const { error: assignmentError } = await supabase
        .from('order_assignments')
        .insert({
          order_id: request.id,
          driver_id: driverId,
          assigned_at: new Date().toISOString(),
          assignment_type: 'delivery'
        });

      if (assignmentError) throw assignmentError;

      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (orderError) throw orderError;

      // Create notification for customer
      const { error: notificationError } = await supabase
        .from('driver_notifications')
        .insert({
          driver_id: driverId,
          order_id: request.id,
          notification_type: 'order_accepted',
          title: 'Pedido Aceptado',
          message: `Has aceptado el pedido #${request.id.slice(-8)}`,
          is_read: false
        });

      if (notificationError) throw notificationError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-orders'] });
      queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
      toast.success('Pedido aceptado exitosamente');
    },
    onError: (error) => {
      console.error('Error accepting order:', error);
      toast.error('Error al aceptar el pedido');
    }
  });

  const rejectOrder = useMutation({
    mutationFn: async () => {
      // For now, we just create a notification that the driver saw but didn't accept
      const { error } = await supabase
        .from('driver_notifications')
        .insert({
          driver_id: driverId,
          order_id: request.id,
          notification_type: 'order_declined',
          title: 'Pedido Rechazado',
          message: `Has rechazado el pedido #${request.id.slice(-8)}`,
          response: 'rejected',
          is_read: true,
          responded_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-orders'] });
      toast.success('Pedido rechazado');
    },
    onError: (error) => {
      console.error('Error rejecting order:', error);
      toast.error('Error al rechazar el pedido');
    }
  });

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await acceptOrder.mutateAsync();
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await rejectOrder.mutateAsync();
    } finally {
      setIsRejecting(false);
    }
  };

  const openMaps = () => {
    const address = `${request.delivery_addresses.street_address}, ${request.delivery_addresses.city}`;
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const timeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Hace menos de 1 min';
    if (minutes < 60) return `Hace ${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    return `Hace ${hours}h ${minutes % 60}m`;
  };

  return (
    <Card className="border-l-4 border-l-orange-500 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">
            Nuevo Pedido #{request.id.slice(-8)}
          </CardTitle>
          <div className="flex flex-col items-end gap-1">
            <Badge className="bg-orange-100 text-orange-800">
              Pendiente
            </Badge>
            <span className="text-xs text-gray-500">
              {timeAgo(request.created_at)}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Customer Info */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium flex items-center">
              <User className="w-4 h-4 mr-1" />
              Cliente
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`tel:${request.profiles.phone}`)}
            >
              <Phone className="w-4 h-4 mr-1" />
              Llamar
            </Button>
          </div>
          <p className="text-sm font-medium">{request.profiles.full_name}</p>
          <p className="text-sm text-gray-600">{request.profiles.phone}</p>
        </div>

        {/* Delivery Info */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              Dirección de entrega
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={openMaps}
            >
              <Navigation className="w-4 h-4 mr-1" />
              Navegar
            </Button>
          </div>
          <p className="text-sm">
            {request.delivery_addresses.street_address}, {request.delivery_addresses.city}
          </p>
          
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            {distance && (
              <div className="flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                <span>{distance} km</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{request.estimated_delivery_time || 30} min estimado</span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center">
            <Package className="w-4 h-4 mr-1" />
            Artículos ({request.order_items.length})
          </h4>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {request.order_items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.menu_items?.name || item.composite_dishes?.name || 'Artículo'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-green-50 p-3 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            Información de pago
          </h4>
          <div className="flex justify-between text-sm mb-1">
            <span>Total del pedido:</span>
            <span>${request.total_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span>Tarifa de entrega:</span>
            <span>${request.delivery_fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-medium text-green-700 border-t pt-1">
            <span>Tu ganancia estimada:</span>
            <span>${(request.delivery_fee * 0.8).toFixed(2)}</span>
          </div>
        </div>

        {/* Notes */}
        {request.notes && (
          <div className="bg-yellow-50 p-3 rounded-lg">
            <h4 className="font-medium mb-1">Notas especiales:</h4>
            <p className="text-sm">{request.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleReject}
            variant="outline"
            className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
            disabled={isRejecting || isAccepting}
          >
            {isRejecting ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <X className="w-4 h-4 mr-1" />
            )}
            Rechazar
          </Button>
          
          <Button
            onClick={handleAccept}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={isAccepting || isRejecting}
          >
            {isAccepting ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-1" />
            )}
            Aceptar Pedido
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryRequestCard;
