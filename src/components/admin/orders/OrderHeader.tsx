
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { statusColors, statusLabels, type Order } from './types';

interface OrderHeaderProps {
  order: Order;
}

const OrderHeader = ({ order }: OrderHeaderProps) => {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <Badge className={statusColors[order.status || 'pending']}>
          {statusLabels[order.status || 'pending']}
        </Badge>
        <span className="text-sm text-gray-500">
          Pedido #{order.id.slice(-8)}
        </span>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          {new Date(order.created_at).toLocaleString()}
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-semibold">${order.total_amount}</div>
        <div className="text-sm text-gray-500">
          {order.estimated_delivery_time} min estimado
        </div>
      </div>
    </div>
  );
};

export default OrderHeader;
