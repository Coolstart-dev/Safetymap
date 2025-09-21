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
  onMenuOpen?: () => void;
}

export default function FloatingMenu({ items, toggleActions = [], onMenuOpen }: FloatingMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    const newOpenState = !isOpen;
    setIsOpen(newOpenState);
    
    // Call onMenuOpen when menu is being opened
    if (newOpenState && onMenuOpen) {
      onMenuOpen();
    }
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      {/* Menu Button */}
      <Button
        onClick={toggleMenu}
        size="icon"
        className="bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-full w-11 h-11 shadow-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all"
        data-testid="button-floating-menu"
      >
        {isOpen ? (
          <X className="h-4 w-4" />
        ) : (
          <Menu className="h-4 w-4" />
        )}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/30" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Items */}
          <div className="absolute top-14 left-0 bg-background border border-border rounded-2xl min-w-48 py-2 z-50 shadow-lg">
            {/* Navigation Items */}
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className="w-full flex items-center px-4 py-3 text-sm text-foreground hover:bg-muted/50 transition-all duration-200 first:rounded-t-2xl last:rounded-b-2xl"
                data-testid={`menu-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="mr-3 text-muted-foreground">
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
            
            {/* Separator if we have both items and toggle actions */}
            {items.length > 0 && toggleActions.length > 0 && (
              <hr className="my-1 border-border mx-4" />
            )}
            
            {/* Toggle Actions */}
            {toggleActions.map((action, index) => (
              <button
                key={`toggle-${index}`}
                onClick={() => {
                  action.onToggle();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all duration-200 ${
                  action.isActive 
                    ? 'text-primary bg-primary/10 border-l-2 border-primary' 
                    : 'text-foreground hover:bg-muted/50'
                }`}
                data-testid={`toggle-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center">
                  <span className={`mr-3 ${action.isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {action.icon}
                  </span>
                  {action.label}
                </div>
                <div className={`w-2 h-2 rounded-full ${action.isActive ? 'bg-primary' : 'bg-muted'}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}