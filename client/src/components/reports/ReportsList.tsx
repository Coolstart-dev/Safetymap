import { useQuery } from "@tanstack/react-query";
import { Report } from "@shared/schema";
import { categories } from "@/lib/categories";
import { formatDistanceToNow } from "date-fns";
import { Shield, X, Clock, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MyRegion from "./MyRegion";

interface ReportsListProps {
  onReportClick: (reportId: string) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  selectedSubcategories: string[];
  onSubcategoriesChange: (subcategories: string[]) => void;
  onSheetInteraction?: () => void;
  activeTab: 'recent' | 'region' | 'nearme';
  onTabChange: (tab: 'recent' | 'region' | 'nearme') => void;
  showFilters?: boolean; // Keep for backwards compatibility but not used
  mapBounds?: {north: number, south: number, east: number, west: number} | null;
  currentZoom?: number;
}

export default function ReportsList({ 
  onReportClick, 
  activeCategory, 
  onCategoryChange, 
  selectedSubcategories, 
  onSubcategoriesChange,
  onSheetInteraction,
  activeTab,
  onTabChange,
  showFilters = false, // Keep for backwards compatibility but not used
  mapBounds,
  currentZoom
}: ReportsListProps) {
  
  // Handle any interaction within the sheet (buttons, clicks, etc.)
  const handleInteraction = () => {
    onSheetInteraction?.();
  };
  
  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports", { category: activeCategory }],
  });

  // Function to check if a report is within the current map bounds
  const isReportInBounds = (report: Report) => {
    if (!mapBounds || report.latitude == null || report.longitude == null) return false;
    
    return (
      report.latitude >= mapBounds.south &&
      report.latitude <= mapBounds.north &&
      report.longitude >= mapBounds.west &&
      report.longitude <= mapBounds.east
    );
  };

  const filteredReports = reports
    .filter(report => {
      // For Near Me tab, filter by map bounds and zoom level
      if (activeTab === 'nearme') {
        // Only show if zoom level is 15 or higher for detailed local view
        if (!currentZoom || currentZoom < 15) return false;
        // Only show reports visible on current map
        if (!isReportInBounds(report)) return false;
      }
      
      // If no subcategories selected, show all reports
      if (selectedSubcategories.length === 0) {
        return activeCategory === 'all' || report.category === activeCategory;
      }
      
      // If subcategories selected, filter by those
      return selectedSubcategories.includes(report.subcategory || '');
    })
    .sort((a, b) => {
      // Sort by createdAt date, newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const getCategoryColor = (category: string) => {
    const categoryInfo = categories[category as keyof typeof categories];
    return categoryInfo?.color || '#6b7280';
  };

  const getCategoryName = (category: string) => {
    const categoryInfo = categories[category as keyof typeof categories];
    return categoryInfo?.name || category;
  };

  const calculateDistance = (lat: number | null, lng: number | null) => {
    if (!lat || !lng) return "Location unknown";
    // Simple distance calculation - in a real app you'd use geolocation
    return `${(Math.random() * 2).toFixed(1)} mi away`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            <Button
              variant={activeTab === 'nearme' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { onTabChange('nearme'); handleInteraction(); }}
              className={`flex-shrink-0 flex items-center gap-2 rounded-xl ${
                activeTab === 'nearme' ? 'glass-strong' : 'glass-subtle'
              } ${(!currentZoom || currentZoom < 15) ? 'opacity-50' : ''}`}
              data-testid="tab-near-me"
              disabled={!currentZoom || currentZoom < 15}
            >
              <Navigation className="w-4 h-4" />
              Near Me
            </Button>
            <Button
              variant={activeTab === 'recent' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { onTabChange('recent'); handleInteraction(); }}
              className={`flex-shrink-0 flex items-center gap-2 rounded-xl ${
                activeTab === 'recent' ? 'glass-strong' : 'glass-subtle'
              }`}
              data-testid="tab-recent-reports"
            >
              <Clock className="w-4 h-4" />
              Recent Reports
            </Button>
            <Button
              variant={activeTab === 'region' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { onTabChange('region'); handleInteraction(); }}
              className={`flex-shrink-0 flex items-center gap-2 rounded-xl ${
                activeTab === 'region' ? 'glass-strong' : 'glass-subtle'
              }`}
              data-testid="tab-my-region"
            >
              <MapPin className="w-4 h-4" />
              My Region
            </Button>
          </div>
          {/* Filter button moved to map controls for better UX */}
        </div>
        
        {/* Selected Filter Tags (always visible when filters are applied) */}
        {selectedSubcategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
            {selectedSubcategories.slice(0, 3).map((subcategory) => {
              // Find the category for this subcategory
              const categoryEntry = Object.entries(categories).find(([_, category]) => 
                (category.subcategories as readonly string[]).includes(subcategory)
              );
              const color = categoryEntry?.[1].color || '#6b7280';
              
              return (
                <div
                  key={subcategory}
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium glass-subtle"
                  style={{ 
                    borderColor: `${color}60`,
                    color: color,
                    textShadow: '0 1px 2px rgba(255,255,255,0.5)'
                  }}
                >
                  <span 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {subcategory.length > 15 ? `${subcategory.substring(0, 15)}...` : subcategory}
                  <button
                    onClick={() => {
                      const newSelected = selectedSubcategories.filter(s => s !== subcategory);
                      onSubcategoriesChange(newSelected);
                      handleInteraction();
                    }}
                    className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
            {selectedSubcategories.length > 3 && (
              <div className="flex-shrink-0 flex items-center px-3 py-1 rounded-full text-xs font-medium border border-muted bg-muted/50 text-muted-foreground">
                +{selectedSubcategories.length - 3} more
              </div>
            )}
          </div>
        )}
        
      </div>

      {/* FilterSheet now managed from Dashboard via map controls */}

      {/* Tab Content */}
      {activeTab === 'nearme' ? (
        <div 
          className="flex-1 overflow-y-auto"
          onScroll={handleInteraction}
        >
        {!currentZoom || currentZoom < 15 ? (
          <div className="p-8 text-center">
            <Navigation className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Zoom in to see nearby reports</h3>
            <p className="text-muted-foreground">
              Zoom in on the map to view incidents in your area.
            </p>
          </div>
        ) : !mapBounds ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Aligning with map view...</p>
          </div>
        ) : isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading nearby reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-8 text-center">
            <Navigation className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No nearby reports</h3>
            <p className="text-muted-foreground">
              No incidents found in the current map area.
            </p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="report-item p-4 mx-2 mb-2 bg-background border border-border rounded-xl cursor-pointer transition-all duration-300 hover:bg-muted/50 hover:shadow-md hover:-translate-y-1"
              onClick={() => { onReportClick(report.id); handleInteraction(); }}
              data-testid={`report-item-${report.id}`}
            >
              <div className="flex items-start space-x-3">
                <div 
                  className="w-3 h-3 rounded-full mt-2 flex-shrink-0 shadow-sm"
                  style={{ 
                    backgroundColor: getCategoryColor(report.category),
                    boxShadow: `0 0 8px ${getCategoryColor(report.category)}40`
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate drop-shadow-sm">
                      {report.title}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2 line-clamp-2 drop-shadow-sm">
                    {report.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="secondary"
                        className="text-xs"
                        style={{ 
                          backgroundColor: `${getCategoryColor(report.category)}20`,
                          color: getCategoryColor(report.category)
                        }}
                      >
                        {getCategoryName(report.category)}
                      </Badge>
                      {report.authoritiesContacted && (
                        <Shield className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {calculateDistance(report.latitude, report.longitude)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      ) : activeTab === 'recent' ? (
        <div 
          className="flex-1 overflow-y-auto"
          onScroll={handleInteraction}
        >
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No reports found for this category.</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="report-item p-4 mx-2 mb-2 bg-background border border-border rounded-xl cursor-pointer transition-all duration-300 hover:bg-muted/50 hover:shadow-md hover:-translate-y-1"
              onClick={() => { onReportClick(report.id); handleInteraction(); }}
              data-testid={`report-item-${report.id}`}
            >
              <div className="flex items-start space-x-3">
                <div 
                  className="w-3 h-3 rounded-full mt-2 flex-shrink-0 shadow-sm"
                  style={{ 
                    backgroundColor: getCategoryColor(report.category),
                    boxShadow: `0 0 8px ${getCategoryColor(report.category)}40`
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate drop-shadow-sm">
                      {report.title}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2 line-clamp-2 drop-shadow-sm">
                    {report.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="secondary"
                        className="text-xs"
                        style={{ 
                          backgroundColor: `${getCategoryColor(report.category)}20`,
                          color: getCategoryColor(report.category)
                        }}
                      >
                        {getCategoryName(report.category)}
                      </Badge>
                      {report.authoritiesContacted && (
                        <Shield className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {calculateDistance(report.latitude, report.longitude)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      ) : (
        <MyRegion onReportClick={onReportClick} />
      )}
    </div>
  );
}
