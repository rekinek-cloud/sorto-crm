'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Deal, Company, Contact } from '@/types/crm';
import { dealsApi } from '@/lib/api/deals';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BuildingOfficeIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface PipelineBoardProps {
  deals: Deal[];
  companies: Company[];
  contacts: Contact[];
  onEditDeal: (deal: Deal) => void;
  onDeleteDeal: (id: string) => void;
  onDealsChange: (deals: Deal[]) => void;
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  deals: Deal[];
}

const PIPELINE_STAGES = [
  { id: 'PROSPECT', name: 'Prospect', color: 'bg-gray-100 border-gray-300' },
  { id: 'QUALIFIED', name: 'Qualified', color: 'bg-blue-100 border-blue-300' },
  { id: 'PROPOSAL', name: 'Proposal', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'NEGOTIATION', name: 'Negotiation', color: 'bg-orange-100 border-orange-300' },
  { id: 'CLOSED_WON', name: 'Won', color: 'bg-green-100 border-green-300' },
  { id: 'CLOSED_LOST', name: 'Lost', color: 'bg-red-100 border-red-300' },
];

export default function PipelineBoard({
  deals,
  companies,
  contacts,
  onEditDeal,
  onDeleteDeal,
  onDealsChange,
}: PipelineBoardProps) {
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Group deals by stage
    const stages = PIPELINE_STAGES.map(stage => ({
      ...stage,
      deals: deals.filter(deal => deal.stage === stage.id)
    }));
    setPipelineStages(stages);
  }, [deals]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'Unknown Company';
  };

  const getContactName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Contact';
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    
    const { destination, source, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    // Find the deal being moved
    const deal = deals.find(d => d.id === draggableId);
    if (!deal) return;

    // Don't allow moving closed deals
    if (deal.stage === 'CLOSED_WON' || deal.stage === 'CLOSED_LOST') {
      toast.error('Cannot move closed deals');
      return;
    }

    const newStage = destination.droppableId as Deal['stage'];

    try {
      // Optimistically update the UI
      const updatedDeals = deals.map(d => 
        d.id === draggableId 
          ? { ...d, stage: newStage }
          : d
      );
      onDealsChange(updatedDeals);

      // Update on the server
      await dealsApi.updateDeal(draggableId, {
        stage: newStage as any,
        ...(newStage === 'CLOSED_WON' ? { actualCloseDate: new Date().toISOString() } : {}),
        ...(newStage === 'CLOSED_LOST' ? { actualCloseDate: new Date().toISOString() } : {})
      });

      toast.success('Deal moved successfully');
    } catch (error: any) {
      console.error('Error moving deal:', error);
      toast.error('Failed to move deal');
      
      // Revert the optimistic update
      onDealsChange(deals);
    }
  };

  const getStageValue = (stageDeals: Deal[]) => {
    return stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  };

  const getProbabilityByStage = (stage: string) => {
    switch (stage) {
      case 'PROSPECT': return 10;
      case 'QUALIFIED': return 25;
      case 'PROPOSAL': return 50;
      case 'NEGOTIATION': return 75;
      case 'CLOSED_WON': return 100;
      case 'CLOSED_LOST': return 0;
      default: return 0;
    }
  };

  const getWeightedValue = (stageDeals: Deal[], stage: string) => {
    const probability = getProbabilityByStage(stage) / 100;
    return stageDeals.reduce((sum, deal) => sum + (deal.value || 0) * probability, 0);
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {pipelineStages.map((stage) => (
          <div key={stage.id} className={`p-4 rounded-lg border-2 ${stage.color}`}>
            <div className="text-sm font-medium text-gray-700 mb-1">{stage.name}</div>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(getStageValue(stage.deals))}
            </div>
            <div className="text-xs text-gray-600">
              {stage.deals.length} {stage.deals.length === 1 ? 'deal' : 'deals'}
            </div>
            {stage.id !== 'CLOSED_WON' && stage.id !== 'CLOSED_LOST' && (
              <div className="text-xs text-gray-500 mt-1">
                Weighted: {formatCurrency(getWeightedValue(stage.deals, stage.id))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 min-h-screen">
          {pipelineStages.map((stage) => (
            <div key={stage.id} className="flex flex-col">
              {/* Stage Header */}
              <div className={`p-3 rounded-t-lg border-2 border-b-0 ${stage.color}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{stage.name}</h3>
                  <span className="text-sm font-medium text-gray-600">
                    {stage.deals.length}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-700 mt-1">
                  {formatCurrency(getStageValue(stage.deals))}
                </div>
              </div>

              {/* Stage Content */}
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-3 bg-gray-50 border-2 border-t-0 rounded-b-lg min-h-96 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                    }`}
                  >
                    <div className="space-y-3">
                      {stage.deals.map((deal, index) => (
                        <Draggable
                          key={deal.id}
                          draggableId={deal.id}
                          index={index}
                          isDragDisabled={deal.stage === 'CLOSED_WON' || deal.stage === 'CLOSED_LOST'}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-all hover:shadow-md ${
                                snapshot.isDragging ? 'rotate-3 shadow-lg' : ''
                              } ${
                                deal.stage === 'CLOSED_WON' || deal.stage === 'CLOSED_LOST' 
                                  ? 'opacity-75 cursor-default' 
                                  : 'cursor-grab active:cursor-grabbing'
                              }`}
                            >
                              {/* Deal Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 truncate text-sm">
                                    {deal.title}
                                  </h4>
                                  <div className="flex items-center text-xs text-gray-500 mt-1">
                                    <BuildingOfficeIcon className="w-3 h-3 mr-1" />
                                    <span className="truncate">
                                      {getCompanyName(deal.companyId)}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="relative">
                                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                                    <EllipsisVerticalIcon className="w-4 h-4" />
                                  </button>
                                  {/* Dropdown menu would go here */}
                                </div>
                              </div>

                              {/* Deal Value */}
                              <div className="flex items-center mb-2">
                                <CurrencyDollarIcon className="w-4 h-4 text-green-600 mr-1" />
                                <span className="font-semibold text-gray-900 text-sm">
                                  {formatCurrency(deal.value || 0)}
                                </span>
                              </div>

                              {/* Deal Contact */}
                              {(deal as any).contactId && (
                                <div className="flex items-center text-xs text-gray-500 mb-2">
                                  <UserIcon className="w-3 h-3 mr-1" />
                                  <span className="truncate">
                                    {getContactName((deal as any).contactId)}
                                  </span>
                                </div>
                              )}

                              {/* Expected Close Date */}
                              {deal.expectedCloseDate && (
                                <div className="flex items-center text-xs text-gray-500 mb-3">
                                  <CalendarIcon className="w-3 h-3 mr-1" />
                                  <span>
                                    {formatDate(deal.expectedCloseDate)}
                                  </span>
                                </div>
                              )}

                              {/* Probability Bar */}
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                  <span>Probability</span>
                                  <span>{getProbabilityByStage(deal.stage)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                                    style={{ width: `${getProbabilityByStage(deal.stage)}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => onEditDeal(deal)}
                                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                  title="Edit deal"
                                >
                                  <PencilIcon className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => onDeleteDeal(deal.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                                  title="Delete deal"
                                >
                                  <TrashIcon className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>

                    {/* Empty State */}
                    {stage.deals.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <div className="text-2xl mb-2">📋</div>
                        <p className="text-sm">No deals in {stage.name.toLowerCase()}</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}