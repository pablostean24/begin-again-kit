
import React from 'react';
import OrderStatusFilter from './orders/OrderStatusFilter';
import OrderCard from './orders/OrderCard';
import { useOrderManagement } from './orders/hooks/useOrderManagement';

const OrderManagement = () => {
  const {
    orders,
    isLoading,
    selectedStatus,
    setSelectedStatus,
    handleStatusChange
  } = useOrderManagement();

  if (isLoading) {
    return <div className="text-center py-8">Cargando pedidos...</div>;
  }

  return (
    <div className="space-y-6">
      <OrderStatusFilter 
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      <div className="grid gap-4">
        {orders?.map((order) => (
          <OrderCard 
            key={order.id}
            order={order}
            onStatusChange={handleStatusChange}
          />
        ))}

        {orders?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay pedidos para mostrar
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
