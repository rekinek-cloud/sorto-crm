import { useState, useMemo, useCallback } from 'react'
import { MessageFilters } from '@/components/communication/filters/MessageFilters'
import { SortConfig } from '@/components/communication/filters/MessageSorting'

export interface Message {
  id: string
  subject?: string
  content?: string
  fromName?: string
  fromAddress?: string
  sentAt?: string
  receivedAt?: string
  priority?: string
  urgencyScore?: number
  isRead?: boolean
  channel?: { name?: string; type?: string }
  channelName?: string
  attachments?: any[]
  isArchived?: boolean
  isProcessed?: boolean
  autoProcessed?: boolean
  contact?: any
  company?: any
  contentPlain?: string
  contentHtml?: string
  toAddresses?: string
}

const DEFAULT_FILTERS: MessageFilters = {
  search: '',
  channels: [],
  dateRange: 'ALL',
  customDateFrom: '',
  customDateTo: '',
  priority: 'ALL',
  status: 'ALL',
  sender: '',
  hasAttachments: 'ALL',
  isRead: 'ALL',
  urgencyMin: 0,
  urgencyMax: 100
}

const DEFAULT_SORT: SortConfig = {
  field: 'receivedAt',
  direction: 'desc'
}

export function useMessageFilters(messages: Message[]) {
  const [filters, setFilters] = useState<MessageFilters>(DEFAULT_FILTERS)
  const [sortConfig, setSortConfig] = useState<SortConfig>(DEFAULT_SORT)
  const [showFilters, setShowFilters] = useState(false)

  // Extract unique channels from messages
  const availableChannels = useMemo(() => {
    const channelSet = new Set<string>()
    messages.forEach(message => {
      // Try channel.name first, then channel.type, then channelName
      const channelName = message.channel?.name || message.channel?.type || message.channelName
      if (channelName && channelName !== 'Unknown') {
        channelSet.add(channelName)
      }
    })
    return Array.from(channelSet).sort()
  }, [messages])

  // Apply filters to messages
  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          message.subject?.toLowerCase().includes(searchLower) ||
          message.content?.toLowerCase().includes(searchLower) ||
          message.fromName?.toLowerCase().includes(searchLower) ||
          message.fromAddress?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Channels filter
      if (filters.channels.length > 0) {
        const messageChannelName = message.channel?.name || message.channel?.type || message.channelName
        if (!filters.channels.includes(messageChannelName || '')) return false
      }

      // Date range filter
      if (filters.dateRange !== 'ALL' || filters.customDateFrom || filters.customDateTo) {
        const messageDate = new Date(message.sentAt || message.receivedAt || '')
        
        if (filters.customDateFrom || filters.customDateTo) {
          if (filters.customDateFrom) {
            const fromDate = new Date(filters.customDateFrom)
            fromDate.setHours(0, 0, 0, 0)
            if (messageDate < fromDate) return false
          }
          if (filters.customDateTo) {
            const toDate = new Date(filters.customDateTo)
            toDate.setHours(23, 59, 59, 999)
            if (messageDate > toDate) return false
          }
        } else {
          const now = new Date()
          
          switch (filters.dateRange) {
            case 'TODAY':
              const today = new Date(now)
              today.setHours(0, 0, 0, 0)
              const tomorrow = new Date(today)
              tomorrow.setDate(tomorrow.getDate() + 1)
              if (messageDate < today || messageDate >= tomorrow) return false
              break
            case 'YESTERDAY':
              const yesterday = new Date(now)
              yesterday.setDate(yesterday.getDate() - 1)
              yesterday.setHours(0, 0, 0, 0)
              const yesterdayEnd = new Date(yesterday)
              yesterdayEnd.setDate(yesterdayEnd.getDate() + 1)
              if (messageDate < yesterday || messageDate >= yesterdayEnd) return false
              break
            case 'LAST_7_DAYS':
              const last7 = new Date(now)
              last7.setDate(last7.getDate() - 7)
              if (messageDate < last7) return false
              break
            case 'LAST_30_DAYS':
              const last30 = new Date(now)
              last30.setDate(last30.getDate() - 30)
              if (messageDate < last30) return false
              break
          }
        }
      }

      // Priority filter
      if (filters.priority !== 'ALL') {
        if (message.priority !== filters.priority) return false
      }

      // Status filter
      if (filters.status !== 'ALL') {
        switch (filters.status) {
          case 'UNREAD':
            if (message.isRead !== false) return false
            break
          case 'read':
            if (message.isRead !== true) return false
            break
          case 'ARCHIVED':
            if (message.isArchived !== true) return false
            break
          case 'PROCESSED':
            if (message.isProcessed !== true) return false
            break
        }
      }

      // Sender filter
      if (filters.sender) {
        const senderLower = filters.sender.toLowerCase()
        const matchesSender = 
          message.fromName?.toLowerCase().includes(senderLower) ||
          message.fromAddress?.toLowerCase().includes(senderLower)
        if (!matchesSender) return false
      }

      // Attachments filter
      if (filters.hasAttachments !== 'ALL') {
        const hasAttachments = message.attachments && message.attachments.length > 0
        if (filters.hasAttachments === 'WITH' && !hasAttachments) return false
        if (filters.hasAttachments === 'WITHOUT' && hasAttachments) return false
      }

      // Read status filter
      if (filters.isRead !== 'ALL') {
        if (filters.isRead === 'read' && message.isRead !== true) return false
        if (filters.isRead === 'UNREAD' && message.isRead !== false) return false
      }

      // Urgency range filter
      const urgency = message.urgencyScore || 0
      if (urgency < filters.urgencyMin || urgency > filters.urgencyMax) return false

      return true
    })
  }, [messages, filters])

  // Apply sorting to filtered messages
  const sortedMessages = useMemo(() => {
    const sorted = [...filteredMessages].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortConfig.field) {
        case 'receivedAt':
        case 'sentAt':
          aValue = new Date(a[sortConfig.field] || 0).getTime()
          bValue = new Date(b[sortConfig.field] || 0).getTime()
          break
        case 'urgencyScore':
          aValue = a.urgencyScore || 0
          bValue = b.urgencyScore || 0
          break
        case 'isRead':
          aValue = a.isRead ? 1 : 0
          bValue = b.isRead ? 1 : 0
          break
        case 'priority':
          const priorityOrder = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'URGENT': 4 }
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
          break
        default:
          aValue = (a[sortConfig.field as keyof Message] || '').toString().toLowerCase()
          bValue = (b[sortConfig.field as keyof Message] || '').toString().toLowerCase()
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [filteredMessages, sortConfig])

  // Pagination
  const paginateMessages = useCallback((page: number, limit: number = 20) => {
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    return {
      messages: sortedMessages.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total: sortedMessages.length,
        totalPages: Math.ceil(sortedMessages.length / limit),
        hasNext: endIndex < sortedMessages.length,
        hasPrev: page > 1
      }
    }
  }, [sortedMessages])

  // Reset filters
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  // Reset sorting
  const resetSort = useCallback(() => {
    setSortConfig(DEFAULT_SORT)
  }, [])

  return {
    // State
    filters,
    sortConfig,
    showFilters,
    
    // Data
    availableChannels,
    filteredMessages: sortedMessages,
    totalMessages: messages.length,
    filteredCount: sortedMessages.length,
    
    // Actions
    setFilters,
    setSortConfig,
    setShowFilters,
    paginateMessages,
    clearFilters,
    resetSort
  }
}