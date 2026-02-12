'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Users, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

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
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Organizacja"
        subtitle="Zarządzaj ustawieniami organizacji"
        icon={Building2}
        iconColor="text-indigo-600"
        breadcrumbs={[{ label: 'Ustawienia', href: '/dashboard/settings' }, { label: 'Organizacja' }]}
      />

      {/* Organization Form */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Dane organizacji</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nazwa firmy</label>
            <input
              type="text"
              value={organization.name}
              onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
              placeholder="Moja Firma Sp. z o.o."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Domena</label>
            <input
              type="text"
              value={organization.domain}
              onChange={(e) => setOrganization({ ...organization, domain: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
              placeholder="mojafirma.pl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Branża</label>
            <select
              value={organization.industry}
              onChange={(e) => setOrganization({ ...organization, industry: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Wielkość firmy</label>
            <select
              value={organization.size}
              onChange={(e) => setOrganization({ ...organization, size: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Adres</label>
            <input
              type="text"
              value={organization.address}
              onChange={(e) => setOrganization({ ...organization, address: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
              placeholder="ul. Przykładowa 1, 00-001 Warszawa"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Strona internetowa</label>
            <input
              type="url"
              value={organization.website}
              onChange={(e) => setOrganization({ ...organization, website: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
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
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Członkowie zespołu</h2>
          <button className="flex items-center gap-2 px-3 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
            <Plus className="h-4 w-4" />
            Zaproś osobę
          </button>
        </div>

        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <Users className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p>Zarządzanie zespołem wymaga planu Enterprise</p>
        </div>
      </div>
    </PageShell>
  );
}
