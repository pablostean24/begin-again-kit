
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Extended type that includes the orders relation
interface PaymentVerificationWithOrders {
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
  orders?: {
    id: string;
    total_amount: number;
    profiles?: {
      full_name?: string;
      email?: string;
    };
  };
}

const PaymentVerificationManagement = () => {
  const queryClient = useQueryClient();
  const [selectedVerification, setSelectedVerification] = useState<PaymentVerificationWithOrders | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: verifications, isLoading } = useQuery({
    queryKey: ['payment-verifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manual_payment_verifications')
        .select(`
          *,
          orders (
            id,
            total_amount,
            profiles (
              full_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment verifications:', error);
        throw error;
      }

      return data as PaymentVerificationWithOrders[];
    }
  });

  const updateVerificationStatus = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['payment-verifications'] });
      toast.success('Estado actualizado exitosamente');
      setSelectedVerification(null);
      setRejectionReason('');
    },
    onError: (error) => {
      toast.error('Error al actualizar el estado: ' + error.message);
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleApprove = (verification: PaymentVerificationWithOrders) => {
    updateVerificationStatus.mutate({
      verificationId: verification.id,
      status: 'approved'
    });
  };

  const handleReject = (verification: PaymentVerificationWithOrders) => {
    if (!rejectionReason.trim()) {
      toast.error('Debes proporcionar una razón para el rechazo');
      return;
    }

    updateVerificationStatus.mutate({
      verificationId: verification.id,
      status: 'rejected',
      rejectionReason
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando verificaciones de pago...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Verificaciones de Pago Manual</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verifications?.map((verification) => (
                <TableRow key={verification.id}>
                  <TableCell>
                    {new Date(verification.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {verification.orders?.profiles?.full_name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    ${verification.orders?.total_amount?.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {verification.payment_method_type}
                  </TableCell>
                  <TableCell>
                    ${verification.amount_paid.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(verification.status)}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedVerification(verification)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Detalles
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalles de Verificación de Pago</DialogTitle>
                        </DialogHeader>
                        
                        {selectedVerification && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <strong>Cliente:</strong> {selectedVerification.orders?.profiles?.full_name}
                              </div>
                              <div>
                                <strong>Email:</strong> {selectedVerification.orders?.profiles?.email}
                              </div>
                              <div>
                                <strong>Método de Pago:</strong> {selectedVerification.payment_method_type}
                              </div>
                              <div>
                                <strong>Banco de Origen:</strong> {selectedVerification.origin_bank}
                              </div>
                              <div>
                                <strong>Monto Pagado:</strong> ${selectedVerification.amount_paid.toFixed(2)}
                              </div>
                              <div>
                                <strong>Referencia:</strong> {selectedVerification.reference_number}
                              </div>
                              {selectedVerification.phone_number_used && (
                                <div>
                                  <strong>Teléfono:</strong> {selectedVerification.phone_number_used}
                                </div>
                              )}
                              <div>
                                <strong>Estado:</strong> {getStatusBadge(selectedVerification.status)}
                              </div>
                            </div>

                            <div>
                              <strong>Comprobante de Pago:</strong>
                              <div className="mt-2">
                                <a 
                                  href={selectedVerification.payment_proof_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  Ver Comprobante
                                </a>
                              </div>
                            </div>

                            {selectedVerification.rejection_reason && (
                              <div>
                                <strong>Razón de Rechazo:</strong>
                                <p className="mt-1 text-red-600">{selectedVerification.rejection_reason}</p>
                              </div>
                            )}

                            {selectedVerification.status === 'pending' && (
                              <div className="space-y-4 pt-4 border-t">
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    Razón de Rechazo (opcional para rechazo)
                                  </label>
                                  <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Explica por qué se rechaza este pago..."
                                  />
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleApprove(selectedVerification)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Aprobar
                                  </Button>
                                  <Button
                                    onClick={() => handleReject(selectedVerification)}
                                    variant="destructive"
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Rechazar
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {verifications?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay verificaciones de pago pendientes
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentVerificationManagement;
