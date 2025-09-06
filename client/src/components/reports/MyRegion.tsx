import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users, Heart, Search, Loader2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { categories } from "@/lib/categories";
import { Report } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface RegionData {
  postalCode: {
    postalCode: string;
    municipality: string;
    latitude: number;
    longitude: number;
  };
  reports: Report[];
  count: number;
}

interface MyRegionProps {
  onReportClick: (reportId: string) => void;
}

export default function MyRegion({ onReportClick }: MyRegionProps) {
  const [postalCode, setPostalCode] = useState("");
  const [searchedPostalCode, setSearchedPostalCode] = useState<string | null>(null);

  const { data: regionData, isLoading, error } = useQuery<RegionData>({
    queryKey: ["/api/region", searchedPostalCode, "reports"],
    queryFn: async () => {
      if (!searchedPostalCode) return null;
      const response = await fetch(`/api/region/${searchedPostalCode}/reports`);
      if (!response.ok) {
        throw new Error('Postal code not found');
      }
      return response.json();
    },
    enabled: !!searchedPostalCode,
  });

  const { data: aiSummary, isLoading: isLoadingSummary } = useQuery<{summary: string}>({
    queryKey: ["/api/region", searchedPostalCode, "ai-summary"],
    queryFn: async () => {
      if (!searchedPostalCode) return null;
      const response = await fetch(`/api/region/${searchedPostalCode}/ai-summary`);
      if (!response.ok) {
        throw new Error('Failed to get AI summary');
      }
      return response.json();
    },
    enabled: !!searchedPostalCode && !!regionData?.reports.length,
  });

  const handleSearch = () => {
    if (postalCode.trim()) {
      setSearchedPostalCode(postalCode.trim());
    }
  };

  const getCategoryColor = (category: string) => {
    return categories[category as keyof typeof categories]?.color || '#6b7280';
  };

  const getCategoryName = (category: string) => {
    return categories[category as keyof typeof categories]?.name || category;
  };

  return (
    <div className="flex flex-col h-full p-4">
      {/* Search Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">My Region</h3>
        </div>
        
        <div className="flex gap-2">
          <Input
            placeholder="Enter postal code (e.g. 2000)"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button 
            onClick={handleSearch} 
            disabled={!postalCode.trim() || isLoading}
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Results Section */}
      {error && (
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">Postal code not found</div>
          <p className="text-sm text-muted-foreground">
            Please check your postal code and try again
          </p>
        </div>
      )}

      {regionData && (
        <div className="flex-1 overflow-hidden">
          {/* Header */}
          <div className="mb-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-primary">
              {regionData.postalCode.municipality}
            </h4>
            <p className="text-sm text-muted-foreground">
              Postal Code: {regionData.postalCode.postalCode}
            </p>
            <p className="text-sm text-muted-foreground">
              {regionData.count} local reports
            </p>
          </div>

          {/* AI Summary */}
          {regionData.reports.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-blue-600" />
                <h5 className="font-medium text-blue-800 dark:text-blue-200">AI Samenvatting</h5>
              </div>
              {isLoadingSummary ? (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Analyzing region reports...</span>
                </div>
              ) : aiSummary ? (
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {aiSummary.summary}
                </p>
              ) : (
                <p className="text-sm text-blue-600">
                  Unable to generate summary at this moment.
                </p>
              )}
            </div>
          )}

          {/* Reports List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {regionData.reports.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  No reports in your region yet
                </p>
              </div>
            ) : (
              regionData.reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => onReportClick(report.id)}
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-sm line-clamp-1">
                      {report.title}
                    </h5>
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {report.description}
                  </p>
                  <div className="flex items-center justify-between">
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
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Default State */}
      {!searchedPostalCode && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="space-y-3 w-full max-w-xs">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Users className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Local community insights</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Heart className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Regional safety</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}