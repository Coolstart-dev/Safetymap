import { useState, useRef, useEffect, useCallback } from "react";
import InteractiveMap from "@/components/map/InteractiveMap";
import ReportsList from "@/components/reports/ReportsList";
import ReportModal from "@/components/reports/ReportModal";
import ReportDetailModal from "@/components/reports/ReportDetailModal";
import FilterSheet from "@/components/reports/FilterSheet";
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
  const [activeTab, setActiveTab] = useState<'recent' | 'region' | 'nearme'>('nearme');
  const [mapBounds, setMapBounds] = useState<{north: number, south: number, east: number, west: number} | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(15);
  const [showFilters, setShowFilters] = useState(false);
  const bottomSheetRef = useRef<BottomSheetRef>(null);

  // Debounced function to snap bottom sheet to position
  const snapToPosition = useCallback((snapIndex: number) => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.snapTo(({ snapPoints }) => snapPoints[snapIndex]);
    }
  }, []);

  // Handle map interactions - snap to low position (20%)
  const handleMapInteraction = useCallback(() => {
    snapToPosition(0); // Index 0 = 20% open
  }, [snapToPosition]);

  // Sheet interaction handler - keep at 40% for better map visibility
  const handleSheetInteraction = useCallback(() => {
    snapToPosition(1); // Index 1 = 40% open for better map visibility
  }, [snapToPosition]);

  // Handle tab change without auto-expansion
  const handleTabChange = useCallback((tab: 'recent' | 'region' | 'nearme') => {
    setActiveTab(tab);
    // Don't auto-expand for Near Me to keep map visible
  }, []);

  // Handle map view change (bounds and zoom)
  const handleMapViewChange = useCallback((bounds: {north: number, south: number, east: number, west: number}, zoom: number) => {
    setMapBounds(bounds);
    setCurrentZoom(zoom);
  }, []);

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
    snapToPosition(0); // 20% open for better map visibility
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
      onClick: () => {
        snapToPosition(0); // Snap to low position for better visibility
        window.location.href = '/';
      }
    },
    {
      label: "Admin Panel",
      icon: <Settings className="h-4 w-4" />,
      onClick: () => {
        snapToPosition(0); // Snap to low position for better visibility
        window.location.href = '/admin';
      }
    }
  ];


  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">

      {/* Floating Menu */}
      <FloatingMenu 
        items={menuItems} 
        onMenuOpen={() => snapToPosition(0)} // Snap to low position when menu opens
      />

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
          onHeatmapToggle={() => setIsHeatmapMode(!isHeatmapMode)}
          onFilterClick={() => setShowFilters(true)}
          onMapInteraction={handleMapInteraction}
          onViewChange={handleMapViewChange}
        />
      </div>

      {/* Bottom Sheet with Reports */}
      <BottomSheet ref={bottomSheetRef} onClick={handleSheetInteraction}>
        <ReportsList 
          onReportClick={handleReportClick}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          selectedSubcategories={selectedSubcategories}
          onSubcategoriesChange={setSelectedSubcategories}
          onSheetInteraction={handleSheetInteraction}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          showFilters={false}
          mapBounds={mapBounds}
          currentZoom={currentZoom}
        />
      </BottomSheet>

      {/* Floating Action Button */}
      <FloatingActionButton 
        onClick={handleOpenReportModal}
        data-testid="button-add-report"
      />

      {/* Location Selection Overlay */}
      {locationSelectionMode && (
        <div className="fixed top-4 left-4 z-50 bg-white border border-gray-200 shadow-lg rounded-xl p-4 max-w-sm">
          <h3 className="font-semibold text-sm mb-3">Select Location on Map</h3>
          
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <div className="text-sm text-blue-800 mb-1">
                🗺️ Click anywhere on the map to place your marker
              </div>
              <div className="text-xs text-blue-600">
                Drag the red marker to fine-tune the location
              </div>
            </div>
            
            {selectedLocation && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-2">
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

      {/* Filter Sheet - Now managed from map controls */}
      <FilterSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        selectedSubcategories={selectedSubcategories}
        onApplyFilters={setSelectedSubcategories}
      />
    </div>
  );
}
