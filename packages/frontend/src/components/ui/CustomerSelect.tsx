'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDownIcon,
  MagnifyingGlassIcon,
  UserIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Contact } from '@/types/crm';
import { contactsApi } from '@/lib/api/contacts';

interface CustomerSelectProps {
  value?: string;
  onCustomerSelect: (customer: SelectedCustomer | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

interface SelectedCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
}

export default function CustomerSelect({
  value,
  onCustomerSelect,
  placeholder = "Wybierz klienta...",
  disabled = false,
  required = false,
  className = ""
}: CustomerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load contacts when component mounts or search term changes
  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen, searchTerm]);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const response = await contactsApi.getContacts({
        search: searchTerm,
        limit: 50,
        sortBy: 'firstName',
        sortOrder: 'asc'
      });
      setContacts(response.contacts);
    } catch (error: any) {
      console.error('Error loading contacts:', error);
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerSelect = (contact: Contact) => {
    const customer: SelectedCustomer = {
      id: contact.id,
      name: `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
      phone: contact.phone,
      company: contact.company || contact.assignedCompany?.name,
      address: '' // You might want to add address field to Contact type
    };

    setSelectedCustomer(customer);
    onCustomerSelect(customer);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    setSelectedCustomer(null);
    onCustomerSelect(null);
  };

  const handleCreateNewCustomer = () => {
    setShowCreateForm(true);
  };

  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const email = contact.email?.toLowerCase() || '';
    const company = contact.company?.toLowerCase() || contact.assignedCompany?.name?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) || email.includes(search) || company.includes(search);
  });

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected Customer Display / Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer
          flex items-center justify-between min-h-[40px]
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'}
          ${isOpen ? 'border-primary-500 ring-1 ring-primary-500' : ''}
          ${required && !selectedCustomer ? 'border-red-300' : ''}
        `}
      >
        <div className="flex items-center flex-1 min-w-0">
          {selectedCustomer ? (
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <UserIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {selectedCustomer.name}
                </div>
                {selectedCustomer.email && (
                  <div className="text-xs text-gray-500 truncate">
                    {selectedCustomer.email}
                  </div>
                )}
              </div>
              {!disabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearSelection();
                  }}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-gray-500">
              <UserIcon className="w-4 h-4" />
              <span className="text-sm">{placeholder}</span>
            </div>
          )}
        </div>
        
        {!disabled && (
          <ChevronDownIcon 
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Szukaj klienta..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto">
              {isLoading ? (
                <div className="p-3 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mx-auto"></div>
                  <span className="text-sm mt-2 block">Ładowanie...</span>
                </div>
              ) : filteredContacts.length > 0 ? (
                <>
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleCustomerSelect(contact)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-2">
                        <UserIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {contact.firstName} {contact.lastName}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            {contact.email && (
                              <span className="truncate">{contact.email}</span>
                            )}
                            {contact.company && (
                              <>
                                {contact.email && <span>•</span>}
                                <span className="truncate">{contact.company}</span>
                              </>
                            )}
                            {contact.assignedCompany?.name && !contact.company && (
                              <>
                                {contact.email && <span>•</span>}
                                <span className="truncate">{contact.assignedCompany.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="p-3 text-center text-gray-500">
                  <UserIcon className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">
                    {searchTerm ? 'Nie znaleziono klientów' : 'Brak klientów'}
                  </p>
                  {searchTerm && (
                    <button
                      onClick={handleCreateNewCustomer}
                      className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center justify-center space-x-1"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>Dodaj nowego klienta</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Create New Customer Option */}
            {!searchTerm && (
              <div className="border-t border-gray-200 p-2">
                <button
                  onClick={handleCreateNewCustomer}
                  className="w-full px-3 py-2 text-left text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md flex items-center space-x-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Dodaj nowego klienta</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Create Form Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Dodaj nowego klienta</h3>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Ta funkcjonalność jest w przygotowaniu. Aby dodać nowego klienta, przejdź do sekcji Kontakty.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="btn btn-outline flex-1"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      // You could redirect to contacts page here
                      // router.push('/dashboard/contacts?action=create');
                    }}
                    className="btn btn-primary flex-1"
                  >
                    Przejdź do Kontaktów
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}