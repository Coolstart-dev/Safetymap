import { useState, useEffect } from "react";
import { categories } from "@/lib/categories";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="glass-card h-[90vh] flex flex-col rounded-t-3xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/20">
          <h2 className="text-lg font-semibold text-gray-900 drop-shadow-sm">Filters</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="glass-subtle rounded-xl text-gray-700 hover:text-gray-900 drop-shadow-sm border border-white/30"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-4">
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
              
              <div className="space-y-3 ml-5">
                {category.subcategories.map((subcategory) => (
                  <div 
                    key={subcategory}
                    className="flex items-center space-x-3 py-2 px-3 rounded-xl glass-subtle hover:bg-white/25 transition-all duration-200 border border-white/20"
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
        <div className="border-t border-white/20 pt-4">
          <Button 
            onClick={handleApply}
            className="glass-button w-full rounded-xl text-gray-900 font-semibold drop-shadow-sm border border-white/30"
            data-testid="button-apply-filters"
          >
            Show {tempSelected.length > 0 ? `${tempSelected.length} selected` : 'all'} reports
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}