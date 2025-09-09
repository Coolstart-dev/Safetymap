import { useState } from "react";
import { Menu, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface ToggleAction {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onToggle: () => void;
}

interface FloatingMenuProps {
  items: MenuItem[];
  toggleActions?: ToggleAction[];
}

export default function FloatingMenu({ items, toggleActions = [] }: FloatingMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      {/* Menu Button */}
      <Button
        onClick={toggleMenu}
        size="icon"
        className="glass-button text-gray-700 rounded-xl w-12 h-12"
        data-testid="button-floating-menu"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 glass-overlay" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Items */}
          <div className="absolute top-14 left-0 glass-card rounded-xl min-w-48 py-2 z-50">
            {/* Navigation Items */}
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                data-testid={`menu-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="mr-3 text-gray-500">
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
            
            {/* Separator if we have both items and toggle actions */}
            {items.length > 0 && toggleActions.length > 0 && (
              <hr className="my-2 border-gray-200" />
            )}
            
            {/* Toggle Actions */}
            {toggleActions.map((action, index) => (
              <button
                key={`toggle-${index}`}
                onClick={() => {
                  action.onToggle();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                  action.isActive 
                    ? 'text-blue-700 bg-blue-50 hover:bg-blue-100' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                data-testid={`toggle-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center">
                  <span className={`mr-3 ${action.isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                    {action.icon}
                  </span>
                  {action.label}
                </div>
                <div className={`w-2 h-2 rounded-full ${action.isActive ? 'bg-blue-600' : 'bg-gray-300'}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}