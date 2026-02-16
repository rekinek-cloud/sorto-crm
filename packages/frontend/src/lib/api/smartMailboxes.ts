import { apiClient } from './client'

export interface SmartMailboxRule {
  id?: string
  field: string
  operator: string
  value: string
  logicOperator?: 'AND' | 'OR'
  ruleOrder?: number
}

export interface SmartMailbox {
  id: string
  name: string
  icon: string
  color: string
  description?: string
  isBuiltIn: boolean
  isActive: boolean
  displayOrder: number
  userId?: string
  organizationId: string
  lastAccessedAt?: string
  accessCount: number
  createdAt: string
  updatedAt: string
  rules: SmartMailboxRule[]
  count?: number
}

export interface SmartMailboxMessages {
  messages: any[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface CreateSmartMailboxData {
  name: string
  icon?: string
  color?: string
  description?: string
  rules: SmartMailboxRule[]
}

// Get all smart mailboxes with counts
export async function getSmartMailboxes(): Promise<SmartMailbox[]> {
  const response = await apiClient.get('/mailboxes')
  // Map smart_mailbox_rules to rules
  return response.data.map((mailbox: any) => ({
    ...mailbox,
    rules: mailbox.smart_mailbox_rules || mailbox.rules || []
  }))
}

// Get messages in a mailbox
export async function getSmartMailboxMessages(
  mailboxId: string,
  page = 1,
  options: any = {}
): Promise<SmartMailboxMessages> {
  const response = await apiClient.get(`/mailboxes/${mailboxId}/messages`, {
    params: { page, limit: options.limit || 20 }
  })
  return response.data
}

// Create custom mailbox
export async function createSmartMailbox(
  data: CreateSmartMailboxData
): Promise<SmartMailbox> {
  const response = await apiClient.post('/mailboxes', data)
  return response.data
}

// Update custom mailbox
export async function updateSmartMailbox(
  mailboxId: string,
  data: CreateSmartMailboxData
): Promise<SmartMailbox> {
  const response = await apiClient.put(`/mailboxes/${mailboxId}`, data)
  return response.data
}

// Delete custom mailbox
export async function deleteSmartMailbox(mailboxId: string): Promise<void> {
  await apiClient.delete(`/mailboxes/${mailboxId}`)
}

// Archive message
export async function archiveMessage(messageId: string): Promise<{ success: boolean; message: string; archivedAt: string }> {
  const response = await apiClient.post(`/communication/messages/${messageId}/archive`)
  return response.data
}

// Delete message
export async function deleteMessage(messageId: string): Promise<{ success: boolean; message: string; deletedId: string }> {
  const response = await apiClient.delete(`/communication/messages/${messageId}`)
  return response.data
}

// Restore message from archive
export async function restoreMessage(messageId: string): Promise<{ success: boolean; message: string; restoredMessage: any }> {
  const response = await apiClient.post(`/communication/messages/${messageId}/restore`)
  return response.data
}

// Reply to message
export async function replyToMessage(messageId: string, data: { content: string; to?: string; subject?: string }): Promise<{ success: boolean; message: string; replyId: string; sentTo: string }> {
  const response = await apiClient.post(`/communication/messages/${messageId}/reply`, data)
  return response.data
}

// Forward message
export async function forwardMessage(messageId: string, data: { to: string; content: string; subject?: string }): Promise<{ success: boolean; message: string; forwardId: string; sentTo: string }> {
  const response = await apiClient.post(`/communication/messages/${messageId}/forward`, data)
  return response.data
}