export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800'
};

export const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado'
};

// Helper function to extract table ID from notes
export const extractTableId = (notes?: string) => {
  if (!notes || !notes.includes('Mesa:')) {
    return null;
  }
  
  const tableId = notes.replace('Mesa: ', '').trim();
  return tableId;
};

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  delivery_fee: number;
  status: OrderStatus;
  notes?: string;
  estimated_delivery_time?: number;
  delivery_address_id?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  profiles?: {
    full_name?: string;
    phone?: string;
    email?: string;
  };
  
  delivery_addresses?: {
    street_address: string;
    city: string;
    postal_code?: string;
  };
  
  order_items?: OrderItem[];
  
  order_assignments?: OrderAssignment[];

  // Nueva relación con verificaciones de pago
  manual_payment_verifications?: ManualPaymentVerification[];

  // Nueva relación con mesas
  restaurant_table?: {
    table_number: string;
    zone?: string;
  };
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  composite_dish_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  
  menu_items?: {
    name: string;
    price: number;
  };
  
  composite_dishes?: {
    name: string;
    base_price: number;
  };

  // Nueva relación con customizaciones de platos
  order_dish_customizations?: OrderDishCustomization[];
}

export interface OrderDishCustomization {
  id: string;
  order_item_id: string;
  optional_element_id: string;
  is_included: boolean;
  replacement_item_id?: string;
  price_adjustment: number;
  created_at: string;

  dish_optional_elements?: {
    menu_items: {
      name: string;
    };
  };

  replacement_menu_items?: {
    name: string;
  };
}

export interface OrderAssignment {
  id: string;
  order_id: string;
  driver_id?: string;
  assigned_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  assignment_type?: string;
  external_tracking_id?: string;
  
  delivery_drivers?: {
    full_name: string;
    phone: string;
  };
}

export interface ManualPaymentVerification {
  id: string;
  payment_method_type: string;
  origin_bank: string;
  amount_paid: number;
  reference_number: string;
  phone_number_used?: string;
  payment_proof_url: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
}
