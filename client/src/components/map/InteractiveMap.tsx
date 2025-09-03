import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// @ts-ignore - leaflet.heat doesn't have types
import "leaflet.heat";
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
  selectedSubcategories: string[];
  // Location selection mode for creating new reports
  locationSelectionMode?: boolean;
  selectedLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  // Heatmap mode toggle
  isHeatmapMode?: boolean;
}


export default function InteractiveMap({ 
  onPinClick, 
  activeCategory, 
  selectedSubcategories,
  locationSelectionMode = false,
  selectedLocation = null,
  onLocationSelect,
  isHeatmapMode = false
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const heatmapRef = useRef<any>(null);
  const locationMarkerRef = useRef<L.Marker | null>(null);
  const isDraggingMarker = useRef(false);

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
    
    // Store map reference for click handler that can access current state
    const mapClickHandler = (e: L.LeafletMouseEvent) => {
      // Don't place marker if we're in the middle of dragging
      if (locationSelectionMode && onLocationSelect && !isDraggingMarker.current) {
        const { lat, lng } = e.latlng;
        onLocationSelect({ lat, lng });
      }
    };
    
    map.on('click', mapClickHandler);

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersRef.current = null;
        locationMarkerRef.current = null;
      }
    };
  }, [locationSelectionMode, onLocationSelect]);

  // Handle location selection marker
  useEffect(() => {
    if (!leafletMapRef.current) return;

    // Always remove existing location marker first
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

      // Handle marker drag events
      locationMarker.on('dragstart', () => {
        isDraggingMarker.current = true;
        locationMarker.closeTooltip();
      });

      locationMarker.on('drag', (e: L.LeafletEvent) => {
        // Optional: provide real-time feedback during drag
        const marker = e.target as L.Marker;
        const position = marker.getLatLng();
        // You could update UI here if needed
      });

      locationMarker.on('dragend', (e: L.DragEndEvent) => {
        const marker = e.target as L.Marker;
        const position = marker.getLatLng();
        if (onLocationSelect) {
          onLocationSelect({ lat: position.lat, lng: position.lng });
        }
        // Reset dragging flag after a short delay to prevent immediate map clicks
        setTimeout(() => {
          isDraggingMarker.current = false;
        }, 100);
        
        // Show tooltip again
        locationMarker.bindTooltip('Drag to adjust location', {
          permanent: true,
          direction: 'top',
          offset: [0, -50]
        }).openTooltip();
      });

      // Initial tooltip
      locationMarker.bindTooltip('Drag to adjust location', {
        permanent: true,
        direction: 'top',
        offset: [0, -50]
      });

      locationMarkerRef.current = locationMarker;
    }
  }, [locationSelectionMode, selectedLocation, onLocationSelect]);

  // Update markers/heatmap when reports or mode changes
  useEffect(() => {
    if (!leafletMapRef.current || !markersRef.current) return;

    // Clear existing markers
    markersRef.current.clearLayers();
    
    // Remove existing heatmap if it exists
    if (heatmapRef.current) {
      leafletMapRef.current.removeLayer(heatmapRef.current);
      heatmapRef.current = null;
    }

    // Filter reports based on active category, selected subcategories, and valid coordinates
    const filteredReports = reports.filter(report => {
      if (!report.latitude || !report.longitude) return false;
      
      // If subcategories are selected, filter by those
      if (selectedSubcategories.length > 0) {
        return selectedSubcategories.includes(report.subcategory || '');
      }
      
      // Otherwise filter by category
      return activeCategory === 'all' || report.category === activeCategory;
    });

    if (isHeatmapMode) {
      // Create density map with larger grouping radius
      const densityMap: Map<string, number> = new Map();
      const groupingRadius = 0.005; // ~500m radius for grouping nearby reports
      
      // Group nearby reports to calculate density
      filteredReports.forEach(report => {
        if (!report.latitude || !report.longitude) return;
        
        // Round coordinates to create larger location groups
        const lat = Math.round(report.latitude / groupingRadius) * groupingRadius;
        const lng = Math.round(report.longitude / groupingRadius) * groupingRadius;
        const key = `${lat},${lng}`;
        
        densityMap.set(key, (densityMap.get(key) || 0) + 1);
      });

      // Create heatmap data with much more dramatic intensity differences
      const maxDensity = Math.max(...Array.from(densityMap.values()), 1);
      const heatData = filteredReports.map(report => {
        if (!report.latitude || !report.longitude) return [0, 0, 0];
        
        // Find density for this location
        const lat = Math.round(report.latitude / groupingRadius) * groupingRadius;
        const lng = Math.round(report.longitude / groupingRadius) * groupingRadius;
        const key = `${lat},${lng}`;
        const density = densityMap.get(key) || 1;
        
        // More dramatic intensity scaling
        let intensity;
        if (density === 1) {
          intensity = 0.2; // Single reports: very low intensity (blue)
        } else if (density === 2) {
          intensity = 0.5; // Two reports: medium intensity (green)
        } else if (density === 3) {
          intensity = 0.8; // Three reports: high intensity (orange)
        } else {
          intensity = 1.0; // Four or more: maximum intensity (red)
        }
        
        return [report.latitude, report.longitude, intensity];
      });

      console.log('Heatmap data:', heatData.length, 'points');
      console.log('Max density:', maxDensity);
      console.log('Density distribution:', Array.from(densityMap.values()).sort());
      console.log('Intensity range:', [Math.min(...heatData.map(d => d[2])), Math.max(...heatData.map(d => d[2]))]);

      if (heatData.length > 0) {
        try {
          // @ts-ignore - leaflet.heat doesn't have types
          if (typeof L.heatLayer === 'function') {
            console.log('Creating heatmap layer...');
            // @ts-ignore
            const heatmapLayer = L.heatLayer(heatData, {
              radius: 60,        // Larger radius for better visibility
              blur: 30,          // More blur for smoother gradients
              minOpacity: 0.5,   // Higher minimum opacity
              max: 1.0,          // Scale to our intensity range
              gradient: {
                0.0: '#1e40af',   // Dark blue (no/very low)
                0.2: '#3b82f6',   // Blue (1 report)
                0.5: '#10b981',   // Green (2 reports)  
                0.8: '#f59e0b',   // Orange (3 reports)
                1.0: '#dc2626'    // Red (4+ reports)
              }
            });
            
            heatmapLayer.addTo(leafletMapRef.current);
            heatmapRef.current = heatmapLayer;
            console.log('Heatmap layer added successfully');
          } else {
            console.error('L.heatLayer is not available - leaflet.heat plugin not loaded');
          }
        } catch (error) {
          console.error('Error creating heatmap:', error);
        }
      } else {
        console.log('No data available for heatmap');
      }
    } else {
      // Add markers for each report (original logic)
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
    }
  }, [reports, activeCategory, selectedSubcategories, onPinClick, isHeatmapMode]);

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
