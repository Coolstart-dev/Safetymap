import { useState, useRef, useEffect, useCallback } from "react";
import InteractiveMap from "@/components/map/InteractiveMap";
import ReportsList from "@/components/reports/ReportsList";
import ReportModal from "@/components/reports/ReportModal";
import ReportDetailModal from "@/components/reports/ReportDetailModal";
import FloatingActionButton from "@/components/ui/floating-action-button";
import FloatingMenu from "@/components/ui/floating-menu";
import BottomSheet from "@/components/ui/bottom-sheet";
import { BottomSheetRef } from 'react-spring-bottom-sheet';
import { Settings, Home, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [locationSelectionMode, setLocationSelectionMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isHeatmapMode, setIsHeatmapMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'recent' | 'region'>('recent');
  const bottomSheetRef = useRef<BottomSheetRef>(null);

  // Debounced function to snap bottom sheet to position
  const snapToPosition = useCallback((snapIndex: number) => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.snapTo(({ snapPoints }) => snapPoints[snapIndex]);
    }
  }, []);

  // Handle map interactions - snap to low position (10%)
  const handleMapInteraction = useCallback(() => {
    snapToPosition(0); // Index 0 = 10% open
  }, [snapToPosition]);

  // Handle list scroll - snap to high position (90%)  
  const handleListScroll = useCallback(() => {
    snapToPosition(2); // Index 2 = 90% open
  }, [snapToPosition]);

  // Handle tab change - snap to high position when switching to region tab
  const handleTabChange = useCallback((tab: 'recent' | 'region') => {
    setActiveTab(tab);
    if (tab === 'region') {
      snapToPosition(2); // Index 2 = 90% open for better visibility
    }
  }, [snapToPosition]);

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

  const handleLocationSelectionStart = () => {
    // Snap bottom sheet to low position when starting location selection
    snapToPosition(0); // 10% open for better map visibility
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
    setLocationSelectionMode(false);
    setSelectedLocation(null);
  };

  const menuItems = [
    {
      label: "Dashboard",
      icon: <Home className="h-4 w-4" />,
      onClick: () => window.location.href = '/'
    },
    {
      label: "Admin Panel",
      icon: <Settings className="h-4 w-4" />,
      onClick: () => window.location.href = '/admin'
    }
  ];

  const toggleActions = [
    {
      label: "Heatmap Mode",
      icon: <MapPin className="h-4 w-4" />,
      isActive: isHeatmapMode,
      onToggle: () => setIsHeatmapMode(!isHeatmapMode)
    }
  ];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">

      {/* Floating Menu */}
      <FloatingMenu items={menuItems} toggleActions={toggleActions} />

      {/* Map Container - Full Height */}
      <div className="absolute inset-0 z-0">
        <InteractiveMap 
          onPinClick={handlePinClick}
          activeCategory={activeCategory}
          selectedSubcategories={selectedSubcategories}
          locationSelectionMode={locationSelectionMode}
          selectedLocation={selectedLocation}
          onLocationSelect={setSelectedLocation}
          isHeatmapMode={isHeatmapMode}
          onMapInteraction={handleMapInteraction}
        />
      </div>

      {/* Bottom Sheet with Reports */}
      <BottomSheet ref={bottomSheetRef}>
        <ReportsList 
          onReportClick={handleReportClick}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          selectedSubcategories={selectedSubcategories}
          onSubcategoriesChange={setSelectedSubcategories}
          onListScroll={handleListScroll}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </BottomSheet>

      {/* Floating Action Button */}
      <FloatingActionButton 
        onClick={handleOpenReportModal}
        data-testid="button-add-report"
      />

      {/* Location Selection Overlay */}
      {locationSelectionMode && (
        <div className="fixed top-4 left-4 z-50 glass-card rounded-xl p-4 max-w-sm">
          <h3 className="font-semibold text-sm mb-3">Select Location on Map</h3>
          
          <div className="space-y-3">
            <div className="glass-subtle border border-blue-200/50 rounded-xl p-3">
              <div className="text-sm text-blue-800 mb-1">
                🗺️ Click anywhere on the map to place your marker
              </div>
              <div className="text-xs text-blue-600">
                Drag the red marker to fine-tune the location
              </div>
            </div>
            
            {selectedLocation && (
              <div className="glass-subtle border border-green-200/50 rounded-xl p-2">
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
        onLocationSelectionStart={handleLocationSelectionStart}
      />

      <ReportDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        reportId={selectedReportId}
      />
    </div>
  );
}
