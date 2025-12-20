'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { SmartMailboxRule } from './types'
import { communicationApi } from '@/lib/api/communication'

interface MailboxPreviewProps {
  rules: SmartMailboxRule[]
  isVisible: boolean
}

interface PreviewMessage {
  id: string
  subject: string
  fromName?: string
  fromAddress: string
  urgencyScore?: number
  receivedAt: string
  attachments?: any[]
}

export function MailboxPreview({ rules, isVisible }: MailboxPreviewProps) {
  const [previewMessages, setPreviewMessages] = useState<PreviewMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    if (isVisible && rules.length > 0) {
      loadPreview()
    }
  }, [rules, isVisible])

  const loadPreview = async () => {
    if (rules.length === 0) return

    try {
      setLoading(true)
      
      // Simulate API call for preview
      // In real implementation, this would call a preview endpoint
      const allMessages = await communicationApi.getMessages()
      
      // Client-side filtering for preview (in production, this should be server-side)
      const filteredMessages = allMessages.filter((message: any) => 
        matchesRules(message, rules)
      ).slice(0, 5) // Show only first 5 for preview

      setPreviewMessages(filteredMessages.map(msg => ({
        id: msg.id,
        subject: msg.subject || 'Bez tematu',
        fromName: msg.fromName,
        fromAddress: msg.fromAddress,
        urgencyScore: msg.urgencyScore,
        receivedAt: msg.receivedAt,
        attachments: (msg as any).attachments
      })))
      setTotalCount(allMessages.filter((message: any) => matchesRules(message, rules)).length)
    } catch (error: any) {
      console.error('Error loading preview:', error)
    } finally {
      setLoading(false)
    }
  }

  // Client-side rule matching (simplified version)
  const matchesRules = (message: any, rules: SmartMailboxRule[]): boolean => {
    if (rules.length === 0) return false

    let result = evaluateRule(message, rules[0])
    
    for (let i = 1; i < rules.length; i++) {
      const ruleResult = evaluateRule(message, rules[i])
      if (rules[i].logicOperator === 'AND') {
        result = result && ruleResult
      } else {
        result = result || ruleResult
      }
    }

    return result
  }

  const evaluateRule = (message: any, rule: SmartMailboxRule): boolean => {
    const { field, operator, value } = rule

    switch (field) {
      case 'subject':
        if (operator === 'contains') {
          return message.subject?.toLowerCase().includes(value.toLowerCase()) || false
        }
        if (operator === 'starts_with') {
          return message.subject?.toLowerCase().startsWith(value.toLowerCase()) || false
        }
        break

      case 'content':
        if (operator === 'contains') {
          return message.content?.toLowerCase().includes(value.toLowerCase()) || false
        }
        break

      case 'fromAddress':
        if (operator === 'equals') {
          return message.fromAddress === value
        }
        if (operator === 'contains') {
          return message.fromAddress?.toLowerCase().includes(value.toLowerCase()) || false
        }
        break

      case 'urgencyScore':
        const score = message.urgencyScore || 0
        if (operator === 'greater_than') {
          return score > parseFloat(value)
        }
        if (operator === 'less_than') {
          return score < parseFloat(value)
        }
        if (operator === 'equals') {
          return score === parseFloat(value)
        }
        break

      case 'priority':
        return message.priority === value

      case 'actionNeeded':
        return message.actionNeeded === (value === 'true')

      case 'autoProcessed':
        return message.autoProcessed === (value === 'true')

      case 'needsResponse':
        return message.needsResponse === (value === 'true')

      case 'attachments':
        if (operator === 'not_empty') {
          return message.attachments && message.attachments.length > 0
        }
        break

      case 'receivedAt':
        if (operator === 'equals' && value === 'today') {
          const today = new Date().toDateString()
          const messageDate = new Date(message.receivedAt).toDateString()
          return today === messageDate
        }
        break
    }

    return false
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-6"
    >
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-slate-800 dark:text-white">
            🔍 Podgląd wyników
          </h4>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {loading ? (
              <span className="flex items-center space-x-2">
                <span className="animate-spin">⏳</span>
                <span>Ładowanie...</span>
              </span>
            ) : (
              <span>
                {totalCount} {totalCount === 1 ? 'wiadomość' : 'wiadomości'}
                {previewMessages.length < totalCount && ` (pokazano ${previewMessages.length})`}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-slate-200 dark:bg-slate-700 h-16 rounded-lg"></div>
            ))}
          </div>
        ) : previewMessages.length > 0 ? (
          <div className="space-y-2">
            {previewMessages.map((message) => (
              <motion.div
                key={message.id}
                className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200/50 dark:border-slate-700/50"
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
                        {message.fromName || message.fromAddress}
                      </span>
                      {message.urgencyScore && message.urgencyScore > 70 && (
                        <span className="px-1.5 py-0.5 bg-red-500/20 text-red-700 text-xs rounded">
                          🔥 {Math.round(message.urgencyScore)}
                        </span>
                      )}
                      {message.attachments && message.attachments.length > 0 && (
                        <span className="text-slate-500">📎</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                      {message.subject || '(Brak tematu)'}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 ml-2 whitespace-nowrap">
                    {formatDate(message.receivedAt)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : rules.length > 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <div className="text-4xl mb-2">📭</div>
            <p className="font-medium">Brak pasujących wiadomości</p>
            <p className="text-sm mt-1">
              Spróbuj zmienić reguły aby znaleźć więcej wiadomości
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <div className="text-4xl mb-2">⚙️</div>
            <p className="font-medium">Dodaj reguły</p>
            <p className="text-sm mt-1">
              Aby zobaczyć podgląd, najpierw dodaj przynajmniej jedną regułę
            </p>
          </div>
        )}

        {rules.length > 0 && !loading && (
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
              <span>💡</span>
              <span>
                {totalCount === 0
                  ? 'Spróbuj inne kryteria aby znaleźć wiadomości'
                  : totalCount === 1
                  ? 'Znaleziono jedną pasującą wiadomość'
                  : `Znaleziono ${totalCount} pasujących wiadomości`
                }
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}