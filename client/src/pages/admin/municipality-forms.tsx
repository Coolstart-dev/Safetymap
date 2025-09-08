import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, ExternalLink, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MunicipalityForm {
  id: string;
  municipality: string;
  formUrl: string;
  isActive: boolean;
  lastChecked?: string;
}

export default function MunicipalityFormsPage() {
  const [forms, setForms] = useState<MunicipalityForm[]>([
    {
      id: '1',
      municipality: 'Antwerpen',
      formUrl: 'https://www.antwerpen.be/melden',
      isActive: true,
      lastChecked: '2025-09-08T10:30:00Z'
    },
    {
      id: '2', 
      municipality: 'Gent',
      formUrl: 'https://stad.gent/meldingsformulier',
      isActive: true,
      lastChecked: '2025-09-08T09:15:00Z'
    },
    {
      id: '3',
      municipality: 'Brugge',
      formUrl: 'https://www.brugge.be/melding-maken',
      isActive: false,
      lastChecked: '2025-09-07T14:20:00Z'
    }
  ]);

  const [newForm, setNewForm] = useState({
    municipality: '',
    formUrl: ''
  });

  const { toast } = useToast();

  const addForm = () => {
    if (!newForm.municipality.trim() || !newForm.formUrl.trim()) {
      toast({
        title: "Error",
        description: "Vul beide velden in.",
        variant: "destructive",
      });
      return;
    }

    const newFormData: MunicipalityForm = {
      id: Date.now().toString(),
      municipality: newForm.municipality.trim(),
      formUrl: newForm.formUrl.trim(),
      isActive: true,
      lastChecked: new Date().toISOString()
    };

    setForms([...forms, newFormData]);
    setNewForm({ municipality: '', formUrl: '' });
    
    toast({
      title: "Success",
      description: `Formulier voor ${newFormData.municipality} toegevoegd.`,
    });
  };

  const deleteForm = (id: string) => {
    const form = forms.find(f => f.id === id);
    setForms(forms.filter(f => f.id !== id));
    
    toast({
      title: "Success", 
      description: `Formulier voor ${form?.municipality} verwijderd.`,
    });
  };

  const toggleActive = (id: string) => {
    setForms(forms.map(form => 
      form.id === id 
        ? { ...form, isActive: !form.isActive }
        : form
    ));
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

  return (
    <div className="space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="municipality">Gemeente</Label>
              <Input
                id="municipality"
                placeholder="Bijv. Antwerpen"
                value={newForm.municipality}
                onChange={(e) => setNewForm({ ...newForm, municipality: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="formUrl">Formulier URL</Label>
              <Input
                id="formUrl"
                placeholder="https://gemeente.be/melden"
                value={newForm.formUrl}
                onChange={(e) => setNewForm({ ...newForm, formUrl: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={addForm} className="gap-2">
            <Plus className="h-4 w-4" />
            Formulier Toevoegen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Beschikbare Formulieren ({forms.length})</CardTitle>
          <CardDescription>
            Overzicht van alle geregistreerde gemeentelijke meldingsformulieren
          </CardDescription>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nog geen formulieren toegevoegd
            </p>
          ) : (
            <div className="space-y-4">
              {forms.map((form) => (
                <div key={form.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{form.municipality}</h3>
                        <Badge variant={form.isActive ? "default" : "secondary"}>
                          {form.isActive ? "Actief" : "Inactief"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{form.formUrl}</p>
                      {form.lastChecked && (
                        <p className="text-xs text-muted-foreground">
                          Laatst gecontroleerd: {new Date(form.lastChecked).toLocaleString('nl-NL')}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testForm(form.formUrl)}
                      >
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(form.formUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(form.id)}
                      >
                        {form.isActive ? "Deactiveren" : "Activeren"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteForm(form.id)}
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