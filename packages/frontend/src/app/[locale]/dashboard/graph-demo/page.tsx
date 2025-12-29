'use client';

import React, { useState } from 'react';
import { RelationshipGraph } from '@/components/graph';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  CubeIcon,
  UserIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const demoEntities = [
  {
    id: 'c6de3899-fbf2-48a7-a62c-45e26d6a8905',
    type: 'company' as const,
    name: 'Acme Corporation',
    icon: BuildingOfficeIcon,
    description: 'Leading technology solutions provider'
  },
  {
    id: '5a563961-4ee3-4ab6-908a-bcc23b2fd41f',
    type: 'company' as const,
    name: 'Agencja Szpilka',
    icon: BuildingOfficeIcon,
    description: 'Firma marketingowa'
  },
  {
    id: 'a7daa4bc-a82c-4179-8627-79bcb57936f5',
    type: 'company' as const,
    name: 'Apaczka',
    icon: BuildingOfficeIcon,
    description: 'Usługi kurierskie'
  },
  {
    id: '62156c1b-a10f-4574-8d9e-6153a9db53c7', 
    type: 'project' as const,
    name: 'Q1 Marketing Campaign',
    icon: CubeIcon,
    description: 'Kampania marketingowa Q1'
  },
  {
    id: 'b0a893c2-d542-49dd-8cbf-3b28bf8dfbdf',
    type: 'project' as const,
    name: 'Customer Onboarding Automation',
    icon: CubeIcon,
    description: 'Automatyzacja onboardingu klientów'
  },
  {
    id: 'f935dc0a-7da0-47af-b18b-d160a480e825',
    type: 'task' as const,
    name: 'Set up development environment',
    icon: ClipboardDocumentListIcon,
    description: 'Konfiguracja środowiska deweloperskiego'
  }
];

export default function GraphDemoPage() {
  const [selectedEntity, setSelectedEntity] = useState(demoEntities[0]);
  const [selectedDepth, setSelectedDepth] = useState(2);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            🕸️ Graph View - Demo
          </h1>
          <p className="text-gray-600 mt-1">
            Interaktywna wizualizacja powiązań między elementami systemu
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Wybierz Encję</h3>
          <div className="space-y-2">
            {demoEntities.map(entity => (
              <Button
                key={entity.id}
                onClick={() => setSelectedEntity(entity)}
                variant={selectedEntity.id === entity.id ? 'default' : 'outline'}
                className="w-full justify-start"
                size="sm"
              >
                <entity.icon className="w-4 h-4 mr-2" />
                {entity.name}
              </Button>
            ))}
          </div>

          <div className="mt-6">
            <h4 className="font-medium mb-2">Głębokość</h4>
            <div className="flex gap-1">
              {[1, 2, 3].map(depth => (
                <Button
                  key={depth}
                  onClick={() => setSelectedDepth(depth)}
                  variant={selectedDepth === depth ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                >
                  {depth}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-1">
              {selectedEntity.name}
            </h4>
            <p className="text-sm text-blue-700">
              {selectedEntity.description}
            </p>
          </div>
        </Card>

        <div className="lg:col-span-3">
          <RelationshipGraph
            entityId={selectedEntity.id}
            entityType={selectedEntity.type}
            depth={selectedDepth}
            onNodeClick={(node) => {
              console.log('Clicked node:', node);
            }}
          />
        </div>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">🎯 Funkcjonalności Graph View</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">🔍 Interaktywność</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Kliknij węzeł → otwórz szczegóły</li>
              <li>• Hover → podświetlenie</li>
              <li>• Zoom i przeciąganie</li>
              <li>• Wybór poziomu głębokości</li>
            </ul>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">🎨 Wizualizacja</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Kolory według typu encji</li>
              <li>• Animacje fizyki</li>
              <li>• Dynamiczne etykiety</li>
              <li>• Siła połączeń</li>
            </ul>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">⚡ Performance</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Canvas rendering</li>
              <li>• Optymalizacja dużych grafów</li>
              <li>• Filtry wydajności</li>
              <li>• Lazy loading węzłów</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">🚀 Co Dalej?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Planowane Rozszerzenia:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Real-time aktualizacje</li>
              <li>• Zapisywanie widoków</li>
              <li>• Export do różnych formatów</li>
              <li>• Integracja z AI insights</li>
              <li>• Grupowanie i clustering</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Integracja z Modułami:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Projekty → Widok zależności</li>
              <li>• CRM → Mapa relacji klientów</li>
              <li>• GTD → Flow zadań</li>
              <li>• Dokumenty → Knowledge graph</li>
              <li>• Komunikacja → Timeline</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}