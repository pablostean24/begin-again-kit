
import React from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardOverview from '@/components/admin/DashboardOverview';
import MenuManagement from '@/components/admin/MenuManagement';
import InventoryManagement from '@/components/admin/InventoryManagement';
import OrderManagement from '@/components/admin/OrderManagement';
import DriverManagement from '@/components/admin/DriverManagement';
import SalesStatistics from '@/components/admin/SalesStatistics';
import PromotionManagement from '@/components/admin/PromotionManagement';
import PaymentMethodsManagement from '@/components/admin/PaymentMethodsManagement';
import PaymentVerificationManagement from '@/components/admin/PaymentVerificationManagement';
import CompositeDishManagement from '@/components/admin/CompositeDishManagement';
import TableManagement from '@/components/admin/TableManagement';
import UserManagement from '@/components/admin/UserManagement';

interface AdminContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AdminContent = ({ activeTab, setActiveTab }: AdminContentProps) => {
  return (
    <div className="lg:pl-64">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsContent value="dashboard" className="space-y-6">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <div className="max-w-7xl mx-auto">
              <Card className="shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-xl">Gestión de Pedidos en Tiempo Real</CardTitle>
                  <CardDescription>
                    Monitorea y gestiona todos los pedidos en tiempo real
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <OrderManagement />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="menu" className="space-y-6">
            <div className="max-w-7xl mx-auto">
              <Card className="shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-xl">Gestión del Menú</CardTitle>
                  <CardDescription>
                    Administra categorías, productos y precios
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <MenuManagement />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="composite-dishes" className="space-y-6">
            <div className="max-w-7xl mx-auto">
              <Card className="shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-xl">Gestión de Platos Compuestos</CardTitle>
                  <CardDescription>
                    Crea y administra platos con múltiples productos y opciones de personalización
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <CompositeDishManagement />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tables" className="space-y-6">
            <div className="max-w-7xl mx-auto">
              <Card className="shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-xl">Gestión de Mesas</CardTitle>
                  <CardDescription>
                    Administra las mesas del restaurante y su estado
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <TableManagement />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <div className="max-w-7xl mx-auto">
              <Card className="shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-xl">Control de Inventario</CardTitle>
                  <CardDescription>
                    Gestiona el stock y alertas de productos
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <InventoryManagement />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="drivers" className="space-y-6">
            <div className="max-w-7xl mx-auto">
              <Card className="shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-xl">Gestión de Repartidores</CardTitle>
                  <CardDescription>
                    Administra repartidores y asignaciones de pedidos
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <DriverManagement />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="max-w-7xl mx-auto">
              <Card className="shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-xl">Gestión de Usuarios</CardTitle>
                  <CardDescription>
                    Administra todos los usuarios registrados en el sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <UserManagement />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="max-w-7xl mx-auto">
              <Card className="shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-xl">Estadísticas de Ventas</CardTitle>
                  <CardDescription>
                    Analiza el rendimiento y tendencias del negocio
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <SalesStatistics />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="promotions" className="space-y-6">
            <div className="max-w-7xl mx-auto">
              <Card className="shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-xl">Gestión de Promociones</CardTitle>
                  <CardDescription>
                    Configura descuentos y ofertas especiales
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <PromotionManagement />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payment-methods" className="space-y-6">
            <div className="max-w-7xl mx-auto">
              <Card className="shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-xl">Métodos de Pago</CardTitle>
                  <CardDescription>
                    Configura los métodos de pago manual disponibles
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <PaymentMethodsManagement />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payment-verifications" className="space-y-6">
            <div className="max-w-7xl mx-auto">
              <Card className="shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-xl">Verificaciones de Pago</CardTitle>
                  <CardDescription>
                    Revisa y aprueba los comprobantes de pago enviados por los clientes
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <PaymentVerificationManagement />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminContent;
