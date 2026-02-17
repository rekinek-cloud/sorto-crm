'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SmartMailboxBuilder } from '@/components/communication/smart-mailboxes/SmartMailboxBuilder'
import { getSmartMailboxMessages, getSmartMailboxes, archiveMessage, deleteMessage, deleteSmartMailbox, analyzeMessage, AnalysisProposal } from '@/lib/api/smartMailboxes'
import { communicationApi, CommunicationChannel } from '@/lib/api/communication'
import { getUnifiedRules, executeUnifiedRule, UnifiedRule } from '@/lib/api/unifiedRules'
import { useMessageFilters } from '@/hooks/useMessageFilters'
import { toast } from 'react-hot-toast'
import {
  Mail,
  CheckCircle2,
  Plus,
  Filter,
  Search,
  X,
  CalendarDays,
  Paperclip,
  Eye,
  EyeOff,
  Clock,
  ChevronDown,
  ChevronUp,
  Archive,
  Trash2,
  Inbox,
  Check,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Zap,
  Flame,
  Star,
  CircleUser,
  Settings,
  FileText,
  Tag,
  Pencil,
  Scan
} from 'lucide-react'

import QuickCaptureModal from '@/components/gtd/QuickCaptureModal'
import ProcessInboxModal from '@/components/gtd/ProcessInboxModal'
import { sourceInboxApi } from '@/lib/api/sourceInbox'
import EmailWriterModal from '@/components/email/EmailWriterModal'
import AnalysisPreviewModal from '@/components/email/AnalysisPreviewModal'

const GLASS_CARD = 'bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm'

interface SmartMailbox {
  id: string
  name: string
  icon: string
  color: string
  description?: string
  isBuiltIn: boolean
  messageCount?: number
  count?: number
  rules?: Array<{
    id?: string
    field: string
    operator: string
    value: string
    logicOperator?: 'AND' | 'OR'
  }>
}

// Map mailbox icon string to Lucide icons
const getMailboxIcon = (iconStr: string, className = "w-5 h-5") => {
  const icons: Record<string, JSX.Element> = {
    'fire': <Flame className={className} />,
    'clock': <Clock className={className} />,
    'star': <Star className={className} />,
    'paperclip': <Paperclip className={className} />,
    'sparkles': <Sparkles className={className} />,
    'inbox': <Inbox className={className} />,
    'bolt': <Zap className={className} />,
    'exclamation': <AlertCircle className={className} />,
  }

  // Try to match known patterns
  const lower = iconStr?.toLowerCase() || ''
  if (lower.includes('fire') || lower.includes('action') || lower.includes('urgent')) return icons.fire
  if (lower.includes('clock') || lower.includes('today') || lower.includes('time')) return icons.clock
  if (lower.includes('star') || lower.includes('vip') || lower.includes('important')) return icons.star
  if (lower.includes('paper') || lower.includes('attach')) return icons.paperclip
  if (lower.includes('spark') || lower.includes('ai') || lower.includes('auto')) return icons.sparkles
  if (lower.includes('wait') || lower.includes('pending')) return icons.clock
  if (lower.includes('priority') || lower.includes('high')) return icons.bolt

  return <Mail className={className} />
}

// Channel icon mapping
const getChannelIcon = (channelName: string, className = "w-4 h-4") => {
  if (!channelName) return <Mail className={className} />
  const name = channelName.toLowerCase()

  if (name.includes('gmail') || name.includes('email') || name.includes('mail'))
    return <Mail className={className} />
  if (name.includes('slack') || name.includes('teams') || name.includes('chat'))
    return <FileText className={className} />

  return <Mail className={className} />
}

