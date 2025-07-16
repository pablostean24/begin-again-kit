
import React from 'react';
import { type Order } from './types';

interface OrderNotesProps {
  order: Order;
}

const OrderNotes = ({ order }: OrderNotesProps) => {
  if (!order.notes) return null;

  return (
    <div className="mb-4">
      <h4 className="font-medium mb-1">Notas</h4>
      <p className="text-sm text-gray-600">{order.notes}</p>
    </div>
  );
};

export default OrderNotes;
