'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapViewProps {
  places?: any[];
  events?: any[];
  center?: [number, number];
  zoom?: number;
}

export default function MapView({ places = [], events = [], center = [-74.006, 40.7128], zoom = 12 }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    // If no token is set, show a placeholder message
    if (!token) {
      console.warn('Mapbox token not found. Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in .env.local');
      return;
    }

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    // Add markers for places
    places.forEach((place) => {
      if (place.location?.coordinates) {
        const el = document.createElement('div');
        el.className = 'marker';
        el.innerHTML = '🍽️';
        el.style.fontSize = '24px';
        el.style.cursor = 'pointer';

        new mapboxgl.Marker(el)
          .setLngLat(place.location.coordinates)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div class="p-2">
                <h3 class="font-bold">${place.name}</h3>
                <p class="text-sm">${place.cuisine}</p>
                <p class="text-sm">⭐ ${place.averageRating.toFixed(1)}</p>
              </div>`
            )
          )
          .addTo(map.current);
      }
    });

    // Add markers for events
    events.forEach((event) => {
      if (event.location?.coordinates) {
        const el = document.createElement('div');
        el.className = 'marker';
        el.innerHTML = '📅';
        el.style.fontSize = '24px';
        el.style.cursor = 'pointer';

        new mapboxgl.Marker(el)
          .setLngLat(event.location.coordinates)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div class="p-2">
                <h3 class="font-bold">${event.title}</h3>
                <p class="text-sm">${event.placeId?.name || ''}</p>
                <p class="text-sm">${new Date(event.date).toLocaleDateString()}</p>
              </div>`
            )
          )
          .addTo(map.current);
      }
    });
  }, [mapLoaded, places, events]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      {!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center p-6">
            <p className="text-lg text-gray-600 mb-2">Map Preview</p>
            <p className="text-sm text-gray-500">
              Add your Mapbox token to .env.local to enable the map
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
