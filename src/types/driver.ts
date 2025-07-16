
export interface DriverNotification {
  id: string;
  driver_id: string;
  order_id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  response?: 'accepted' | 'rejected' | null;
  expires_at?: string;
  created_at: string;
  responded_at?: string;
  
  // Relations
  orders?: {
    id: string;
    total_amount: number;
    delivery_address_id?: string;
    delivery_addresses?: {
      street_address: string;
      city: string;
    };
  };
}

export interface DriverLocation {
  id: string;
  driver_id: string;
  order_id?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  created_at: string;
}

export interface DeliveryConfirmation {
  id: string;
  order_id: string;
  driver_id: string;
  confirmation_type: 'code' | 'signature' | 'photo';
  confirmation_data?: string;
  delivery_notes?: string;
  delivery_issues?: string;
  confirmed_at: string;
  created_at: string;
}

export interface DriverStats {
  id: string;
  driver_id: string;
  date: string;
  total_deliveries: number;
  total_earnings: number;
  total_distance: number;
  average_delivery_time: number;
  customer_rating: number;
  created_at: string;
  updated_at: string;
}

export interface DriverOrder {
  id: string;
  user_id: string;
  total_amount: number;
  delivery_fee: number;
  status: string;
  notes?: string;
  estimated_delivery_time?: number;
  delivery_address_id?: string;
  pickup_time?: string;
  delivery_code?: string;
  driver_earnings?: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  profiles?: {
    full_name?: string;
    phone?: string;
  };
  
  delivery_addresses?: {
    street_address: string;
    city: string;
    postal_code?: string;
  };
  
  order_items?: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    composite_dish_id?: string | null;
    menu_items?: {
      name: string;
    };
    composite_dishes?: {
      name: string;
    };
  }>;
  
  order_assignments?: Array<{
    id: string;
    assigned_at?: string;
    picked_up_at?: string;
    delivered_at?: string;
    estimated_pickup_time?: string;
    estimated_delivery_time?: string;
    actual_distance?: number;
  }>;
}
