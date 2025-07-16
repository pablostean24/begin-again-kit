
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Package } from 'lucide-react';
import { useAvailableOrders } from '@/hooks/useAvailableOrders';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import DeliveryRequestCard from './DeliveryRequestCard';

interface AvailableOrdersListProps {
  driverId: string;
}

const AvailableOrdersList: React.FC<AvailableOrdersListProps> = ({ driverId }) => {
  const { availableOrders, isLoading, error } = useAvailableOrders(driverId);
  const { currentLocation } = useDriverLocation(driverId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Buscando pedidos disponibles...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error al cargar pedidos
          </h3>
          <p className="text-gray-600">
            No se pudieron cargar los pedidos disponibles. Intenta de nuevo.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <Package className="w-6 h-6 mr-2" />
          Pedidos Disponibles
        </h2>
        <div className="text-sm text-gray-600">
          {availableOrders?.length || 0} pedidos encontrados
        </div>
      </div>

      {!availableOrders || availableOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No hay pedidos disponibles
            </h3>
            <p className="text-gray-600">
              En este momento no hay pedidos esperando repartidor.
              Te notificaremos cuando lleguen nuevos pedidos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {availableOrders.map((order) => (
            <DeliveryRequestCard
              key={order.id}
              request={order}
              driverId={driverId}
              driverLocation={currentLocation}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableOrdersList;
