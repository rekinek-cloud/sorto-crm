'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { entityLinksApi, type EntityLink } from '@/lib/api/entityLinks';

interface EntityLinkPanelProps {
  entityType: string;
  entityId: string;
  className?: string;
}

const ENTITY_ICONS: Record<string, string> = {
  CONTACT: '👤',
  COMPANY: '🏢',
  DEAL: '💰',
  PROJECT: '🎯',
  TASK: '✅',
  STREAM: '🌊',
  MESSAGE: '💬',
  EVENT: '📅',
};

const ENTITY_TYPES = ['CONTACT', 'COMPANY', 'DEAL', 'PROJECT', 'TASK', 'STREAM', 'MESSAGE', 'EVENT'];
const LINK_TYPES = ['RELATED', 'DEPENDS_ON', 'BLOCKS', 'PARENT', 'CHILD', 'REFERENCES'];

function StrengthStars({ strength, onChange }: { strength: number; onChange?: (v: number) => void }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(i)}
          className={`text-xs ${i <= strength ? 'text-yellow-500' : 'text-gray-300'} ${onChange ? 'cursor-pointer hover:text-yellow-400' : ''}`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

export default function EntityLinkPanel({ entityType, entityId, className = '' }: EntityLinkPanelProps) {
  const [links, setLinks] = useState<EntityLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    toEntityType: 'CONTACT',
    toEntityId: '',
    linkType: 'RELATED',
    strength: 3,
    notes: '',
  });

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await entityLinksApi.getLinks(entityType, entityId);
      setLinks(data.links || []);
    } catch (err) {
      console.error('Failed to load entity links:', err);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleCreate = async () => {
    if (!formData.toEntityId.trim()) {
      toast.error('ID encji docelowej jest wymagane');
      return;
    }
    try {
      await entityLinksApi.createLink({
        fromEntityType: entityType,
        fromEntityId: entityId,
        toEntityType: formData.toEntityType,
        toEntityId: formData.toEntityId,
        linkType: formData.linkType,
        strength: formData.strength,
        notes: formData.notes || undefined,
      });
      toast.success('Powiazanie utworzone');
      setShowForm(false);
      setFormData({ toEntityType: 'CONTACT', toEntityId: '', linkType: 'RELATED', strength: 3, notes: '' });
      fetchLinks();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Blad tworzenia powiazania');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await entityLinksApi.deleteLink(id);
      toast.success('Powiazanie usuniete');
      fetchLinks();
    } catch {
      toast.error('Blad usuwania powiazania');
    }
  };

  const getOtherEntity = (link: EntityLink) => {
    const isFrom = link.fromEntityType === entityType && link.fromEntityId === entityId;
    return {
      type: isFrom ? link.toEntityType : link.fromEntityType,
      id: isFrom ? link.toEntityId : link.fromEntityId,
    };
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow border p-4 ${className}`}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow border ${className}`}>
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Powiazania</h3>
          <p className="text-xs text-gray-500">{links.length} powiazan</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          {showForm ? 'Anuluj' : '+ Dodaj'}
        </button>
      </div>

      {showForm && (
        <div className="p-4 border-b bg-gray-50 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600 block mb-1">Typ encji</label>
              <select
                value={formData.toEntityType}
                onChange={e => setFormData(p => ({ ...p, toEntityType: e.target.value }))}
                className="w-full text-sm border rounded px-2 py-1.5"
              >
                {ENTITY_TYPES.map(t => (
                  <option key={t} value={t}>{ENTITY_ICONS[t]} {t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Typ linku</label>
              <select
                value={formData.linkType}
                onChange={e => setFormData(p => ({ ...p, linkType: e.target.value }))}
                className="w-full text-sm border rounded px-2 py-1.5"
              >
                {LINK_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">ID encji docelowej</label>
            <input
              type="text"
              value={formData.toEntityId}
              onChange={e => setFormData(p => ({ ...p, toEntityId: e.target.value }))}
              placeholder="UUID encji..."
              className="w-full text-sm border rounded px-2 py-1.5"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600">Sila:</span>
            <StrengthStars strength={formData.strength} onChange={v => setFormData(p => ({ ...p, strength: v }))} />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">Notatki</label>
            <input
              type="text"
              value={formData.notes}
              onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
              placeholder="Opcjonalne..."
              className="w-full text-sm border rounded px-2 py-1.5"
            />
          </div>
          <button
            onClick={handleCreate}
            className="w-full px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Utworz powiazanie
          </button>
        </div>
      )}

      <div className="divide-y max-h-80 overflow-y-auto">
        {links.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">Brak powiazan</div>
        ) : (
          links.map(link => {
            const other = getOtherEntity(link);
            return (
              <div key={link.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-lg">{ENTITY_ICONS[other.type] || '📋'}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-700 truncate">
                      {other.type} <span className="text-gray-400 font-mono">{other.id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded">{link.linkType}</span>
                      <StrengthStars strength={link.strength} />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(link.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                  title="Usun"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
