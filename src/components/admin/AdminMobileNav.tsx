
import React from 'react';
import { 
  ChefHat, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Gift,
  Grid3X3,
  CreditCard,
  CheckCircle,
  Utensils,
  UserCog
} from 'lucide-react';

interface AdminMobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AdminMobileNav = ({ activeTab, setActiveTab }: AdminMobileNavProps) => {
  const navigationItems = [
    { value: 'dashboard', label: 'Dashboard', icon: Grid3X3 },
    { value: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { value: 'menu', label: 'Menú', icon: ChefHat },
    { value: 'composite-dishes', label: 'Platos Compuestos', icon: Package },
    { value: 'tables', label: 'Mesas', icon: Utensils },
    { value: 'inventory', label: 'Inventario', icon: Package },
    { value: 'drivers', label: 'Repartidores', icon: Users },
    { value: 'users', label: 'Usuarios', icon: UserCog },
    { value: 'stats', label: 'Estadísticas', icon: BarChart3 },
    { value: 'promotions', label: 'Promociones', icon: Gift },
    { value: 'payment-methods', label: 'Métodos Pago', icon: CreditCard },
    { value: 'payment-verifications', label: 'Verificaciones', icon: CheckCircle }
  ];

  return (
    <div className="lg:hidden border-t bg-white">
      <div className="overflow-x-auto">
        <div className="flex space-x-1 px-4 py-2 min-w-max">
          {navigationItems.map((item) => (
            <button
              key={item.value}
              onClick={() => setActiveTab(item.value)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === item.value
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminMobileNav;
