'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { 
  UserIcon, 
  BuildingOfficeIcon, 
  CurrencyDollarIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface RelationshipItem {
  id: string;
  name: string;
  type: string;
  status?: string;
  metadata?: any;
}

interface RelationshipsData {
  contacts?: RelationshipItem[];
  deals?: RelationshipItem[];
  projects?: RelationshipItem[];
  tasks?: RelationshipItem[];
  company?: RelationshipItem;
}

interface RelationshipsPanelProps {
  entityId: string;
  entityType: 'company' | 'contact' | 'project' | 'deal';
  entityName: string;
  onClose?: () => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'contact': return UserIcon;
    case 'company': return BuildingOfficeIcon;
    case 'deal': return CurrencyDollarIcon;
    case 'project': return CubeIcon;
    case 'task': return ClipboardDocumentListIcon;
    default: return UserIcon;
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'completed':
    case 'customer': 
      return 'bg-green-100 text-green-800';
    case 'in_progress':
    case 'prospect':
      return 'bg-blue-100 text-blue-800';
    case 'on_hold':
    case 'inactive':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
    case 'archived':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function RelationshipsPanel({ entityId, entityType, entityName, onClose }: RelationshipsPanelProps) {
  const [data, setData] = useState<RelationshipsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        setLoading(true);
        setError(null);

        let response;
        
        switch (entityType) {
          case 'company':
            response = await apiClient.get(`/companies/${entityId}`);
            break;
          case 'contact':
            response = await apiClient.get(`/contacts/${entityId}`);
            break;
          case 'project':
            response = await apiClient.get(`/projects/${entityId}`);
            break;
          case 'deal':
            response = await apiClient.get(`/deals/${entityId}`);
            break;
          default:
            throw new Error(`Unsupported entity type: ${entityType}`);
        }

        if (response.data) {
          const entityData = response.data;
          const relationships: RelationshipsData = {};

          if (entityType === 'company') {
            // Map contacts
            relationships.contacts = entityData.contacts?.map((contact: any) => ({
              id: contact.id,
              name: contact.user 
                ? `${contact.user.firstName} ${contact.user.lastName}`
                : `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Nieznany kontakt',
              type: 'contact',
              status: contact.status || 'ACTIVE',
              metadata: { 
                email: contact.user?.email || contact.email,
                position: contact.position || contact.jobTitle
              }
            })) || [];

            // Map deals
            relationships.deals = entityData.deals?.map((deal: any) => ({
              id: deal.id,
              name: deal.title || deal.name || 'Bez nazwy',
              type: 'deal',
              status: deal.status || deal.stage || 'UNKNOWN',
              metadata: { 
                value: deal.value,
                closeDate: deal.closeDate || deal.expectedCloseDate,
                assignedTo: deal.assignedTo 
                  ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}`
                  : null
              }
            })) || [];
          } else if (entityType === 'contact') {
            // Map company relationship
            if (entityData.assignedCompany) {
              relationships.company = {
                id: entityData.assignedCompany.id,
                name: entityData.assignedCompany.name,
                type: 'company',
                status: entityData.assignedCompany.status
              };
            }
            
            // Map additional companies
            if (entityData.companies && entityData.companies.length > 0) {
              if (!relationships.company) {
                relationships.company = {
                  id: entityData.companies[0].id,
                  name: entityData.companies[0].name,
                  type: 'company',
                  status: entityData.companies[0].status
                };
              }
            }
          } else if (entityType === 'project') {
            // Map project relationships
            relationships.tasks = entityData.tasks?.map((task: any) => ({
              id: task.id,
              name: task.title || task.name || 'Bez nazwy',
              type: 'task',
              status: task.status || 'TODO',
              metadata: { 
                description: task.description,
                dueDate: task.dueDate,
                assignedTo: task.assignedTo 
                  ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                  : null
              }
            })) || [];
          } else if (entityType === 'deal') {
            // Map deal relationships
            if (entityData.company) {
              relationships.company = {
                id: entityData.company.id,
                name: entityData.company.name,
                type: 'company',
                status: entityData.company.status
              };
            }
            
            if (entityData.contact) {
              relationships.contacts = [{
                id: entityData.contact.id,
                name: `${entityData.contact.firstName} ${entityData.contact.lastName}`,
                type: 'contact',
                status: entityData.contact.status || 'ACTIVE',
                metadata: { 
                  email: entityData.contact.email,
                  position: entityData.contact.position
                }
              }];
            }
          }

          setData(relationships);
        }
      } catch (err: any) {
        console.error('Error fetching relationships:', err);
        setError('Nie udało się załadować powiązań');
      } finally {
        setLoading(false);
      }
    };

    fetchRelationships();
  }, [entityId, entityType]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner text="Ładowanie powiązań..." />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  const renderRelationshipSection = (title: string, items: RelationshipItem[], type: string) => {
    if (!items || items.length === 0) return null;

    const Icon = getIcon(type);

    return (
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <Icon className="w-4 h-4 mr-2" />
          {title} ({items.length})
        </h4>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </h5>
                  {item.metadata && (
                    <div className="mt-1 text-xs text-gray-500">
                      {type === 'contact' && item.metadata.email && (
                        <span>{item.metadata.email}</span>
                      )}
                      {type === 'contact' && item.metadata.position && (
                        <span className="ml-2">• {item.metadata.position}</span>
                      )}
                      {type === 'task' && (
                        <div className="flex flex-wrap gap-2">
                          {item.metadata.description && (
                            <span className="text-xs text-gray-400">{item.metadata.description}</span>
                          )}
                          {item.metadata.assignedTo && (
                            <span>• Przypisane: {item.metadata.assignedTo}</span>
                          )}
                          {item.metadata.dueDate && (
                            <span>• Termin: {new Date(item.metadata.dueDate).toLocaleDateString('pl-PL')}</span>
                          )}
                        </div>
                      )}
                      {type === 'deal' && (
                        <div className="flex flex-wrap gap-2">
                          {item.metadata.value && (
                            <span>{new Intl.NumberFormat('pl-PL', { 
                              style: 'currency', 
                              currency: 'PLN' 
                            }).format(item.metadata.value)}</span>
                          )}
                          {item.metadata.assignedTo && (
                            <span>• Przypisane: {item.metadata.assignedTo}</span>
                          )}
                          {item.metadata.closeDate && (
                            <span>• Zamknięcie: {new Date(item.metadata.closeDate).toLocaleDateString('pl-PL')}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {item.status && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSingleRelationship = (title: string, item: RelationshipItem) => {
    if (!item) return null;

    const Icon = getIcon(item.type);

    return (
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <Icon className="w-4 h-4 mr-2" />
          {title}
        </h4>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium text-gray-900">
              {item.name}
            </h5>
            {item.status && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            🔗 Powiązania: {entityName}
          </h3>
          <p className="text-sm text-gray-600">
            Wszystkie elementy powiązane z {entityType === 'company' ? 'firmą' : 'kontaktem'}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      <div>
        {data?.contacts && renderRelationshipSection('Kontakty', data.contacts, 'contact')}
        {data?.deals && renderRelationshipSection('Deale', data.deals, 'deal')}
        {data?.projects && renderRelationshipSection('Projekty', data.projects, 'project')}
        {data?.tasks && renderRelationshipSection('Zadania', data.tasks, 'task')}
        {data?.company && renderSingleRelationship('Firma', data.company)}

        {!data?.contacts?.length && !data?.deals?.length && !data?.projects?.length && !data?.tasks?.length && !data?.company && (
          <div className="text-center py-8 text-gray-500">
            <p>Brak powiązań do wyświetlenia</p>
          </div>
        )}
      </div>
    </Card>
  );
}