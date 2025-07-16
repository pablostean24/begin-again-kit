
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Utensils } from 'lucide-react';
import { useTables, Table } from '@/hooks/useTables';

interface TableSelectorProps {
  selectedTableId?: string;
  onTableSelect: (table: Table) => void;
}

const TableSelector = ({ selectedTableId, onTableSelect }: TableSelectorProps) => {
  const { data: tables, isLoading } = useTables();

  if (isLoading) {
    return <div className="text-center py-4">Cargando mesas...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'occupied':
        return 'bg-red-500';
      case 'cleaning':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'occupied':
        return 'Ocupada';
      case 'cleaning':
        return 'Limpieza';
      default:
        return 'Desconocido';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="w-5 h-5" />
          Seleccionar Mesa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables?.map((table) => (
            <Button
              key={table.id}
              variant={selectedTableId === table.id ? "default" : "outline"}
              className={`h-24 flex flex-col items-center justify-center relative p-4 ${
                table.status !== 'available' ? 'opacity-60' : ''
              }`}
              onClick={() => onTableSelect(table)}
              disabled={table.status !== 'available'}
            >
              <div className="flex flex-col items-center justify-center space-y-1 text-center">
                <span className="font-bold text-lg text-foreground">
                  Mesa {table.table_number}
                </span>
                <span className="text-sm text-muted-foreground">
                  {table.capacity} personas
                </span>
                {table.zone && (
                  <span className="text-xs text-muted-foreground opacity-80">
                    {table.zone}
                  </span>
                )}
              </div>
              <Badge 
                className={`absolute top-2 right-2 text-xs px-2 py-1 ${getStatusColor(table.status)} text-white border-0`}
              >
                {getStatusText(table.status)}
              </Badge>
            </Button>
          ))}
        </div>
        
        {selectedTableId && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              Mesa seleccionada: <strong>Mesa {tables?.find(t => t.id === selectedTableId)?.table_number}</strong>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TableSelector;
