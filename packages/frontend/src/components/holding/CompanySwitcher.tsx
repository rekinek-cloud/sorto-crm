'use client';

import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { useCompanyContext } from '@/hooks/useCompanyContext';

export function CompanySwitcher() {
  const { organizations, activeOrganization, switchOrganization, isLoading } = useCompanyContext();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = async (orgId: string) => {
    if (orgId === activeOrganization?.id) {
      setOpen(false);
      return;
    }
    setOpen(false);
    await switchOrganization(orgId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 animate-pulse">
        <div className="w-8 h-8 rounded-lg bg-gray-200" />
        <div className="w-24 h-4 rounded bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 min-w-[200px]"
      >
        {activeOrganization ? (
          <>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: activeOrganization.color || '#6366f1' }}
            >
              {activeOrganization.shortName?.slice(0, 2) || activeOrganization.name.slice(0, 2)}
            </div>
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className="text-sm font-semibold text-gray-900 truncate w-full text-left">
                {activeOrganization.name}
              </span>
              <span className="text-xs text-gray-400 truncate w-full text-left">
                {activeOrganization.companyType}
              </span>
            </div>
          </>
        ) : (
          <>
            <Building2 className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">Wybierz organizację</span>
          </>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Organizacje
            </p>
          </div>
          <div className="py-1 max-h-64 overflow-y-auto">
            {organizations.map((org) => {
              const isActive = org.id === activeOrganization?.id;
              return (
                <button
                  key={org.id}
                  onClick={() => handleSwitch(org.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors duration-150 ${
                    isActive ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: org.color || '#6366f1' }}
                  >
                    {org.shortName?.slice(0, 2) || org.name.slice(0, 2)}
                  </div>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate w-full text-left">
                      {org.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {org.companyType}
                    </span>
                  </div>
                  {isActive && (
                    <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
          {organizations.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              Brak organizacji
            </div>
          )}
        </div>
      )}
    </div>
  );
}
