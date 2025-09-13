import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Users, Shield, MessageSquare, TrendingUp } from 'lucide-react';

export default function BestPracticesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Best Practices</h1>
        <p className="text-muted-foreground">
          Richtlijnen en aanbevelingen voor effectief community safety management
        </p>
      </div>

      {/* Community Engagement */}
      <Card data-testid="card-community-engagement">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Community Betrokkenheid
          </CardTitle>
          <CardDescription>
            Strategieën om actieve deelname van bewoners te stimuleren
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium">Regelmatige communicatie</span>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              Houd bewoners op de hoogte van acties en resultaten via nieuwsbrieven en sociale media.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium">Feedback loops</span>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              Implementeer systemen voor bewoners om feedback te geven op genomen maatregelen.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium">Lokale leiders betrekken</span>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              Werk samen met lokale organisaties en wijkvertegenwoordigers.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Content Moderation */}
      <Card data-testid="card-content-moderation">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            Content Moderatie
          </CardTitle>
          <CardDescription>
            Best practices voor het beheren van gebruikersinhoud
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Aanvaardbaar
              </Badge>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Verdachte activiteiten melden</li>
                <li>• Veiligheidsproblemen rapporteren</li>
                <li>• Infrastructuur issues</li>
                <li>• Positieve waarnemingen delen</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                Niet toegestaan
              </Badge>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Discriminerende taal</li>
                <li>• Persoonlijke informatie</li>
                <li>• Spam of reclame</li>
                <li>• Ongegronde beschuldigingen</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Response Protocols */}
      <Card data-testid="card-response-protocols">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Reactie Protocollen
          </CardTitle>
          <CardDescription>
            Richtlijnen voor het reageren op verschillende soorten rapporten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="border-l-4 border-l-red-500 pl-4">
              <h4 className="font-medium text-red-700">Urgente Situaties</h4>
              <p className="text-sm text-muted-foreground">
                Binnen 30 minuten reageren. Directe doorverwijzing naar autoriteiten indien nodig.
              </p>
            </div>
            
            <div className="border-l-4 border-l-yellow-500 pl-4">
              <h4 className="font-medium text-yellow-700">Gewone Rapporten</h4>
              <p className="text-sm text-muted-foreground">
                Binnen 24 uur bevestigen en binnen 7 dagen follow-up geven.
              </p>
            </div>
            
            <div className="border-l-4 border-l-blue-500 pl-4">
              <h4 className="font-medium text-blue-700">Status Updates</h4>
              <p className="text-sm text-muted-foreground">
                Wekelijks reviewen en indien relevant delen met community.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card data-testid="card-performance-metrics">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Performance Indicatoren
          </CardTitle>
          <CardDescription>
            Key metrics om het succes van het platform te meten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">85%+</div>
              <div className="text-sm text-muted-foreground">Rapporten beantwoord binnen 24u</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">90%+</div>
              <div className="text-sm text-muted-foreground">Community tevredenheid</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">70%+</div>
              <div className="text-sm text-muted-foreground">Actieve gebruikers per maand</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communication Guidelines */}
      <Card data-testid="card-communication-guidelines">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-teal-600" />
            Communicatie Richtlijnen
          </CardTitle>
          <CardDescription>
            Best practices voor communicatie met de community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Transparantie</h4>
                <p className="text-sm text-muted-foreground">
                  Deel wat er gedaan wordt met rapporten, ook als er geen directe actie mogelijk is.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Empathie</h4>
                <p className="text-sm text-muted-foreground">
                  Erken zorgen van bewoners en toon begrip voor hun situatie.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Proactieve updates</h4>
                <p className="text-sm text-muted-foreground">
                  Informeer de community over trends, verbeteringen en nieuwe initiatieven.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}