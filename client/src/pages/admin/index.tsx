import React from 'react';
import { Switch, Route, useLocation } from "wouter";
import { DesktopSidebar, MobileShortcuts, MobileMenuButton } from '@/components/admin/AdminNavigation';
import ReportsPage from './reports';
import ModerationPage from './moderation';
import MunicipalityFormsPage from './municipality-forms';
import NewsReportsPage from './news-reports';

export default function AdminLayout() {
  const [location, setLocation] = useLocation();

  const handleNavigate = (path: string) => {
    setLocation(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <MobileMenuButton />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <DesktopSidebar currentPath={location} onNavigate={handleNavigate} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <div className="pt-16 pb-4 bg-background border-b">
              <h1 className="text-2xl font-bold text-center">Admin Panel</h1>
              <p className="text-muted-foreground text-center">Manage your Area platform</p>
            </div>
            <MobileShortcuts currentPath={location} onNavigate={handleNavigate} />
          </div>
          
          {/* Desktop Header */}
          <div className="hidden md:block border-b bg-background">
            <div className="p-6">
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">Manage your Area community safety platform</p>
            </div>
          </div>
          
          {/* Page Content */}
          <div className="flex-1 p-6">
            <Switch>
              <Route path="/admin" component={ReportsPage} />
              <Route path="/admin/reports" component={ReportsPage} />
              <Route path="/admin/moderation" component={ModerationPage} />
              <Route path="/admin/municipality-forms" component={MunicipalityFormsPage} />
              <Route path="/admin/news-reports" component={NewsReportsPage} />
              {/* Fallback to reports */}
              <Route component={ReportsPage} />
            </Switch>
          </div>
        </div>
      </div>
    </div>
  );
}