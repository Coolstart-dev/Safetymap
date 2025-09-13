import { useState, useEffect } from "react";
import { categories } from "@/lib/categories";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSubcategories: string[];
  onApplyFilters: (subcategories: string[]) => void;
}

export default function FilterSheet({ 
  isOpen, 
  onClose, 
  selectedSubcategories, 
  onApplyFilters 
}: FilterSheetProps) {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedSubcategories);

  // Update temp selection when props change
  useEffect(() => {
    setTempSelected(selectedSubcategories);
  }, [selectedSubcategories]);

  // Get all subcategories across all categories
  const allSubcategories = Object.entries(categories).flatMap(([categoryKey, category]) => 
    category.subcategories.map(sub => ({
      subcategory: sub,
      categoryKey,
      categoryName: category.name,
      color: category.color
    }))
  );

  const handleSubcategoryToggle = (subcategory: string) => {
    setTempSelected(prev => 
      prev.includes(subcategory)
        ? prev.filter(s => s !== subcategory)
        : [...prev, subcategory]
    );
  };

  const handleClearAll = () => {
    setTempSelected([]);
  };

  const handleApply = () => {
    onApplyFilters(tempSelected);
    onClose();
  };

  const handleCancel = () => {
    setTempSelected(selectedSubcategories); // Reset to original
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[85vh] sm:max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Filter Reports</DialogTitle>
          <DialogDescription>
            Select the types of reports you want to see on the map and in the list.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between pb-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        </div>

        <div 
          className="flex-1 overflow-y-auto min-h-0 pb-2 pr-1" 
          data-scroll-lock-scrollable
          style={{ 
            WebkitOverflowScrolling: 'touch', 
            touchAction: 'pan-y', 
            overscrollBehavior: 'contain' 
          }}
        >
          {Object.entries(categories).map(([categoryKey, category]) => (
            <div key={categoryKey} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <h3 className="font-medium text-gray-900 drop-shadow-sm">
                  {category.name}
                </h3>
              </div>
              
              <div className="space-y-2 sm:space-y-3 ml-4 sm:ml-5">
                {category.subcategories.map((subcategory) => (
                  <div 
                    key={subcategory}
                    className="flex items-center space-x-3 py-2 px-2 sm:px-3"
                  >
                    <Checkbox
                      id={`checkbox-${subcategory.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                      checked={tempSelected.includes(subcategory)}
                      onCheckedChange={() => handleSubcategoryToggle(subcategory)}
                      data-testid={`checkbox-${subcategory.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                    />
                    <label 
                      htmlFor={`checkbox-${subcategory.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                      className="text-sm cursor-pointer flex-1 text-gray-900 drop-shadow-sm"
                    >
                      {subcategory}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="border-t pt-3 flex gap-2 mt-2">
          <Button 
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
            data-testid="button-cancel-filters"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApply}
            className="flex-1"
            data-testid="button-apply-filters"
          >
            Apply {tempSelected.length > 0 ? `(${tempSelected.length})` : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}