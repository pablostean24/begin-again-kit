
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  notes?: string;
}

interface LocationSelectorProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  onLocationSelect,
  initialLocation
}) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(initialLocation || null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [notes, setNotes] = useState(initialLocation?.notes || '');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      const defaultLocation = currentLocation || { latitude: -12.0464, longitude: -77.0428 }; // Lima, Peru

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: defaultLocation.latitude, lng: defaultLocation.longitude },
        zoom: 15,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Add marker
      markerRef.current = new window.google.maps.Marker({
        position: { lat: defaultLocation.latitude, lng: defaultLocation.longitude },
        map: mapInstanceRef.current,
        draggable: true,
        title: 'Tu ubicación de entrega'
      });

      // Handle marker drag
      markerRef.current.addListener('dragend', (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        reverseGeocode(lat, lng);
      });

      // Handle map click
      mapInstanceRef.current.addListener('click', (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        markerRef.current.setPosition({ lat, lng });
        reverseGeocode(lat, lng);
      });

      setMapLoaded(true);
    };

    // Load Google Maps script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!window.google) return;

    const geocoder = new window.google.maps.Geocoder();
    
    try {
      const response = await geocoder.geocode({
        location: { lat, lng }
      });

      if (response.results[0]) {
        const addressStr = response.results[0].formatted_address;
        setAddress(addressStr);
        
        const newLocation = {
          latitude: lat,
          longitude: lng,
          address: addressStr,
          notes
        };
        
        setCurrentLocation(newLocation);
      }
    } catch (error) {
      console.error('Error getting address:', error);
      toast.error('Error al obtener la dirección');
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no está disponible en este navegador');
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (mapInstanceRef.current && markerRef.current) {
          const newPosition = { lat: latitude, lng: longitude };
          mapInstanceRef.current.setCenter(newPosition);
          markerRef.current.setPosition(newPosition);
          reverseGeocode(latitude, longitude);
        }
        
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Error al obtener tu ubicación actual');
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const searchAddress = async () => {
    if (!address.trim() || !window.google) return;

    const geocoder = new window.google.maps.Geocoder();
    
    try {
      const response = await geocoder.geocode({ address });
      
      if (response.results[0]) {
        const location = response.results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng });
          markerRef.current.setPosition({ lat, lng });
        }
        
        const newLocation = {
          latitude: lat,
          longitude: lng,
          address: response.results[0].formatted_address,
          notes
        };
        
        setCurrentLocation(newLocation);
      } else {
        toast.error('No se encontró la dirección');
      }
    } catch (error) {
      console.error('Error searching address:', error);
      toast.error('Error al buscar la dirección');
    }
  };

  const handleConfirmLocation = () => {
    if (!currentLocation) {
      toast.error('Por favor selecciona una ubicación');
      return;
    }

    const finalLocation = {
      ...currentLocation,
      notes
    };

    onLocationSelect(finalLocation);
    toast.success('Ubicación seleccionada correctamente');
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Selecciona tu ubicación de entrega
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Buscar dirección..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
            className="flex-1"
          />
          <Button onClick={searchAddress} variant="outline">
            <Search className="w-4 h-4" />
          </Button>
          <Button 
            onClick={getCurrentLocation} 
            disabled={isLoadingLocation}
            variant="outline"
          >
            {isLoadingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Map Container */}
        <div className="relative h-80 w-full rounded-lg overflow-hidden border">
          <div ref={mapRef} className="w-full h-full" />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Cargando mapa...</p>
              </div>
            </div>
          )}
        </div>

        {/* Delivery Notes */}
        <div>
          <Label htmlFor="notes">Notas de entrega (opcional)</Label>
          <Input
            id="notes"
            placeholder="Ej: Casa azul, tercer piso, timbre rojo..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Current Location Info */}
        {currentLocation && (
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-medium text-green-800 mb-1">Ubicación seleccionada:</h4>
            <p className="text-sm text-green-700">{currentLocation.address}</p>
            {notes && (
              <p className="text-sm text-green-600 mt-1">
                <strong>Notas:</strong> {notes}
              </p>
            )}
          </div>
        )}

        <Button 
          onClick={handleConfirmLocation}
          className="w-full"
          disabled={!currentLocation}
        >
          Confirmar ubicación
        </Button>
      </CardContent>
    </Card>
  );
};

export default LocationSelector;
