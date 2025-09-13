import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Menu, Database, Settings, MapPin, Newspaper, Home, BookOpen, BarChart } from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  description?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'reports',
    label: 'Reports Overview',
    icon: <Database className="h-5 w-5" />,
    path: '/admin/reports',
    description: 'Beheer alle ingediende rapporten'
  },
  {
    id: 'moderation',
    label: 'AI Moderation',
    icon: <Settings className="h-5 w-5" />,
    path: '/admin/moderation',
    description: 'AI moderatie configuratie'
  },
  {
    id: 'municipality-forms',
    label: 'Municipality Forms',
    icon: <MapPin className="h-5 w-5" />,
    path: '/admin/municipality-forms',
    description: 'Gemeente formulieren beheer'
  },
  {
    id: 'news-reports',
    label: 'News Reports',
    icon: <Newspaper className="h-5 w-5" />,
    path: '/admin/news-reports',
    description: 'Nieuws scraped rapporten'
  },
  {
    id: 'best-practices',
    label: 'Best Practices',
    icon: <BookOpen className="h-5 w-5" />,
    path: '/admin/best-practices',
    description: 'Community safety richtlijnen'
  },
  {
    id: 'city-report',
    label: 'City Report',
    icon: <BarChart className="h-5 w-5" />,
    path: '/admin/city-report',
    description: 'Gemeente rapporten en statistieken'
  }
];

interface AdminNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

// Mobile Shortcuts Grid
function MobileShortcuts({ currentPath, onNavigate }: AdminNavigationProps) {
  return (
    <div className="md:hidden">
      <div className="grid grid-cols-2 gap-2 p-3 md:gap-3 md:p-4">
        {navigationItems.map((item) => (
          <Button
            key={item.id}
            variant={currentPath === item.path ? "default" : "outline"}
            className="h-16 md:h-20 flex flex-col gap-1 md:gap-2 text-center"
            onClick={() => onNavigate(item.path)}
          >
            {item.icon}
            <span className="text-xs font-medium leading-tight text-center">{item.label}</span>
          </Button>
        ))}
      </div>
      
      {/* Quick Dashboard Link */}
      <div className="px-3 pb-3 md:px-4 md:pb-4">
        <Button
          variant="ghost"
          className="w-full gap-2"
          onClick={() => window.location.href = '/'}
        >
          <Home className="h-4 w-4" />
          Terug naar Dashboard
        </Button>
      </div>
    </div>
  );
}

// Desktop Sidebar
function DesktopSidebar({ currentPath, onNavigate }: AdminNavigationProps) {
  return (
    <div className="hidden md:flex flex-col w-64 border-r min-h-screen admin-container">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
        <p className="text-sm text-muted-foreground">Area platform beheer</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <Button
            key={item.id}
            variant={currentPath === item.path ? "default" : "ghost"}
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={() => onNavigate(item.path)}
          >
            {item.icon}
            <div className="text-left">
              <div className="font-medium">{item.label}</div>
              {item.description && (
                <div className="text-xs text-muted-foreground">{item.description}</div>
              )}
            </div>
          </Button>
        ))}
      </nav>
      
      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => window.location.href = '/'}
        >
          <Home className="h-4 w-4" />
          Dashboard
        </Button>
      </div>
    </div>
  );
}

// Mobile Menu Button (hamburger)
function MobileMenuButton() {
  return (
    <div className="md:hidden fixed top-4 left-4 z-50">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="bg-background">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] sm:w-80 p-0 admin-panel">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Admin Navigatie</h2>
            <p className="text-sm text-muted-foreground">Kies een sectie</p>
          </div>
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className="w-full justify-start gap-3 h-auto py-3"
                onClick={() => window.location.href = item.path}
              >
                {item.icon}
                <div className="text-left">
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  )}
                </div>
              </Button>
            ))}
          </nav>
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.location.href = '/'}
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export { MobileShortcuts, DesktopSidebar, MobileMenuButton, navigationItems };