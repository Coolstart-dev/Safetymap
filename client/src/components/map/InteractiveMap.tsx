import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { categories } from "@/lib/categories";
import { Report } from "@shared/schema";
import { Plus, Minus, Navigation, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InteractiveMapProps {
  onPinClick: (reportId: string) => void;
  activeCategory: string;
}


export default function InteractiveMap({ onPinClick, activeCategory }: InteractiveMapProps) {
  const [zoom, setZoom] = useState(13);
  const [center, setCenter] = useState({ lat: 40.7128, lng: -74.0060 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: ["/api/reports", { category: activeCategory }],
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => {
          // Default to NYC if geolocation fails
          setCenter({ lat: 40.7128, lng: -74.0060 });
        }
      );
    }
  }, []);

  const filteredReports = reports.filter(report => 
    report.latitude && report.longitude && 
    (activeCategory === 'all' || report.category === activeCategory)
  );

  const getCategoryColor = (category: string) => {
    const categoryInfo = categories[category as keyof typeof categories];
    return categoryInfo?.color || '#6b7280';
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 1, 18));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 1, 1));
  const handleCenterMap = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Calculate movement based on zoom level
    const movementScale = 0.0001 * (18 - zoom); // Smaller movements at higher zoom
    
    // Simulate map panning with proper scaling
    setCenter(prev => ({
      lat: prev.lat - deltaY * movementScale,
      lng: prev.lng + deltaX * movementScale
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Convert lat/lng to screen position anchored to the map
  const getScreenPosition = (lat: number, lng: number) => {
    // Calculate the map bounds based on center and zoom
    const mapHeight = window.innerHeight * 0.6; // 60vh
    const mapWidth = window.innerWidth;
    
    // Rough approximation: each zoom level doubles the scale
    const scale = Math.pow(2, zoom - 10); // Normalize around zoom 10
    
    // Convert coordinate differences to pixels
    const pixelsPerDegree = scale * 111320; // Approximate meters per degree at equator
    const pixelsPerMeter = mapHeight / (20000 / scale); // Rough approximation
    
    const latDiff = lat - center.lat;
    const lngDiff = lng - center.lng;
    
    // Convert to percentage of screen
    const x = 50 + (lngDiff * pixelsPerDegree * pixelsPerMeter) / mapWidth * 100;
    const y = 50 - (latDiff * pixelsPerDegree * pixelsPerMeter) / mapHeight * 100;
    
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  return (
    <div className="relative h-[60vh] overflow-hidden cursor-grab select-none"
         style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseUp}
    >
      {/* OpenStreetMap-style Background */}
      <div className="absolute inset-0">
        <iframe
          key={`${center.lat}-${center.lng}-${zoom}`}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${center.lng-0.01},${center.lat-0.01},${center.lng+0.01},${center.lat+0.01}&layer=mapnik&marker=${center.lat},${center.lng}`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          title="Interactive Map"
          className="pointer-events-none"
        />
        
        {/* Custom overlay for interactivity */}
        <div className="absolute inset-0 bg-transparent pointer-events-none">
          {/* Report Pins */}
          {filteredReports.map((report) => {
            if (!report.latitude || !report.longitude) return null;
            
            const pos = getScreenPosition(report.latitude, report.longitude);
            const isVisible = pos.x >= 0 && pos.x <= 100 && pos.y >= 0 && pos.y <= 100;
            
            if (!isVisible) return null;
            
            return (
              <div
                key={report.id}
                className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-all duration-200 z-10"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onPinClick(report.id);
                }}
                data-testid={`map-pin-${report.id}`}
              >
                <div
                  className="w-8 h-8 rounded-full border-3 border-white shadow-lg flex items-center justify-center hover:shadow-xl"
                  style={{ backgroundColor: getCategoryColor(report.category) }}
                  title={report.title}
                >
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                
                {/* Pin tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                    {report.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-[1000]">
        <Button
          size="icon"
          className="bg-white text-gray-700 shadow-md hover:shadow-lg border"
          onClick={handleZoomIn}
          data-testid="button-zoom-in"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          className="bg-white text-gray-700 shadow-md hover:shadow-lg border"
          onClick={handleZoomOut}
          data-testid="button-zoom-out"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
      
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
      <div className="absolute bottom-2 left-2 bg-white/90 px-3 py-1 rounded-full text-xs text-gray-700 shadow-sm border">
        <span className="font-medium">{filteredReports.length}</span> reports • Zoom {zoom}
      </div>
      
      {/* Attribution */}
      <div className="absolute bottom-1 right-20 text-xs text-gray-500 bg-white/70 px-1 rounded">
        © OpenStreetMap
      </div>
    </div>
  );
}
