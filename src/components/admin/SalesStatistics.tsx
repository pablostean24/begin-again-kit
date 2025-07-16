
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Clock } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const SalesStatistics = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['sales-stats', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sales_stats', {
        start_date: dateRange.startDate + 'T00:00:00Z',
        end_date: dateRange.endDate + 'T23:59:59Z'
      });

      if (error) throw error;
      return data[0];
    }
  });

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateStats = () => {
    refetch();
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando estadísticas...</div>;
  }

  const dailySalesData = stats?.daily_sales ? JSON.parse(stats.daily_sales as string) : [];
  const topItemsData = stats?.top_selling_items ? JSON.parse(stats.top_selling_items as string) : [];
  const peakHoursData = stats?.peak_hours ? JSON.parse(stats.peak_hours as string) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Estadísticas de Ventas</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="startDate">Desde:</Label>
            <Input
              id="startDate"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="endDate">Hasta:</Label>
            <Input
              id="endDate"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="w-auto"
            />
          </div>
          <Button onClick={updateStats}>Actualizar</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Pedidos</p>
                <p className="text-2xl font-bold">{stats?.total_orders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold">${Number(stats?.total_revenue || 0).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Promedio</p>
                <p className="text-2xl font-bold">${Number(stats?.avg_order_value || 0).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Período</p>
                <p className="text-lg font-bold">
                  {Math.ceil((new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24))} días
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas Diarias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`$${value}`, 'Ingresos']} />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Peak Hours Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Horas Pico</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHoursData.slice(0, 12)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value}`, 'Pedidos']} />
                <Bar dataKey="order_count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topItemsData.slice(0, 10).map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{item.item_name}</h4>
                    <p className="text-sm text-gray-600">Cantidad vendida: {item.total_quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${Number(item.total_revenue || 0).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Items Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Ventas por Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topItemsData.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ item_name, percent }: any) => `${item_name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total_revenue"
                >
                  {topItemsData.slice(0, 5).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`$${value}`, 'Ingresos']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Orders Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Pedidos por Día</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-right p-2">Pedidos</th>
                  <th className="text-right p-2">Ingresos</th>
                  <th className="text-right p-2">Promedio por Pedido</th>
                </tr>
              </thead>
              <tbody>
                {dailySalesData.map((day: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{new Date(day.date).toLocaleDateString()}</td>
                    <td className="text-right p-2">{day.orders}</td>
                    <td className="text-right p-2">${Number(day.revenue || 0).toFixed(2)}</td>
                    <td className="text-right p-2">
                      ${day.orders > 0 ? (day.revenue / day.orders).toFixed(2) : '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesStatistics;
