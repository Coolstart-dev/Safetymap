import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Database, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function ReportsPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showOriginalContent, setShowOriginalContent] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all reports (including rejected ones) for admin  
  const { data: allReports = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/admin/reports'],
    enabled: true,
    retry: 3,
    refetchOnMount: true,
  });

  const handleDeleteAllReports = async () => {
    setIsDeleting(true);
    try {
      const response = await apiRequest({
        method: 'DELETE',
        url: '/api/admin/reports',
      });

      toast({
        title: "Success",
        description: "All reports have been deleted successfully.",
      });

      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    } catch (error) {
      console.error('Error deleting reports:', error);
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
    if (report.moderationStatus === 'rejected') {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Afgewezen</Badge>;
    }
    if (report.isModerated) {
      return <Badge variant="secondary" className="gap-1"><CheckCircle className="h-3 w-3" />Gemoderated</Badge>;
    }
    return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Goedgekeurd</Badge>;
  };

  return (
    <div className="space-y-4 md:space-y-6">
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
        <CardContent className="space-y-3 md:space-y-4">
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
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                })
                .map((report: any) => (
                <div key={report.id} className="border rounded-lg p-3 md:p-4 space-y-2 md:space-y-3">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 md:gap-0">
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
                        className="gap-1 text-xs"
                      >
                        {showOriginalContent[report.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {showOriginalContent[report.id] ? 'Gemoderate versie' : 'Originele versie'}
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground gap-1 sm:gap-0">
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
    </div>
  );
}