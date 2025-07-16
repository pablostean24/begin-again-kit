
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowLeft } from 'lucide-react';
import LocationSelector from './LocationSelector';

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  notes?: string;
}

interface DeliveryLocationStepProps {
  onLocationConfirmed: (location: LocationData) => void;
  onBack: () => void;
  initialLocation?: LocationData;
}

const DeliveryLocationStep: React.FC<DeliveryLocationStepProps> = ({
  onLocationConfirmed,
  onBack,
  initialLocation
}) => {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    initialLocation || null
  );

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationConfirmed(selectedLocation);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver al carrito
        </Button>
        <h2 className="text-xl font-bold">Confirmar ubicación de entrega</h2>
      </div>

      <LocationSelector
        onLocationSelect={handleLocationSelect}
        initialLocation={initialLocation}
      />

      {selectedLocation && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-800 mb-1">
                  Ubicación confirmada
                </h4>
                <p className="text-sm text-green-700">
                  {selectedLocation.address}
                </p>
                {selectedLocation.notes && (
                  <p className="text-sm text-green-600 mt-1">
                    <strong>Notas:</strong> {selectedLocation.notes}
                  </p>
                )}
              </div>
              <Button
                onClick={handleConfirm}
                className="bg-green-600 hover:bg-green-700"
              >
                Continuar con el pedido
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DeliveryLocationStep;
