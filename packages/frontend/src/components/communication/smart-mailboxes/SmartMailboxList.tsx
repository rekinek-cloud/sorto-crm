'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SmartMailboxItem } from './SmartMailboxItem'
import { SmartMailboxBuilder } from './SmartMailboxBuilder'
import { SmartMailboxListProps, SmartMailbox } from './types'
import { getSmartMailboxes, deleteSmartMailbox } from '@/lib/api/smartMailboxes'
import { toast } from 'react-hot-toast'

export function SmartMailboxList({
  selectedMailboxId,
  onSelectMailbox
}: SmartMailboxListProps) {
  const [mailboxes, setMailboxes] = useState<SmartMailbox[]>([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingMailbox, setEditingMailbox] = useState<SmartMailbox | null>(null)

  useEffect(() => {
    loadMailboxes()
  }, [])

  const loadMailboxes = async () => {
    try {
      setLoading(true)
      const data = await getSmartMailboxes()
      setMailboxes(data)
    } catch (error: any) {
      console.error('Error loading smart mailboxes:', error)
      toast.error('Nie udało się załadować smart mailboxów')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMailbox = async (mailboxId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę skrzynkę?')) return

    try {
      await deleteSmartMailbox(mailboxId)
      toast.success('Skrzynka została usunięta')
      loadMailboxes()
      
      // If deleted mailbox was selected, clear selection
      if (selectedMailboxId === mailboxId) {
        onSelectMailbox('')
      }
    } catch (error: any) {
      console.error('Error deleting mailbox:', error)
      toast.error('Nie udało się usunąć skrzynki')
    }
  }

  const handleEditMailbox = (mailbox: SmartMailbox) => {
    setEditingMailbox(mailbox)
    setShowBuilder(true)
  }

  const handleBuilderClose = () => {
    setShowBuilder(false)
    setEditingMailbox(null)
    loadMailboxes()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-white/20 rounded w-48 animate-pulse"></div>
          <div className="h-8 bg-white/10 rounded-lg w-20 animate-pulse"></div>
        </div>
        <div className="glass-card p-4 space-y-3">
          <div className="h-4 bg-white/20 rounded w-24 animate-pulse"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-white/10 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const builtInMailboxes = mailboxes.filter(m => m.isBuiltIn)
  const customMailboxes = mailboxes.filter(m => !m.isBuiltIn)

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
            📮 Smart Mailboxes
          </h2>
          <motion.button
            onClick={() => setShowBuilder(true)}
            className="glass bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 dark:text-blue-300 text-xs rounded-lg px-3 py-2 transition-all hover:scale-105 flex items-center space-x-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>➕</span>
            <span>Nowa</span>
          </motion.button>
        </div>

        {/* Built-in Section */}
        <motion.div 
          className="glass-card p-4 space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center">
            🏠 Wbudowane
          </h3>
          <div className="space-y-2">
            {builtInMailboxes.map((mailbox) => (
              <SmartMailboxItem
                key={mailbox.id}
                mailbox={mailbox}
                isActive={selectedMailboxId === mailbox.id}
                onClick={() => onSelectMailbox(mailbox.id)}
              />
            ))}
          </div>
        </motion.div>

        {/* Custom Section */}
        {customMailboxes.length > 0 && (
          <motion.div 
            className="glass-card p-4 space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center">
              ⚡ Własne
            </h3>
            <div className="space-y-2">
              {customMailboxes.map((mailbox) => (
                <SmartMailboxItem
                  key={mailbox.id}
                  mailbox={mailbox}
                  isActive={selectedMailboxId === mailbox.id}
                  isCustom={true}
                  onClick={() => onSelectMailbox(mailbox.id)}
                  onEdit={() => handleEditMailbox(mailbox)}
                  onDelete={() => handleDeleteMailbox(mailbox.id)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State for Custom */}
        {customMailboxes.length === 0 && (
          <motion.div 
            className="glass-card p-6 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="text-4xl mb-3">📮</div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Brak własnych skrzynek
            </p>
            <motion.button
              onClick={() => setShowBuilder(true)}
              className="glass bg-purple-500/20 hover:bg-purple-500/30 text-purple-700 dark:text-purple-300 text-sm rounded-lg px-4 py-2 transition-all hover:scale-105"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Utwórz pierwszą skrzynkę →
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Builder Modal */}
      <AnimatePresence>
        {showBuilder && (
          <SmartMailboxBuilder
            mailbox={editingMailbox}
            onClose={handleBuilderClose}
          />
        )}
      </AnimatePresence>
    </>
  )
}