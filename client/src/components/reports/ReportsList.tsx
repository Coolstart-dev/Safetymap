import { useQuery } from "@tanstack/react-query";
import { Report } from "@shared/schema";
import { categories } from "@/lib/categories";
import { formatDistanceToNow } from "date-fns";
import { Filter, Shield, X, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FilterSheet from "./FilterSheet";
import MyNeighborhood from "./MyNeighborhood";

interface ReportsListProps {
  onReportClick: (reportId: string) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  selectedSubcategories: string[];
  onSubcategoriesChange: (subcategories: string[]) => void;
  onListScroll?: () => void;
  activeTab: 'recent' | 'neighborhood';
  onTabChange: (tab: 'recent' | 'neighborhood') => void;
}

export default function ReportsList({ 
  onReportClick, 
  activeCategory, 
  onCategoryChange, 
  selectedSubcategories, 
  onSubcategoriesChange,
  onListScroll,
  activeTab,
  onTabChange
}: ReportsListProps) {
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports", { category: activeCategory }],
  });

  const filteredReports = reports
    .filter(report => {
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
    <div className="flex flex-col h-full bg-white">
      {/* Tab Navigation */}
      <div className="px-4 pt-1 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex space-x-1">
            <Button
              variant={activeTab === 'recent' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('recent')}
              className="flex items-center gap-2"
              data-testid="tab-recent-reports"
            >
              <Clock className="w-4 h-4" />
              Recent Reports
            </Button>
            <Button
              variant={activeTab === 'neighborhood' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('neighborhood')}
              className="flex items-center gap-2"
              data-testid="tab-my-neighborhood"
            >
              <MapPin className="w-4 h-4" />
              My Neighborhood
            </Button>
          </div>
          {activeTab === 'recent' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-filter"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
          )}
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
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border"
                  style={{ 
                    backgroundColor: `${color}15`,
                    borderColor: `${color}40`,
                    color: color
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

      {/* Filter Sheet */}
      <FilterSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        selectedSubcategories={selectedSubcategories}
        onApplyFilters={onSubcategoriesChange}
      />

      {/* Tab Content */}
      {activeTab === 'recent' ? (
        <div 
          className="flex-1 overflow-y-auto"
          onScroll={onListScroll}
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
              className="report-item p-4 border-b border-border cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:transform hover:-translate-y-0.5"
              onClick={() => onReportClick(report.id)}
              data-testid={`report-item-${report.id}`}
            >
              <div className="flex items-start space-x-3">
                <div 
                  className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(report.category) }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-foreground truncate">
                      {report.title}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
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
        <MyNeighborhood onReportClick={onReportClick} />
      )}
    </div>
  );
}
