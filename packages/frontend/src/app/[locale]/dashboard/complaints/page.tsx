'use client';

import React, { useState } from 'react';
import { ExclamationTriangleIcon, PlusIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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
  new: 'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700'
};

const statusLabels = {
  new: 'Nowa',
  in_progress: 'W trakcie',
  resolved: 'Rozwiązana',
  closed: 'Zamknięta'
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700'
};

export default function ComplaintsPage() {
  const [complaints] = useState<Complaint[]>(mockComplaints);
  const [search, setSearch] = useState('');

  const filteredComplaints = complaints.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.customer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reklamacje</h1>
            <p className="text-sm text-gray-600">Zarządzaj reklamacjami i problemami klientów</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          <PlusIcon className="h-4 w-4" />
          Nowa reklamacja
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Szukaj reklamacji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <FunnelIcon className="h-4 w-4" />
          Filtry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{complaints.length}</div>
          <div className="text-sm text-gray-600">Wszystkie</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-red-600">{complaints.filter(c => c.status === 'new').length}</div>
          <div className="text-sm text-gray-600">Nowe</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-yellow-600">{complaints.filter(c => c.status === 'in_progress').length}</div>
          <div className="text-sm text-gray-600">W trakcie</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{complaints.filter(c => c.status === 'resolved').length}</div>
          <div className="text-sm text-gray-600">Rozwiązane</div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tytuł</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Klient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priorytet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredComplaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{complaint.title}</div>
                    <div className="text-sm text-gray-500">{complaint.description}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{complaint.customer}</td>
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
                  <td className="px-6 py-4 text-gray-600">{complaint.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
