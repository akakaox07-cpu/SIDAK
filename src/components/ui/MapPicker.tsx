import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';

interface MapPickerProps {
  latitude: string;
  longitude: string;
  onLocationChange?: (lat: string, lng: string) => void;
  readonly?: boolean;
}

// Updated default center per request
const defaultCenter: [number, number] = [-6.298278946700676, 106.59173727035524];

// Component to synchronize map center with external latitude/longitude props and
// update external state when user pans/zooms the map.
function CenterSync({
  lat,
  lng,
  onCenterChange,
  disabled,
}: { lat: number; lng: number; onCenterChange: (lat: number, lng: number) => void; disabled: boolean }) {
  const map = useMap();
  const isSettingViewRef = useRef(false);
  const EPS = 1e-7;

  // Force map to invalidate size on mount
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);

  // When props change (e.g. manual input), reflect on map view if sufficiently different
  useEffect(() => {
    const c = map.getCenter();
    if (Math.abs(c.lat - lat) > EPS || Math.abs(c.lng - lng) > EPS) {
      isSettingViewRef.current = true;
      map.setView([lat, lng]);
      // Allow next moveend to know it's internal
      setTimeout(() => {
        isSettingViewRef.current = false;
      }, 50);
    }
  }, [lat, lng, map]);

  useMapEvents({
    moveend: () => {
      if (disabled || isSettingViewRef.current) return;
      const c = map.getCenter();
      if (Math.abs(c.lat - lat) > EPS || Math.abs(c.lng - lng) > EPS) {
        onCenterChange(c.lat, c.lng);
      }
    },
  });
  return null;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  latitude,
  longitude,
  onLocationChange,
  readonly = false,
}) => {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const parsed = useMemo<[number, number]>(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isFinite(lat) && isFinite(lng)) return [lat, lng];
    return defaultCenter;
  }, [latitude, longitude]);

  const handleCenterChange = useCallback(
    (lat: number, lng: number) => {
      onLocationChange?.(lat.toString(), lng.toString());
    },
    [onLocationChange]
  );

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser Anda');
      return;
    }
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        onLocationChange?.(lat.toString(), lng.toString());
        setIsLoadingLocation(false);
      },
      (err) => {
        console.error(err);
        alert('Gagal mendapatkan lokasi. Pastikan Anda mengizinkan akses lokasi.');
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
    );
  }, [onLocationChange]);

  const openInGoogleMaps = () => {
    const [lat, lng] = parsed;
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          <MapPin className="inline w-4 h-4 mr-1" />
          Lokasi pada Peta
        </label>
        <div className="flex gap-2">
          {!readonly && onLocationChange && (
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isLoadingLocation}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Gunakan lokasi saat ini"
            >
              <Navigation className="w-3 h-3" />
              {isLoadingLocation ? 'Mencari...' : 'Lokasi Saya'}
            </button>
          )}
          <button
            type="button"
            onClick={openInGoogleMaps}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100"
            title="Buka di Google Maps"
          >
            Buka di Maps
          </button>
        </div>
      </div>

      {/* Map Display */}
      <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
        <MapContainer 
          center={parsed as LatLngExpression} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true} 
          doubleClickZoom={true}
          zoomControl={true}
          dragging={true}
        >
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            maxZoom={20}
            minZoom={3}
          />
          {!readonly && <CenterSync lat={parsed[0]} lng={parsed[1]} onCenterChange={handleCenterChange} disabled={false} />}
        </MapContainer>
        {/* Fixed center pin overlay - Google Maps style */}
        {!readonly && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full z-1000">
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 48 48" 
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-2xl"
            >
              {/* Pin shadow */}
              <ellipse cx="24" cy="44" rx="6" ry="2" fill="rgba(0,0,0,0.3)" />
              
              {/* Pin body */}
              <path 
                d="M24 2C15.163 2 8 9.163 8 18c0 13.5 16 28 16 28s16-14.5 16-28c0-8.837-7.163-16-16-16z" 
                fill="#EA4335"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              
              {/* Inner circle */}
              <circle 
                cx="24" 
                cy="18" 
                r="6" 
                fill="#FFFFFF"
              />
              
              {/* Center dot */}
              <circle 
                cx="24" 
                cy="18" 
                r="3" 
                fill="#EA4335"
              />
            </svg>
          </div>
        )}
        {/* Coordinates overlay */}
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-md text-xs font-mono">
          <div className="text-gray-600">
            <span className="font-semibold">Lat:</span> {parsed[0].toFixed(6)}
          </div>
          <div className="text-gray-600">
            <span className="font-semibold">Lng:</span> {parsed[1].toFixed(6)}
          </div>
        </div>
      </div>

      {/* Coordinate Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
          <input
            type="text"
            value={latitude}
            onChange={(e) => onLocationChange?.(e.target.value, longitude)}
            readOnly={readonly}
            className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 font-mono"
            placeholder="-6.2088"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
          <input
            type="text"
            value={longitude}
            onChange={(e) => onLocationChange?.(latitude, e.target.value)}
            readOnly={readonly}
            className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 font-mono"
            placeholder="106.8456"
          />
        </div>
      </div>

      <p className="text-xs text-gray-500">
        {readonly
          ? 'Klik "Buka di Maps" untuk melihat lokasi lengkap'
          : 'Geser / zoom peta untuk memilih titik (pin tetap di tengah), atau gunakan tombol "Lokasi Saya".'}
      </p>
    </div>
  );
};
