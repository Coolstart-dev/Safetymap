import { useEffect, useState, useRef } from "react";
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
  const mapRef = useRef<HTMLDivElement>(null);
  const [tiles, setTiles] = useState<Array<{x: number, y: number, z: number}>>([]);

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

  // Calculate which tiles to show
  useEffect(() => {
    const calculateTiles = () => {
      const tilesPerRow = Math.ceil(window.innerWidth / 256) + 1;
      const tilesPerCol = Math.ceil((window.innerHeight * 0.6) / 256) + 1;
      const newTiles = [];
      
      for (let x = -tilesPerRow; x <= tilesPerRow; x++) {
        for (let y = -tilesPerCol; y <= tilesPerCol; y++) {
          newTiles.push({ x, y, z: zoom });
        }
      }
      setTiles(newTiles);
    };
    
    calculateTiles();
    window.addEventListener('resize', calculateTiles);
    return () => window.removeEventListener('resize', calculateTiles);
  }, [zoom]);

  const filteredReports = reports.filter(report => 
    report.latitude && report.longitude && 
    (activeCategory === 'all' || report.category === activeCategory)
  );

  const getCategoryColor = (category: string) => {
    const categoryInfo = categories[category as keyof typeof categories];
    return categoryInfo?.color || '#6b7280';
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 1, 18));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 1, 3));
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
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Calculate movement based on zoom level - more precise scaling
    const scale = Math.pow(2, zoom);
    const movementScale = 360 / (256 * scale); // Degrees per pixel
    
    setCenter(prev => ({
      lat: Math.max(-85, Math.min(85, prev.lat + deltaY * movementScale)),
      lng: ((prev.lng - deltaX * movementScale) + 540) % 360 - 180 // Wrap longitude
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Convert lat/lng to pixel position on the map
  const latLngToPixel = (lat: number, lng: number) => {
    const scale = Math.pow(2, zoom);
    const worldSize = 256 * scale;
    
    // Web Mercator projection
    const x = (lng + 180) / 360 * worldSize;
    const latRad = lat * Math.PI / 180;
    const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * worldSize;
    
    // Convert to screen coordinates
    const centerX = (center.lng + 180) / 360 * worldSize;
    const centerLatRad = center.lat * Math.PI / 180;
    const centerY = (1 - Math.log(Math.tan(centerLatRad) + 1 / Math.cos(centerLatRad)) / Math.PI) / 2 * worldSize;
    
    const mapWidth = mapRef.current?.offsetWidth || window.innerWidth;
    const mapHeight = mapRef.current?.offsetHeight || window.innerHeight * 0.6;
    
    return {
      x: (x - centerX) + mapWidth / 2,
      y: (y - centerY) + mapHeight / 2
    };
  };

  return (
    <div 
      ref={mapRef}
      className="relative h-[60vh] overflow-hidden select-none bg-blue-100"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Tile Layer - Real OpenStreetMap tiles */}
      <div className="absolute inset-0">
        {tiles.map((tile, index) => {
          const scale = Math.pow(2, zoom);
          const centerTileX = Math.floor((center.lng + 180) / 360 * scale);
          const centerTileY = Math.floor((1 - Math.log(Math.tan(center.lat * Math.PI / 180) + 1 / Math.cos(center.lat * Math.PI / 180)) / Math.PI) / 2 * scale);
          
          const tileX = centerTileX + tile.x;
          const tileY = centerTileY + tile.y;
          
          // Skip invalid tiles
          if (tileX < 0 || tileY < 0 || tileX >= scale || tileY >= scale) return null;
          
          const left = (tile.x * 256) + (mapRef.current?.offsetWidth || 0) / 2 - 128;
          const top = (tile.y * 256) + (mapRef.current?.offsetHeight || 0) / 2 - 128;
          
          return (
            <img
              key={`${tileX}-${tileY}-${zoom}`}
              src={`https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`}
              alt=""
              className="absolute pointer-events-none"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: '256px',
                height: '256px'
              }}
              onError={(e) => {
                // Hide failed tiles
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          );
        })}
      </div>
      
      {/* Report Pins */}
      {filteredReports.map((report) => {
        if (!report.latitude || !report.longitude) return null;
        
        const pos = latLngToPixel(report.latitude, report.longitude);
        const mapWidth = mapRef.current?.offsetWidth || 0;
        const mapHeight = mapRef.current?.offsetHeight || 0;
        
        // Only show pins that are visible on screen
        if (pos.x < -50 || pos.x > mapWidth + 50 || pos.y < -50 || pos.y > mapHeight + 50) {
          return null;
        }
        
        return (
          <div
            key={report.id}
            className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-all duration-200 z-10"
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
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
              <div className="bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap max-w-48 truncate">
                {report.title}
              </div>
            </div>
          </div>
        );
      })}
      
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
        © OpenStreetMap contributors
      </div>
    </div>
  );
}
