
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { type Order, type OrderStatus } from './types';

interface OrderStatusSelectorProps {
  order: Order;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}

const OrderStatusSelector = ({ order, onStatusChange }: OrderStatusSelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={order.status || 'pending'}
        onValueChange={(status) => 
          onStatusChange(order.id, status as OrderStatus)
        }
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pendiente</SelectItem>
          <SelectItem value="confirmed">Confirmado</SelectItem>
          <SelectItem value="preparing">Preparando</SelectItem>
          <SelectItem value="ready">Listo</SelectItem>
          <SelectItem value="delivered">Entregado</SelectItem>
          <SelectItem value="cancelled">Cancelado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default OrderStatusSelector;
