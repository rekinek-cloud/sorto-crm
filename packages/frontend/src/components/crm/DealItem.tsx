'use client';

import React from 'react';
import { Deal, Company, Contact } from '@/types/crm';

interface DealItemProps {
  deal: Deal;
  companies: Company[];
  contacts: Contact[];
  onEdit: (deal: Deal) => void;
  onDelete: (id: string) => void;
  onOpen?: (id: string) => void;
}

export default function DealItem({ deal, companies, contacts, onEdit, onDelete, onOpen }: DealItemProps) {
  const getCompanyName = () => {
    if (deal.company) return deal.company.name;
    if (deal.companyId) {
      const company = companies.find(c => c.id === deal.companyId);
      return company?.name || 'Unknown Company';
    }
    return 'No Company';
  };

  const getContactName = () => {
    if ((deal as any).contact) return `${(deal as any).contact.firstName} ${(deal as any).contact.lastName}`;
    if ((deal as any).contactId) {
      const contact = contacts.find(c => c.id === (deal as any).contactId);
      return contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Contact';
    }
    return null;
  };


  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'PROSPECT': return 'bg-gray-100 text-gray-800';
      case 'QUALIFIED': return 'bg-blue-100 text-blue-800';
      case 'PROPOSAL': return 'bg-yellow-100 text-yellow-800';
      case 'NEGOTIATION': return 'bg-orange-100 text-orange-800';
      case 'CLOSED_WON': return 'bg-green-100 text-green-800';
      case 'CLOSED_LOST': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: deal.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const getDealIcon = () => {
    switch (deal.stage) {
      case 'CLOSED_WON': return '🎉';
      case 'CLOSED_LOST': return '😞';
      default: return '💰';
    }
  };

  return (
    <div
      className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => onOpen?.(deal.id)}
    >
      <div className="flex items-center justify-between">
        {/* Deal Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-4">
            {/* Deal Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">
                  {getDealIcon()}
                </span>
              </div>
            </div>

            {/* Deal Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {deal.title}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(deal.stage)}`}>
                  {deal.stage.toLowerCase()}
                </span>
                {deal.probability !== undefined && deal.probability > 0 && (
                  <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                    {deal.probability}%
                  </span>
                )}
              </div>
              
              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                <span className="font-medium text-gray-700">{getCompanyName()}</span>
                {getContactName() && (
                  <span>{getContactName()}</span>
                )}
                {deal.owner && (
                  <span>Owner: {deal.owner.firstName} {deal.owner.lastName}</span>
                )}
              </div>

              {/* Description */}
              {deal.description && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {deal.description}
                </p>
              )}

              {/* Dates */}
              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                {deal.expectedCloseDate && (
                  <span>Expected: {formatDate(deal.expectedCloseDate)}</span>
                )}
                {deal.actualCloseDate && (
                  <span>Closed: {formatDate(deal.actualCloseDate)}</span>
                )}
                {(deal as any).lostReason && deal.stage === 'CLOSED_LOST' && (
                  <span className="text-red-600">Reason: {(deal as any).lostReason}</span>
                )}
              </div>

              {/* Notes */}
              {deal.notes && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-1">
                  <span className="font-medium">Notes:</span> {deal.notes}
                </p>
              )}

              {/* Tags */}
              {(deal as any).tags && (deal as any).tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {(deal as any).tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Value and Actions */}
        <div className="flex items-center space-x-6 ml-6">
          {/* Deal Value */}
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(deal.value)}
            </div>
            <div className="text-sm text-gray-500">
              {deal.currency || 'USD'}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(deal); }}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Edit deal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(deal.id); }}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete deal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}