'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { contactRelationsApi, CreateContactRelationRequest } from '@/lib/api/contactRelations';
import { ContactRelation } from '@/types/gtd';

// ─── Relation type config ────────────────────────────────────────────
const RELATION_TYPES: Record<string, { label: string; color: string }> = {
  REPORTS_TO:       { label: 'Podlega',            color: 'bg-purple-100 text-purple-700' },
  WORKS_WITH:       { label: 'Wspolpracuje',       color: 'bg-blue-100 text-blue-700' },
  KNOWS:            { label: 'Zna',                 color: 'bg-gray-100 text-gray-700' },
  REFERRED_BY:      { label: 'Polecony przez',      color: 'bg-teal-100 text-teal-700' },
  FAMILY:           { label: 'Rodzina',             color: 'bg-pink-100 text-pink-700' },
  TECHNICAL:        { label: 'Kontakt techniczny',  color: 'bg-indigo-100 text-indigo-700' },
  FORMER_COLLEAGUE: { label: 'Byly wspolpracownik', color: 'bg-yellow-100 text-yellow-700' },
  MENTOR:           { label: 'Mentor',              color: 'bg-amber-100 text-amber-700' },
  PARTNER:          { label: 'Partner',             color: 'bg-green-100 text-green-700' },
};

interface ContactOption {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  company?: { name: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────
function contactName(c?: { firstName: string; lastName: string } | null): string {
  if (!c) return '(nieznany)';
  return `${c.firstName} ${c.lastName}`;
}

function strengthBar(strength: number) {
  const pct = Math.min(100, Math.max(0, strength));
  let color = 'bg-gray-300';
  if (pct >= 80) color = 'bg-green-500';
  else if (pct >= 50) color = 'bg-blue-500';
  else if (pct >= 25) color = 'bg-yellow-500';
  else color = 'bg-red-400';
  return { pct, color };
}

// ─── Page ────────────────────────────────────────────────────────────
export default function ContactRelationsPage() {
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [relations, setRelations] = useState<ContactRelation[]>([]);
  const [loading, setLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    toContactId: '',
    type: 'WORKS_WITH' as CreateContactRelationRequest['type'],
    strength: 50,
    notes: '',
    meetingContext: '',
  });

