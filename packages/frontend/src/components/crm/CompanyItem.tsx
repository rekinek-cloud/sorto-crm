'use client';

import React from 'react';
import { Company } from '@/types/crm';

interface CompanyItemProps {
  company: Company;
  onEdit: (company: Company) => void;
  onDelete: (id: string) => void;
  onOpen?: (id: string) => void;
}

export default function CompanyItem({ company, onEdit, onDelete, onOpen }: CompanyItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CUSTOMER': return 'bg-green-100 text-green-800';
      case 'PROSPECT': return 'bg-blue-100 text-blue-800';
      case 'PARTNER': return 'bg-purple-100 text-purple-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'ARCHIVED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSizeColor = (size?: string) => {
    if (!size) return 'bg-gray-100 text-gray-800';
    switch (size) {
      case 'STARTUP': return 'bg-purple-100 text-purple-800';
      case 'SMALL': return 'bg-blue-100 text-blue-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LARGE': return 'bg-orange-100 text-orange-800';
      case 'ENTERPRISE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div
      className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => onOpen?.(company.id)}
    >
      <div className="flex items-center justify-between">
        {/* Company Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            {/* Company Avatar */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {company.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Company Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {company.name}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(company.status)}`}>
                  {company.status.toLowerCase()}
                </span>
                {company.size && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSizeColor(company.size)}`}>
                    {company.size.toLowerCase()}
                  </span>
                )}
              </div>
              
              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                {company.industry && (
                  <span>{company.industry}</span>
                )}
                {company.email && (
                  <span>{company.email}</span>
                )}
                {company.phone && (
                  <span>{company.phone}</span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Website
                  </a>
                )}
              </div>

              {company.description && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {company.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-6 text-sm text-gray-500">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {(company as any).contactsCount || 0}
            </div>
            <div>Contacts</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {(company as any).dealsCount || 0}
            </div>
            <div>Deals</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {(company as any).activeDealsCount || 0}
            </div>
            <div>Active</div>
          </div>
          {(company as any).totalDealsValue !== undefined && (company as any).totalDealsValue > 0 && (
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency((company as any).totalDealsValue)}
              </div>
              <div>Pipeline</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-6">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(company); }}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Edit company"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(company.id); }}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete company"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tags */}
      {company.tags && company.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {company.tags.map((tag, index) => (
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
  );
}