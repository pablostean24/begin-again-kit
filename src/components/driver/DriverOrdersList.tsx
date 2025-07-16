
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  MapPin, 
  Clock, 
  Phone, 
  User, 
  DollarSign,
  Navigation,
  CheckCircle
} from 'lucide-react';
import { useDriverOrders } from '@/hooks/useDriverOrders';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { DriverOrder } from '@/types/driver';

interface DriverOrdersListProps {
  driverId: string;
}

const DriverOrdersList = ({ driverId }: DriverOrdersListProps) => {
  const { assignedOrders, isLoading, pickupOrder, deliverOrder } = useDriverOrders(driverId);
  const { startTracking, stopTracking, isTracking } = useDriverLocation(driverId);

  if (isLoading) {
    return <div className="text-center py-8">Cargando pedidos...</div>;
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
      preparing: { label: 'Preparando', color: 'bg-orange-100 text-orange-800' },
      ready: { label: 'Listo', color: 'bg-green-100 text-green-800' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || 
      { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  const formatAddress = (order: DriverOrder) => {
    const address = order.delivery_addresses;
    if (!address) return 'Dirección no disponible';
    return `${address.street_address}, ${address.city}${address.postal_code ? `, ${address.postal_code}` : ''}`;
  };

  const handlePickup = (orderId: string) => {
    pickupOrder(orderId);
    startTracking(orderId);
  };

  const handleDelivery = (orderId: string) => {
    deliverOrder(orderId);
    stopTracking();
  };

  const openMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <Package className="w-6 h-6 mr-2" />
          Mis Pedidos Asignados
        </h2>
        {isTracking && (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Seguimiento Activo
          </Badge>
        )}
      </div>

      {assignedOrders?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No tienes pedidos asignados en este momento
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignedOrders?.map((order) => (
            <Card key={order.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    Pedido #{order.id.slice(-8)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.status)}
                    <Badge variant="outline">
                      ${order.total_amount.toFixed(2)}
                    </Badge>
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
                    {order.profiles?.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`tel:${order.profiles?.phone}`)}
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Llamar
                      </Button>
                    )}
                  </div>
                  <p className="text-sm">
                    {order.profiles?.full_name || 'Cliente'}
                  </p>
                  {order.profiles?.phone && (
                    <p className="text-sm text-gray-600">
                      {order.profiles.phone}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Dirección de Entrega
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openMaps(formatAddress(order))}
                    >
                      <Navigation className="w-4 h-4 mr-1" />
                      Navegar
                    </Button>
                  </div>
                  <p className="text-sm">{formatAddress(order)}</p>
                </div>

                {/* Order Items */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium mb-2">Artículos del Pedido</h4>
                  <div className="space-y-1">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.menu_items?.name || 'Artículo'}
                        </span>
                        <span>${item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Código de Entrega:</span>
                    <p className="font-mono font-bold text-lg">
                      {order.delivery_code || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Ganancia:</span>
                    <p className="font-medium flex items-center">
                      <DollarSign className="w-4 h-4" />
                      {order.driver_earnings?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>

                {order.notes && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <h4 className="font-medium mb-1">Notas del Pedido:</h4>
                    <p className="text-sm">{order.notes}</p>
                  </div>
                )}

                {/* Timing Info */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Creado: {new Date(order.created_at).toLocaleString()}
                  </div>
                  {order.estimated_delivery_time && (
                    <div>
                      Entrega estimada: {order.estimated_delivery_time} min
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  {order.status === 'confirmed' || order.status === 'preparing' ? (
                    <Button
                      onClick={() => handlePickup(order.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={!order.order_assignments?.[0] || !!order.order_assignments?.[0]?.picked_up_at}
                    >
                      <Package className="w-4 h-4 mr-1" />
                      {order.order_assignments?.[0]?.picked_up_at ? 'Recogido' : 'Recoger Pedido'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleDelivery(order.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={!!order.order_assignments?.[0]?.delivered_at}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {order.order_assignments?.[0]?.delivered_at ? 'Entregado' : 'Marcar como Entregado'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverOrdersList;
