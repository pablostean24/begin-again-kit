
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { type OrderStatus } from './types';

interface OrderStatusFilterProps {
  selectedStatus: string;
  onStatusChange: (status: "all" | OrderStatus) => void;
}

const OrderStatusFilter = ({ selectedStatus, onStatusChange }: OrderStatusFilterProps) => {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">Pedidos Activos</h3>
      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los pedidos</SelectItem>
          <SelectItem value="pending">Pendientes</SelectItem>
          <SelectItem value="confirmed">Confirmados</SelectItem>
          <SelectItem value="preparing">Preparando</SelectItem>
          <SelectItem value="ready">Listos</SelectItem>
          <SelectItem value="delivered">Entregados</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default OrderStatusFilter;
