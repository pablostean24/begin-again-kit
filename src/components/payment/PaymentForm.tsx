
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CreditCard, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';

interface PaymentFormProps {
  orderId: string;
  orderAmount: number;
  onPaymentSubmitted: () => void;
}

interface PaymentFormData {
  payment_method_type: string;
  origin_bank: string;
  phone_number_used?: string;
  amount_paid: number;
  reference_number: string;
}

const PaymentForm = ({ orderId, orderAmount, onPaymentSubmitted }: PaymentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  
  const { data: paymentMethods, isLoading: loadingMethods } = usePaymentMethods();
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PaymentFormData>({
    defaultValues: {
      amount_paid: orderAmount
    }
  });

  const watchedPaymentType = watch('payment_method_type');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Solo se permiten archivos JPG, PNG o PDF');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo no puede exceder 5MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const uploadPaymentProof = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${orderId}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, file);

    if (error) {
      throw new Error('Error al subir el comprobante: ' + error.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const onSubmit = async (data: PaymentFormData) => {
    if (!selectedFile) {
      toast.error('Debes seleccionar un comprobante de pago');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload payment proof
      const proofUrl = await uploadPaymentProof(selectedFile);

      // Create payment verification record
      const { error } = await supabase
        .from('manual_payment_verifications')
        .insert({
          order_id: orderId,
          payment_method_type: data.payment_method_type,
          origin_bank: data.origin_bank,
          phone_number_used: data.phone_number_used,
          amount_paid: data.amount_paid,
          reference_number: data.reference_number,
          payment_proof_url: proofUrl
        });

      if (error) {
        throw error;
      }

      toast.success('Comprobante enviado exitosamente. Pendiente de verificación.');
      onPaymentSubmitted();
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error('Error al enviar el comprobante. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMethod = paymentMethods?.find(method => method.id === selectedPaymentMethod);

  if (loadingMethods) {
    return <div className="text-center py-4">Cargando métodos de pago...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Información de Pago Manual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Selecciona un método de pago y realiza la transferencia. Luego sube el comprobante para verificación.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Método de Pago</Label>
            <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un método de pago" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods?.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.payment_type} - {method.destination_bank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMethod && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Datos para la Transferencia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <strong>Tipo:</strong> {selectedMethod.payment_type}
                </div>
                <div>
                  <strong>Banco:</strong> {selectedMethod.destination_bank}
                </div>
                <div>
                  <strong>Número de Cuenta:</strong> {selectedMethod.account_number}
                </div>
                {selectedMethod.phone_number && (
                  <div>
                    <strong>Teléfono:</strong> {selectedMethod.phone_number}
                  </div>
                )}
                {selectedMethod.account_holder_name && (
                  <div>
                    <strong>Titular:</strong> {selectedMethod.account_holder_name}
                  </div>
                )}
                <div>
                  <strong>Monto a Pagar:</strong> ${orderAmount.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {selectedMethod && (
        <Card>
          <CardHeader>
            <CardTitle>Subir Comprobante de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Pago Realizado</Label>
                <Select 
                  value={watchedPaymentType} 
                  onValueChange={(value) => setValue('payment_method_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pago Móvil">Pago Móvil</SelectItem>
                    <SelectItem value="Transferencia Bancaria">Transferencia Bancaria</SelectItem>
                    <SelectItem value="Zelle">Zelle</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                {errors.payment_method_type && (
                  <span className="text-red-500 text-sm">Este campo es requerido</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="origin_bank">Banco de Origen</Label>
                <Input
                  id="origin_bank"
                  {...register('origin_bank', { required: 'El banco de origen es requerido' })}
                  placeholder="Ej: Banco de Venezuela"
                />
                {errors.origin_bank && (
                  <span className="text-red-500 text-sm">{errors.origin_bank.message}</span>
                )}
              </div>

              {(watchedPaymentType === 'Pago Móvil' || watchedPaymentType === 'Zelle') && (
                <div className="space-y-2">
                  <Label htmlFor="phone_number_used">Teléfono Usado</Label>
                  <Input
                    id="phone_number_used"
                    {...register('phone_number_used')}
                    placeholder="Ej: 04121234567"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount_paid">Monto Pagado</Label>
                <Input
                  id="amount_paid"
                  type="number"
                  step="0.01"
                  {...register('amount_paid', { 
                    required: 'El monto es requerido',
                    min: { value: 0.01, message: 'El monto debe ser mayor a 0' }
                  })}
                />
                {errors.amount_paid && (
                  <span className="text-red-500 text-sm">{errors.amount_paid.message}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference_number">Número de Referencia</Label>
                <Input
                  id="reference_number"
                  {...register('reference_number', { required: 'El número de referencia es requerido' })}
                  placeholder="Número de confirmación o referencia"
                />
                {errors.reference_number && (
                  <span className="text-red-500 text-sm">{errors.reference_number.message}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_proof">Comprobante de Pago</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="payment_proof"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileSelect}
                    className="flex-1"
                  />
                  <Upload className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">
                  Formatos permitidos: JPG, PNG, PDF. Tamaño máximo: 5MB
                </p>
                {selectedFile && (
                  <p className="text-sm text-green-600">
                    Archivo seleccionado: {selectedFile.name}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !selectedFile}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Comprobante'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaymentForm;
