import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, FileText, TrendingUp, Calendar, MapPin, Users, Download, Filter } from 'lucide-react';

export default function CityReportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">City Report</h1>
          <p className="text-muted-foreground">
            Samenvattende rapporten en statistieken voor gemeente beheer
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" data-testid="button-filter">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="card-total-reports">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Totaal Rapporten</p>
                <p className="text-2xl font-bold">1,247</p>
                <p className="text-xs text-green-600">+12% vs vorige maand</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-resolved-reports">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Opgelost</p>
                <p className="text-2xl font-bold">1,089</p>
                <p className="text-xs text-green-600">87% resolutie rate</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-active-users">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actieve Gebruikers</p>
                <p className="text-2xl font-bold">3,421</p>
                <p className="text-xs text-blue-600">+8% vs vorige maand</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-response">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gem. Reactietijd</p>
                <p className="text-2xl font-bold">2.4u</p>
                <p className="text-xs text-green-600">-0.6u vs vorige maand</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Categories */}
      <Card data-testid="card-report-categories">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Rapport Categorieën
          </CardTitle>
          <CardDescription>
            Verdeling van rapporten per categorie (laatste 30 dagen)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-medium">Gevaar & Criminaliteit</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                </div>
                <span className="text-sm text-muted-foreground w-12">35%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="font-medium">Overlast</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '28%' }}></div>
                </div>
                <span className="text-sm text-muted-foreground w-12">28%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-medium">Infrastructuur</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '22%' }}></div>
                </div>
                <span className="text-sm text-muted-foreground w-12">22%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">Status Updates</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
                <span className="text-sm text-muted-foreground w-12">15%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Geographic Distribution */}
        <Card data-testid="card-geographic-distribution">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Geografische Verdeling
            </CardTitle>
            <CardDescription>
              Rapport dichtheid per wijk
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Centrum</span>
                <Badge variant="secondary">142 rapporten</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Noord</span>
                <Badge variant="secondary">98 rapporten</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Zuid</span>
                <Badge variant="secondary">87 rapporten</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Oost</span>
                <Badge variant="secondary">76 rapporten</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">West</span>
                <Badge variant="secondary">63 rapporten</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Trends */}
        <Card data-testid="card-recent-trends">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recente Trends
            </CardTitle>
            <CardDescription>
              Opvallende ontwikkelingen deze maand
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border-l-4 border-l-green-500 rounded-r">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-700">Verbeterde Reactietijd</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  25% snellere reacties door nieuwe workflow
                </p>
              </div>

              <div className="p-3 bg-blue-50 border-l-4 border-l-blue-500 rounded-r">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-700">Meer Betrokkenheid</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  15% toename in actieve gebruikers
                </p>
              </div>

              <div className="p-3 bg-orange-50 border-l-4 border-l-orange-500 rounded-r">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-700">Hotspot Identificatie</span>
                </div>
                <p className="text-sm text-orange-600 mt-1">
                  3 nieuwe aandachtsgebieden geïdentificeerd
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary */}
      <Card data-testid="card-monthly-summary">
        <CardHeader>
          <CardTitle>Maandelijkse Samenvatting</CardTitle>
          <CardDescription>
            Uitgebreide analyse van september 2025
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Belangrijkste Verbeteringen</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• AI moderatie systeem geoptimaliseerd</li>
                <li>• Nieuwe filterfuncties toegevoegd</li>
                <li>• Mobile interface verbeterd</li>
                <li>• Notificatie systeem uitgebreid</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Gemeenschaps Feedback</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 4.6/5 sterren tevredenheid</li>
                <li>• 92% vindt platform nuttig</li>
                <li>• 78% rapporteert regelmatig</li>
                <li>• 85% beveelt platform aan</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Toekomstplannen</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Integratie met gemeente systemen</li>
                <li>• Uitbreiding naar buursteden</li>
                <li>• Predictive analytics toevoegen</li>
                <li>• Automatische follow-ups</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}