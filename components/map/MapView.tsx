'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import { UtensilsCrossed, Calendar, Star } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
const createCustomIcon = (IconComponent: any, color: string = 'currentColor') => {
  const iconHtml = renderToString(
    <IconComponent size={24} color={color} strokeWidth={2} />
  );
  return L.divIcon({
    html: `<div style="display: flex; align-items: center; justify-content: center;">${iconHtml}</div>`,
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

const placeIcon = createCustomIcon(UtensilsCrossed, '#f97316');
const eventIcon = createCustomIcon(Calendar, '#f97316');

interface MapViewProps {
  places?: any[];
  events?: any[];
  center?: [number, number];
  zoom?: number;
}

// Component to update map view when center/zoom changes
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapView({
  places = [],
  events = [],
  center = [0.0349, -51.0694], // Macapá-AP, Brazil - Note: Leaflet uses [lat, lng] not [lng, lat]
  zoom = 13
}: MapViewProps) {
  // Add a test marker to verify Leaflet is working
  const TEST_MARKER_ENABLED = false; // Set to true to test if Leaflet rendering works
  const testMarkerPosition: [number, number] = [0.0349, -51.0694]; // Macapá center

  // Calculate valid markers
  const validPlaces = places.filter(p => p.location?.coordinates && Array.isArray(p.location.coordinates) && p.location.coordinates.length === 2);
  const validEvents = events.filter(e => e.location?.coordinates && Array.isArray(e.location.coordinates) && e.location.coordinates.length === 2);

  // Calculate center based on markers if available
  let mapCenter = center;
  let mapZoom = zoom;

  if (validPlaces.length > 0 || validEvents.length > 0) {
    const allCoords = [
      ...validPlaces.map(p => p.location.coordinates),
      ...validEvents.map(e => e.location.coordinates)
    ];

    // Calculate average position
    const avgLng = allCoords.reduce((sum, coord) => sum + coord[0], 0) / allCoords.length;
    const avgLat = allCoords.reduce((sum, coord) => sum + coord[1], 0) / allCoords.length;
    mapCenter = [avgLat, avgLng];
    mapZoom = 12;
  }

  console.log('MapView render:', {
    totalPlaces: places.length,
    totalEvents: events.length,
    validPlaces: validPlaces.length,
    validEvents: validEvents.length,
    center: mapCenter,
    zoom: mapZoom
  });

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={mapCenter} zoom={mapZoom} />

        {/* Test Marker - to verify Leaflet is working */}
        {TEST_MARKER_ENABLED && (
          <Marker position={testMarkerPosition} icon={placeIcon}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-base mb-1">Test Marker</h3>
                <p className="text-sm text-gray-600">If you can see this, Leaflet is working!</p>
                <p className="text-sm text-gray-600">Position: {testMarkerPosition[0]}, {testMarkerPosition[1]}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Place Markers */}
        {validPlaces.map((place) => {
          try {
            // Convert from GeoJSON [lng, lat] to Leaflet [lat, lng]
            const position: [number, number] = [
              place.location.coordinates[1],
              place.location.coordinates[0],
            ];

            return (
              <Marker key={place._id} position={position} icon={placeIcon}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-base mb-1">{place.name}</h3>
                    <p className="text-sm text-gray-600">{place.cuisine}</p>
                    <p className="text-sm text-gray-600 flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span>{place.averageRating?.toFixed(1) || 'N/A'}</span>
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          } catch (error) {
            console.error('Error rendering place marker:', place._id, error);
            return null;
          }
        })}

        {/* Event Markers */}
        {validEvents.map((event) => {
          try {
            // Convert from GeoJSON [lng, lat] to Leaflet [lat, lng]
            const position: [number, number] = [
              event.location.coordinates[1],
              event.location.coordinates[0],
            ];

            return (
              <Marker key={event._id} position={position} icon={eventIcon}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-base mb-1">{event.title}</h3>
                    <p className="text-sm text-gray-600">{event.placeId?.name || ''}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          } catch (error) {
            console.error('Error rendering event marker:', event._id, error);
            return null;
          }
        })}

        {/* Show message if no markers */}
        {validPlaces.length === 0 && validEvents.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg z-[1000] text-center">
            <p className="text-gray-700 font-medium mb-2">No markers to display</p>
            <p className="text-sm text-gray-500">Add places or create events to see them on the map</p>
          </div>
        )}
      </MapContainer>

      <style jsx global>{`
        .custom-marker {
          background: transparent;
          border: none;
          animation: markerPulse 2s ease-in-out infinite;
        }

        @keyframes markerPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        .custom-marker:hover {
          animation: markerBounce 0.5s ease-in-out;
          z-index: 1000 !important;
        }

        @keyframes markerBounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.2);
          }
        }

        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          animation: popupSlideIn 0.3s ease-out;
          background: linear-gradient(to bottom right, #ffffff, #fef3f2);
          border: 2px solid rgba(249, 115, 22, 0.1);
        }

        @keyframes popupSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .leaflet-popup-tip {
          background: linear-gradient(to bottom right, #ffffff, #fef3f2);
        }

        .leaflet-popup-close-button {
          color: #f97316 !important;
          font-size: 24px !important;
          font-weight: bold;
          transition: transform 0.2s ease;
        }

        .leaflet-popup-close-button:hover {
          color: #ea580c !important;
          transform: rotate(90deg) scale(1.1);
        }

        /* Marker shadow pulse */
        .custom-marker::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 10px;
          background: radial-gradient(ellipse, rgba(0, 0, 0, 0.3), transparent);
          animation: shadowPulse 2s ease-in-out infinite;
        }

        @keyframes shadowPulse {
          0%, 100% {
            transform: translateX(-50%) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateX(-50%) scale(1.2);
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
