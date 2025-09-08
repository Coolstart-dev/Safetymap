import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, ExternalLink, RefreshCw, Newspaper, Calendar, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NewsReport {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
  confidence: number;
  extractedData?: {
    latitude?: number;
    longitude?: number;
    incidentType?: string;
  };
}

export default function NewsReportsPage() {
  const [reports, setReports] = useState<NewsReport[]>([
    {
      id: '1',
      title: 'Fietsendiefstal in centrum van Antwerpen',
      source: 'Het Laatste Nieuws',
      url: 'https://hln.be/antwerpen/fietsendiefstal-centrum',
      publishedAt: '2025-09-08T10:30:00Z',
      category: 'theft',
      location: 'Antwerpen',
      status: 'pending',
      confidence: 0.85,
      extractedData: {
        latitude: 51.2194,
        longitude: 4.4025,
        incidentType: 'bicycle-theft'
      }
    },
    {
      id: '2',
      title: 'Vandalisme aan bushokje Gent Sint-Pieters',
      source: 'De Standaard',
      url: 'https://standaard.be/gent/vandalisme-bushokje',
      publishedAt: '2025-09-08T09:15:00Z',
      category: 'degradation',
      location: 'Gent',
      status: 'approved',
      confidence: 0.92
    },
    {
      id: '3',
      title: 'Voetbalwedstrijd in Brugge centrum',
      source: 'Nieuwsblad',
      url: 'https://nieuwsblad.be/brugge/voetbal',
      publishedAt: '2025-09-08T08:45:00Z',
      category: 'event',
      location: 'Brugge',
      status: 'rejected',
      confidence: 0.45
    }
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const updateStatus = (id: string, newStatus: 'approved' | 'rejected') => {
    setReports(reports.map(report => 
      report.id === id 
        ? { ...report, status: newStatus }
        : report
    ));

    const report = reports.find(r => r.id === id);
    toast({
      title: "Status bijgewerkt",
      description: `"${report?.title}" is ${newStatus === 'approved' ? 'goedgekeurd' : 'afgewezen'}.`,
    });
  };

  const deleteReport = (id: string) => {
    const report = reports.find(r => r.id === id);
    setReports(reports.filter(r => r.id !== id));
    
    toast({
      title: "Report verwijderd",
      description: `"${report?.title}" is verwijderd.`,
    });
  };

  const refreshScraping = () => {
    toast({
      title: "Scraping gestart",
      description: "Nieuwe nieuws artikelen worden opgehaald...",
    });

    // Simulate adding new reports
    setTimeout(() => {
      toast({
        title: "Scraping voltooid",
        description: "2 nieuwe reports gevonden en toegevoegd.",
      });
    }, 3000);
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
                         report.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.source.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            News Scraped Reports
          </CardTitle>
          <CardDescription>
            Beheer van automatisch verzamelde incident reports uit nieuwsbronnen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <div className="sm:w-auto flex items-end">
              <Button onClick={refreshScraping} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Nieuwe Scraping
              </Button>
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
          {filteredReports.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Geen reports gevonden met de huidige filters
            </p>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-sm">{report.title}</h3>
                        {getStatusBadge(report.status)}
                        <span className={`text-xs font-medium ${getConfidenceColor(report.confidence)}`}>
                          {Math.round(report.confidence * 100)}% vertrouwen
                        </span>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-4">
                          <span><strong>Bron:</strong> {report.source}</span>
                          <span><strong>Locatie:</strong> {report.location}</span>
                          <span><strong>Categorie:</strong> {report.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(report.publishedAt).toLocaleString('nl-NL')}</span>
                        </div>
                      </div>

                      {report.extractedData && (
                        <div className="text-xs bg-muted/50 p-2 rounded">
                          <strong>Geëxtraheerde data:</strong>
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
                        onClick={() => window.open(report.url, '_blank')}
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
                          >
                            Goedkeuren
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(report.id, 'rejected')}
                            className="text-red-600 hover:text-red-700"
                          >
                            Afwijzen
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteReport(report.id)}
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
          <CardTitle>Scraping Instellingen</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>Bronnen:</strong> HLN, De Standaard, Het Nieuwsblad, VRT NWS</p>
          <p><strong>Frequentie:</strong> Elke 30 minuten</p>
          <p><strong>AI Vertrouwen:</strong> Minimum 60% voor automatische goedkeuring</p>
          <p><strong>Laatste update:</strong> {new Date().toLocaleString('nl-NL')}</p>
        </CardContent>
      </Card>
    </div>
  );
}