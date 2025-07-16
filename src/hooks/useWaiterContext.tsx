
import { createContext, useContext, useState } from 'react';
import { Table } from '@/hooks/useTables';

interface WaiterContextType {
  selectedTable: Table | null;
  setSelectedTable: (table: Table | null) => void;
}

const WaiterContext = createContext<WaiterContextType | undefined>(undefined);

export const WaiterProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  return (
    <WaiterContext.Provider value={{
      selectedTable,
      setSelectedTable
    }}>
      {children}
    </WaiterContext.Provider>
  );
};

export const useWaiterContext = () => {
  const context = useContext(WaiterContext);
  if (context === undefined) {
    throw new Error('useWaiterContext must be used within a WaiterProvider');
  }
  return context;
};