export default function SmartMailboxesPage() {
  const [selectedMailboxId, setSelectedMailboxId] = useState<string>('all')
  const [mailboxes, setMailboxes] = useState<SmartMailbox[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingMailbox, setEditingMailbox] = useState<SmartMailbox | null>(null)
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null)
  const [allMessages, setAllMessages] = useState<any[]>([])
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([])
  const [channels, setChannels] = useState<CommunicationChannel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)

  // GTD & Email states
  const [showGTDModal, setShowGTDModal] = useState(false)
  const [showEmailWriterModal, setShowEmailWriterModal] = useState(false)
  const [currentMessage, setCurrentMessage] = useState<any>(null)

  // Analysis preview modal state
  const [showAnalysisPreview, setShowAnalysisPreview] = useState(false)
  const [analysisClassification, setAnalysisClassification] = useState('')
  const [analysisConfidence, setAnalysisConfidence] = useState(0)
  const [analysisProposals, setAnalysisProposals] = useState<AnalysisProposal[]>([])
  const [analysisText, setAnalysisText] = useState<string | null>(null)

  // Advanced filters panel visibility
  const [showFilters, setShowFilters] = useState(false)

  const {
    filters,
    sortConfig,
    showFilters: hookShowFilters,
    availableChannels,
    filteredMessages,
    totalMessages,
    filteredCount,
    setFilters,
    setSortConfig,
    setShowFilters: setHookShowFilters,
    clearFilters
  } = useMessageFilters(allMessages)

  // Use local showFilters state (already defined above) or sync with hook
  // const showFilters and setShowFilters are defined locally above

  const [mailboxesLoaded, setMailboxesLoaded] = useState(false)

  useEffect(() => {
    loadMailboxes()
    loadChannels()
  }, [])

  useEffect(() => {
    if (!mailboxesLoaded) return
    loadMessages()
  }, [selectedMailboxId, selectedChannelId, mailboxesLoaded, mailboxes])

  // Auto-refresh messages and channels every 30s
  useEffect(() => {
    if (!mailboxesLoaded) return
    const interval = setInterval(() => {
      loadMessages()
      loadChannels()
    }, 30000)
    return () => clearInterval(interval)
  }, [mailboxesLoaded, selectedMailboxId, selectedChannelId, mailboxes])

  const loadMailboxes = async () => {
    try {
      const data = await getSmartMailboxes()
      setMailboxes(data)
    } catch (error: any) {
      console.error('Error loading mailboxes:', error)
    } finally {
      setMailboxesLoaded(true)
    }
  }

  const loadChannels = async () => {
    try {
      const data = await communicationApi.getChannels()
      setChannels(data)
    } catch (error: any) {
      console.error('Error loading channels:', error)
    }
  }

  const [syncingChannelId, setSyncingChannelId] = useState<string | null>(null)

  const handleSyncChannel = async (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (syncingChannelId) return
    try {
      setSyncingChannelId(channelId)
      const result = await communicationApi.syncChannel(channelId)
      if (result.syncedCount > 0) {
        toast.success(`Pobrano ${result.syncedCount} nowych wiadomosci`)
      } else {
        toast.success('Synchronizacja zakonczona - brak nowych wiadomosci')
      }
      await loadChannels()
      await loadMessages()
    } catch (error: any) {
      console.error('Error syncing channel:', error)
      toast.error('Blad synchronizacji kanalu')
    } finally {
      setSyncingChannelId(null)
    }
  }

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Nigdy'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Teraz'
    if (diffMin < 60) return `${diffMin} min temu`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH} godz. temu`
    const diffD = Math.floor(diffH / 24)
    return `${diffD} dni temu`
  }

  const loadMessages = async () => {
    try {
      setLoading(true)
      let messagesData: any[] = []

      // If a channel is selected, load messages directly from communication API
      if (selectedChannelId) {
        messagesData = await communicationApi.getMessages({ channelId: selectedChannelId, limit: 500 })
      } else if (selectedMailboxId === 'all') {
        if (mailboxes.length > 0) {
          // Load from smart mailboxes
          const allMailboxData = await Promise.all(
            mailboxes.map(async (mailbox) => {
              try {
                const data = await getSmartMailboxMessages(mailbox.id, 1, { limit: 500 })
                return data.messages || []
              } catch { return [] }
            })
          )
          messagesData = allMailboxData.flat()
          const uniqueMessages = messagesData.filter((msg, idx, self) =>
            idx === self.findIndex(m => m.id === msg.id)
          )
          messagesData = uniqueMessages
        } else {
          // No mailboxes defined - load all messages from communication API
          messagesData = await communicationApi.getMessages({ limit: 500 })
        }
      } else {
        const data = await getSmartMailboxMessages(selectedMailboxId, 1, { limit: 500 })
        messagesData = data.messages || []
      }

      setAllMessages(messagesData)
    } catch (error: any) {
      console.error('Error loading messages:', error)
      toast.error('Nie udalo sie zaladowac wiadomosci')
      setAllMessages([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (refreshing || loading) return
    try {
      setRefreshing(true)
      await loadMessages()
      toast.success('Wiadomosci odswiezone')
    } finally {
      setRefreshing(false)
    }
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value }
      if (key === 'dateRange' && value !== 'CUSTOM') {
        newFilters.customDateFrom = ''
        newFilters.customDateTo = ''
      }
      return newFilters
    })
  }

  const handleSortChange = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  const toggleMessageSelection = (id: string) => {
    setSelectedMessageIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectAllMessages = () => {
    setSelectedMessageIds(filteredMessages.map((m: any) => m.id))
  }

  const deselectAllMessages = () => {
    setSelectedMessageIds([])
  }

  const handleArchive = async (id: string) => {
    try {
      await archiveMessage(id)
      toast.success('Wiadomosc zarchiwizowana')
      loadMessages()
    } catch {
      toast.error('Blad archiwizacji')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Usunac wiadomosc?')) return
    try {
      await deleteMessage(id)
      toast.success('Wiadomosc usunieta')
      loadMessages()
    } catch {
      toast.error('Blad usuwania')
    }
  }

  const handleAnalyze = async (id: string) => {
    const toastId = toast.loading('Analizowanie wiadomosci...')
    try {
      const result = await analyzeMessage(id)
      toast.dismiss(toastId)

      if (result.data?.requiresReview && result.data.proposals?.length > 0) {
        // Open preview modal with proposals for human review
        setAnalysisClassification(result.data.classification || 'N/A')
        setAnalysisConfidence(result.data.confidence || 0)
        setAnalysisProposals(result.data.proposals)
        setAnalysisText(result.data.analysis)
        setShowAnalysisPreview(true)
        toast.success(`Analiza: ${result.data.classification}. ${result.data.proposals.length} propozycji do zatwierdzenia.`, { duration: 3000 })
      } else {
        // No proposals (auto-created or no entities found)
        const created = result.data?.entitiesCreated || []
        const classification = result.data?.classification || 'N/A'
        const msg = created.length > 0
          ? `Analiza: ${classification}. Utworzono: ${created.length} encji CRM`
          : `Analiza: ${classification}`
        toast.success(msg)
      }
      loadMessages()
    } catch {
      toast.error('Blad analizy AI', { id: toastId })
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedMessageIds.length === 0) return

    try {
      if (action === 'archive') {
        await Promise.all(selectedMessageIds.map(id => archiveMessage(id)))
        toast.success(`Zarchiwizowano ${selectedMessageIds.length} wiadomosci`)
      } else if (action === 'delete') {
        if (!confirm(`Usunac ${selectedMessageIds.length} wiadomosci?`)) return
        await Promise.all(selectedMessageIds.map(id => deleteMessage(id)))
        toast.success(`Usunieto ${selectedMessageIds.length} wiadomosci`)
      }
      setSelectedMessageIds([])
      loadMessages()
    } catch {
      toast.error('Blad operacji zbiorczej')
    }
  }

  const handleGTDQuickAction = async (message: any, action: 'INBOX' | 'DO' | 'DEFER') => {
    try {
      const inboxItem = {
        content: message.subject || 'Wiadomosc email',
        note: `Od: ${message.fromName || message.fromAddress}\n${message.content?.substring(0, 300) || ''}`,
        sourceType: 'EMAIL',
        urgencyScore: action === 'DO' ? 85 : action === 'DEFER' ? 60 : 50,
        actionable: true
      }

      await sourceInboxApi.quickCapture(inboxItem as any)
      toast.success(`Dodano do ${action === 'INBOX' ? 'Inbox' : action === 'DO' ? 'Do zrobienia' : 'Odlozone'}`)
    } catch {
      toast.error('Blad przetwarzania')
    }
  }

  const handleEditMailbox = (mailbox: SmartMailbox) => {
    setEditingMailbox(mailbox)
    setShowBuilder(true)
  }

  const handleDeleteMailbox = async (mailboxId: string, mailboxName: string) => {
    if (!confirm(`Czy na pewno chcesz usunac skrzynke "${mailboxName}"?`)) return
    try {
      await deleteSmartMailbox(mailboxId)
      toast.success('Skrzynka usunieta')
      if (selectedMailboxId === mailboxId) {
        setSelectedMailboxId('all')
      }
      loadMailboxes()
    } catch {
      toast.error('Blad usuwania skrzynki')
    }
  }

  const selectedMailbox = selectedMailboxId === 'all'
    ? { id: 'all', name: 'Wszystkie', icon: 'inbox', isBuiltIn: true }
    : mailboxes.find(m => m.id === selectedMailboxId)

  const builtInMailboxes = mailboxes.filter(m => m.isBuiltIn)
  const customMailboxes = mailboxes.filter(m => !m.isBuiltIn)

  const stats = {
    total: totalMessages,
    unread: filteredMessages.filter((m: any) => !m.isRead).length,
    urgent: filteredMessages.filter((m: any) => m.urgencyScore && m.urgencyScore > 70).length,
    processed: filteredMessages.filter((m: any) => m.autoProcessed).length
  }

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'channels') return (value as string[]).length > 0
    if (key === 'customDateFrom' || key === 'customDateTo') return value !== ''
    return value !== 'ALL' && value !== '' && value !== 0 && value !== 100
  }).length

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 -m-6">
      {/* Header - compact */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 sticky top-0 z-30">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-base font-semibold text-slate-900 dark:text-white">
              Smart Mailboxes
            </h1>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {stats.total} wiadomosci
            </span>
            {selectedChannelId && (
              <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                {channels.find(c => c.id === selectedChannelId)?.name || 'Kanal'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              title="Odswiez"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowBuilder(true)}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nowa</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)]">
        {/* Sidebar - mailboxes */}
        <aside className="w-full lg:w-56 flex-shrink-0 bg-white/60 backdrop-blur-lg dark:bg-slate-800/60 border-b lg:border-b-0 lg:border-r border-white/20 dark:border-slate-700/30 overflow-y-auto">
          <div className="p-3">
            {/* All mailbox */}
            <button
              onClick={() => { setSelectedMailboxId('all'); setSelectedChannelId(null) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                selectedMailboxId === 'all' && !selectedChannelId
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Inbox className="w-5 h-5" />
              <span className="flex-1 text-left text-sm font-medium">Wszystkie</span>
              <span className="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-0.5 rounded-full">
                {mailboxes.reduce((acc, m) => acc + (m.count || m.messageCount || 0), 0)}
              </span>
            </button>

            {/* Built-in mailboxes */}
            {builtInMailboxes.length > 0 && (
              <div className="mt-4">
                <h3 className="px-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Wbudowane
                </h3>
                <div className="space-y-1">
                  {builtInMailboxes.map(mailbox => (
                    <button
                      key={mailbox.id}
                      onClick={() => { setSelectedMailboxId(mailbox.id); setSelectedChannelId(null) }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        selectedMailboxId === mailbox.id
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {getMailboxIcon(mailbox.icon || mailbox.name)}
                      <span className="flex-1 text-left text-sm truncate">{mailbox.name}</span>
                      {(mailbox.count || mailbox.messageCount) ? (
                        <span className="text-xs text-slate-500 dark:text-slate-400">{mailbox.count || mailbox.messageCount}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom mailboxes */}
            {customMailboxes.length > 0 && (
              <div className="mt-4">
                <h3 className="px-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Wlasne
                </h3>
                <div className="space-y-1">
                  {customMailboxes.map(mailbox => (
                    <div
                      key={mailbox.id}
                      className={`group w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                        selectedMailboxId === mailbox.id
                          ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                      onClick={() => { setSelectedMailboxId(mailbox.id); setSelectedChannelId(null) }}
                    >
                      <Zap className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1 text-left text-sm truncate">{mailbox.name}</span>
                      {(mailbox.count || mailbox.messageCount) ? (
                        <span className="text-xs text-slate-500 dark:text-slate-400">{mailbox.count || mailbox.messageCount}</span>
                      ) : null}
                      {/* Edit/Delete buttons */}
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditMailbox(mailbox as any)
                          }}
                          className="p-1 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded"
                          title="Edytuj"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteMailbox(mailbox.id, mailbox.name)
                          }}
                          className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          title="Usun"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Channels section */}
            {channels.length > 0 && (
              <div className="mt-4">
                <h3 className="px-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Kanaly ({channels.length})
                </h3>
                <div className="space-y-1">
                  {channels.map(channel => (
                    <div key={channel.id}>
                      <button
                        onClick={() => {
                          if (selectedChannelId === channel.id) {
                            setSelectedChannelId(null)
                          } else {
                            setSelectedChannelId(channel.id)
                            setSelectedMailboxId('all')
                          }
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                          selectedChannelId === channel.id
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                        }`}
                      >
                        {getChannelIcon(channel.type || channel.name)}
                        <span className="flex-1 text-left text-sm truncate">{channel.name}</span>
                        <button
                          onClick={(e) => handleSyncChannel(channel.id, e)}
                          disabled={syncingChannelId === channel.id}
                          className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                          title="Synchronizuj"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${syncingChannelId === channel.id ? 'animate-spin' : ''}`} />
                        </button>
                        {!channel.active && (
                          <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-600 px-1 rounded">OFF</span>
                        )}
                      </button>
                      {/* Last sync info */}
                      <div className="px-3 pb-1">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          Sync: {formatTimeAgo(channel.lastSyncAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-3 overflow-y-auto">
          {/* Search Bar */}
          <div className={`${GLASS_CARD} mb-3 p-3`}>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Szukaj w temacie, tresci, nadawcy..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                />
                {filters.search && (
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {filters.search && (
                  <span className="text-xs text-slate-500 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded">
                    {filteredCount} z {totalMessages}
                  </span>
                )}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg transition-colors ${
                    showFilters || activeFiltersCount > 0
                      ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
                  }`}
                  title="Zaawansowane filtry"
                >
                  <Filter className="w-5 h-5" />
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] bg-blue-600 text-white rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          <div className={`${GLASS_CARD} mb-3`}>
            {/* Filters Header */}
            <div className="px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white">Filtry i sortowanie</h3>
                  {activeFiltersCount > 0 && (
                    <span className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
                      {activeFiltersCount} aktywnych
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Wyczysc filtry
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Expandable Filters Content */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-4">
                    {/* Row 1: Basic Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Channels */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          <Mail className="w-3 h-3 inline mr-1" />
                          Kanaly ({filters.channels?.length || 0})
                        </label>
                        <div className="min-h-[40px] p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                          {availableChannels.length === 0 ? (
                            <span className="text-xs text-slate-400 dark:text-slate-500">Brak kanalow</span>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                              {availableChannels.map(channel => (
                                <label key={channel} className="flex items-center gap-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-600 p-1 rounded text-xs">
                                  <input
                                    type="checkbox"
                                    checked={filters.channels?.includes(channel) || false}
                                    onChange={() => {
                                      const channels = filters.channels || []
                                      if (channels.includes(channel)) {
                                        handleFilterChange('channels', channels.filter((c: string) => c !== channel))
                                      } else {
                                        handleFilterChange('channels', [...channels, channel])
                                      }
                                    }}
                                    className="w-3 h-3 text-blue-600 rounded"
                                  />
                                  <span className="text-slate-700 dark:text-slate-300">{channel}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Date Range */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          <CalendarDays className="w-3 h-3 inline mr-1" />
                          Okres
                        </label>
                        <select
                          value={filters.dateRange}
                          onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                        >
                          <option value="ALL">Wszystkie daty</option>
                          <option value="TODAY">Dzisiaj</option>
                          <option value="YESTERDAY">Wczoraj</option>
                          <option value="LAST_7_DAYS">Ostatnie 7 dni</option>
                          <option value="LAST_30_DAYS">Ostatnie 30 dni</option>
                          <option value="THIS_MONTH">Ten miesiac</option>
                          <option value="CUSTOM">Zakres niestandardowy</option>
                        </select>
                        {filters.dateRange === 'CUSTOM' && (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={filters.customDateFrom || ''}
                              onChange={(e) => handleFilterChange('customDateFrom', e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                            />
                            <input
                              type="date"
                              value={filters.customDateTo || ''}
                              onChange={(e) => handleFilterChange('customDateTo', e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                            />
                          </div>
                        )}
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          Priorytet
                        </label>
                        <select
                          value={filters.priority}
                          onChange={(e) => handleFilterChange('priority', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                        >
                          <option value="ALL">Wszystkie priorytety</option>
                          <option value="HIGH">Wysoki</option>
                          <option value="MEDIUM">Sredni</option>
                          <option value="LOW">Niski</option>
                        </select>
                      </div>

                      {/* Read Status */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          <Eye className="w-3 h-3 inline mr-1" />
                          Status
                        </label>
                        <select
                          value={filters.isRead}
                          onChange={(e) => handleFilterChange('isRead', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                        >
                          <option value="ALL">Wszystkie</option>
                          <option value="UNREAD">Nieprzeczytane</option>
                          <option value="read">Przeczytane</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 2: Advanced Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Sender */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          <CircleUser className="w-3 h-3 inline mr-1" />
                          Nadawca
                        </label>
                        <input
                          type="text"
                          value={filters.sender || ''}
                          onChange={(e) => handleFilterChange('sender', e.target.value)}
                          placeholder="Nazwa lub email..."
                          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                        />
                      </div>

                      {/* Has Attachments */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          <Paperclip className="w-3 h-3 inline mr-1" />
                          Zalaczniki
                        </label>
                        <select
                          value={filters.hasAttachments || 'ALL'}
                          onChange={(e) => handleFilterChange('hasAttachments', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                        >
                          <option value="ALL">Wszystkie</option>
                          <option value="WITH">Z zalacznikami</option>
                          <option value="WITHOUT">Bez zalacznikow</option>
                        </select>
                      </div>

                      {/* Urgency Score Range */}
                      <div className="lg:col-span-2">
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          <Flame className="w-3 h-3 inline mr-1" />
                          Pilnosc: {filters.urgencyMin || 0} - {filters.urgencyMax || 100}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={filters.urgencyMin || 0}
                            onChange={(e) => handleFilterChange('urgencyMin', parseInt(e.target.value))}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                          />
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={filters.urgencyMax || 100}
                            onChange={(e) => handleFilterChange('urgencyMax', parseInt(e.target.value))}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sort Row - Always Visible */}
            <div className="flex items-center gap-4 px-4 py-3 border-t border-slate-200/50 dark:border-slate-700/50">
              <span className="text-sm text-slate-500 dark:text-slate-400">Sortuj:</span>
              <div className="flex gap-1 flex-wrap">
                {[
                  { field: 'receivedAt', label: 'Data' },
                  { field: 'sentAt', label: 'Wyslania' },
                  { field: 'subject', label: 'Temat' },
                  { field: 'fromName', label: 'Nadawca' },
                  { field: 'urgencyScore', label: 'Pilnosc' },
                  { field: 'isRead', label: 'Status' },
                ].map(({ field, label }) => (
                  <button
                    key={field}
                    onClick={() => handleSortChange(field)}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                      sortConfig.field === field
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
                    }`}
                  >
                    {label}
                    {sortConfig.field === field && (
                      sortConfig.direction === 'desc'
                        ? <ChevronDown className="w-3 h-3 inline ml-0.5" />
                        : <ChevronUp className="w-3 h-3 inline ml-0.5" />
                    )}
                  </button>
                ))}
              </div>

              <div className="ml-auto text-sm text-slate-500 dark:text-slate-400">
                {filteredCount} z {totalMessages}
              </div>
            </div>
          </div>

          {/* Bulk actions bar */}
          <AnimatePresence>
            {selectedMessageIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-4"
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {selectedMessageIds.length} zaznaczono
                    </span>
                    <button
                      onClick={deselectAllMessages}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Odznacz
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkAction('archive')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                      Archiwizuj
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Usun
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats row - compact */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className={GLASS_CARD + ' p-3'}>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Wszystkie</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className={GLASS_CARD + ' p-3'}>
              <div className="flex items-center gap-2">
                <EyeOff className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Nieprzeczytane</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.unread}</p>
                </div>
              </div>
            </div>
            <div className={GLASS_CARD + ' p-3'}>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pilne</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.urgent}</p>
                </div>
              </div>
            </div>
            <div className={GLASS_CARD + ' p-3'}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">AI</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.processed}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages list */}
          <div className={GLASS_CARD}>
            {/* Header with select all */}
            <div className="px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedMailbox && (
                  <>
                    {getMailboxIcon(selectedMailbox.icon || selectedMailbox.name, "w-5 h-5 text-slate-600 dark:text-slate-400")}
                    <h2 className="font-medium text-slate-900 dark:text-white">{selectedMailbox.name}</h2>
                  </>
                )}
              </div>

              {filteredMessages.length > 0 && (
                <button
                  onClick={() => {
                    if (selectedMessageIds.length === filteredMessages.length) {
                      deselectAllMessages()
                    } else {
                      selectAllMessages()
                    }
                  }}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    selectedMessageIds.length === filteredMessages.length && filteredMessages.length > 0
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-slate-300 dark:bg-slate-700 dark:border-slate-500'
                  }`}>
                    {selectedMessageIds.length === filteredMessages.length && filteredMessages.length > 0 && (
                      <Check className="w-2.5 h-2.5 text-white" />
                    )}
                  </div>
                  Zaznacz wszystkie
                </button>
              )}
            </div>

            {/* Messages */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredMessages.length > 0 ? (
              <div className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                {filteredMessages.map((message: any) => (
                  <MessageRow
                    key={message.id}
                    message={message}
                    isExpanded={expandedMessageId === message.id}
                    onToggleExpand={() => setExpandedMessageId(
                      expandedMessageId === message.id ? null : message.id
                    )}
                    isSelected={selectedMessageIds.includes(message.id)}
                    onToggleSelect={() => toggleMessageSelection(message.id)}
                    onArchive={() => handleArchive(message.id)}
                    onDelete={() => handleDelete(message.id)}
                    onGTDAction={(action) => handleGTDQuickAction(message, action)}
                    onEmailWriter={() => {
                      setCurrentMessage(message)
                      setShowEmailWriterModal(true)
                    }}
                    onAnalyze={() => handleAnalyze(message.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Inbox className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                  {totalMessages > 0 ? 'Brak wynikow' : 'Brak wiadomosci'}
                </h4>
                <p className="text-slate-500 dark:text-slate-400">
                  {totalMessages > 0
                    ? 'Sprobuj zmienic filtry wyszukiwania'
                    : `Nie ma wiadomosci w skrzynce "${selectedMailbox?.name}"`
                  }
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showBuilder && (
          <SmartMailboxBuilder
            mailbox={editingMailbox as any}
            onClose={() => {
              setShowBuilder(false)
              setEditingMailbox(null)
              loadMailboxes()
            }}
          />
        )}
      </AnimatePresence>

      {showEmailWriterModal && currentMessage && (
        <EmailWriterModal
          isOpen={showEmailWriterModal}
          onClose={() => {
            setShowEmailWriterModal(false)
            setCurrentMessage(null)
          }}
          originalMessage={{
            id: currentMessage.id,
            subject: currentMessage.subject,
            content: currentMessage.content,
            fromName: currentMessage.fromName,
            fromAddress: currentMessage.fromAddress
          }}
          onEmailGenerated={(email) => {
            toast.success('Email AI wygenerowany!')
            console.log('Generated:', email)
          }}
        />
      )}

      {showGTDModal && currentMessage && (
        <ProcessInboxModal
          item={{
            id: `temp-${currentMessage.id}`,
            content: currentMessage.subject || 'Email',
            note: `Od: ${currentMessage.fromAddress}\n${currentMessage.content?.substring(0, 500) || ''}`,
            source: 'EMAIL',
            capturedAt: currentMessage.receivedAt || new Date().toISOString(),
            processed: false,
            organizationId: '',
            capturedById: '',
            capturedBy: { id: '', firstName: '', lastName: '', email: '' },
            createdAt: currentMessage.receivedAt,
            updatedAt: currentMessage.receivedAt
          } as any}
          onClose={() => {
            setShowGTDModal(false)
            setCurrentMessage(null)
          }}
          onComplete={() => {
            setShowGTDModal(false)
            setCurrentMessage(null)
            toast.success('Wiadomosc przetworzona')
          }}
        />
      )}

      {showAnalysisPreview && (
        <AnalysisPreviewModal
          isOpen={showAnalysisPreview}
          onClose={() => {
            setShowAnalysisPreview(false)
            setAnalysisProposals([])
          }}
          onComplete={() => {
            loadMessages()
          }}
          classification={analysisClassification}
          confidence={analysisConfidence}
          proposals={analysisProposals}
          analysis={analysisText}
        />
      )}
    </div>
  )
}

// Message row component
function MessageRow({
  message,
  isExpanded,
  onToggleExpand,
  isSelected,
  onToggleSelect,
  onArchive,
  onDelete,
  onGTDAction,
  onEmailWriter,
  onAnalyze
}: {
  message: any
  isExpanded: boolean
  onToggleExpand: () => void
  isSelected: boolean
  onToggleSelect: () => void
  onArchive: () => void
  onDelete: () => void
  onGTDAction: (action: 'INBOX' | 'DO' | 'DEFER') => void
  onEmailWriter: () => void
  onAnalyze: () => void
}) {
  const urgency = message.urgencyScore || 0
  const isUnread = !message.isRead
  const hasAttachments = message.attachments?.length > 0

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Wczoraj'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('pl-PL', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
    }
  }

  return (
    <div className={`transition-colors ${isSelected ? 'bg-blue-50/80 dark:bg-blue-900/20' : 'hover:bg-slate-50/80 dark:hover:bg-slate-700/50'}`}>
      <div
        className="px-4 py-3 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div
            onClick={(e) => { e.stopPropagation(); onToggleSelect() }}
            className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer ${
              isSelected
                ? 'bg-blue-600 border-blue-600'
                : 'bg-white border-slate-300 dark:bg-slate-700 dark:border-slate-500'
            }`}
          >
            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
          </div>

          {/* Urgency indicator */}
          <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
            urgency > 70 ? 'bg-red-500' : urgency > 40 ? 'bg-amber-500' : 'bg-green-500'
          }`} />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm truncate ${isUnread ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                {message.fromName || message.fromAddress || 'Nieznany nadawca'}
              </span>
              {hasAttachments && (
                <Paperclip className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
              )}
              {message.autoProcessed && (
                <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
              )}
            </div>

            <h4 className={`text-sm mb-1 truncate ${isUnread ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
              {message.subject || '(bez tematu)'}
            </h4>

            <p className="text-xs text-slate-500 dark:text-slate-500 line-clamp-1">
              {message.contentPlain || message.content?.replace(/<[^>]+>/g, '').substring(0, 150) || ''}
            </p>
          </div>

          {/* Date & actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formatDate(message.sentAt || message.receivedAt)}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 ml-9 border-t border-slate-100 dark:border-slate-700/50">
              {/* Actions */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={(e) => { e.stopPropagation(); onGTDAction('INBOX') }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/40 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                >
                  <Inbox className="w-3.5 h-3.5" />
                  Do Inbox
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onGTDAction('DO') }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/40 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  DO
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onGTDAction('DEFER') }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Odloz
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onEmailWriter() }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/40 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Odpowiedz
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onAnalyze() }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-700 bg-cyan-100 dark:text-cyan-300 dark:bg-cyan-900/40 rounded-lg hover:bg-cyan-200 dark:hover:bg-cyan-900/60 transition-colors"
                >
                  <Scan className="w-3.5 h-3.5" />
                  Analizuj
                </button>
                <div className="flex-1" />
                <button
                  onClick={(e) => { e.stopPropagation(); onArchive() }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Archiwizuj
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete() }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/40 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Usun
                </button>
              </div>

              {/* Message details */}
              <div className="text-sm">
                <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span>Od: {message.fromAddress}</span>
                  {message.toAddresses && <span>Do: {message.toAddresses}</span>}
                  <span>{new Date(message.sentAt || message.receivedAt).toLocaleString('pl-PL')}</span>
                </div>

                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {message.contentHtml ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: message.contentHtml }}
                      className="max-h-96 overflow-y-auto"
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 max-h-96 overflow-y-auto">
                      {message.content || message.contentPlain || 'Brak tresci'}
                    </pre>
                  )}
                </div>

                {/* Attachments */}
                {hasAttachments && (
                  <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                    <h5 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                      Zalaczniki ({message.attachments.length})
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {message.attachments.map((att: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm"
                        >
                          <Paperclip className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="truncate max-w-[200px] text-slate-700 dark:text-slate-300">{att.filename || att.name}</span>
                          {att.size && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {Math.round(att.size / 1024)}KB
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
