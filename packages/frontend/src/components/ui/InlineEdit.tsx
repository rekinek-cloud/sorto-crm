'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineEditProps {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  type?: 'text' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  displayClassName?: string;
  inputClassName?: string;
  renderDisplay?: (value: string) => React.ReactNode;
}

export function InlineEdit({
  value,
  onSave,
  type = 'text',
  options,
  placeholder = 'Kliknij aby edytowac...',
  className,
  displayClassName,
  inputClassName,
  renderDisplay,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [editing]);

  const handleSave = useCallback(async () => {
    if (editValue === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(editValue);
      setEditing(false);
    } catch {
      setEditValue(value);
    } finally {
      setSaving(false);
    }
  }, [editValue, value, onSave]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setEditing(false);
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  }, [handleSave, handleCancel]);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className={cn(
          'group inline-flex items-center gap-1 text-left rounded-lg px-1.5 py-0.5 -mx-1.5 -my-0.5',
          'hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
          className,
          displayClassName
        )}
      >
        {renderDisplay ? renderDisplay(value) : (
          <span className={cn(!value && 'text-slate-400 dark:text-slate-500 italic')}>
            {value || placeholder}
          </span>
        )}
        <Pencil className="w-3 h-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  if (type === 'select' && options) {
    return (
      <div className={cn('inline-flex items-center gap-1', className)}>
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            // Auto-save on select change
            setSaving(true);
            Promise.resolve(onSave(e.target.value))
              .then(() => setEditing(false))
              .finally(() => setSaving(false));
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleCancel}
          disabled={saving}
          className={cn(
            'text-sm border border-blue-300 dark:border-blue-600 rounded-lg px-2 py-1',
            'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            inputClassName
          )}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        disabled={saving}
        className={cn(
          'text-sm border border-blue-300 dark:border-blue-600 rounded-lg px-2 py-1',
          'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          inputClassName
        )}
      />
      {saving && (
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  );
}

export default InlineEdit;
