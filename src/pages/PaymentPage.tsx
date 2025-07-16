
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import PaymentForm from '@/components/payment/PaymentForm';

const PaymentPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId || !user) return null;

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        throw error;
      }

      return data;
    },
    enabled: !!orderId && !!user
  });

  const handlePaymentSubmitted = () => {
    navigate('/profile');
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">Cargando...</div>;
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-4">Pedido no encontrado</h2>
            <Button onClick={() => navigate('/')}>Volver al inicio</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/profile')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al perfil
        </Button>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Resumen del Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Pedido ID:</span>
                <span className="font-mono">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Total a Pagar:</span>
                <span className="font-bold text-lg">${order.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estado:</span>
                <span className="capitalize">{order.status}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <PaymentForm
          orderId={order.id}
          orderAmount={order.total_amount}
          onPaymentSubmitted={handlePaymentSubmitted}
        />
      </div>
    </div>
  );
};

export default PaymentPage;
