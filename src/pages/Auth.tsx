
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import SocialAuthButtons from '@/components/SocialAuthButtons';

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('¡Bienvenido de vuelta!');
      // Navigation will be handled by useAuth hook
    }
    
    setLoading(false);
  };

  const handleQuickLogin = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('¡Bienvenido!');
      // Navigation will be handled by useAuth hook
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('¡Cuenta creada exitosamente! Revisa tu email para confirmar.');
    }
    
    setLoading(false);
  };

  const testUsers = [
    { email: 'restaurant@test.com', password: 'restaurant', role: 'Restaurante', color: 'bg-blue-500' },
    //{ email: 'cliente@test.com', password: 'cliente', role: 'Cliente', color: 'bg-orange-500' },
    //{ email: 'delivery@test.com', password: 'delivery', role: 'Repartidor', color: 'bg-green-500' },
    { email: 'mesero@test.com', password: 'mesero', role: 'Mesero', color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Flamas</h2>
          <p className="mt-2 text-gray-600">Tu comida favorita</p>
        </div>

        {/* Usuarios de prueba */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuarios de Prueba
            </CardTitle>
            <CardDescription>
              Haz clic para iniciar sesión rápidamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {testUsers.map((testUser) => (
              <Button
                key={testUser.email}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleQuickLogin(testUser.email, testUser.password)}
                disabled={loading}
              >
                <div className={`w-3 h-3 rounded-full ${testUser.color} mr-3`}></div>
                {testUser.role} - {testUser.email}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="signup">Registrarse</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Iniciar Sesión</CardTitle>
                <CardDescription>
                  Ingresa tus credenciales para acceder a tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SocialAuthButtons />
                {/* 
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">O con email</span>
                  </div>
                </div>
                */}
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      required
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signin-password">Contraseña</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
                    {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Crear Cuenta</CardTitle>
                <CardDescription>
                  Regístrate para comenzar a hacer pedidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SocialAuthButtons />
                {/* 
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">O con email</span>
                  </div>
                </div>
                   */}
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name">Nombre Completo</Label>
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      required
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
                    {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
