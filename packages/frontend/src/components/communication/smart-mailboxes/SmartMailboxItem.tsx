'use client'

import { motion } from 'framer-motion'
import { SmartMailboxItemProps, mailboxColors } from './types'

export function SmartMailboxItem({
  mailbox,
  isActive,
  isCustom = false,
  onClick,
  onEdit,
  onDelete
}: SmartMailboxItemProps) {
  const colorScheme = mailboxColors[mailbox.color as keyof typeof mailboxColors] || mailboxColors.blue

  return (
    <motion.div
      className={`
        relative flex items-center justify-between p-3 rounded-xl 
        transition-all duration-200 cursor-pointer group hover-lift
        ${isActive 
          ? 'glass bg-blue-500/20 border border-blue-300/30 shadow-md' 
          : 'bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/20'
        }
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <span className="text-xl flex-shrink-0">{mailbox.icon}</span>
        <span className="font-medium text-slate-800 dark:text-white truncate">
          {mailbox.name}
        </span>
      </div>
      
      <div className="flex items-center space-x-2 flex-shrink-0">
        {mailbox.count !== undefined && mailbox.count > 0 && (
          <motion.span
            className="glass bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full text-xs font-medium border border-emerald-300/30"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            key={mailbox.count}
          >
            {mailbox.count}
          </motion.span>
        )}
        
        {isCustom && (
          <div className="opacity-0 group-hover:opacity-100 flex space-x-1 transition-all duration-300">
            {onEdit && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="glass bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 p-1.5 rounded-lg transition-all hover:scale-105"
                title="Edit mailbox"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </motion.button>
            )}
            {onDelete && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="glass bg-red-500/20 hover:bg-red-500/30 text-red-700 dark:text-red-300 p-1.5 rounded-lg transition-all hover:scale-105"
                title="Delete mailbox"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </motion.button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}