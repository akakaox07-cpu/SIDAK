import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

interface MapViewerProps {
  latitude?: string | number;
  longitude?: string | number;
  address?: string;
  className?: string;
}

export const MapViewer: React.FC<MapViewerProps> = ({ 
  latitude, 
  longitude, 
  address,
  className = '' 
}) => {
  // Return null if no coordinates
  if (!latitude || !longitude) {
    return null;
  }

  let lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
  let lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;

  // Fix common coordinate format issues
  // If coordinates are too large (e.g., -629142189831155), they might be missing decimal point
  // Valid lat range: -90 to 90, valid lng range: -180 to 180
  if (Math.abs(lat) > 90) {
    // Likely missing decimal point - try to fix it
    // Example: -629142189831155 should be -6.29142189831155
    const latStr = lat.toString();
    if (latStr.includes('.')) {
      lat = parseFloat(latStr);
    } else {
      // Insert decimal after first digit (with sign)
      const sign = lat < 0 ? '-' : '';
      const absStr = Math.abs(lat).toString();
      lat = parseFloat(sign + absStr[0] + '.' + absStr.substring(1));
    }
  }

  if (Math.abs(lng) > 180) {
    const lngStr = lng.toString();
    if (lngStr.includes('.')) {
      lng = parseFloat(lngStr);
    } else {
      const sign = lng < 0 ? '-' : '';
      const absStr = Math.abs(lng).toString();
      lng = parseFloat(sign + absStr.substring(0, 3) + '.' + absStr.substring(3));
    }
  }

  // Validate coordinates after conversion
  if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return (
      <div className={className}>
        <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4" />
          <span>Lokasi</span>
        </div>
        {address && <p className="text-sm text-gray-600 mb-2">{address}</p>}
        <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          ⚠️ Koordinat tidak valid: {latitude}, {longitude}
        </div>
      </div>
    );
  }

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
          <MapPin className="w-4 h-4" />
          <span>Lokasi</span>
        </div>
        <button
          onClick={openInGoogleMaps}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Buka Maps
        </button>
      </div>

      {address && (
        <p className="text-sm text-gray-600 mb-2">{address}</p>
      )}

      <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
        {/* OpenStreetMap using Leaflet */}
        <div 
          className="w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
          onClick={openInGoogleMaps}
        >
          {/* Static map image using OpenStreetMap tiles */}
          <img
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`}
            alt="Map"
            className="hidden"
          />
          
          {/* Fallback: Static map image */}
          <iframe
            src={`https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
            className="w-full h-full border-0"
            loading="lazy"
            title="Location Map"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>

        {/* Coordinates badge */}
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-md text-xs font-mono pointer-events-none">
          <div className="text-gray-700">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </div>
        </div>
      </div>
    </div>
  );
};
