import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Wifi, Circle, Eye, Settings, TestTube, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function ModerationPage() {
  const [contentFilterPrompt, setContentFilterPrompt] = useState<string>('');
  const [textFormalizationPrompt, setTextFormalizationPrompt] = useState<string>('');
  const [promptLoading, setPromptLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<{ isOnline: boolean; error?: string } | null>(null);
  const [isCheckingApi, setIsCheckingApi] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing moderation prompts on component mount
  const { data: promptData } = useQuery({
    queryKey: ['/api/admin/moderation-prompts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/moderation-prompts');
      return response.json();
    }
  });

  // Fetch AI logs for debugging
  const { data: aiLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['/api/admin/ai-logs'],
    queryFn: async () => {
      const response = await fetch('/api/admin/ai-logs');
      return response.json();
    },
    refetchOnMount: true
  });

  // Update prompts when query data is available
  React.useEffect(() => {
    if (promptData) {
      setContentFilterPrompt(promptData.contentFilter || '');
      setTextFormalizationPrompt(promptData.textFormalization || '');
    }
  }, [promptData]);

  // Moderation test mutation
  const testMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/moderation-test'),
    onSuccess: (data) => {
      setTestResults(data);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-logs'] });
      toast({
        title: "Test voltooid",
        description: "Moderatie pipeline test is succesvol uitgevoerd.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test gefaald",
        description: error.message || "Er is een fout opgetreden tijdens de test.",
        variant: "destructive",
      });
    }
  });

  // API Health Check
  const checkApiHealth = async () => {
    setIsCheckingApi(true);
    try {
      const response = await fetch('/api/admin/api-health');
      const healthData = await response.json();
      setApiStatus(healthData);
    } catch (error) {
      setApiStatus({ isOnline: false, error: 'Connection failed' });
    } finally {
      setIsCheckingApi(false);
    }
  };

  // Check API health only on mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  const saveModerationPrompts = async () => {
    setPromptLoading(true);
    try {
      const response = await fetch('/api/admin/moderation-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          contentFilter: contentFilterPrompt,
          textFormalization: textFormalizationPrompt 
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Moderatie instructies succesvol opgeslagen!",
        });
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Error saving moderation prompts:', error);
      toast({
        title: "Error",
        description: "Er is een fout opgetreden bij het opslaan.",
        variant: "destructive",
      });
    } finally {
      setPromptLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* AI Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            AI Service Status
          </CardTitle>
          <CardDescription>
            Status en configuratie van de AI moderatie service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/30 rounded-lg gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              {isCheckingApi ? (
                <Circle className="h-4 w-4 animate-pulse text-gray-400" />
              ) : apiStatus?.isOnline ? (
                <Circle className="h-4 w-4 fill-green-500 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 fill-orange-500 text-orange-500" />
              )}
              <div>
                <p className="font-medium text-sm">
                  {isCheckingApi ? 'Checking...' : apiStatus?.isOnline ? 'Service Online' : 'Service Offline'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Model: claude-3-haiku-20240307
                </p>
                {apiStatus?.error && !apiStatus.isOnline && (
                  <p className="text-xs text-red-500">Error: {apiStatus.error}</p>
                )}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                checkApiHealth();
                refetchLogs();
              }}
              disabled={isCheckingApi}
            >
              {isCheckingApi ? 'Checking...' : 'Refresh Status'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Type 1: Content Filtering */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-red-600" />
            Type 1: Content Filtering
          </CardTitle>
          <CardDescription>
            Configureer wat wel/niet toegestaan is - bepaalt of meldingen worden goedgekeurd of afgewezen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content-filter-prompt">Content Filter Instructies</Label>
            <Textarea
              id="content-filter-prompt"
              placeholder="Instructies voor het bepalen wat wel/niet toegestaan is..."
              value={contentFilterPrompt}
              onChange={(e) => setContentFilterPrompt(e.target.value)}
              className="min-h-[120px] md:min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Focus op criteria voor goedkeuring/afwijzing. Bijvoorbeeld: "Sta echte incidenten toe, wijs spam af"
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-medium mb-2 text-red-800">Voorbeeld Content Filter:</h3>
            <div className="text-sm text-red-700 space-y-1">
              <p><strong>✅ Toestaan:</strong> Echte veiligheidsincidenten, overlast, observaties</p>
              <p><strong>❌ Afwijzen:</strong> Test berichten, spam, persoonlijke informatie, grove taal</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Type 2: Text Formalization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Type 2: Text Formalization
          </CardTitle>
          <CardDescription>
            Configureer hoe goedgekeurde teksten worden herschreven naar formele versies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text-formalization-prompt">Text Formalization Instructies</Label>
            <Textarea
              id="text-formalization-prompt"
              placeholder="Instructies voor het herschrijven van teksten naar formele versie..."
              value={textFormalizationPrompt}
              onChange={(e) => setTextFormalizationPrompt(e.target.value)}
              className="min-h-[120px] md:min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Focus op stijl en formulering. Bijvoorbeeld: "Maak formeel, verwijder emoties, behoud feiten"
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium mb-2 text-blue-800">Voorbeeld Text Formalization:</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Input:</strong> "Mijn fiets is gejat door een of andere idioot!"</p>
              <p><strong>Output:</strong> "Fietsdiefstal gemeld door eigenaar"</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={saveModerationPrompts}
            disabled={promptLoading}
            className="w-full"
            size="lg"
          >
            {promptLoading ? 'Opslaan...' : 'Beide Moderatie Instructies Opslaan'}
          </Button>
        </CardContent>
      </Card>

      {/* AI Moderation Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            AI Moderatie Pipeline Test
          </CardTitle>
          <CardDescription>
            Test de volledige moderatie pipeline met voorgedefinieerde test cases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <p><strong>Test 1:</strong> Ongepaste content (racistische taal) - moet worden geblokkeerd</p>
              <p><strong>Test 2:</strong> Gepaste content - moet worden goedgekeurd en geformaliseerd</p>
              <p className="text-xs mt-2">⏱️ Tests worden 2 seconden na elkaar uitgevoerd om server overload te voorkomen</p>
            </div>
            
            <Button
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              data-testid="button-run-moderation-test"
              className="w-full"
              size="lg"
            >
              {testMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 animate-spin" />
                  Pipeline test wordt uitgevoerd...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <TestTube className="h-4 w-4" />
                  Run AI Moderatie Pipeline Test
                </div>
              )}
            </Button>

            {/* Test Results */}
            {testResults && (
              <div className="mt-6 space-y-4" data-testid="test-results">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2">
                    Test Resultaten
                    {testResults.summary?.allPassed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {testResults.summary?.passed || 0}/{testResults.summary?.total || 0} geslaagd | {testResults.totalDurationMs}ms
                  </span>
                </div>
                
                {/* Summary Badge */}
                <div className={`p-3 rounded-lg border ${
                  testResults.summary?.allPassed 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <p className="font-medium">
                    {testResults.summary?.allPassed ? '✅ Alle tests geslaagd!' : '❌ Sommige tests gefaald'}
                  </p>
                  <p className="text-sm opacity-80">
                    {testResults.summary?.allPassed 
                      ? 'AI moderatie pipeline functioneert correct'
                      : 'Er zijn problemen gedetecteerd in de moderatie pipeline'
                    }
                  </p>
                </div>
                
                {testResults.tests?.map((test: any, index: number) => (
                  <Card key={test.id} className="border-l-4 border-l-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            Test {index + 1}: {test.id === 'inappropriate' ? 'Ongepaste Content' : 'Gepaste Content'}
                          </span>
                          {test.passed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            test.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {test.passed ? 'PASS' : 'FAIL'}
                          </span>
                          <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                            {test.submissionResult?.status || 'ERROR'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground">Input:</p>
                          <p className="bg-muted/50 p-2 rounded text-xs">
                            "{test.testData?.title}" - "{test.testData?.description}"
                          </p>
                        </div>
                        
                        <div>
                          <p className="font-medium text-muted-foreground">Verwacht vs Resultaat:</p>
                          <div className="bg-muted/30 p-2 rounded space-y-1">
                            <p className="text-xs text-muted-foreground">
                              <strong>Verwacht:</strong> {test.expected}
                            </p>
                            <div className={test.passed ? "text-green-700" : "text-red-700"}>
                              {test.passed ? '✅' : '❌'} <strong>Resultaat:</strong> Status {test.submissionResult?.status}
                              {test.passed ? ' (Correct!)' : ' (Fout!)'}
                            </div>
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                API Response Details
                              </summary>
                              <pre className="mt-1 font-mono bg-muted/50 p-1 rounded text-xs overflow-x-auto">
                                {typeof test.submissionResult?.response === 'string' 
                                  ? test.submissionResult.response 
                                  : JSON.stringify(test.submissionResult?.response, null, 2)
                                }
                              </pre>
                            </details>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Duur: {test.submissionResult?.durationMs}ms
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Response Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            AI Response Logs
          </CardTitle>
          <CardDescription>
            Bekijk de laatste AI responses voor debugging (laatste 50 entries)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Geen AI logs beschikbaar</p>
          ) : (
            <div className="space-y-3 max-h-64 md:max-h-96 overflow-y-auto">
              {aiLogs.map((log: any, index: number) => (
                <div key={index} className="border rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        log.type === 'content-filter' ? 'bg-red-100 text-red-800' :
                        log.type === 'text-formalization' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {log.type}
                      </span>
                      {log.error && (
                        <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                          ERROR
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString('nl-NL')}
                    </span>
                  </div>
                  
                  {log.input.title && (
                    <div className="mb-2">
                      <p className="font-medium text-xs text-muted-foreground">Input:</p>
                      <p className="text-xs bg-muted/50 p-1 rounded">"{log.input.title}" - "{log.input.description}"</p>
                    </div>
                  )}
                  
                  {log.error ? (
                    <div className="mb-2">
                      <p className="font-medium text-xs text-red-600">Error:</p>
                      <p className="text-xs text-red-600 bg-red-50 p-1 rounded">{log.error}</p>
                    </div>
                  ) : (
                    <>
                      {log.parsedResult && (
                        <div className="mb-2">
                          <p className="font-medium text-xs text-muted-foreground">Parsed Result:</p>
                          <p className="text-xs bg-green-50 p-1 rounded font-mono">
                            {JSON.stringify(log.parsedResult, null, 2)}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <p className="font-medium text-xs text-muted-foreground">Raw AI Response:</p>
                        <p className="text-xs bg-muted/30 p-1 rounded font-mono max-h-20 overflow-y-auto">
                          {log.rawResponse.length > 200 
                            ? log.rawResponse.substring(0, 200) + '...'
                            : log.rawResponse
                          }
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}