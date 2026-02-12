'use client';

import React, { useState, useEffect } from 'react';
import { Contact, Company } from '@/types/crm';
import ContactForm from './ContactForm';
import ContactItem from './ContactItem';
import { contactsApi } from '@/lib/api/contacts';
import { companiesApi } from '@/lib/api/companies';
import { toast } from 'react-hot-toast';

interface ContactsListProps {
  companyId?: string;
}

export default function ContactsList({ companyId }: ContactsListProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>(companyId || '');

  // Fetch contacts and companies
  useEffect(() => {
    fetchData();
  }, [searchTerm, selectedCompany]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [contactsResponse, companiesResponse] = await Promise.all([
        contactsApi.getContacts({
          search: searchTerm,
          companyId: selectedCompany || undefined,
        }),
        companiesApi.getCompanies({ limit: 100 })
      ]);
      
      setContacts(contactsResponse.contacts);
      setCompanies(companiesResponse.companies);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateContact = async (data: any) => {
    try {
      const newContact = await contactsApi.createContact(data);
      setContacts(prev => [newContact, ...prev]);
      setIsFormOpen(false);
      toast.success('Contact created successfully');
    } catch (error: any) {
      console.error('Error creating contact:', error);
      toast.error('Failed to create contact');
      throw error;
    }
  };

  const handleUpdateContact = async (data: any) => {
    if (!editingContact) return;
    
    try {
      const updatedContact = await contactsApi.updateContact(editingContact.id, data);
      setContacts(prev => prev.map(contact => 
        contact.id === editingContact.id ? updatedContact : contact
      ));
      setEditingContact(null);
      setIsFormOpen(false);
      toast.success('Contact updated successfully');
    } catch (error: any) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact');
      throw error;
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await contactsApi.deleteContact(id);
      setContacts(prev => prev.filter(contact => contact.id !== id));
      toast.success('Contact deleted successfully');
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingContact(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600">Manage your professional relationships</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn btn-primary"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Contact
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full"
          />
        </div>
        <div className="sm:w-64">
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="input w-full"
          >
            <option value="">All companies</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Contacts</h3>
          <p className="text-3xl font-bold text-primary-600">{contacts.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">With Companies</h3>
          <p className="text-3xl font-bold text-success-600">
            {contacts.filter(c => c.companyId || c.assignedCompany).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Independent</h3>
          <p className="text-3xl font-bold text-warning-600">
            {contacts.filter(c => !c.companyId && !c.assignedCompany).length}
          </p>
        </div>
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-lg shadow">
        {contacts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👤</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No contacts found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCompany 
                ? 'Try adjusting your filters' 
                : 'Start by adding your first contact'
              }
            </p>
            {!searchTerm && !selectedCompany && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="btn btn-primary"
              >
                Add First Contact
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {contacts.map(contact => (
              <ContactItem
                key={contact.id}
                contact={contact}
                companies={companies}
                onEdit={handleEditContact}
                onDelete={handleDeleteContact}
                onOpen={(id) => window.location.href = `/crm/dashboard/contacts/${id}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Contact Form Modal */}
      {isFormOpen && (
        <ContactForm
          contact={editingContact || undefined}
          companies={companies}
          onSubmit={editingContact ? handleUpdateContact : handleCreateContact}
          onCancel={handleCloseForm}
        />
      )}
    </div>
  );
}