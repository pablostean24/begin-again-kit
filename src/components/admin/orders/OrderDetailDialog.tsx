
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, MapPin, Phone, Clock, CreditCard, Utensils } from 'lucide-react';
import { statusColors, statusLabels, type Order, extractTableId } from './types';

interface OrderDetailDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OrderDetailDialog = ({ order, open, onOpenChange }: OrderDetailDialogProps) => {
  if (!order) return null;

  // Usar la función helper para extraer el ID de la mesa y usar la información de la relación
  const tableId = extractTableId(order.notes);
  const isTableOrder = tableId !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalle del Pedido #{order.id.slice(-8)}</span>
            <Badge className={statusColors[order.status || 'pending']}>
              {statusLabels[order.status || 'pending']}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <strong>Nombre:</strong> {order.profiles?.full_name || 'N/A'}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <strong>Teléfono:</strong> {order.profiles?.phone || 'N/A'}
              </div>
              {isTableOrder ? (
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4" />
                  <strong>Mesa:</strong> Mesa {order.restaurant_table?.table_number || tableId?.slice(-4)}
                  {order.restaurant_table?.zone && (
                    <span className="text-sm text-gray-500">({order.restaurant_table.zone})</span>
                  )}
                </div>
              ) : (
                order.delivery_addresses && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4" />
                      <strong>Dirección de Entrega:</strong>
                    </div>
                    <div className="text-sm text-gray-600 ml-6">
                      <div>{order.delivery_addresses.street_address}</div>
                      <div>{order.delivery_addresses.city}, {order.delivery_addresses.postal_code}</div>
                    </div>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* Información del Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5" />
                Información del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <strong>Fecha:</strong> {new Date(order.created_at).toLocaleString()}
              </div>
              <div>
                <strong>Total:</strong> ${order.total_amount}
              </div>
              <div>
                <strong>Tiempo Estimado:</strong> {order.estimated_delivery_time} minutos
              </div>
              <div>
                <strong>Tipo de Servicio:</strong> {isTableOrder ? 'Mesa' : 'Delivery'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Productos del Pedido */}
        <Card>
          <CardHeader>
            <CardTitle>Productos del Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.order_items?.map((item) => {
                const itemName = item.menu_items?.name || 
                                (item.composite_dish_id ? 
                                  (item.composite_dishes?.name || 'Plato Personalizado') : 
                                  'Producto desconocido');
                
                return (
                  <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-lg">
                            {item.quantity}x {itemName}
                          </span>
                          {item.composite_dish_id && (
                            <Badge variant="outline" className="bg-orange-100 text-orange-600">
                              Personalizado
                            </Badge>
                          )}
                        </div>
                        
                        {/* Detalles de Platos Compuestos */}
                        {item.composite_dish_id && item.order_dish_customizations && item.order_dish_customizations.length > 0 && (
                          <div className="mt-3 p-3 bg-white rounded border">
                            <h5 className="font-medium text-gray-700 mb-2">Personalización del Plato:</h5>
                            <div className="space-y-2">
                              {item.order_dish_customizations.map((customization) => (
                                <div key={customization.id} className="flex items-center gap-3 text-sm">
                                  <div className="flex items-center gap-2">
                                    {customization.is_included ? (
                                      <span className="text-green-600 font-bold">✓</span>
                                    ) : (
                                      <span className="text-red-600 font-bold">✗</span>
                                    )}
                                    <span className={customization.is_included ? 'text-green-700' : 'text-red-700'}>
                                      {customization.is_included ? 'Incluido' : 'Excluido'}
                                    </span>
                                  </div>
                                  
                                  <div className="flex-1">
                                    {customization.replacement_item_id ? (
                                      <span>
                                        <span className="line-through text-gray-500">
                                          {customization.dish_optional_elements?.menu_items.name}
                                        </span>
                                        {' → '}
                                        <span className="font-medium text-blue-600">
                                          {customization.replacement_menu_items?.name}
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="font-medium">
                                        {customization.dish_optional_elements?.menu_items.name}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {customization.price_adjustment !== 0 && (
                                    <span className={`text-sm font-medium ${
                                      customization.price_adjustment > 0 ? 'text-orange-600' : 'text-green-600'
                                    }`}>
                                      {customization.price_adjustment > 0 ? '+' : ''}${customization.price_adjustment.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-semibold text-lg">${item.total_price.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">
                          ${item.unit_price.toFixed(2)} c/u
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Información de Pago */}
        {order.manual_payment_verifications && order.manual_payment_verifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Verificaciones de Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.manual_payment_verifications.map((verification) => (
                  <div key={verification.id} className="border rounded p-3 bg-gray-50">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><strong>Método:</strong> {verification.payment_method_type}</div>
                      <div><strong>Monto:</strong> ${verification.amount_paid.toFixed(2)}</div>
                      <div><strong>Banco:</strong> {verification.origin_bank}</div>
                      <div><strong>Referencia:</strong> {verification.reference_number}</div>
                    </div>
                    {verification.payment_proof_url && (
                      <div className="mt-2">
                        <a 
                          href={verification.payment_proof_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Ver Comprobante →
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notas del Pedido */}
        {order.notes && !isTableOrder && (
          <Card>
            <CardHeader>
              <CardTitle>Notas Adicionales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{order.notes}</p>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailDialog;
