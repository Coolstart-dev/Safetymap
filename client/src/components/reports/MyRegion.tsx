import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users, Heart, Search, Loader2, Brain, Clock, Image, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Group reports by category
  const reportsByCategory = regionData?.reports.reduce((groups, report) => {
    const category = report.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(report);
    return groups;
  }, {} as Record<string, Report[]>) || {};

  // Get list of categories with 2+ reports for analysis
  const categoriesNeedingAnalysis = Object.entries(reportsByCategory)
    .filter(([_, reports]) => reports.length >= 2)
    .map(([category, _]) => category);

  // Create a single query for all category analyses
  const { data: allCategoryAnalyses } = useQuery({
    queryKey: ['/api/region', searchedPostalCode, 'category-analyses', categoriesNeedingAnalysis],
    queryFn: async () => {
      if (!searchedPostalCode || categoriesNeedingAnalysis.length === 0) return {};
      
      const analyses: Record<string, string> = {};
      
      // Fetch all analyses in parallel
      const promises = categoriesNeedingAnalysis.map(async (category) => {
        try {
          const response = await fetch(`/api/region/${searchedPostalCode}/category/${category}/analysis`);
          if (response.ok) {
            const data = await response.json();
            if (data?.analysis) {
              analyses[category] = data.analysis;
            }
          }
        } catch (error) {
          console.error(`Failed to get analysis for category ${category}:`, error);
        }
      });
      
      await Promise.all(promises);
      return analyses;
    },
    enabled: !!searchedPostalCode && categoriesNeedingAnalysis.length > 0,
  });

  const categoryAnalyses = allCategoryAnalyses || {};

  // Group reports by category and sort by recency
  const groupedReports: CategorySection[] = regionData ? 
    Object.entries(reportsByCategory)
    .map(([category, reports]) => ({
      category,
      name: getCategoryName(category),
      color: getCategoryColor(category),
      reports: reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }))
    .filter(section => section.reports.length > 0)
    .sort((a, b) => b.reports.length - a.reports.length) // Sort by number of reports
    : [];

  const ReportCard = ({ report, size = 'normal' }: { report: Report; size?: 'normal' | 'large' }) => {
    const categoryColor = getCategoryColor(report.category);
    const isLarge = size === 'large';

    return (
      <article 
        className={`bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300 flex-shrink-0 flex flex-col ${
          isLarge ? 'w-80 min-w-80 h-96' : 'w-64 min-w-64 h-80'
        }`}
        onClick={() => onReportClick(report.id)}
        data-testid={`report-card-${report.id}`}
      >
        {/* Image or Placeholder */}
        <div className={`${isLarge ? 'h-48' : 'h-32'} bg-gray-100 relative`}>
          {report.imageUrl ? (
            <img
              src={report.imageUrl}
              alt={report.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ 
                backgroundColor: `${categoryColor}15`,
                border: `2px dashed ${categoryColor}40`
              }}
            >
              <div className="text-center">
                <div 
                  className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{ backgroundColor: `${categoryColor}25` }}
                >
                  <div 
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: categoryColor }}
                  />
                </div>
                <p className="text-xs font-medium" style={{ color: categoryColor }}>
                  {getCategoryName(report.category)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`p-4 space-y-2 flex-1 flex flex-col justify-between`}>
          <div className="flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className={`font-semibold text-gray-900 line-clamp-2 flex-1 ${
                isLarge ? 'text-base' : 'text-sm'
              }`}>
                {report.title}
              </h3>
              <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
              </span>
            </div>

            <p className={`text-gray-600 line-clamp-3 flex-1 ${
              isLarge ? 'text-sm' : 'text-xs'
            }`}>
              {report.description}
            </p>
          </div>

          <div className="flex items-center justify-between mt-auto">
            <Badge 
              variant="secondary"
              className="text-xs border-0"
              style={{ 
                backgroundColor: `${categoryColor}20`,
                color: categoryColor
              }}
            >
              {getCategoryName(report.category)}
            </Badge>
          </div>
        </div>
      </article>
    );
  };

  const CategorySection = ({ section }: { section: CategorySection }) => {
    const [featuredReport, ...otherReports] = section.reports;

    return (
      <section className="mb-8" data-testid={`category-section-${section.category}`}>
        {/* Category Header */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: section.color }}
                />
                <span>{section.name}</span>
                <Badge 
                  className="border-0"
                  style={{ 
                    backgroundColor: `${section.color}20`,
                    color: section.color
                  }}
                >
                  {section.reports.length}
                </Badge>
              </div>
            </CardTitle>

            {/* AI Journalism Analysis */}
            {categoryAnalyses[section.category] && (
              <div 
                className="mt-3 p-3 rounded-md border-l-4"
                style={{ 
                  backgroundColor: `${section.color}10`,
                  borderLeftColor: section.color 
                }}
              >
                <div className="flex items-start space-x-2">
                  <FileText 
                    className="h-4 w-4 mt-0.5 flex-shrink-0" 
                    style={{ color: section.color }}
                  />
                  <div 
                    className="text-sm font-medium"
                    style={{ color: section.color }}
                  >
                    <div dangerouslySetInnerHTML={{ 
                      __html: categoryAnalyses[section.category].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                    }} />
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {/* Horizontal Scrolling Reports */}
            <div className="relative">
              {/* Scroll indicators */}
              {section.reports.length > 1 && (
                <div className="absolute right-0 top-0 z-10 flex items-center space-x-1 bg-gradient-to-l from-white via-white to-transparent pl-8 pr-2 py-2">
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(section.reports.length, 5) }).map((_, i) => (
                      <div 
                        key={i} 
                        className="w-1.5 h-1.5 rounded-full bg-gray-300"
                      />
                    ))}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              )}
              
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {/* Featured Report (large) */}
                {featuredReport && (
                  <div className="snap-start">
                    <ReportCard report={featuredReport} size="large" />
                  </div>
                )}

                {/* Other Reports (normal size) */}
                {otherReports.map((report) => (
                  <div key={report.id} className="snap-start">
                    <ReportCard key={report.id} report={report} size="normal" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
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