  // ─── Load contacts ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/contacts?limit=200');
        const data = res.data?.data || res.data;
        const list: ContactOption[] = Array.isArray(data) ? data : data?.contacts || data?.items || [];
        setContacts(list);
      } catch {
        toast.error('Nie udalo sie pobrac kontaktow');
      } finally {
        setContactsLoading(false);
      }
    })();
  }, []);

  // ─── Load relations ───────────────────────────────────────────────
  const loadRelations = useCallback(async (contactId: string) => {
    if (!contactId) {
      setRelations([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await contactRelationsApi.getContactRelations({ contactId });
      const list = Array.isArray(data) ? data : [];
      setRelations(list);
    } catch {
      setError('Nie udalo sie pobrac relacji');
      toast.error('Blad podczas ladowania relacji kontaktu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedContactId) {
      loadRelations(selectedContactId);
    }
  }, [selectedContactId, loadRelations]);

  // ─── Create relation ──────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.toContactId || !selectedContactId) {
      toast.error('Wybierz kontakt docelowy');
      return;
    }
    if (form.toContactId === selectedContactId) {
      toast.error('Nie mozna utworzyc relacji z samym soba');
      return;
    }
    setFormLoading(true);
    try {
      const req: CreateContactRelationRequest = {
        fromContactId: selectedContactId,
        toContactId: form.toContactId,
        type: form.type,
        strength: form.strength,
        notes: form.notes.trim() || undefined,
        meetingContext: form.meetingContext.trim() || undefined,
      };
      await contactRelationsApi.createContactRelation(req);
      toast.success('Relacja utworzona');
      setShowForm(false);
      setForm({ toContactId: '', type: 'WORKS_WITH', strength: 50, notes: '', meetingContext: '' });
      loadRelations(selectedContactId);
    } catch {
      toast.error('Nie udalo sie utworzyc relacji');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Delete relation ──────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunac te relacje?')) return;
    try {
      await contactRelationsApi.deleteContactRelation(id);
      toast.success('Relacja usunieta');
      loadRelations(selectedContactId);
    } catch {
      toast.error('Nie udalo sie usunac relacji');
    }
  };

  // Currently selected contact name
  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relacje kontaktow</h1>
          <p className="text-sm text-gray-500 mt-1">Mapuj powiazania i sile relacji miedzy kontaktami</p>
        </div>
        {selectedContactId && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Dodaj relacje
          </button>
        )}
      </div>

      {/* Contact selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Wybierz kontakt</label>
        {contactsLoading ? (
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        ) : (
          <select
            value={selectedContactId}
            onChange={(e) => setSelectedContactId(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">-- Wybierz kontakt --</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* No contact selected */}
      {!selectedContactId && !contactsLoading && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H9m6 0a5.97 5.97 0 01-.786-3.07M9 19.128v-.003c0-1.113.285-2.16.786-3.07m0 0a5.97 5.97 0 019.428 0M9.786 16.058A5.965 5.965 0 0112 15c1.042 0 2.022.266 2.876.734" /></svg>
          <p className="mt-3 text-gray-500">Wybierz kontakt, aby zobaczyc jego relacje</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-gray-500">Ladowanie...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
          <button onClick={() => loadRelations(selectedContactId)} className="ml-3 underline">
            Sprobuj ponownie
          </button>
        </div>
      )}

      {/* Relations list */}
      {!loading && !error && selectedContactId && (
        <>
          {/* Summary */}
          {relations.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-2xl font-bold text-gray-900">{relations.length}</div>
                <div className="text-xs text-gray-500">Relacje razem</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {relations.length > 0
                    ? Math.round(relations.reduce((s, r) => s + (r.strength || 0), 0) / relations.length)
                    : 0}
                </div>
                <div className="text-xs text-gray-500">Srednia sila relacji</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-2xl font-bold text-green-600">
                  {relations.filter((r) => (r.strength || 0) >= 70).length}
                </div>
                <div className="text-xs text-gray-500">Silne relacje (70+)</div>
              </div>
            </div>
          )}

          {relations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">
                {selectedContact
                  ? `${contactName(selectedContact)} nie ma jeszcze zadnych relacji`
                  : 'Brak relacji dla tego kontaktu'}
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Dodaj pierwsza relacje
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relations.map((r) => {
                const tc = RELATION_TYPES[r.relationType] || RELATION_TYPES.KNOWS;
                const sb = strengthBar(r.strength || 0);
                // Determine which side is "the other" contact
                const isFrom = r.fromContactId === selectedContactId;
                const otherContact = isFrom ? r.toContact : r.fromContact;
                const direction = isFrom ? 'do' : 'od';

                return (
                  <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Contact name & direction */}
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
                            {otherContact?.firstName?.[0] || '?'}{otherContact?.lastName?.[0] || ''}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm">{contactName(otherContact)}</h3>
                            <span className="text-xs text-gray-400">Relacja {direction}</span>
                          </div>
                        </div>

                        {/* Type badge */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tc.color}`}>
                            {tc.label}
                          </span>
                          {r.isBidirectional && (
                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                              Dwustronna
                            </span>
                          )}
                        </div>

                        {/* Strength bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs text-gray-500">Sila relacji</span>
                            <span className="text-xs font-medium text-gray-700">{r.strength || 0}/100</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${sb.color}`} style={{ width: `${sb.pct}%` }} />
                          </div>
                        </div>

                        {/* Notes */}
                        {r.notes && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                            <span className="font-medium">Notatki:</span> {r.notes}
                          </p>
                        )}
                        {r.discoveredVia && (
                          <p className="text-xs text-gray-400 mt-1">
                            Kontekst: {r.discoveredVia}
                          </p>
                        )}
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors shrink-0"
                        title="Usun relacje"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── Create Form Modal ────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Nowa relacja</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {/* To contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kontakt docelowy *</label>
                <select
                  value={form.toContactId}
                  onChange={(e) => setForm({ ...form, toContactId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                >
                  <option value="">-- Wybierz kontakt --</option>
                  {contacts
                    .filter((c) => c.id !== selectedContactId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ''}
                      </option>
                    ))}
                </select>
              </div>
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Typ relacji *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as CreateContactRelationRequest['type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {Object.entries(RELATION_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              {/* Strength slider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sila relacji: <span className="text-blue-600 font-semibold">{form.strength}</span>/100
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={form.strength}
                  onChange={(e) => setForm({ ...form, strength: parseInt(e.target.value) })}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Slaba</span>
                  <span>Silna</span>
                </div>
              </div>
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notatki</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                  placeholder="Dodatkowe informacje o relacji..."
                />
              </div>
              {/* Meeting Context */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kontekst poznania</label>
                <input
                  type="text"
                  value={form.meetingContext}
                  onChange={(e) => setForm({ ...form, meetingContext: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="np. Konferencja IT 2025, Spotkanie networkingowe"
                />
              </div>
              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {formLoading ? 'Tworzenie...' : 'Dodaj relacje'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
