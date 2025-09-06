import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users, Heart, Search, Loader2, Brain, Clock, Image, ChevronRight } from "lucide-react";
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

interface CategorySection {
  category: string;
  name: string;
  color: string;
  reports: Report[];
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

  // Group reports by category and sort by recency
  const groupedReports: CategorySection[] = regionData ? 
    Object.entries(
      regionData.reports.reduce((groups, report) => {
        const category = report.category;
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(report);
        return groups;
      }, {} as Record<string, Report[]>)
    )
    .map(([category, reports]) => ({
      category,
      name: getCategoryName(category),
      color: getCategoryColor(category),
      reports: reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }))
    .filter(section => section.reports.length > 0)
    .sort((a, b) => b.reports.length - a.reports.length) // Sort by number of reports
    : [];

  const FeaturedArticle = ({ report, large = false }: { report: Report; large?: boolean }) => (
    <article 
      onClick={() => onReportClick(report.id)}
      className={`group cursor-pointer bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg ${
        large ? 'col-span-2 row-span-2' : ''
      }`}
      data-testid={`featured-article-${report.id}`}
    >
      {/* Image Section */}
      {report.imageUrl ? (
        <div className={`relative overflow-hidden bg-gray-100 ${large ? 'h-64' : 'h-48'}`}>
          <img 
            src={report.imageUrl} 
            alt={report.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute top-3 left-3">
            <Badge 
              variant="secondary"
              className="text-xs font-medium text-white border-0"
              style={{ backgroundColor: getCategoryColor(report.category) }}
            >
              {getCategoryName(report.category)}
            </Badge>
          </div>
        </div>
      ) : (
        <div className={`relative bg-gray-50 border-b border-gray-200 ${large ? 'h-32' : 'h-24'} flex items-center justify-center`}>
          <div className="text-center">
            <Image className="h-8 w-8 text-gray-300 mx-auto mb-2" />
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
      )}

      {/* Content Section */}
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <h3 className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight ${
            large ? 'text-xl' : 'text-lg'
          }`}>
            {report.title}
          </h3>
          <p className={`text-gray-600 leading-relaxed ${large ? 'text-base' : 'text-sm'} line-clamp-3`}>
            {report.description}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
          </div>
          <ChevronRight className="h-3 w-3 group-hover:text-blue-600" />
        </div>
      </div>
    </article>
  );

  const CategorySection = ({ section }: { section: CategorySection }) => {
    const [featuredReport, ...otherReports] = section.reports;
    
    return (
      <section className="mb-12" data-testid={`category-section-${section.category}`}>
        {/* Category Header */}
        <div className="flex items-center gap-3 mb-6 pb-3 border-b-2" style={{ borderColor: section.color }}>
          <div 
            className="w-3 h-8 rounded-sm"
            style={{ backgroundColor: section.color }}
          />
          <h2 className="text-2xl font-bold text-gray-900">{section.name}</h2>
          <Badge variant="outline" className="text-sm">
            {section.reports.length} {section.reports.length === 1 ? 'report' : 'reports'}
          </Badge>
        </div>

        {/* Featured Report */}
        {featuredReport && (
          <div className="mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <FeaturedArticle report={featuredReport} large />
              
              {/* Side stories */}
              <div className="space-y-4">
                {otherReports.slice(0, 3).map((report) => (
                  <article 
                    key={report.id}
                    onClick={() => onReportClick(report.id)}
                    className="group cursor-pointer border-b border-gray-200 pb-4 hover:border-gray-300 transition-colors"
                    data-testid={`side-article-${report.id}`}
                  >
                    <div className="flex gap-3">
                      {report.imageUrl && (
                        <div className="w-20 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          <img 
                            src={report.imageUrl} 
                            alt={report.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                          {report.title}
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                          {report.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Additional Reports Grid */}
        {otherReports.length > 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherReports.slice(3).map((report) => (
              <article 
                key={report.id}
                onClick={() => onReportClick(report.id)}
                className="group cursor-pointer bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
                data-testid={`grid-article-${report.id}`}
              >
                {report.imageUrl && (
                  <div className="h-32 bg-gray-100 overflow-hidden">
                    <img 
                      src={report.imageUrl} 
                      alt={report.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="p-3 space-y-2">
                  <h4 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {report.title}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {report.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-red-600" />
          <h1 className="text-xl font-bold text-gray-900">Regional News</h1>
        </div>
        
        <div className="flex gap-2">
          <Input
            placeholder="Enter postal code (e.g. 2000)"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
            data-testid="postal-code-input"
          />
          <Button 
            onClick={handleSearch} 
            disabled={!postalCode.trim() || isLoading}
            size="sm"
            className="bg-red-600 hover:bg-red-700"
            data-testid="search-button"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {error && (
          <div className="text-center py-16">
            <div className="text-red-600 text-lg font-semibold mb-2">Postal code not found</div>
            <p className="text-gray-600">
              Please check your postal code and try again
            </p>
          </div>
        )}

        {regionData && (
          <div className="max-w-6xl mx-auto p-6">
            {/* Region Header */}
            <header className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {regionData.postalCode.municipality}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>Postal Code: {regionData.postalCode.postalCode}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{regionData.count} total reports</span>
                </div>
              </div>

              {/* AI Summary */}
              {regionData.reports.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">Regional Summary</h3>
                  </div>
                  {isLoadingSummary ? (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Analyzing region reports...</span>
                    </div>
                  ) : aiSummary ? (
                    <p className="text-sm text-blue-700">
                      {aiSummary.summary}
                    </p>
                  ) : (
                    <p className="text-sm text-blue-600">
                      Unable to generate summary at this moment.
                    </p>
                  )}
                </div>
              )}
            </header>

            {/* News Sections */}
            {groupedReports.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No News Yet</h3>
                <p className="text-gray-600">
                  No reports have been submitted for this region yet.
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {groupedReports.map((section) => (
                  <CategorySection key={section.category} section={section} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Default State */}
        {!searchedPostalCode && !isLoading && (
          <div className="max-w-4xl mx-auto p-6 text-center py-16">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Regional News Dashboard</h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Stay informed about what's happening in your area. Enter a postal code above to see the latest reports organized by category.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                  <Users className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Community Insights</h3>
                  <p className="text-sm text-gray-600 text-center">
                    Local reports organized by category for easy browsing
                  </p>
                </div>
                
                <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                  <Image className="w-8 h-8 text-green-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Visual Stories</h3>
                  <p className="text-sm text-gray-600 text-center">
                    Photos and detailed descriptions from residents
                  </p>
                </div>
                
                <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                  <Heart className="w-8 h-8 text-red-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Regional Safety</h3>
                  <p className="text-sm text-gray-600 text-center">
                    Both positive and concerning community developments
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}