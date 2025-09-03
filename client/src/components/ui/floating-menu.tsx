import { useState } from "react";
import { Menu, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface FloatingMenuProps {
  items: MenuItem[];
}

export default function FloatingMenu({ items }: FloatingMenuProps) {
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
        className="bg-white hover:bg-gray-50 text-gray-700 shadow-lg border border-gray-200 rounded-lg w-12 h-12"
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
            className="fixed inset-0 z-40 bg-black/20" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Items */}
          <div className="absolute top-14 left-0 bg-white rounded-lg shadow-xl border border-gray-200 min-w-48 py-2 z-50">
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
          </div>
        </>
      )}
    </div>
  );
}