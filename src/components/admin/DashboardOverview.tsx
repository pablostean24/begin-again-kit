
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  BarChart3,
  Users,
  ChefHat,
  Clock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DashboardOverview = () => {
  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Obtener ingresos totales del día
      const { data: ordersToday } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', startOfDay.toISOString())
        .eq('status', 'delivered');
      
      // Obtener pedidos pendientes
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('id')
        .in('status', ['confirmed', 'preparing', 'ready']);
      
      // Obtener total de pedidos del día
      const { data: totalOrdersToday } = await supabase
        .from('orders')
        .select('id')
        .gte('created_at', startOfDay.toISOString());
      
      const totalIncome = ordersToday?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const pendingCount = pendingOrders?.length || 0;
      const totalOrdersCount = totalOrdersToday?.length || 0;
      
      return {
        totalIncome,
        pendingOrders: pendingCount,
        totalOrders: totalOrdersCount
      };
    }
  });

  const quickAccessItems = [
    {
      title: 'Gestionar Pedidos',
      icon: ShoppingCart,
      value: 'orders',
      color: 'bg-orange-500'
    },
    {
      title: 'Editar Menú',
      icon: ChefHat,
      value: 'menu',
      color: 'bg-orange-500'
    },
    {
      title: 'Ver Estadísticas',
      icon: BarChart3,
      value: 'stats',
      color: 'bg-orange-500'
    },
    {
      title: 'Vista de Cliente',
      icon: Users,
      value: 'customer-view',
      color: 'bg-orange-500'
    }
  ];

  const handleQuickAccess = (value: string) => {
    // This will be handled by the parent component
    const event = new CustomEvent('quickAccess', { detail: value });
    window.dispatchEvent(event);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard de Administrador</h1>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${dashboardStats?.totalIncome?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pedidos Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats?.pendingOrders || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pedidos Totales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats?.totalOrders || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Accesos Rápidos</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickAccessItems.map((item) => (
            <Card 
              key={item.value} 
              className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleQuickAccess(item.value)}
            >
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center space-y-3">
                  <div className={`w-16 h-16 ${item.color} rounded-lg flex items-center justify-center`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
