'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UndoToastState {
  id: string;
  message: string;
  onUndo: () => void;
  onConfirm: () => void;
  duration?: number;
}

let addToastFn: ((toast: Omit<UndoToastState, 'id'>) => void) | null = null;

export function showUndoToast(message: string, onUndo: () => void, onConfirm: () => void, duration = 5000) {
  addToastFn?.({ message, onUndo, onConfirm, duration });
}

export function UndoToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<UndoToastState[]>([]);

  const addToast = useCallback((toast: Omit<UndoToastState, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string, undo: boolean) => {
    setToasts(prev => {
      const toast = prev.find(t => t.id === id);
      if (toast) {
        if (undo) toast.onUndo();
        else toast.onConfirm();
      }
      return prev.filter(t => t.id !== id);
    });
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  return (
    <>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <UndoToastItem
              key={toast.id}
              toast={toast}
              onDismiss={(undo) => removeToast(toast.id, undo)}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

function UndoToastItem({ toast, onDismiss }: { toast: UndoToastState; onDismiss: (undo: boolean) => void }) {
  const duration = toast.duration || 5000;
  const [remaining, setRemaining] = useState(duration);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 100) {
          clearInterval(intervalRef.current!);
          onDismiss(false);
          return 0;
        }
        return prev - 100;
      });
    }, 100);
    return () => clearInterval(intervalRef.current!);
  }, [duration, onDismiss]);

  const progress = remaining / duration;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 min-w-[300px]"
    >
      <div className="flex-1 text-sm font-medium">{toast.message}</div>
      <button
        onClick={() => { clearInterval(intervalRef.current!); onDismiss(true); }}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/20 dark:bg-slate-900/20 hover:bg-white/30 dark:hover:bg-slate-900/30 text-sm font-medium transition-colors"
      >
        <Undo2 className="w-3.5 h-3.5" />
        Cofnij ({Math.ceil(remaining / 1000)}s)
      </button>
      <button
        onClick={() => { clearInterval(intervalRef.current!); onDismiss(false); }}
        className="p-1 rounded-lg hover:bg-white/20 dark:hover:bg-slate-900/20 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 dark:bg-slate-900/10 rounded-b-xl overflow-hidden">
        <motion.div
          className="h-full bg-blue-400 dark:bg-blue-600"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </motion.div>
  );
}

export default UndoToastProvider;
