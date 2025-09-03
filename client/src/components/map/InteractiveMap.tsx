import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";
import { categories } from "@/lib/categories";
import { Report } from "@shared/schema";
import { Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Tile server configuration - modular for easy swapping
const TILE_CONFIG = {
  openstreetmap: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  // Future tile servers can be added here
  // maptiler: {
  //   url: 'https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key={apikey}',
  //   attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; OpenStreetMap contributors'
  // }
};

// Current tile server
const CURRENT_TILES = TILE_CONFIG.openstreetmap;

interface InteractiveMapProps {
  onPinClick: (reportId: string) => void;
  activeCategory: string;
  // Location selection mode for creating new reports
  locationSelectionMode?: boolean;
  selectedLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
}


export default function InteractiveMap({ 
  onPinClick, 
  activeCategory, 
  locationSelectionMode = false,
  selectedLocation = null,
  onLocationSelect 
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const locationMarkerRef = useRef<L.Marker | null>(null);

  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: ["/api/reports", { category: activeCategory }],
  });

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Create map centered on Antwerp
    const map = L.map(mapRef.current, {
      center: [51.2194, 4.4025], // Antwerp coordinates
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });

    // Add tile layer
    L.tileLayer(CURRENT_TILES.url, {
      attribution: CURRENT_TILES.attribution,
      maxZoom: 19,
      minZoom: 3
    }).addTo(map);

    // Create markers layer group
    const markersLayer = L.layerGroup().addTo(map);
    markersRef.current = markersLayer;
    leafletMapRef.current = map;
    
    // Add click handler for location selection mode
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (locationSelectionMode && onLocationSelect) {
        const { lat, lng } = e.latlng;
        onLocationSelect({ lat, lng });
      }
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersRef.current = null;
        locationMarkerRef.current = null;
      }
    };
  }, []);

  // Handle location selection marker
  useEffect(() => {
    if (!leafletMapRef.current) return;

    // Remove existing location marker
    if (locationMarkerRef.current) {
      leafletMapRef.current.removeLayer(locationMarkerRef.current);
      locationMarkerRef.current = null;
    }

    // Add location selection marker if in selection mode and location is set
    if (locationSelectionMode && selectedLocation) {
      // Create a draggable red marker for location selection
      const locationIcon = L.divIcon({
        className: 'location-selection-marker',
        html: `
          <div style="
            width: 40px; 
            height: 40px; 
            background-color: #ef4444; 
            border: 4px solid white; 
            border-radius: 50%; 
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: move;
            animation: pulse 2s infinite;
          ">
            <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            </svg>
          </div>
          <style>
            @keyframes pulse {
              0% { box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2), 0 0 0 0 rgba(239, 68, 68, 0.7); }
              70% { box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2), 0 0 0 10px rgba(239, 68, 68, 0); }
              100% { box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2), 0 0 0 0 rgba(239, 68, 68, 0); }
            }
          </style>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });

      const locationMarker = L.marker([selectedLocation.lat, selectedLocation.lng], {
        icon: locationIcon,
        draggable: true
      }).addTo(leafletMapRef.current);

      // Handle marker drag
      locationMarker.on('dragend', (e: L.DragEndEvent) => {
        const marker = e.target as L.Marker;
        const position = marker.getLatLng();
        if (onLocationSelect) {
          onLocationSelect({ lat: position.lat, lng: position.lng });
        }
      });

      locationMarker.bindTooltip('Drag to adjust location', {
        permanent: true,
        direction: 'top',
        offset: [0, -50]
      });

      locationMarkerRef.current = locationMarker;
    }
  }, [locationSelectionMode, selectedLocation, onLocationSelect]);

  // Update markers when reports change
  useEffect(() => {
    if (!leafletMapRef.current || !markersRef.current) return;

    // Clear existing markers
    markersRef.current.clearLayers();

    // Filter reports based on active category and valid coordinates
    const filteredReports = reports.filter(report => 
      report.latitude && report.longitude && 
      (activeCategory === 'all' || report.category === activeCategory)
    );

    // Add markers for each report
    filteredReports.forEach((report) => {
      if (!report.latitude || !report.longitude || !markersRef.current) return;

      const categoryInfo = categories[report.category as keyof typeof categories];
      const color = categoryInfo?.color || '#6b7280';

      // Create custom colored marker
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 32px; 
            height: 32px; 
            background-color: ${color}; 
            border: 3px solid white; 
            border-radius: 50%; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([report.latitude, report.longitude], {
        icon: customIcon
      });

      // Add click handler
      marker.on('click', () => {
        onPinClick(report.id);
      });

      // Add tooltip
      marker.bindTooltip(report.title, {
        direction: 'top',
        offset: [0, -20]
      });

      markersRef.current.addLayer(marker);
    });
  }, [reports, activeCategory, onPinClick]);

  const handleCenterMap = () => {
    if (!leafletMapRef.current) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          leafletMapRef.current?.setView(
            [position.coords.latitude, position.coords.longitude], 
            15
          );
        },
        () => {
          // Fall back to Antwerp if geolocation fails
          leafletMapRef.current?.setView([51.2194, 4.4025], 13);
        }
      );
    } else {
      // Center on Antwerp
      leafletMapRef.current.setView([51.2194, 4.4025], 13);
    }
  };

  const filteredReports = reports.filter(report => 
    report.latitude && report.longitude && 
    (activeCategory === 'all' || report.category === activeCategory)
  );

  return (
    <div className="relative h-[60vh] bg-gray-100">
      {/* Leaflet map container */}
      <div 
        ref={mapRef} 
        className="w-full h-full"
        data-testid="leaflet-map-container"
      />
      
      {/* Custom location button overlay */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <Button
          size="icon"
          className="bg-white text-gray-700 shadow-md hover:shadow-lg border rounded-full"
          onClick={handleCenterMap}
          data-testid="button-center-map"
          title="Center on my location"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Map Info Overlay */}
      <div className="absolute bottom-2 left-2 bg-white/90 px-3 py-1 rounded-full text-xs text-gray-700 shadow-sm border z-[1000]">
        <span className="font-medium">{filteredReports.length}</span> reports
      </div>
    </div>
  );
}
