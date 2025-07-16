import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, User, MapPin, Phone, Mail, ShoppingBag, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProfileData {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: {
    quantity: number;
    menu_items: {
      name: string;
    };
  }[];
  manual_payment_verifications: {
    status: string;
    rejection_reason?: string;
  }[];
}

const Profile = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    postal_code: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchOrders();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar el perfil.",
          variant: "destructive",
        });
        return;
      }

      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        postal_code: data.postal_code || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            menu_items (name)
          ),
          manual_payment_verifications (
            status,
            rejection_reason
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Perfil actualizado correctamente.",
      });
      
      // Refresh profile data
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Éxito",
        description: "Foto de perfil actualizada correctamente.",
      });
      
      fetchProfile();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la foto de perfil.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'restaurant':
        return 'bg-blue-100 text-blue-800';
      case 'delivery':
        return 'bg-green-100 text-green-800';
      case 'cliente':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role: string | null) => {
    switch (role) {
      case 'restaurant':
        return 'Restaurante';
      case 'delivery':
        return 'Repartidor';
      case 'cliente':
        return 'Cliente';
      default:
        return 'Sin rol';
    }
  };

  const getOrderStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
      preparing: { label: 'Preparando', color: 'bg-orange-100 text-orange-800' },
      ready: { label: 'Listo', color: 'bg-green-100 text-green-800' },
      delivered: { label: 'Entregado', color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const getPaymentStatusBadge = (order: Order) => {
    const verification = order.manual_payment_verifications?.[0];
    if (!verification) {
      return <Badge className="bg-gray-100 text-gray-800">Sin pago</Badge>;
    }

    switch (verification.status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Verificando pago</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Pago aprobado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Pago rechazado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Sin estado</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to="/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Link>
            <h1 className="ml-4 text-2xl font-bold text-orange-600">Mi Perfil</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile Picture and Basic Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24 cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="text-lg">
                      {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="relative">
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Subiendo...' : 'Cambiar foto'}
                    </Button>
                  </div>
                </div>
                
                <CardTitle className="mt-4">{profile?.full_name || 'Usuario'}</CardTitle>
                <CardDescription className="flex items-center justify-center">
                  <Mail className="h-4 w-4 mr-1" />
                  {profile?.email}
                </CardDescription>
                
                <div className="mt-2">
                  <Badge className={getRoleBadgeColor(userRole)}>
                    {getRoleDisplayName(userRole)}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Información Personal
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Mis Pedidos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Información Personal
                    </CardTitle>
                    <CardDescription>
                      Actualiza tu información personal y datos de contacto
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="full_name">Nombre Completo</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          placeholder="Tu nombre completo"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Teléfono</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="+1 234 567 8900"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center mb-2">
                        <MapPin className="h-5 w-5 mr-2 text-gray-600" />
                        <Label className="text-base font-medium">Dirección de Entrega</Label>
                      </div>
                      
                      <div>
                        <Label htmlFor="address">Dirección</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Calle, número, apartamento, etc."
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">Ciudad</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            placeholder="Tu ciudad"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="postal_code">Código Postal</Label>
                          <Input
                            id="postal_code"
                            value={formData.postal_code}
                            onChange={(e) => handleInputChange('postal_code', e.target.value)}
                            placeholder="12345"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button 
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      Historial de Pedidos
                    </CardTitle>
                    <CardDescription>
                      Revisa el estado de tus pedidos y pagos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {orders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No tienes pedidos aún
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div key={order.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-medium">Pedido #{order.id.slice(-8)}</h4>
                                <p className="text-sm text-gray-600">
                                  {new Date(order.created_at).toLocaleDateString()} - ${order.total_amount.toFixed(2)}
                                </p>
                              </div>
                              <div className="flex flex-col gap-2 items-end">
                                {getOrderStatusBadge(order.status)}
                                {getPaymentStatusBadge(order)}
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-3">
                              <strong>Productos:</strong>
                              <ul className="list-disc list-inside ml-2">
                                {order.order_items.map((item, index) => (
                                  <li key={index}>
                                    {item.quantity}x {item.menu_items.name}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {order.manual_payment_verifications?.[0]?.status === 'rejected' && (
                              <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                                <p className="text-sm text-red-800">
                                  <strong>Pago rechazado:</strong> {order.manual_payment_verifications[0].rejection_reason}
                                </p>
                              </div>
                            )}

                            <div className="flex gap-2">
                              {order.status === 'pending' && !order.manual_payment_verifications?.length && (
                                <Link to={`/payment/${order.id}`}>
                                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                                    <CreditCard className="h-4 w-4 mr-1" />
                                    Pagar Ahora
                                  </Button>
                                </Link>
                              )}
                              
                              {order.manual_payment_verifications?.[0]?.status === 'rejected' && (
                                <Link to={`/payment/${order.id}`}>
                                  <Button size="sm" variant="outline">
                                    <CreditCard className="h-4 w-4 mr-1" />
                                    Enviar Nuevo Pago
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;