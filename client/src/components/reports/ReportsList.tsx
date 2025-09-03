import { useQuery } from "@tanstack/react-query";
import { Report } from "@shared/schema";
import { categories } from "@/lib/categories";
import { formatDistanceToNow } from "date-fns";
import { Filter, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ReportsListProps {
  onReportClick: (reportId: string) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function ReportsList({ onReportClick, activeCategory, onCategoryChange }: ReportsListProps) {
  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports", { category: activeCategory }],
  });

  const filteredReports = reports.filter(report => 
    activeCategory === 'all' || report.category === activeCategory
  );

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
    <div className="bg-white rounded-t-xl shadow-lg relative" style={{ marginTop: '-16px' }}>
      <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2 mb-4"></div>
      
      {/* Header and Filters */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Recent Reports</h2>
          <Button variant="ghost" size="sm" data-testid="button-filter">
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
        </div>
        
        {/* Category Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={activeCategory === 'all' ? 'default' : 'secondary'}
            size="sm"
            className="flex-shrink-0 rounded-full"
            onClick={() => onCategoryChange('all')}
            data-testid="filter-all"
          >
            All
          </Button>
          {Object.entries(categories).map(([key, category]) => (
            <Button
              key={key}
              variant={activeCategory === key ? 'default' : 'secondary'}
              size="sm"
              className="flex-shrink-0 rounded-full"
              onClick={() => onCategoryChange(key)}
              data-testid={`filter-${key}`}
            >
              <span 
                className="w-2 h-2 rounded-full inline-block mr-1"
                style={{ backgroundColor: category.color }}
              />
              {category.name.split(' ')[0]}
            </Button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="max-h-96 overflow-y-auto">
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
    </div>
  );
}
