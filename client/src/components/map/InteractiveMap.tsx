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

  return (
    <div className="relative h-[60vh] bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 bg-blue-200">
        <div className="h-full w-full relative">
          {/* Grid Lines for Map Effect */}
          <svg className="absolute inset-0 h-full w-full opacity-20">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3b82f6" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          
          {/* Report Pins */}
          <div className="absolute inset-0">
            {filteredReports.map((report, index) => {
              const x = (index * 80 + 50) % window.innerWidth;
              const y = (Math.sin(index) * 100 + 200) % 400;
              return (
                <div
                  key={report.id}
                  className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-all"
                  style={{
                    left: `${Math.max(5, Math.min(95, x / window.innerWidth * 100))}%`,
                    top: `${Math.max(5, Math.min(90, y / 400 * 100))}%`,
                  }}
                  onClick={() => onPinClick(report.id)}
                  data-testid={`map-pin-${report.id}`}
                >
                  <div
                    className="w-6 h-6 rounded-full border-3 border-white shadow-lg flex items-center justify-center"
                    style={{ backgroundColor: getCategoryColor(report.category) }}
                  >
                    <MapPin className="h-3 w-3 text-white" />
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2 z-[1000]">
            <Button
              size="icon"
              className="bg-white text-gray-700 shadow-md hover:shadow-lg"
              onClick={handleZoomIn}
              data-testid="button-zoom-in"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              className="bg-white text-gray-700 shadow-md hover:shadow-lg"
              onClick={handleZoomOut}
              data-testid="button-zoom-out"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="absolute bottom-4 right-4 z-[1000]">
            <Button
              size="icon"
              className="bg-white text-gray-700 shadow-md hover:shadow-lg rounded-full"
              onClick={handleCenterMap}
              data-testid="button-center-map"
            >
              <Navigation className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Map Info Overlay */}
      <div className="absolute bottom-2 left-2 bg-white/80 px-2 py-1 rounded text-xs text-gray-600">
        Reports: {filteredReports.length} • Zoom: {zoom}
      </div>
    </div>
  );
}
