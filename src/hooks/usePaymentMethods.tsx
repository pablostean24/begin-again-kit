
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PaymentMethod } from '@/types/payment';

export const usePaymentMethods = () => {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('payment_type');

      if (error) {
        console.error('Error fetching payment methods:', error);
        throw error;
      }

      return data as PaymentMethod[];
    }
  });
};
