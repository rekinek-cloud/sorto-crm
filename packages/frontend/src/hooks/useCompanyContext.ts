'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { holdingsApi } from '@/lib/api/holdings';

interface OrganizationContext {
  id: string;
  name: string;
  shortName?: string;
  companyType: string;
  color: string;
}

interface CompanyContextStore {
  organizations: OrganizationContext[];
  activeOrganizationId: string | null;
  isLoading: boolean;
  setOrganizations: (orgs: OrganizationContext[]) => void;
  setActiveOrganizationId: (id: string) => void;
  switchOrganization: (id: string) => Promise<void>;
}

export const useCompanyStore = create<CompanyContextStore>()(
  persist(
    (set, get) => ({
      organizations: [],
      activeOrganizationId: null,
      isLoading: true,
      setOrganizations: (organizations) => set({ organizations, isLoading: false }),
      setActiveOrganizationId: (id) => set({ activeOrganizationId: id }),
      switchOrganization: async (id: string) => {
        try {
          await holdingsApi.switchOrganization(id);
          set({ activeOrganizationId: id });
          // Store new tokens from response if needed, then reload
          window.location.reload();
        } catch (error) {
          console.error('Failed to switch organization:', error);
        }
      }
    }),
    {
      name: 'company-context',
      partialize: (state) => ({ activeOrganizationId: state.activeOrganizationId })
    }
  )
);

export function useCompanyContext() {
  const store = useCompanyStore();
  const activeOrganization = store.organizations.find(o => o.id === store.activeOrganizationId);
  return { ...store, activeOrganization };
}
