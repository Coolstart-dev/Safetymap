import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Database, Eye, EyeOff, AlertTriangle, CheckCircle, Settings, Home, Circle, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import FloatingMenu from "@/components/ui/floating-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AdminPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showOriginalContent, setShowOriginalContent] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [contentFilterPrompt, setContentFilterPrompt] = useState<string>('');
  const [textFormalizationPrompt, setTextFormalizationPrompt] = useState<string>('');
  const [promptLoading, setPromptLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<{ isOnline: boolean; error?: string } | null>(null);
  const [isCheckingApi, setIsCheckingApi] = useState(false);

  const menuItems = [
    {
      label: "Dashboard",
      icon: <Home className="h-4 w-4" />,
      onClick: () => window.location.href = '/'
    },
    {
      label: "Admin Panel",
      icon: <Settings className="h-4 w-4" />,
      onClick: () => window.location.href = '/admin'
    }
  ];

  // Fetch all reports (including rejected ones) for admin  
  const { data: allReports = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/admin/reports'],
    enabled: true,
    retry: 3,
    refetchOnMount: true,
  });

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

  const fetchModerationPrompts = async () => {
    try {
      const response = await fetch('/api/admin/moderation-prompts');
      const data = await response.json();
      setContentFilterPrompt(data.contentFilter || '');
      setTextFormalizationPrompt(data.textFormalization || '');
    } catch (error) {
      console.error('Error fetching moderation prompts:', error);
    }
  };

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

  const handleDeleteAllReports = async () => {
    try {
      setIsDeleting(true);

      const response = await fetch('/api/admin/reports', {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: "All reports have been deleted successfully",
        });

        // Invalidate all report queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
      } else {
        throw new Error('Failed to delete reports');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete reports. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleOriginalContent = (reportId: string) => {
    setShowOriginalContent(prev => ({
      ...prev,
      [reportId]: !prev[reportId]
    }));
  };

  const getStatusBadge = (report: any) => {
    if (!report.isPublic) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Afgewezen</Badge>;
    }
    if (report.isModerated) {
      return <Badge variant="secondary" className="gap-1"><CheckCircle className="h-3 w-3" />Gemoderated</Badge>;
    }
    return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Goedgekeurd</Badge>;
  };

  const fetchReports = async () => {
    // This function is not used but kept for potential future use or context.
    // The actual data fetching is handled by useQuery above.
  };

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      {/* Floating Menu */}
      <FloatingMenu items={menuItems} />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">Manage your Area community safety platform</p>
        
      </div>

      <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reports">Reports Overview</TabsTrigger>
            <TabsTrigger value="moderation">AI Moderation</TabsTrigger>
            <TabsTrigger value="database">Database Management</TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Management
                </CardTitle>
                <CardDescription>
                  Reset and clean up your database for testing purposes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Delete All Reports</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will permanently delete all incident reports from the database. 
                    This action cannot be undone and is useful for testing with fresh data.
                  </p>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        className="gap-2"
                        data-testid="button-delete-all"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete All Reports
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete all 
                          incident reports and associated data from the database.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid="button-cancel">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAllReports}
                          disabled={isDeleting}
                          data-testid="button-confirm-delete"
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? "Deleting..." : "Yes, delete all reports"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>For Testing:</strong> Use "Delete All Reports" to start fresh with new test data</p>
                <p><strong>Database:</strong> All data is now stored persistently in PostgreSQL</p>
                <p><strong>Deployment:</strong> Data will persist across deployments and restarts</p>
              </CardContent>
            </Card>

            {/* All Reports Overview for Admin */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Alle Rapporten (Inclusief Afgewezen)
                </CardTitle>
                <CardDescription>
                  Overzicht van alle ingediende rapporten met moderatie status en originele content
                </CardDescription>
              </CardHeader>
              <CardContent>

                {isLoading ? (
                  <p className="text-muted-foreground">Laden...</p>
                ) : error ? (
                  <div>
                    <p className="text-red-500">Error: {String(error)}</p>
                  </div>
                ) : allReports.length === 0 ? (
                  <p className="text-muted-foreground">Geen rapporten gevonden</p>
                ) : (
                  <div className="space-y-4">
                    {allReports
                      .sort((a: any, b: any) => {
                        // Sort by createdAt date, newest first
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                      })
                      .map((report: any) => (
                      <div key={report.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm">
                                {showOriginalContent[report.id] ? report.originalTitle || report.title : report.title}
                              </h3>
                              {getStatusBadge(report)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {showOriginalContent[report.id] ? report.originalDescription || report.description : report.description}
                            </p>
                          </div>
                          {(report.originalTitle || report.originalDescription) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleOriginalContent(report.id)}
                              className="gap-1"
                            >
                              {showOriginalContent[report.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              {showOriginalContent[report.id] ? 'Gemoderate versie' : 'Originele versie'}
                            </Button>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium">{report.category}</span>
                            {report.subcategory && ` • ${report.subcategory}`}
                          </div>
                          <div>
                            {report.incidentDateTime && format(new Date(report.incidentDateTime), 'dd/MM/yyyy HH:mm')}
                          </div>
                        </div>

                        {report.moderationReason && (
                          <div className="bg-muted/50 rounded p-2">
                            <p className="text-xs font-medium text-muted-foreground">Moderatie reden:</p>
                            <p className="text-xs text-muted-foreground">{report.moderationReason}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation">
            <div className="space-y-6">
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
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
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
                      className="min-h-[200px]"
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
                      className="min-h-[200px]"
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
                    <div className="space-y-3 max-h-96 overflow-y-auto">
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
          </TabsContent>

          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Management
                </CardTitle>
                <CardDescription>
                  Reset and clean up your database for testing purposes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Delete All Reports</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will permanently delete all incident reports from the database. 
                    This action cannot be undone and is useful for testing with fresh data.
                  </p>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        className="gap-2"
                        data-testid="button-delete-all"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete All Reports
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete all 
                          incident reports and associated data from the database.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid="button-cancel">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAllReports}
                          disabled={isDeleting}
                          data-testid="button-confirm-delete"
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? "Deleting..." : "Yes, delete all reports"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>For Testing:</strong> Use "Delete All Reports" to start fresh with new test data</p>
                <p><strong>Database:</strong> All data is now stored persistently in PostgreSQL</p>
                <p><strong>Deployment:</strong> Data will persist across deployments and restarts</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}