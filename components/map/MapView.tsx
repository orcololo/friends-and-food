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
  center = [40.7128, -74.006], // Note: Leaflet uses [lat, lng] not [lng, lat]
  zoom = 12
}: MapViewProps) {
  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} zoom={zoom} />

        {/* Place Markers */}
        {places.map((place) => {
          if (place.location?.coordinates) {
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
          }
          return null;
        })}

        {/* Event Markers */}
        {events.map((event) => {
          if (event.location?.coordinates) {
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
          }
          return null;
        })}
      </MapContainer>

      <style jsx global>{`
        .custom-marker {
          background: transparent;
          border: none;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
