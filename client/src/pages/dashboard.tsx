import { useState, useRef, useEffect, useCallback } from "react";
import InteractiveMap from "@/components/map/InteractiveMap";
import ReportsList from "@/components/reports/ReportsList";
import ReportModal from "@/components/reports/ReportModal";
import ReportDetailModal from "@/components/reports/ReportDetailModal";
import FilterSheet from "@/components/reports/FilterSheet";
import FloatingActionButton from "@/components/ui/floating-action-button";
import BottomSheet from "@/components/ui/bottom-sheet";
import StoriesPage from "@/pages/stories";
import { BottomSheetRef } from 'react-spring-bottom-sheet';
import { Settings, Home, MapPin, Grid3X3, Activity, BookOpen, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [locationSelectionMode, setLocationSelectionMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [viewMode, setViewMode] = useState<'stories' | 'pins' | 'heatmap'>('pins');
  const [activeTab, setActiveTab] = useState<'recent' | 'region' | 'nearme'>('nearme');
  const [mapBounds, setMapBounds] = useState<{north: number, south: number, east: number, west: number} | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(15);
  const [showFilters, setShowFilters] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const bottomSheetRef = useRef<BottomSheetRef>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Handle click outside menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">

      {/* Main Navigation Tabs with Integrated Menu - Top Center with iOS safe area handling */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[1100] flex items-center" style={{
        /* iOS Safe Area adjustments */
        top: 'max(1.5rem, calc(env(safe-area-inset-top) + 0.5rem))'
      }}>
        <div className="bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-full p-1 shadow-lg">
          <div ref={menuRef} className="flex items-center relative">
            {/* Menu Button - Smaller and on the left */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsMenuOpen(!isMenuOpen);
                snapToPosition(0); // Snap to low position when menu opens
              }}
              className="rounded-full px-2 py-2 text-sm font-medium transition-all text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              data-testid="button-integrated-menu"
              aria-label="Open Menu"
            >
              {isMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
            
            {/* Vertical Separator */}
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            <Button
              size="sm"
              variant={viewMode === 'stories' ? "default" : "ghost"}
              onClick={() => {
                setViewMode('stories');
                snapToPosition(0); // Collapse sheet when switching view
              }}
              className={`rounded-full px-3 py-2 text-sm font-medium transition-all ${
                viewMode === 'stories' 
                  ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              data-testid="button-stories-view"
              aria-label="Switch to Stories View"
            >
              <BookOpen className="h-4 w-4 mr-1" />
              Stories
            </Button>
            
            <Button
              size="sm"
              variant={viewMode === 'pins' ? "default" : "ghost"}
              onClick={() => {
                setViewMode('pins');
                snapToPosition(0); // Collapse sheet when switching view
              }}
              className={`rounded-full px-3 py-2 text-sm font-medium transition-all ${
                viewMode === 'pins' 
                  ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              data-testid="button-pin-view"
              aria-label="Switch to Pin View"
            >
              <MapPin className="h-4 w-4 mr-1" />
              Pins
            </Button>
            
            <Button
              size="sm"
              variant={viewMode === 'heatmap' ? "default" : "ghost"}
              onClick={() => {
                setViewMode('heatmap');
                snapToPosition(0); // Collapse sheet when switching view
              }}
              className={`rounded-full px-3 py-2 text-sm font-medium transition-all ${
                viewMode === 'heatmap' 
                  ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              data-testid="button-heatmap-view"
              aria-label="Switch to Heatmap View"
            >
              <Activity className="h-4 w-4 mr-1" />
              Heatmap
            </Button>

            {/* Integrated Menu Dropdown */}
            {isMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    snapToPosition(0);
                    window.location.href = '/';
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  data-testid="menu-dashboard"
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    snapToPosition(0);
                    window.location.href = '/admin';
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  data-testid="menu-admin"
                >
                  <Settings className="h-4 w-4" />
                  Admin Panel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conditional View Rendering */}
      {viewMode === 'stories' ? (
        /* Stories View - Full Screen */
        <div className="absolute inset-0 z-0">
          <StoriesPage />
        </div>
      ) : (
        <>
          {/* Map Container - Full Height */}
          <div className="absolute inset-0 z-0">
            <InteractiveMap 
              onPinClick={handlePinClick}
              activeCategory={activeCategory}
              selectedSubcategories={selectedSubcategories}
              locationSelectionMode={locationSelectionMode}
              selectedLocation={selectedLocation}
              onLocationSelect={setSelectedLocation}
              isHeatmapMode={viewMode === 'heatmap'}
              onHeatmapToggle={() => setViewMode(viewMode === 'heatmap' ? 'pins' : 'heatmap')}
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
        </>
      )}

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
