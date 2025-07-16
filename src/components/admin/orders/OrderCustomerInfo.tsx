
import React from 'react';
import { User, MapPin, Phone, Utensils } from 'lucide-react';
import { type Order, extractTableId } from './types';

interface OrderCustomerInfoProps {
  order: Order;
}

const OrderCustomerInfo = ({ order }: OrderCustomerInfoProps) => {
  // Extraer ID de la mesa y usar la información de la relación
  const tableId = extractTableId(order.notes);
  const isTableOrder = tableId !== null;

  return (
    <div className="grid md:grid-cols-2 gap-4 mb-4">
      <div>
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <User className="w-4 h-4" />
          Cliente
        </h4>
        <div className="text-sm text-gray-600">
          <div>{order.profiles?.full_name}</div>
          {order.profiles?.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {order.profiles.phone}
            </div>
          )}
        </div>
      </div>

      <div>
        {isTableOrder ? (
          <>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Utensils className="w-4 h-4" />
              Información de Mesa
            </h4>
            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Utensils className="w-3 h-3" />
                Mesa {order.restaurant_table?.table_number || tableId?.slice(-4)}
              </div>
              {order.restaurant_table?.zone && (
                <div className="text-xs text-gray-500">
                  Zona: {order.restaurant_table.zone}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1">Servicio en mesa</div>
            </div>
          </>
        ) : order.delivery_addresses ? (
          <>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Dirección de Entrega
            </h4>
            <div className="text-sm text-gray-600">
              <div>{order.delivery_addresses.street_address}</div>
              <div>{order.delivery_addresses.city}, {order.delivery_addresses.postal_code}</div>
            </div>
          </>
        ) : (
          <>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Información de Entrega
            </h4>
            <div className="text-sm text-gray-500">
              Sin información de entrega
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderCustomerInfo;
