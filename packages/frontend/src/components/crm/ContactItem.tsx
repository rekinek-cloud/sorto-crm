'use client';

import React from 'react';
import { Contact, Company } from '@/types/crm';

interface ContactItemProps {
  contact: Contact;
  companies: Company[];
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

export default function ContactItem({ contact, companies, onEdit, onDelete }: ContactItemProps) {
  const getCompanyName = () => {
    // Check assigned company first (new relationship)
    if (contact.assignedCompany) {
      return contact.assignedCompany.name;
    }
    // Fallback to old company string field
    if (contact.company) {
      return contact.company;
    }
    // Fallback to find company by ID
    if (contact.companyId) {
      const company = companies.find(c => c.id === contact.companyId);
      return company?.name || 'Unknown Company';
    }
    return 'Independent';
  };

  const getInitials = () => {
    return `${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`.toUpperCase();
  };

  const formatSocialLink = (url?: string) => {
    if (!url) return null;
    const domain = url.includes('linkedin') ? 'LinkedIn' : 
                   url.includes('twitter') ? 'Twitter' : 
                   url.includes('facebook') ? 'Facebook' : 'Link';
    return { domain, url };
  };

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        {/* Contact Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {getInitials()}
                </span>
              </div>
            </div>

            {/* Contact Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {contact.firstName} {contact.lastName}
                </h3>
                {contact.position && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {contact.position}
                  </span>
                )}
              </div>
              
              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                <span className="font-medium text-gray-700">{getCompanyName()}</span>
                {contact.department && (
                  <span>{contact.department}</span>
                )}
                {contact.email && (
                  <a 
                    href={`mailto:${contact.email}`}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a 
                    href={`tel:${contact.phone}`}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {contact.phone}
                  </a>
                )}
              </div>

              {/* Social Links */}
              {contact.socialLinks && (
                <div className="mt-2 flex items-center space-x-3">
                  {Object.entries(contact.socialLinks).map(([platform, url]) => {
                    const socialLink = formatSocialLink(url);
                    if (!socialLink) return null;
                    
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-primary-600 transition-colors"
                      >
                        {socialLink.domain}
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Notes */}
              {contact.notes && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {contact.notes}
                </p>
              )}

              {/* Tags */}
              {contact.tags && contact.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {contact.tags.map((tag, index) => (
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

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-6">
          <button
            onClick={() => onEdit(contact)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Edit contact"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(contact.id)}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete contact"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}