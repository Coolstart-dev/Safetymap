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
      await apiRequest({
        method: 'PUT',
        url: `/api/admin/scraped-reports/${id}/status`,
        data: { status: newStatus }
      });

      queryClient.invalidateQueries({ queryKey: ['/api/admin/scraped-reports'] });
      
      const report = reports.find(r => r.id === id);
      toast({
        title: "Status bijgewerkt",
        description: `"${report?.title}" is ${newStatus === 'approved' ? 'goedgekeurd' : 'afgewezen'}.`,
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
      
      await apiRequest({
        method: 'DELETE',
        url: `/api/admin/scraped-reports/${id}`
      });

      queryClient.invalidateQueries({ queryKey: ['/api/admin/scraped-reports'] });
      
      toast({
        title: "Report verwijderd",
        description: `"${report?.title}" is verwijderd.`,
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
      
      await apiRequest({
        method: 'POST',
        url: '/api/admin/scraping-configs',
        data: {
          postcode: newConfig.postcode,
          keywords,
          isManual: newConfig.isManual,
          isActive: true,
          scrapingFrequency: 'daily'
        }
      });

      queryClient.invalidateQueries({ queryKey: ['/api/admin/scraping-configs'] });
      setNewConfig({ postcode: '', keywords: '', isManual: true });
      
      toast({
        title: "Configuratie toegevoegd",
        description: `Scraping configuratie voor ${newConfig.postcode} toegevoegd.`,
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
      const response = await apiRequest({
        method: 'POST',
        url: '/api/admin/scrape-news',
        data: { postcode, keywords }
      });

      queryClient.invalidateQueries({ queryKey: ['/api/admin/scraped-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/scraping-configs'] });
      
      toast({
        title: "Scraping voltooid",
        description: response.message,
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
        return <Badge variant="default" className="bg-green-100 text-green-800">Goedgekeurd</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Afgewezen</Badge>;
      default:
        return <Badge variant="secondary">In afwachting</Badge>;
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
    <div className="space-y-6">
      {/* Scraping Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            News Scraping Configuratie
          </CardTitle>
          <CardDescription>
            Configureer automatische nieuws scraping per postcode en keywords
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="keywords">Keywords (komma gescheiden)</Label>
              <Input
                id="keywords"
                placeholder="diefstal, vandalisme, overlast, incident"
                value={newConfig.keywords}
                onChange={(e) => setNewConfig({ ...newConfig, keywords: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Configuratie</Label>
              <Button onClick={addScrapingConfig} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Toevoegen
              </Button>
            </div>
          </div>

          {/* Active Configurations */}
          {configsLoading ? (
            <p className="text-muted-foreground">Configuraties laden...</p>
          ) : configs.length > 0 ? (
            <div className="space-y-2">
              <h3 className="font-medium">Actieve Configuraties:</h3>
              {configs.map((config) => (
                <div key={config.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <span className="font-medium">Postcode {config.postcode}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      Keywords: {config.keywords.join(', ')}
                    </span>
                    {config.lastScrapedAt && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        Laatste scraping: {new Date(config.lastScrapedAt).toLocaleString('nl-NL')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={config.isActive ? "default" : "secondary"}>
                      {config.isActive ? "Actief" : "Inactief"}
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
              Geen configuraties gevonden. Voeg er een toe om te beginnen.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Zoeken</Label>
              <Input
                id="search"
                placeholder="Zoek op titel, locatie of bron..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="sm:w-48">
              <Label htmlFor="status-filter">Filter op status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle statussen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="pending">In afwachting</SelectItem>
                  <SelectItem value="approved">Goedgekeurd</SelectItem>
                  <SelectItem value="rejected">Afgewezen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gevonden Reports ({filteredReports.length})</span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              {filterStatus !== 'all' && `Gefilterd op: ${filterStatus}`}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <p className="text-muted-foreground text-center py-4">Scraped reports laden...</p>
          ) : filteredReports.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {reports.length === 0 
                ? "Nog geen scraped reports. Start een scraping om berichten te verzamelen."
                : "Geen reports gevonden met de huidige filters"
              }
            </p>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
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
                            {Math.round(report.confidence * 100)}% AI vertrouwen
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
                              <span>Gepubliceerd: {new Date(report.publishedAt).toLocaleString('nl-NL')}</span>
                            </div>
                          )}
                          <span>Gescraped: {new Date(report.scrapedAt).toLocaleString('nl-NL')}</span>
                        </div>
                        <div className="text-xs">
                          <strong>URL:</strong> 
                          <span className="ml-1 font-mono text-xs break-all">{report.sourceUrl}</span>
                        </div>
                      </div>

                      {report.extractedData && (
                        <div className="text-xs bg-muted/50 p-2 rounded">
                          <strong>AI Geëxtraheerde data:</strong>
                          {report.extractedData.latitude && (
                            <span className="ml-2">
                              Coördinaten: {report.extractedData.latitude.toFixed(4)}, {report.extractedData.longitude?.toFixed(4)}
                            </span>
                          )}
                          {report.extractedData.incidentType && (
                            <span className="ml-2">Type: {report.extractedData.incidentType}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(report.sourceUrl, '_blank')}
                        title="Open origineel artikel"
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
                            title="Goedkeuren als echte melding"
                          >
                            Goedkeuren
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(report.id, 'rejected')}
                            className="text-red-600 hover:text-red-700"
                            title="Afwijzen"
                          >
                            Afwijzen
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteReport(report.id)}
                        title="Report verwijderen"
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
          <CardTitle>Systeem Informatie</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>Bronnen:</strong> Simulatie van HLN, De Standaard, Het Nieuwsblad, VRT NWS, De Tijd</p>
          <p><strong>AI Model:</strong> Claude Sonnet 4 voor incident analyse en categorisering</p>
          <p><strong>Vertrouwensdrempel:</strong> Minimum 40% voor opslag, admin goedkeuring vereist</p>
          <p><strong>Copyright:</strong> Favicon en bron URL worden bewaard voor attribution</p>
          <p><strong>Duplicaten:</strong> URL controle voorkomt dubbele invoer</p>
          <p><strong>Status:</strong> Alleen goedgekeurde reports worden echte meldingen</p>
        </CardContent>
      </Card>
    </div>
  );
}