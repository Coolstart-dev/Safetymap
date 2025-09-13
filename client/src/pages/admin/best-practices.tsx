import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Save, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function BestPracticesPage() {
  const [content, setContent] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current notes
  const { data: note, isLoading } = useQuery({
    queryKey: ['/api/admin/notes/best_practices'],
    onSuccess: (data) => {
      setContent(data.content || '');
    }
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (newContent: string) => {
      return apiRequest({
        method: 'POST',
        url: '/api/admin/notes/best_practices',
        data: { content: newContent }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notes/best_practices'] });
      toast({
        title: "Opgeslagen",
        description: "Best practices notities zijn bijgewerkt",
      });
    },
    onError: (error) => {
      console.error('Error saving notes:', error);
      toast({
        title: "Fout",
        description: "Kon notities niet opslaan",
        variant: "destructive",
      });
    }
  });

  // Update content when note data is loaded
  React.useEffect(() => {
    if (note && note.content !== undefined) {
      setContent(note.content);
    }
  }, [note]);

  const handleSave = () => {
    saveMutation.mutate(content);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Best Practices</h1>
        <p className="text-muted-foreground">
          Ontwikkelnotities en belangrijke zaken om te onthouden tijdens de bouw
        </p>
      </div>

      <Card data-testid="card-best-practices-editor">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Development Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Laden...</span>
            </div>
          ) : (
            <>
              <Textarea
                data-testid="textarea-best-practices-notes"
                placeholder="Voeg hier belangrijke ontwikkelnotities toe...

Bijvoorbeeld:
- Report modal scroll fix: gebruik overflow-y-auto op de content container
- Form validatie: altijd Zod schemas gebruiken voor consistentie
- AI formalisatie: controleer keyword overlap om hallucination te voorkomen

Voeg hier nieuwe notities toe terwijl we het platform bouwen..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[400px] resize-none font-mono text-sm"
              />
              
              <div className="flex justify-end">
                <Button 
                  data-testid="button-save-notes"
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Opslaan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Opslaan
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}