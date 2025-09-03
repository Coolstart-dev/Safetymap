import { useState } from "react";
import InteractiveMap from "@/components/map/InteractiveMap";
import ReportsList from "@/components/reports/ReportsList";
import ReportModal from "@/components/reports/ReportModal";
import ReportDetailModal from "@/components/reports/ReportDetailModal";
import FloatingActionButton from "@/components/ui/floating-action-button";
import FloatingMenu from "@/components/ui/floating-menu";
import { Settings } from "lucide-react";

export default function Dashboard() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
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

  const handleOpenReportModal = () => {
    // Reset all location-related state when opening a new report
    setLocationSelectionMode(false);
    setSelectedLocation(null);
    setIsReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
    setLocationSelectionMode(false);
    setSelectedLocation(null);
  };

  const menuItems = [
    {
      label: "Admin Panel",
      icon: <Settings className="h-4 w-4" />,
      onClick: () => window.location.href = '/admin'
    }
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* Floating Menu */}
      <FloatingMenu items={menuItems} />

      {/* Map Container */}
      <div className="relative">
        <InteractiveMap 
          onPinClick={handlePinClick}
          activeCategory={activeCategory}
          selectedSubcategories={selectedSubcategories}
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
        selectedSubcategories={selectedSubcategories}
        onSubcategoriesChange={setSelectedSubcategories}
      />

      {/* Floating Action Button */}
      <FloatingActionButton 
        onClick={handleOpenReportModal}
        data-testid="button-add-report"
      />

      {/* Location Selection Overlay */}
      {locationSelectionMode && (
        <div className="fixed top-4 left-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
          <h3 className="font-semibold text-sm mb-3">Select Location on Map</h3>
          
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800 mb-1">
                🗺️ Click anywhere on the map to place your marker
              </div>
              <div className="text-xs text-blue-600">
                Drag the red marker to fine-tune the location
              </div>
            </div>
            
            {selectedLocation && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                <div className="text-sm text-green-800">
                  ✅ Location: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={() => setLocationSelectionMode(false)}
                size="sm"
                className="flex-1"
                disabled={!selectedLocation}
                data-testid="button-confirm-location"
              >
                ✓ Confirm Location
              </Button>
              <Button
                onClick={handleCloseReportModal}
                variant="outline"
                size="sm"
                data-testid="button-cancel-location"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ReportModal 
        isOpen={isReportModalOpen && !locationSelectionMode}
        onClose={handleCloseReportModal}
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
