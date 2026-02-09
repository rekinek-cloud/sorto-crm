'use client';

import React, { useState, useEffect } from 'react';
import { BuildingOfficeIcon, UsersIcon, PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';

export default function OrganizationSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [organization, setOrganization] = useState({
    name: '',
    domain: '',
    industry: '',
    size: '',
    address: '',
    website: '',
  });

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      const user = response.data?.data || response.data;
      if (user?.organization) {
        const org = user.organization;
        setOrganization({
          name: org.name || '',
          domain: org.domain || '',
          industry: org.settings?.industry || '',
          size: org.settings?.size || '',
          address: org.settings?.address || '',
          website: org.settings?.website || '',
        });
      }
    } catch (error) {
      console.error('Failed to load organization:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiClient.put('/organizations', {
        name: organization.name || undefined,
        domain: organization.domain || undefined,
        settings: {
          industry: organization.industry || undefined,
          size: organization.size || undefined,
          address: organization.address || undefined,
          website: organization.website || undefined,
        }
      });
      toast.success('Ustawienia organizacji zostały zapisane');
    } catch (error: any) {
      console.error('Failed to save organization:', error);
      const msg = error?.response?.data?.error || 'Nie udało się zapisać ustawień';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizacja</h1>
          <p className="text-sm text-gray-600">Zarządzaj ustawieniami organizacji</p>
        </div>
      </div>

      {/* Organization Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dane organizacji</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa firmy</label>
            <input
              type="text"
              value={organization.name}
              onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Moja Firma Sp. z o.o."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domena</label>
            <input
              type="text"
              value={organization.domain}
              onChange={(e) => setOrganization({ ...organization, domain: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="mojafirma.pl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branża</label>
            <select
              value={organization.industry}
              onChange={(e) => setOrganization({ ...organization, industry: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Wybierz branżę</option>
              <option value="technology">Technologia</option>
              <option value="finance">Finanse</option>
              <option value="healthcare">Ochrona zdrowia</option>
              <option value="retail">Handel detaliczny</option>
              <option value="manufacturing">Produkcja</option>
              <option value="services">Usługi</option>
              <option value="other">Inna</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wielkość firmy</label>
            <select
              value={organization.size}
              onChange={(e) => setOrganization({ ...organization, size: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Wybierz</option>
              <option value="1-10">1-10 pracowników</option>
              <option value="11-50">11-50 pracowników</option>
              <option value="51-200">51-200 pracowników</option>
              <option value="201-500">201-500 pracowników</option>
              <option value="500+">Ponad 500 pracowników</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
            <input
              type="text"
              value={organization.address}
              onChange={(e) => setOrganization({ ...organization, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="ul. Przykładowa 1, 00-001 Warszawa"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Strona internetowa</label>
            <input
              type="url"
              value={organization.website}
              onChange={(e) => setOrganization({ ...organization, website: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://mojafirma.pl"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </button>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Członkowie zespołu</h2>
          <button className="flex items-center gap-2 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <PlusIcon className="h-4 w-4" />
            Zaproś osobę
          </button>
        </div>

        <div className="text-center py-8 text-gray-500">
          <UsersIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Zarządzanie zespołem wymaga planu Enterprise</p>
        </div>
      </div>
    </div>
  );
}
