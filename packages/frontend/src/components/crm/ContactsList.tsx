'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Plus, User, Building2, Mail, Phone } from 'lucide-react';
import { Contact, Company } from '@/types/crm';
import ContactForm from './ContactForm';
import { contactsApi } from '@/lib/api/contacts';
import { companiesApi } from '@/lib/api/companies';
import { toast } from 'react-hot-toast';

import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/ui/ActionButton';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

interface ContactsListProps {
  companyId?: string;
}

export default function ContactsList({ companyId }: ContactsListProps) {
  const router = useRouter();
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
      toast.error('Nie udalo sie zaladowac kontaktow');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateContact = async (data: any) => {
    try {
      const newContact = await contactsApi.createContact(data);
      setContacts(prev => [newContact, ...prev]);
      setIsFormOpen(false);
      toast.success('Kontakt utworzony pomyslnie');
    } catch (error: any) {
      console.error('Error creating contact:', error);
      toast.error('Nie udalo sie utworzyc kontaktu');
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
      toast.success('Kontakt zaktualizowany pomyslnie');
    } catch (error: any) {
      console.error('Error updating contact:', error);
      toast.error('Nie udalo sie zaktualizowac kontaktu');
      throw error;
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await contactsApi.deleteContact(id);
      setContacts(prev => prev.filter(contact => contact.id !== id));
      toast.success('Kontakt usuniety pomyslnie');
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      toast.error('Nie udalo sie usunac kontaktu');
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

  // Stats
  const withCompanies = useMemo(
    () => contacts.filter(c => c.companyId || c.assignedCompany).length,
    [contacts]
  );
  const independent = useMemo(
    () => contacts.filter(c => !c.companyId && !c.assignedCompany).length,
    [contacts]
  );

  // Filter config for FilterBar
  const companyFilterOptions = useMemo(
    () => companies.map(c => ({ value: c.id, label: c.name })),
    [companies]
  );

  // DataTable columns
  const columns: Column<Contact>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Imie i nazwisko',
      sortable: true,
      getValue: (contact) => `${contact.firstName} ${contact.lastName}`,
      render: (_: any, contact: Contact) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
            <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </div>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {contact.firstName} {contact.lastName}
          </span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value: any) => value ? (
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <Mail className="w-3.5 h-3.5" />
          <span>{value}</span>
        </div>
      ) : (
        <span className="text-slate-400 dark:text-slate-600">-</span>
      ),
    },
    {
      key: 'phone',
      label: 'Telefon',
      sortable: false,
      render: (value: any) => value ? (
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <Phone className="w-3.5 h-3.5" />
          <span>{value}</span>
        </div>
      ) : (
        <span className="text-slate-400 dark:text-slate-600">-</span>
      ),
    },
    {
      key: 'company',
      label: 'Firma',
      sortable: true,
      getValue: (contact) => contact.assignedCompany?.name || '',
      render: (_: any, contact: Contact) => contact.assignedCompany ? (
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <Building2 className="w-3.5 h-3.5" />
          <span>{contact.assignedCompany.name}</span>
        </div>
      ) : (
        <span className="text-slate-400 dark:text-slate-600">-</span>
      ),
    },
    {
      key: 'position',
      label: 'Stanowisko',
      sortable: true,
    },
  ], []);

  // Loading state
  if (isLoading) {
    return (
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Header */}
      <PageHeader
        title="Kontakty"
        subtitle={`${contacts.length} kontaktow w bazie`}
        icon={Users}
        iconColor="text-blue-600"
        breadcrumbs={[{ label: 'Kontakty' }]}
        actions={
          <ActionButton
            variant="primary"
            icon={Plus}
            onClick={() => setIsFormOpen(true)}
          >
            Dodaj kontakt
          </ActionButton>
        }
      />

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
      >
        <StatCard
          label="Wszystkie"
          value={contacts.length}
          icon={Users}
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          label="Z firmami"
          value={withCompanies}
          icon={Building2}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          label="Niezalezni"
          value={independent}
          icon={User}
          iconColor="text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400"
        />
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
      >
        <FilterBar
          search={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Szukaj kontaktow..."
          filters={[
            {
              key: 'company',
              label: 'Wszystkie firmy',
              options: companyFilterOptions,
            },
          ]}
          filterValues={{ company: selectedCompany || 'all' }}
          onFilterChange={(key, value) => {
            if (key === 'company') {
              setSelectedCompany(value === 'all' ? '' : value);
            }
          }}
        />
      </motion.div>

      {/* Data Table / Empty State */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Brak kontaktow"
            description={
              searchTerm || selectedCompany
                ? 'Sprobuj zmienic filtry wyszukiwania'
                : 'Zacznij od dodania pierwszego kontaktu'
            }
            action={
              !searchTerm && !selectedCompany ? (
                <ActionButton
                  variant="primary"
                  icon={Plus}
                  onClick={() => setIsFormOpen(true)}
                >
                  Dodaj pierwszy kontakt
                </ActionButton>
              ) : undefined
            }
          />
        ) : (
          <DataTable<Contact>
            columns={columns}
            data={contacts}
            storageKey="contacts-list"
            pageSize={20}
            stickyHeader
            onRowClick={(contact) => router.push(`/dashboard/contacts/${contact.id}`)}
            emptyMessage="Brak kontaktow"
            emptyIcon={<Users className="w-8 h-8" />}
          />
        )}
      </motion.div>

      {/* Contact Form Modal */}
      {isFormOpen && (
        <ContactForm
          contact={editingContact || undefined}
          companies={companies}
          onSubmit={editingContact ? handleUpdateContact : handleCreateContact}
          onCancel={handleCloseForm}
        />
      )}
    </PageShell>
  );
}
