import { useQuery } from "@tanstack/react-query";
import { Report } from "@shared/schema";
import { categories } from "@/lib/categories";
import { formatDistanceToNow } from "date-fns";
import { Flag, Shield, Clock, MapPin, User, Camera } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string | null;
}

export default function ReportDetailModal({ isOpen, onClose, reportId }: ReportDetailModalProps) {
  const { data: report, isLoading } = useQuery<Report>({
    queryKey: [`/api/reports/${reportId}`],
    enabled: !!reportId,
  });

  if (!report && !isLoading) {
    return null;
  }

  const getCategoryColor = (category: string) => {
    const categoryInfo = categories[category as keyof typeof categories];
    return categoryInfo?.color || '#6b7280';
  };

  const getCategoryName = (category: string) => {
    const categoryInfo = categories[category as keyof typeof categories];
    return categoryInfo?.name || category;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 drop-shadow-sm">Report Details</DialogTitle>
          <DialogDescription>
            View detailed information about this community safety report.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-700 drop-shadow-sm">Loading report details...</p>
          </div>
        ) : report ? (
          <div className="space-y-3 sm:space-y-4">
            {/* Header */}
            <div className="flex items-start space-x-3">
              <div 
                className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                style={{ backgroundColor: getCategoryColor(report.category) }}
              />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1 drop-shadow-sm">{report.title}</h3>
                <Badge 
                  variant="secondary"
                  style={{ 
                    backgroundColor: `${getCategoryColor(report.category)}40`,
                    color: getCategoryColor(report.category),
                    border: `1px solid ${getCategoryColor(report.category)}60`
                  }}
                >
                  {getCategoryName(report.category)}
                </Badge>
                {report.subcategory && (
                  <Badge variant="outline" className="ml-2 bg-white/50 border-gray-400">
                    {report.subcategory}
                  </Badge>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 sm:space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-900 flex items-center mb-1 drop-shadow-sm">
                  <User className="h-4 w-4 mr-2" />
                  Description
                </span>
                <p className="text-gray-700 drop-shadow-sm">{report.description}</p>
              </div>

              {/* Incident Time */}
              {report.incidentDateTime && (
                <div>
                  <span className="font-medium text-gray-900 flex items-center drop-shadow-sm">
                    <Clock className="h-4 w-4 mr-2" />
                    When incident happened
                  </span>
                  <p className="text-gray-700 drop-shadow-sm">
                    {(() => {
                      try {
                        const date = new Date(report.incidentDateTime);
                        if (isNaN(date.getTime())) {
                          return "Invalid date format";
                        }
                        return (
                          <>
                            {formatDistanceToNow(date, { addSuffix: true })} 
                            ({date.toLocaleString()})
                          </>
                        );
                      } catch (error) {
                        console.log("Date parsing error:", error, "incidentDateTime value:", report.incidentDateTime);
                        return "Unable to parse date";
                      }
                    })()}
                  </p>
                </div>
              )}

              {/* Reported Time */}
              <div>
                <span className="font-medium text-gray-900 flex items-center drop-shadow-sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Report submitted
                </span>
                <p className="text-gray-700 drop-shadow-sm">
                  {(() => {
                    if (!report.createdAt) return "Time not available";
                    
                    try {
                      const date = new Date(report.createdAt);
                      if (isNaN(date.getTime())) {
                        return "Invalid date format";
                      }
                      return (
                        <>
                          {formatDistanceToNow(date, { addSuffix: true })} 
                          ({date.toLocaleString()})
                        </>
                      );
                    } catch (error) {
                      console.log("Date parsing error:", error, "createdAt value:", report.createdAt);
                      return "Unable to parse date";
                    }
                  })()}
                </p>
              </div>

              <div>
                <span className="font-medium text-gray-900 flex items-center drop-shadow-sm">
                  <MapPin className="h-4 w-4 mr-2" />
                  Location
                </span>
                <p className="text-gray-700 drop-shadow-sm">
                  {report.locationDescription || 
                   (report.latitude && report.longitude ? 
                    `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}` : 
                    "Location not specified"
                   )}
                </p>
              </div>

              <div>
                <span className="font-medium text-gray-900 flex items-center drop-shadow-sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Authorities contacted
                </span>
                <p className="text-gray-700 drop-shadow-sm">
                  {report.authoritiesContacted ? "Yes" : "No"}
                </p>
              </div>

              <div>
                <span className="font-medium text-gray-900 flex items-center drop-shadow-sm">
                  <User className="h-4 w-4 mr-2" />
                  Involvement
                </span>
                <p className="text-gray-700 drop-shadow-sm">
                  {report.involvementType === 'victim' ? 
                    'Reported by victim/directly affected person' : 
                    'Reported by witness'
                  }
                </p>
              </div>

              {/* Image */}
              {report.imageUrl && (
                <div>
                  <span className="font-medium text-gray-900 flex items-center mb-2 drop-shadow-sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Photo Evidence
                  </span>
                  <img 
                    src={report.imageUrl} 
                    alt="Report evidence" 
                    className="w-full rounded-lg border"
                    data-testid="img-report-evidence"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4">
              <Button 
                variant="outline" 
                className="w-full"
                data-testid="button-report-inappropriate"
              >
                <Flag className="h-4 w-4 mr-2" />
                Report as Inappropriate
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-700 drop-shadow-sm">Report not found.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
