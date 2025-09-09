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
        className="glass-fab rounded-2xl w-12 h-12 text-gray-900 shadow-lg border-white/30"
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
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Items */}
          <div className="absolute top-14 left-0 glass-modal rounded-2xl min-w-48 py-2 z-50 shadow-2xl border border-white/30">
            {/* Navigation Items */}
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className="w-full flex items-center px-4 py-3 text-sm text-gray-900 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm drop-shadow-sm first:rounded-t-2xl last:rounded-b-2xl"
                data-testid={`menu-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="mr-3 text-gray-700 drop-shadow-sm">
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
            
            {/* Separator if we have both items and toggle actions */}
            {items.length > 0 && toggleActions.length > 0 && (
              <hr className="my-1 border-white/30 mx-4" />
            )}
            
            {/* Toggle Actions */}
            {toggleActions.map((action, index) => (
              <button
                key={`toggle-${index}`}
                onClick={() => {
                  action.onToggle();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all duration-200 backdrop-blur-sm drop-shadow-sm ${
                  action.isActive 
                    ? 'text-blue-800 bg-blue-100/40 border-l-2 border-blue-400' 
                    : 'text-gray-900 hover:bg-white/20'
                }`}
                data-testid={`toggle-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center">
                  <span className={`mr-3 drop-shadow-sm ${action.isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                    {action.icon}
                  </span>
                  {action.label}
                </div>
                <div className={`w-2 h-2 rounded-full shadow-sm ${action.isActive ? 'bg-blue-600 shadow-blue-300' : 'bg-gray-400 shadow-gray-200'}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}