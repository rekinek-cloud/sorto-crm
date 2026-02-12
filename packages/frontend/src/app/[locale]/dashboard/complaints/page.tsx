'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { AlertTriangle, Plus, Filter, Search } from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

interface Complaint {
  id: string;
  title: string;
  customer: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  description: string;
}

const mockComplaints: Complaint[] = [
  {
    id: '1',
    title: 'Opóźniona dostawa zamówienia #1234',
    customer: 'Jan Kowalski',
    status: 'new',
    priority: 'high',
    createdAt: '2025-11-28',
    description: 'Zamówienie miało dotrzeć 3 dni temu'
  },
  {
    id: '2',
    title: 'Uszkodzony produkt',
    customer: 'Anna Nowak',
    status: 'in_progress',
    priority: 'medium',
    createdAt: '2025-11-27',
    description: 'Produkt dotarł z widocznymi uszkodzeniami'
  },
  {
    id: '3',
    title: 'Błędna faktura',
    customer: 'Firma ABC Sp. z o.o.',
    status: 'resolved',
    priority: 'low',
    createdAt: '2025-11-25',
    description: 'Nieprawidłowe dane na fakturze'
  }
];

const statusColors = {
  new: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-400'
};

const statusLabels = {
  new: 'Nowa',
  in_progress: 'W trakcie',
  resolved: 'Rozwiązana',
  closed: 'Zamknięta'
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  medium: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
};

export default function ComplaintsPage() {
  const [complaints] = useState<Complaint[]>(mockComplaints);
  const [search, setSearch] = useState('');

  const filteredComplaints = complaints.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.customer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageShell>
      <PageHeader
        title="Reklamacje"
        subtitle="Zarządzaj reklamacjami i problemami klientów"
        icon={AlertTriangle}
        iconColor="text-red-600"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reklamacje' },
        ]}
        actions={
          <button
            onClick={() => toast('Moduł reklamacji - wkrótce dostępny')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nowa reklamacja
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Szukaj reklamacji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300">
          <Filter className="h-4 w-4" />
          Filtry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{complaints.length}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Wszystkie</div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="text-2xl font-bold text-red-600">{complaints.filter(c => c.status === 'new').length}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Nowe</div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="text-2xl font-bold text-yellow-600">{complaints.filter(c => c.status === 'in_progress').length}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">W trakcie</div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">{complaints.filter(c => c.status === 'resolved').length}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Rozwiązane</div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Tytuł</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Klient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Priorytet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredComplaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{complaint.title}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{complaint.description}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{complaint.customer}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[complaint.status]}`}>
                      {statusLabels[complaint.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[complaint.priority]}`}>
                      {complaint.priority === 'high' ? 'Wysoki' : complaint.priority === 'medium' ? 'Średni' : 'Niski'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{complaint.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
