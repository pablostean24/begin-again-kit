import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Eye, CheckCircle, XCircle, Clock, CreditCard, Info } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import OrderHeader from './OrderHeader';
import OrderCustomerInfo from './OrderCustomerInfo';
import OrderItems from './OrderItems';
import OrderStatusSelector from './OrderStatusSelector';
import OrderNotes from './OrderNotes';
import OrderDetailDialog from './OrderDetailDialog';
import { type Order } from './types';

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: string) => void;
}

const OrderCard = ({ order, onStatusChange }: OrderCardProps) => {
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedVerificationId, setSelectedVerificationId] = useState<string | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const updatePaymentStatus = useMutation({
    mutationFn: async ({ 
      verificationId, 
      status, 
      rejectionReason 
    }: { 
      verificationId: string; 
      status: 'approved' | 'rejected'; 
      rejectionReason?: string 
    }) => {
      const { error } = await supabase
        .from('manual_payment_verifications')
        .update({
          status,
          rejection_reason: rejectionReason,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', verificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Estado del pago actualizado exitosamente');
      setSelectedVerificationId(null);
      setRejectionReason('');
    },
    onError: (error) => {
      toast.error('Error al actualizar el pago: ' + error.message);
    }
  });

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>;
      default:
        return null;
    }
  };

  const handleApprovePayment = (verificationId: string) => {
    updatePaymentStatus.mutate({
      verificationId,
      status: 'approved'
    });
  };

  const handleRejectPayment = (verificationId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Debes proporcionar una razón para el rechazo');
      return;
    }

    updatePaymentStatus.mutate({
      verificationId,
      status: 'rejected',
      rejectionReason
    });
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <OrderHeader order={order} />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDetailDialog(true)}
              className="ml-2"
            >
              <Info className="w-4 h-4 mr-1" />
              Ver Detalle
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <OrderCustomerInfo order={order} />
            
            <div className="space-y-3">
              <div>
                <strong>Estado del Pedido:</strong>
                <div className="mt-1">
                  <OrderStatusSelector 
                    order={order}
                    onStatusChange={onStatusChange}
                  />
                </div>
              </div>

              {/* Sección de Verificación de Pago */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <strong className="flex items-center">
                    <CreditCard className="w-4 h-4 mr-1" />
                    Verificación de Pago:
                  </strong>
                  {order.manual_payment_verifications && order.manual_payment_verifications.length > 0 && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Detalles
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Verificación de Pago - Pedido #{order.id.slice(-8)}</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          {order.manual_payment_verifications.map((verification) => (
                            <div key={verification.id} className="border rounded-lg p-4 space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <strong>Método de Pago:</strong> {verification.payment_method_type}
                                </div>
                                <div>
                                  <strong>Banco de Origen:</strong> {verification.origin_bank}
                                </div>
                                <div>
                                  <strong>Monto Pagado:</strong> ${verification.amount_paid.toFixed(2)}
                                </div>
                                <div>
                                  <strong>Referencia:</strong> {verification.reference_number}
                                </div>
                                {verification.phone_number_used && (
                                  <div>
                                    <strong>Teléfono:</strong> {verification.phone_number_used}
                                  </div>
                                )}
                                <div>
                                  <strong>Estado:</strong> {getPaymentStatusBadge(verification.status)}
                                </div>
                              </div>

                              <div>
                                <strong>Comprobante:</strong>
                                <div className="mt-2">
                                  <a 
                                    href={verification.payment_proof_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    Ver Comprobante
                                  </a>
                                </div>
                              </div>

                              {verification.rejection_reason && (
                                <div>
                                  <strong>Razón de Rechazo:</strong>
                                  <p className="mt-1 text-red-600">{verification.rejection_reason}</p>
                                </div>
                              )}

                              {verification.status === 'pending' && (
                                <div className="space-y-4 pt-4 border-t">
                                  <div>
                                    <label className="block text-sm font-medium mb-2">
                                      Razón de Rechazo (opcional para rechazo)
                                    </label>
                                    <Textarea
                                      value={selectedVerificationId === verification.id ? rejectionReason : ''}
                                      onChange={(e) => {
                                        setSelectedVerificationId(verification.id);
                                        setRejectionReason(e.target.value);
                                      }}
                                      placeholder="Explica por qué se rechaza este pago..."
                                    />
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleApprovePayment(verification.id)}
                                      className="bg-green-600 hover:bg-green-700"
                                      disabled={updatePaymentStatus.isPending}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Aprobar
                                    </Button>
                                    <Button
                                      onClick={() => handleRejectPayment(verification.id)}
                                      variant="destructive"
                                      disabled={updatePaymentStatus.isPending}
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Rechazar
                                    </Button>
                                  </div>
                                </div>
                              )}

                              <div className="text-sm text-gray-500">
                                Enviado: {new Date(verification.created_at).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                
                <div>
                  {order.manual_payment_verifications && order.manual_payment_verifications.length > 0 ? (
                    <div className="space-y-2">
                      {order.manual_payment_verifications.map((verification) => (
                        <div key={verification.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">
                            {verification.payment_method_type} - ${verification.amount_paid.toFixed(2)}
                          </span>
                          <div className="flex items-center gap-2">
                            {getPaymentStatusBadge(verification.status)}
                            {verification.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleApprovePayment(verification.id)}
                                  className="bg-green-600 hover:bg-green-700 h-6 px-2"
                                  disabled={updatePaymentStatus.isPending}
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="h-6 px-2"
                                      onClick={() => setSelectedVerificationId(verification.id)}
                                    >
                                      <XCircle className="w-3 h-3" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Rechazar Pago</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <label className="block text-sm font-medium mb-2">
                                          Razón del rechazo
                                        </label>
                                        <Textarea
                                          value={rejectionReason}
                                          onChange={(e) => setRejectionReason(e.target.value)}
                                          placeholder="Explica por qué se rechaza este pago..."
                                        />
                                      </div>
                                      <div className="flex gap-2 justify-end">
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedVerificationId(null);
                                            setRejectionReason('');
                                          }}
                                        >
                                          Cancelar
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          onClick={() => handleRejectPayment(verification.id)}
                                          disabled={updatePaymentStatus.isPending}
                                        >
                                          Rechazar
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Sin verificaciones de pago</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <OrderItems order={order} />
          <OrderNotes order={order} />
        </CardContent>
      </Card>

      <OrderDetailDialog 
        order={order}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />
    </>
  );
};

export default OrderCard;
