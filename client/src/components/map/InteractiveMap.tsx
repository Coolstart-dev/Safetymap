import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// @ts-ignore - leaflet.heat doesn't have types
import "leaflet.heat";
import { useQuery } from "@tanstack/react-query";
import { categories } from "@/lib/categories";
import { Report } from "@shared/schema";
import { Navigation, MapPin, Grid3X3, Filter } from "lucide-react";
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
  positron: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }
};

// Current tile server - using Positron for clean, minimal Google Maps-like appearance
const CURRENT_TILES = TILE_CONFIG.positron;

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
  onHeatmapToggle?: () => void;
  // Filter functionality
  onFilterClick?: () => void;
  // Callback for map interactions (zoom, pan, etc)
  onMapInteraction?: () => void;
}


export default function InteractiveMap({ 
  onPinClick, 
  activeCategory, 
  selectedSubcategories,
  locationSelectionMode = false,
  selectedLocation = null,
  onLocationSelect,
  isHeatmapMode = false,
  onHeatmapToggle,
  onFilterClick,
  onMapInteraction
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

    // Add map interaction event listeners (zoom, pan)
    if (onMapInteraction) {
      map.on('zoomstart movestart', onMapInteraction);
    }

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
      // Create proper heatmap data array
      const heatData: [number, number, number][] = [];
      
      filteredReports.forEach(report => {
        if (!report.latitude || !report.longitude) return;
        
        // Count nearby reports within 300m radius
        let nearbyCount = 0;
        const searchRadius = 0.003; // ~300m
        
        filteredReports.forEach(other => {
          if (!other.latitude || !other.longitude) return;
          
          const distLat = Math.abs(report.latitude! - other.latitude);
          const distLng = Math.abs(report.longitude! - other.longitude);
          
          if (distLat <= searchRadius && distLng <= searchRadius) {
            nearbyCount++;
          }
        });
        
        // Convert count to intensity (0-1 range)
        let intensity: number;
        if (nearbyCount === 1) {
          intensity = 0.3;  // Low intensity
        } else if (nearbyCount === 2) {
          intensity = 0.6;  // Medium intensity
        } else if (nearbyCount === 3) {
          intensity = 0.8;  // High intensity
        } else {
          intensity = 1.0;  // Maximum intensity
        }
        
        heatData.push([report.latitude, report.longitude, intensity]);
      });

      if (heatData.length > 0) {
        try {
          // @ts-ignore - leaflet.heat doesn't have types
          if (typeof L.heatLayer === 'function') {
            console.log('Creating heatmap with', heatData.length, 'points');
            // @ts-ignore
            const heatmapLayer = L.heatLayer(heatData, {
              radius: 25,
              blur: 15,
              maxZoom: 17,
              max: 1.0,
              minOpacity: 0.05,
              gradient: {
                '0.0': 'blue',
                '0.3': 'cyan',  
                '0.6': 'lime',
                '0.8': 'yellow',
                '1.0': 'red'
              }
            });
            
            heatmapLayer.addTo(leafletMapRef.current);
            heatmapRef.current = heatmapLayer;
            console.log('Heatmap layer added successfully');
          } else {
            console.error('L.heatLayer function not available');
          }
        } catch (error) {
          console.error('Error creating heatmap:', error);
        }
      } else {
        console.log('No data for heatmap');
      }
    } else {
      // Add markers for each report (original logic)
      filteredReports.forEach((report) => {
        if (!report.latitude || !report.longitude || !markersRef.current) return;

        const categoryInfo = categories[report.category as keyof typeof categories];
        const color = categoryInfo?.color || '#6b7280';

        // Create custom colored marker with modern Google Maps-like styling
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              width: 24px; 
              height: 24px; 
              background-color: ${color}; 
              border: 2px solid white; 
              border-radius: 50%; 
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.2s ease;
            ">
              <div style="
                width: 8px; 
                height: 8px; 
                background-color: white; 
                border-radius: 50%;
              "></div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
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
    <div className="relative h-full bg-gray-100">
      {/* Leaflet map container */}
      <div 
        ref={mapRef} 
        className="w-full h-full"
        data-testid="leaflet-map-container"
      />
      
      {/* Map Controls Overlay - Top Right */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        {/* Filter Button */}
        {onFilterClick && (
          <Button
            size="icon"
            className={`glass-button rounded-full w-10 h-10 transition-all ${
              selectedSubcategories.length > 0 
                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                : 'hover:bg-white/90'
            }`}
            onClick={() => {
              onFilterClick();
              onMapInteraction?.(); // Collapse sheet when using map controls
            }}
            data-testid="button-filter-map"
            title={selectedSubcategories.length > 0 ? `${selectedSubcategories.length} filters active` : "Filter reports"}
            aria-label={selectedSubcategories.length > 0 ? `${selectedSubcategories.length} filters active` : "Filter reports"}
          >
            <Filter className="h-4 w-4" />
            {selectedSubcategories.length > 0 && (
              <div className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {selectedSubcategories.length > 9 ? '9+' : selectedSubcategories.length}
              </div>
            )}
          </Button>
        )}
        
        {/* View Toggle Button */}
        {onHeatmapToggle && (
          <Button
            size="icon"
            className={`glass-button rounded-full w-10 h-10 transition-all ${
              isHeatmapMode 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'hover:bg-white/90'
            }`}
            onClick={() => {
              onHeatmapToggle();
              onMapInteraction?.(); // Collapse sheet when using map controls
            }}
            data-testid="button-toggle-heatmap"
            title={isHeatmapMode ? "Switch to Pin View" : "Switch to Heatmap View"}
            aria-pressed={isHeatmapMode}
            aria-label={isHeatmapMode ? "Switch to Pin View" : "Switch to Heatmap View"}
            role="switch"
          >
            {isHeatmapMode ? <MapPin className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>
        )}
        
        {/* Center Location Button */}
        <Button
          size="icon"
          className="glass-button rounded-full w-10 h-10"
          onClick={() => {
            handleCenterMap();
            onMapInteraction?.(); // Collapse sheet when using map controls
          }}
          data-testid="button-center-map"
          title="Center on my location"
          aria-label="Center map on my location"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Map Info Overlay */}
      <div className="absolute bottom-2 left-2 glass-subtle px-3 py-1.5 rounded-full text-xs font-medium z-[1000]" style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
        <span className="font-semibold">{filteredReports.length}</span> reports
      </div>
    </div>
  );
}
