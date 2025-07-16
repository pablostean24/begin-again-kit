
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Clock, MapPin, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { useDriverNotifications } from '@/hooks/useDriverNotifications';
import { DriverNotification } from '@/types/driver';

interface DriverNotificationsProps {
  driverId: string;
}

const DriverNotifications = ({ driverId }: DriverNotificationsProps) => {
  const { notifications, isLoading, respondToNotification, markAsRead } = useDriverNotifications(driverId);

  if (isLoading) {
    return <div className="text-center py-8">Cargando notificaciones...</div>;
  }

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const handleAccept = (notificationId: string) => {
    respondToNotification.mutate({
      notificationId,
      response: 'accepted'
    });
  };

  const handleReject = (notificationId: string) => {
    respondToNotification.mutate({
      notificationId,
      response: 'rejected'
    });
  };

  const formatAddress = (notification: DriverNotification) => {
    const address = notification.orders?.delivery_addresses;
    if (!address) return 'Dirección no disponible';
    return `${address.street_address}, ${address.city}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <Bell className="w-6 h-6 mr-2" />
          Notificaciones
        </h2>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="ml-2">
            {unreadCount} nuevas
          </Badge>
        )}
      </div>

      {notifications?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No hay notificaciones disponibles
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications?.map((notification) => (
            <Card 
              key={notification.id} 
              className={`${!notification.is_read ? 'border-blue-500 bg-blue-50' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{notification.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    {!notification.is_read && (
                      <Badge variant="secondary">Nueva</Badge>
                    )}
                    {notification.response && (
                      <Badge 
                        variant={notification.response === 'accepted' ? 'default' : 'destructive'}
                      >
                        {notification.response === 'accepted' ? 'Aceptada' : 'Rechazada'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <p className="text-gray-700">{notification.message}</p>
                
                {notification.orders && (
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span className="font-medium">
                          ${notification.orders.total_amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Pedido #{notification.orders.id.slice(-8)}
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-1 mt-0.5 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {formatAddress(notification)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(notification.created_at).toLocaleString()}
                  </div>
                  
                  {notification.expires_at && (
                    <div className="text-red-500">
                      Expira: {new Date(notification.expires_at).toLocaleString()}
                    </div>
                  )}
                </div>

                {notification.notification_type === 'new_order' && !notification.response && (
                  <div className="flex gap-2 pt-3">
                    <Button
                      onClick={() => handleAccept(notification.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={respondToNotification.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Aceptar
                    </Button>
                    <Button
                      onClick={() => handleReject(notification.id)}
                      variant="destructive"
                      className="flex-1"
                      disabled={respondToNotification.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                )}

                {!notification.is_read && notification.response && (
                  <Button
                    onClick={() => markAsRead.mutate(notification.id)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Marcar como leída
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverNotifications;
