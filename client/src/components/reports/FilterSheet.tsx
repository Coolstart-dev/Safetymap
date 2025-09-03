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
      <SheetContent side="bottom" className="h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b">
          <h2 className="text-lg font-semibold text-foreground">Filters</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-muted-foreground"
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
                <h3 className="font-medium text-foreground">
                  {category.name}
                </h3>
              </div>
              
              <div className="space-y-3 ml-5">
                {category.subcategories.map((subcategory) => (
                  <div 
                    key={subcategory}
                    className="flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSubcategoryToggle(subcategory)}
                  >
                    <Checkbox
                      checked={tempSelected.includes(subcategory)}
                      onCheckedChange={() => handleSubcategoryToggle(subcategory)}
                      data-testid={`checkbox-${subcategory.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                    />
                    <label 
                      className="text-sm cursor-pointer flex-1"
                      onClick={(e) => e.preventDefault()}
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
        <div className="border-t pt-4 bg-background">
          <Button 
            onClick={handleApply}
            className="w-full"
            data-testid="button-apply-filters"
          >
            Show {tempSelected.length > 0 ? `${tempSelected.length} selected` : 'all'} reports
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}