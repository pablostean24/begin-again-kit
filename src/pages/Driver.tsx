import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Home, 
  Package, 
  Bell, 
  TrendingUp, 
  User,
  LogOut,
  AlertCircle,
  Menu
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import DriverDashboard from '@/components/driver/DriverDashboard';
import DriverOrdersList from '@/components/driver/DriverOrdersList';
import DriverNotifications from '@/components/driver/DriverNotifications';
import { Link } from 'react-router-dom';

const Driver = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: driverInfo, isLoading, error } = useQuery({
    queryKey: ['driver-info', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      
      const { data, error } = await supabase
        .from('delivery_drivers')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (error) {
        console.error('Error fetching driver info:', error);
        throw error;
      }
      return data;
    },
    enabled: !!user?.email,
    retry: 1
  });

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
  };

  const MobileMenu = () => (
    <div className="flex flex-col space-y-4 p-4">
      <div className="text-sm text-gray-600 border-b pb-2">
        Panel de Repartidor
      </div>
      
      <Link to="/" onClick={() => setMobileMenuOpen(false)}>
        <Button variant="outline" className="w-full justify-start">
          <Home className="h-4 w-4 mr-2" />
          Ir al Inicio
        </Button>
      </Link>
      
      <Button 
        variant="outline" 
        className="w-full justify-start text-red-600 hover:text-red-700"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Cerrar Sesión
      </Button>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-center">Acceso Requerido</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">Debes iniciar sesión para acceder al panel de repartidor.</p>
            <Link to="/auth">
              <Button className="w-full">Iniciar Sesión</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando información del repartidor...</p>
        </div>
      </div>
    );
  }

  if (error || !driverInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  Panel de Repartidor
                </h1>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-4">
                <Link to="/">
                  <Button variant="outline">
                    <Home className="w-4 h-4 mr-2" />
                    Ir al Inicio
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>

              {/* Mobile Navigation */}
              <div className="md:hidden">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-64">
                    <MobileMenu />
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Repartidor No Encontrado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No se encontró información de repartidor para este usuario ({user.email}).
                  Contacta al administrador para que te registre como repartidor.
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col gap-2">
                <Link to="/">
                  <Button variant="outline" className="w-full">
                    <Home className="w-4 h-4 mr-2" />
                    Ir al Inicio
                  </Button>
                </Link>
                <Button onClick={handleSignOut} className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Panel de Repartidor
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {driverInfo.full_name}
              </span>
              <Link to="/">
                <Button variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Ir al Inicio
                </Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <MobileMenu />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Desktop Tabs */}
          <div className="hidden md:block">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="dashboard" className="flex items-center">
                <Home className="w-4 h-4 mr-2" />
                Inicio
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center">
                <Package className="w-4 h-4 mr-2" />
                Pedidos
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center">
                <Bell className="w-4 h-4 mr-2" />
                Notificaciones
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Estadísticas
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Mobile Tabs */}
          <div className="md:hidden mb-6">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="dashboard" className="flex items-center text-xs">
                <Home className="w-3 h-3 mr-1" />
                Inicio
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center text-xs">
                <Package className="w-3 h-3 mr-1" />
                Pedidos
              </TabsTrigger>
            </TabsList>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="notifications" className="flex items-center text-xs">
                <Bell className="w-3 h-3 mr-1" />
                Notificaciones
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                Estadísticas
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard">
            <DriverDashboard 
              driverId={driverInfo.id} 
              driverInfo={driverInfo}
            />
          </TabsContent>

          <TabsContent value="orders">
            <DriverOrdersList driverId={driverInfo.id} />
          </TabsContent>

          <TabsContent value="notifications">
            <DriverNotifications driverId={driverInfo.id} />
          </TabsContent>

          <TabsContent value="stats">
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Estadísticas Detalladas
              </h3>
              <p className="text-gray-600">
                Las estadísticas detalladas estarán disponibles pronto.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Driver;