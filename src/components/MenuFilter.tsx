
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Utensils } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type MenuCategory = Tables<'menu_categories'> & {
  menu_items: Tables<'menu_items'>[];
};

interface MenuFilterProps {
  categories: MenuCategory[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  totalItems: number;
  compositeDishesCount?: number;
}

const MenuFilter = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange, 
  searchTerm, 
  onSearchChange,
  totalItems,
  compositeDishesCount = 0
}: MenuFilterProps) => {
  const allItemsCount = categories.reduce((total, cat) => total + (cat.menu_items?.length || 0), 0) + compositeDishesCount;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Buscar por nombre o ingredientes..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 py-3 rounded-full border-gray-200"
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => onCategoryChange(null)}
          className={`rounded-full px-6 py-2 ${
            selectedCategory === null 
              ? "bg-orange-500 hover:bg-orange-600 text-white" 
              : "hover:bg-gray-50"
          }`}
        >
          <Utensils className="h-4 w-4 mr-2" />
          Todas
          <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs">
            {allItemsCount}
          </span>
        </Button>

        {/* Filtro especial para platos personalizables */}
        {compositeDishesCount > 0 && (
          <Button
            variant={selectedCategory === 'composite' ? "default" : "outline"}
            onClick={() => onCategoryChange('composite')}
            className={`rounded-full px-6 py-2 ${
              selectedCategory === 'composite' 
                ? "bg-orange-500 hover:bg-orange-600 text-white" 
                : "hover:bg-gray-50"
            }`}
          >
            🍽️ Platos Personalizables
            <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs">
              {compositeDishesCount}
            </span>
          </Button>
        )}

        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            onClick={() => onCategoryChange(category.id)}
            className={`rounded-full px-6 py-2 ${
              selectedCategory === category.id 
                ? "bg-orange-500 hover:bg-orange-600 text-white" 
                : "hover:bg-gray-50"
            }`}
          >
            {category.name}
            <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs">
              {category.menu_items?.length || 0}
            </span>
          </Button>
        ))}
      </div>

      {/* Results Count */}
      <div className="text-center text-gray-600">
        Mostrando <span className="font-semibold text-orange-600">{totalItems}</span> de {allItemsCount} platos
      </div>
    </div>
  );
};

export default MenuFilter;
