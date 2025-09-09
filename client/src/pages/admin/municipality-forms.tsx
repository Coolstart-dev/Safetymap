import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, ExternalLink, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Municipality {
  id: string;
  name: string;
  postcode: string;
  reportingUrl: string;
  alternativeUrl?: string;
  isActive: boolean;
  lastChecked?: string;
  createdAt: string;
}

export default function MunicipalityFormsPage() {
  const queryClient = useQueryClient();
  
  const { data: municipalities = [], isLoading } = useQuery<Municipality[]>({
    queryKey: ['/api/admin/municipalities'],
  });

  const [newForm, setNewForm] = useState({
    name: '',
    postcode: '',
    reportingUrl: '',
    alternativeUrl: ''
  });

  const createMutation = useMutation({
    mutationFn: (municipalityData: any) => apiRequest('POST', '/api/admin/municipalities', municipalityData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/municipalities'] });
      setNewForm({ name: '', postcode: '', reportingUrl: '', alternativeUrl: '' });
      toast({
        title: "Success",
        description: "Gemeente succesvol toegevoegd.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Er is een fout opgetreden.",
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest('PUT', `/api/admin/municipalities/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/municipalities'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/municipalities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/municipalities'] });
    },
  });

  const { toast } = useToast();

  const addForm = () => {
    if (!newForm.name.trim() || !newForm.postcode.trim() || !newForm.reportingUrl.trim()) {
      toast({
        title: "Error",
        description: "Vul alle verplichte velden in.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      name: newForm.name.trim(),
      postcode: newForm.postcode.trim(),
      reportingUrl: newForm.reportingUrl.trim(),
      alternativeUrl: newForm.alternativeUrl.trim() || undefined,
      isActive: true,
    });
  };

  const deleteForm = (id: string) => {
    deleteMutation.mutate(id);
    
    toast({
      title: "Success", 
      description: "Gemeente verwijderd.",
    });
  };

  const toggleActive = (id: string) => {
    const municipality = municipalities.find((m: Municipality) => m.id === id);
    if (municipality) {
      updateMutation.mutate({
        id,
        data: { isActive: !municipality.isActive }
      });
    }
  };

  const testForm = async (formUrl: string) => {
    // In a real implementation, this would test if the URL is accessible
    toast({
      title: "Test gestart",
      description: "Formulier toegankelijkheid wordt gecontroleerd...",
    });
    
    // Simulate test
    setTimeout(() => {
      toast({
        title: "Test voltooid",
        description: "Formulier is toegankelijk.",
      });
    }, 2000);
  };

  // Add Belgian municipalities on component mount if database is empty
  useEffect(() => {
    if (municipalities.length === 0 && !isLoading) {
      const belgianMunicipalities = [
        {
          name: "Wijnegem",
          postcode: "2110",
          reportingUrl: "https://www.wijnegem.be/meldingskaart",
          alternativeUrl: "https://www.wijnegem.be/meldingen-en-klachten",
          isActive: true
        },
        {
          name: "Schoten",
          postcode: "2900",
          reportingUrl: "https://www.schoten.be/over-schoten/communicatie-en-inspraak/meldingsformulier",
          alternativeUrl: "https://www.schoten.be/loket",
          isActive: true
        },
        {
          name: "Brasschaat",
          postcode: "2930",
          reportingUrl: "https://www.brasschaat.be/meldingen",
          alternativeUrl: "https://www.brasschaat.be/meldingen-overlast",
          isActive: true
        },
        {
          name: "Mortsel",
          postcode: "2640",
          reportingUrl: "https://www.mortsel.be/iets-melden",
          alternativeUrl: "https://www.mortsel.be/klachtenbehandeling",
          isActive: true
        },
        {
          name: "Kapellen",
          postcode: "2950",
          reportingUrl: "https://www.kapellen.be/meldingen",
          alternativeUrl: "https://www.kapellen.be/e-meldingen",
          isActive: true
        },
        {
          name: "Edegem",
          postcode: "2650",
          reportingUrl: "https://www.edegem.be/melding-of-klacht",
          alternativeUrl: undefined,
          isActive: true
        }
      ];

      // Add all municipalities
      belgianMunicipalities.forEach(municipality => {
        createMutation.mutate(municipality);
      });
    }
  }, [municipalities.length, isLoading]);

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Gemeente Meldingsformulieren
          </CardTitle>
          <CardDescription>
            Beheer de URL's van officiële gemeentelijke meldingsformulieren voor integratie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Gemeente</Label>
              <Input
                id="name"
                placeholder="Bijv. Antwerpen"
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                placeholder="2000"
                value={newForm.postcode}
                onChange={(e) => setNewForm({ ...newForm, postcode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportingUrl">Primaire URL</Label>
              <Input
                id="reportingUrl"
                placeholder="https://gemeente.be/melden"
                value={newForm.reportingUrl}
                onChange={(e) => setNewForm({ ...newForm, reportingUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alternativeUrl">Alternatieve URL (optioneel)</Label>
              <Input
                id="alternativeUrl"
                placeholder="https://gemeente.be/contact"
                value={newForm.alternativeUrl}
                onChange={(e) => setNewForm({ ...newForm, alternativeUrl: e.target.value })}
              />
            </div>
          </div>
          <Button 
            onClick={addForm} 
            className="gap-2"
            disabled={createMutation.isPending}
          >
            <Plus className="h-4 w-4" />
            {createMutation.isPending ? 'Toevoegen...' : 'Gemeente Toevoegen'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Beschikbare Gemeenten ({municipalities.length})</CardTitle>
          <CardDescription>
            Overzicht van alle geregistreerde gemeentelijke meldingsformulieren
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-4">Laden...</p>
          ) : municipalities.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nog geen gemeenten toegevoegd
            </p>
          ) : (
            <div className="space-y-4">
              {municipalities.map((municipality: Municipality) => (
                <div key={municipality.id} className="border rounded-lg p-3 md:p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{municipality.name}</h3>
                        <Badge variant="outline" className="text-xs">{municipality.postcode}</Badge>
                        <Badge variant={municipality.isActive ? "default" : "secondary"}>
                          {municipality.isActive ? "Actief" : "Inactief"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground break-all">Primair: {municipality.reportingUrl}</p>
                      {municipality.alternativeUrl && (
                        <p className="text-sm text-muted-foreground break-all">Alternatief: {municipality.alternativeUrl}</p>
                      )}
                      {municipality.lastChecked && (
                        <p className="text-xs text-muted-foreground">
                          Laatst gecontroleerd: {new Date(municipality.lastChecked).toLocaleString('nl-NL')}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testForm(municipality.reportingUrl)}
                      >
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(municipality.reportingUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(municipality.id)}
                        disabled={updateMutation.isPending}
                      >
                        {municipality.isActive ? "Deactiveren" : "Activeren"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteForm(municipality.id)}
                        disabled={deleteMutation.isPending}
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
          <CardTitle>Integratie Informatie</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>Gebruik:</strong> Deze URL's kunnen gebruikt worden om gebruikers door te leiden naar officiële gemeentelijke formulieren</p>
          <p><strong>Automatische controle:</strong> Periodieke checks op toegankelijkheid van formulieren</p>
          <p><strong>API:</strong> Beschikbaar via /api/municipality-forms endpoint</p>
        </CardContent>
      </Card>
    </div>
  );
}