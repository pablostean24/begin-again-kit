import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, Settings, LogOut, Menu, Utensils } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import PublicMenu from '@/components/PublicMenu';
import { Cart } from '@/components/Cart';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Index = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const MobileMenu = () => (
    <div className="flex flex-col space-y-4 p-4">
      {user ? (
        <>
          <div className="text-sm text-gray-600 border-b pb-2">
            Bienvenido, {user.email}
          </div>
          
          <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="outline" className="w-full justify-start">
              <User className="h-4 w-4 mr-2" />
              Perfil
            </Button>
          </Link>
          
          {userRole === 'restaurant' && (
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
          )}

          {userRole === 'delivery' && (
            <Link to="/driver" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Panel Repartidor
              </Button>
            </Link>
          )}
          
          <Button 
            variant="outline" 
            className="w-full justify-start text-red-600 hover:text-red-700"
            onClick={() => {
              setMobileMenuOpen(false);
              signOut();
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </>
      ) : (
        <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
          <Button variant="outline" className="w-full justify-start">
            <User className="h-4 w-4 mr-2" />
            Iniciar Sesión
          </Button>
        </Link>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-orange-600">Flamas</h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Cart />
              
              {user ? (
                <>
                  <span className="text-sm text-gray-600">
                    Bienvenido, {user.email}
                  </span>
                  
                  <Link to="/profile">
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Perfil
                    </Button>
                  </Link>
                  
                  {userRole === 'restaurant' && (
                    <Link to="/admin">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Admin
                      </Button>
                    </Link>
                  )}

                  {userRole === 'delivery' && (
                    <Link to="/driver">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Panel Repartidor
                      </Button>
                    </Link>
                  )}
                  
                  <Button variant="outline" size="sm" onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button variant="outline">
                    <User className="h-4 w-4 mr-2" />
                    Iniciar Sesión
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center space-x-2">
              <Cart />
              
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {user ? (
            <div className="space-y-8">
              {/* Role-specific content */}
              <div className="grid grid-cols-1 gap-6">
                <RoleGuard allowedRoles={['restaurant']}>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Panel de Restaurante</h2>
                    <p className="text-gray-600 mb-4">
                      Desde aquí puedes gestionar tu menú, ver pedidos y administrar tu restaurante.
                    </p>
                    <Link to="/admin">
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        Ir al Panel de Administración
                      </Button>
                    </Link>
                  </div>
                </RoleGuard>

                <RoleGuard allowedRoles={['cliente']}>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">¡Bienvenido Cliente!</h2>
                    <p className="text-gray-600 mb-4">
                      Explora nuestro menú y haz tu pedido favorito.
                    </p>
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-gray-600">
                        Revisa nuestro menú completo más abajo
                      </span>
                    </div>
                  </div>
                </RoleGuard>

                <RoleGuard allowedRoles={['mesero']}>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Panel de Mesero</h2>
                    <p className="text-gray-600 mb-4">
                      Como mesero, puedes tomar pedidos para las mesas del restaurante. 
                      Los pedidos se envían directamente a cocina sin pasar por el proceso de pago.
                    </p>
                    <div className="flex items-center space-x-2">
                      <Utensils className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-gray-600">
                        Selecciona productos del menú y asígnalos a una mesa
                      </span>
                    </div>
                  </div>
                </RoleGuard>

                <RoleGuard allowedRoles={['delivery']}>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Panel de Repartidor</h2>
                    <p className="text-gray-600 mb-4">
                      Aquí puedes ver los pedidos asignados y gestionar tus entregas.
                    </p>
                    <Link to="/driver">
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        Ir al Panel de Repartidor
                      </Button>
                    </Link>
                  </div>
                </RoleGuard>
              </div>

              {/* Menu Section for authenticated users */}
              <div className="bg-white rounded-lg shadow p-6">
                <PublicMenu />
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Landing page for non-authenticated users */}
              <div className="text-center">
                <div className="max-w-3xl mx-auto">
                  <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
                    Tu comida favorita
                    <span className="text-orange-600"> </span>
                  </h1>
                  <p className="mt-6 text-lg leading-8 text-gray-600">
                    
                  </p>
                  <div className="mt-10 flex items-center justify-center gap-x-6">
                    <Link to="/auth">
                      <Button className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-3">
                        Comenzar ahora
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Menu Section for non-authenticated users */}
              <div className="bg-white rounded-lg shadow p-6">
                <PublicMenu />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
