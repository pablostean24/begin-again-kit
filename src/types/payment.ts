
export interface PaymentMethod {
  id: string;
  payment_type: 'Pago Móvil' | 'Transferencia Bancaria' | 'Zelle' | 'Otro';
  account_number: string;
  phone_number?: string;
  owner_id: string;
  destination_bank: string;
  account_holder_name?: string;
  other_type_description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ManualPaymentVerification {
  id: string;
  order_id: string;
  payment_method_type: string;
  origin_bank: string;
  phone_number_used?: string;
  amount_paid: number;
  reference_number: string;
  payment_proof_url: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  orders?: {
    id: string;
    total_amount: number;
    profiles?: {
      full_name?: string;
      email?: string;
    };
  };
}
