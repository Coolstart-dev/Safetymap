import { useState } from "react";
import InteractiveMap from "@/components/map/InteractiveMap";
import ReportsList from "@/components/reports/ReportsList";
import ReportModal from "@/components/reports/ReportModal";
import ReportDetailModal from "@/components/reports/ReportDetailModal";
import FloatingActionButton from "@/components/ui/floating-action-button";
import { Shield, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [locationSelectionMode, setLocationSelectionMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleReportClick = (reportId: string) => {
    setSelectedReportId(reportId);
    setIsDetailModalOpen(true);
  };

  const handlePinClick = (reportId: string) => {
    setSelectedReportId(reportId);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Area</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" data-testid="button-search">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-settings">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Map Container */}
      <div className="relative">
        <InteractiveMap 
          onPinClick={handlePinClick}
          activeCategory={activeCategory}
          locationSelectionMode={locationSelectionMode}
          selectedLocation={selectedLocation}
          onLocationSelect={setSelectedLocation}
        />
      </div>

      {/* Reports List */}
      <ReportsList 
        onReportClick={handleReportClick}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Floating Action Button */}
      <FloatingActionButton 
        onClick={() => setIsReportModalOpen(true)}
        data-testid="button-add-report"
      />

      {/* Modals */}
      <ReportModal 
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setLocationSelectionMode(false);
          setSelectedLocation(null);
        }}
        selectedLocation={selectedLocation}
        onLocationSelect={setSelectedLocation}
        locationSelectionMode={locationSelectionMode}
        onLocationSelectionModeToggle={() => setLocationSelectionMode(!locationSelectionMode)}
      />

      <ReportDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        reportId={selectedReportId}
      />
    </div>
  );
}
