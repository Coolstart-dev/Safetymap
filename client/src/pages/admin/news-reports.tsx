import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, ExternalLink, RefreshCw, Newspaper, Calendar, Filter, Plus, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ScrapedReport {
  id: string;
  title: string;
  description?: string;
  sourceUrl: string;
  sourceName: string;
  sourceFavicon?: string;
  publishedAt?: string;
  scrapedAt: string;
  postcode?: string;
  location?: string;
  category?: string;
  confidence?: number;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  aiAnalysis?: any;
  extractedData?: {
    latitude?: number;
    longitude?: number;
    incidentType?: string;
  };
}

interface ScrapingConfig {
  id: string;
  postcode: string;
  keywords: string[];
  isActive: boolean;
  isManual: boolean;
  lastScrapedAt?: string;
  scrapingFrequency: string;
}

export default function NewsReportsPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newConfig, setNewConfig] = useState({
    postcode: '2900',
    keywords: 'diefstal, vandalisme, overlast, incident',
    isManual: true
  });
  const [isScrapingLoading, setIsScrapingLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch scraped reports
  const { data: reports = [], isLoading: reportsLoading } = useQuery<ScrapedReport[]>({
    queryKey: ['/api/admin/scraped-reports'],
    queryFn: async () => {
      const response = await fetch('/api/admin/scraped-reports');
      if (!response.ok) throw new Error('Failed to fetch scraped reports');
      return response.json();
    }
  });

  // Fetch scraping configurations
  const { data: configs = [], isLoading: configsLoading } = useQuery<ScrapingConfig[]>({
    queryKey: ['/api/admin/scraping-configs'],
    queryFn: async () => {
      const response = await fetch('/api/admin/scraping-configs');
      if (!response.ok) throw new Error('Failed to fetch scraping configs');
      return response.json();
    }
  });

  const updateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      await apiRequest('PUT', `/api/admin/scraped-reports/${id}/status`, { status: newStatus });

      queryClient.invalidateQueries({ queryKey: ['/api/admin/scraped-reports'] });
      
      const report = reports.find(r => r.id === id);
      toast({
        title: "Status updated",
        description: `"${report?.title}" has been ${newStatus === 'approved' ? 'approved' : 'rejected'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive"
      });
    }
  };

  const deleteReport = async (id: string) => {
    try {
      const report = reports.find(r => r.id === id);
      
      await apiRequest('DELETE', `/api/admin/scraped-reports/${id}`);

      queryClient.invalidateQueries({ queryKey: ['/api/admin/scraped-reports'] });
      
      toast({
        title: "Report deleted",
        description: `"${report?.title}" has been deleted.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive"
      });
    }
  };

  const addScrapingConfig = async () => {
    try {
      const keywords = newConfig.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      
      await apiRequest('POST', '/api/admin/scraping-configs', {
        postcode: newConfig.postcode,
        keywords,
        isManual: newConfig.isManual,
        isActive: true,
        scrapingFrequency: 'daily'
      });

      queryClient.invalidateQueries({ queryKey: ['/api/admin/scraping-configs'] });
      setNewConfig({ postcode: '', keywords: '', isManual: true });
      
      toast({
        title: "Configuration added",
        description: `Scraping configuration for ${newConfig.postcode} added successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add scraping configuration",
        variant: "destructive"
      });
    }
  };

  const triggerManualScraping = async (postcode: string, keywords: string[]) => {
    setIsScrapingLoading(true);
    try {
      const response = await apiRequest('POST', '/api/admin/scrape-news', { postcode, keywords });
      const result = await response.json();

      queryClient.invalidateQueries({ queryKey: ['/api/admin/scraped-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/scraping-configs'] });
      
      toast({
        title: "Scraping completed",
        description: result.message || 'Scraping completed successfully',
      });
    } catch (error) {
      toast({
        title: "Scraping error",
        description: "Failed to scrape news. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsScrapingLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredReports = reports.filter(report => {
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (report.location?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         report.sourceName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Scraping Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            News Test Scraping Configuration
          </CardTitle>
          <CardDescription>
            Configure automated news scraping by postcode and keywords (Phase 1 testing interface)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                placeholder="2900"
                value={newConfig.postcode}
                onChange={(e) => setNewConfig({ ...newConfig, postcode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords (comma separated)</Label>
              <Input
                id="keywords"
                placeholder="theft, vandalism, incident, crime"
                value={newConfig.keywords}
                onChange={(e) => setNewConfig({ ...newConfig, keywords: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Add Configuration</Label>
              <Button onClick={addScrapingConfig} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Add Configuration
              </Button>
            </div>
          </div>

          {/* Active Configurations */}
          {configsLoading ? (
            <p className="text-muted-foreground">Loading configurations...</p>
          ) : configs.length > 0 ? (
            <div className="space-y-2">
              <h3 className="font-medium">Active Configurations:</h3>
              {configs.map((config) => (
                <div key={config.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/30 rounded-lg gap-3 sm:gap-0">
                  <div>
                    <span className="font-medium">Postcode {config.postcode}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      Keywords: {config.keywords.join(', ')}
                    </span>
                    {config.lastScrapedAt && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        Last scraped: {new Date(config.lastScrapedAt).toLocaleString('en-US')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={config.isActive ? "default" : "secondary"}>
                      {config.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => triggerManualScraping(config.postcode, config.keywords)}
                      disabled={isScrapingLoading}
                      className="gap-1"
                    >
                      <RefreshCw className={`h-3 w-3 ${isScrapingLoading ? 'animate-spin' : ''}`} />
                      {isScrapingLoading ? 'Scraping...' : 'Start Scraping'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No configurations found. Add one to get started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by title, location or source..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="sm:w-48">
              <Label htmlFor="status-filter">Filter by status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Scraped Reports ({filteredReports.length})</span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              {filterStatus !== 'all' && `Filtered by: ${filterStatus}`}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <p className="text-muted-foreground text-center py-4">Loading scraped reports...</p>
          ) : filteredReports.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {reports.length === 0 
                ? "No scraped reports yet. Start a scraping session to collect news articles."
                : "No reports found with current filters"
              }
            </p>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {filteredReports.map((report) => (
                <div key={report.id} className="border rounded-lg p-3 md:p-4 space-y-2 md:space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 lg:gap-0">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Favicon and Source */}
                        <div className="flex items-center gap-2">
                          {report.sourceFavicon && (
                            <img 
                              src={report.sourceFavicon} 
                              alt="" 
                              className="w-4 h-4 flex-shrink-0"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          )}
                          <span className="text-xs font-medium text-muted-foreground">
                            {report.sourceName}
                          </span>
                        </div>
                        {getStatusBadge(report.status)}
                        {report.confidence && (
                          <span className={`text-xs font-medium ${getConfidenceColor(report.confidence)}`}>
                            {Math.round(report.confidence * 100)}% AI confidence
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-medium text-sm">{report.title}</h3>
                      
                      {report.description && (
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      )}
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-4 flex-wrap">
                          {report.postcode && (
                            <span><strong>Postcode:</strong> {report.postcode}</span>
                          )}
                          {report.location && (
                            <span><strong>Locatie:</strong> {report.location}</span>
                          )}
                          {report.category && (
                            <span><strong>Categorie:</strong> {report.category}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          {report.publishedAt && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Published: {new Date(report.publishedAt).toLocaleString('en-US')}</span>
                            </div>
                          )}
                          <span>Scraped: {new Date(report.scrapedAt).toLocaleString('en-US')}</span>
                        </div>
                        <div className="text-xs">
                          <strong>URL:</strong> 
                          <span className="ml-1 font-mono text-xs break-all">{report.sourceUrl}</span>
                        </div>
                      </div>

                      {report.extractedData && (
                        <div className="text-xs bg-muted/50 p-2 rounded">
                          <strong>AI Extracted data:</strong>
                          {report.extractedData.latitude && (
                            <span className="ml-2">
                              Coordinates: {report.extractedData.latitude.toFixed(4)}, {report.extractedData.longitude?.toFixed(4)}
                            </span>
                          )}
                          {report.extractedData.incidentType && (
                            <span className="ml-2">Type: {report.extractedData.incidentType}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2 lg:mt-0 lg:ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(report.sourceUrl, '_blank')}
                        title="Open original article"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      
                      {report.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(report.id, 'approved')}
                            className="text-green-600 hover:text-green-700"
                            title="Approve as genuine report"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(report.id, 'rejected')}
                            className="text-red-600 hover:text-red-700"
                            title="Reject this report"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteReport(report.id)}
                        title="Delete report"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>Sources:</strong> Simulation of HLN, De Standaard, Het Nieuwsblad, VRT NWS, De Tijd</p>
          <p><strong>AI Model:</strong> Claude Sonnet 4 for incident analysis and categorization</p>
          <p><strong>Confidence threshold:</strong> Minimum 40% for storage, admin approval required</p>
          <p><strong>Copyright:</strong> Favicon and source URL preserved for attribution</p>
          <p><strong>Duplicates:</strong> URL check prevents duplicate entries</p>
          <p><strong>Status:</strong> Only approved reports become actual incident reports</p>
        </CardContent>
      </Card>
    </div>
  );
}