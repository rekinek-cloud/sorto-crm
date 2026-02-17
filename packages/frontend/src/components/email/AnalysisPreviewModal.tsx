'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import {
  X, Check, XCircle, Building2, User, Target,
  Handshake, CheckSquare, Sparkles, AlertTriangle,
} from 'lucide-react'
import { AnalysisProposal, bulkActionSuggestions } from '@/lib/api/smartMailboxes'

interface AnalysisPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  classification: string
  confidence: number
  proposals: AnalysisProposal[]
  analysis: string | null
}

const TYPE_CONFIG: Record<string, { icon: any; label: string; color: string; bgColor: string }> = {
  CREATE_COMPANY: { icon: Building2, label: 'Firma', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  CREATE_CONTACT: { icon: User, label: 'Kontakt', color: 'text-green-600', bgColor: 'bg-green-50' },
  CREATE_LEAD: { icon: Target, label: 'Lead', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  CREATE_DEAL: { icon: Handshake, label: 'Transakcja', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  CREATE_TASK: { icon: CheckSquare, label: 'Zadanie', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
}

const CLASS_COLORS: Record<string, string> = {
  BUSINESS: 'bg-green-100 text-green-800',
  NEWSLETTER: 'bg-blue-100 text-blue-800',
  SPAM: 'bg-red-100 text-red-800',
  TRANSACTIONAL: 'bg-gray-100 text-gray-800',
  PERSONAL: 'bg-yellow-100 text-yellow-800',
  INBOX: 'bg-slate-100 text-slate-800',
}

function ProposalFields({ type, data }: { type: string; data: Record<string, any> }) {
  switch (type) {
    case 'CREATE_COMPANY':
      return (
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
          <span>Nazwa: <b className="text-gray-800">{data.name}</b></span>
          {data.domain && <span>Domena: <b className="text-gray-800">{data.domain}</b></span>}
          {data.email && <span>Email: <b className="text-gray-800">{data.email}</b></span>}
          {data.nip && <span>NIP: <b className="text-gray-800">{data.nip}</b></span>}
        </div>
      )
    case 'CREATE_CONTACT':
      return (
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
          <span>Imie: <b className="text-gray-800">{data.firstName}</b></span>
          <span>Nazwisko: <b className="text-gray-800">{data.lastName}</b></span>
          {data.email && <span>Email: <b className="text-gray-800">{data.email}</b></span>}
          {data.phone && <span>Tel: <b className="text-gray-800">{data.phone}</b></span>}
          {data.position && <span>Stanowisko: <b className="text-gray-800">{data.position}</b></span>}
          {data.companyName && <span>Firma: <b className="text-gray-800">{data.companyName}</b></span>}
        </div>
      )
    case 'CREATE_LEAD':
      return (
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
          <span className="col-span-2">Tytul: <b className="text-gray-800">{data.title}</b></span>
          {data.company && <span>Firma: <b className="text-gray-800">{data.company}</b></span>}
          {data.priority && <span>Priorytet: <b className="text-gray-800">{data.priority}</b></span>}
        </div>
      )
    case 'CREATE_DEAL':
      return (
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
          <span className="col-span-2">Tytul: <b className="text-gray-800">{data.title}</b></span>
          {data.value > 0 && <span>Wartosc: <b className="text-gray-800">{data.value} PLN</b></span>}
          {data.stage && <span>Etap: <b className="text-gray-800">{data.stage}</b></span>}
        </div>
      )
    case 'CREATE_TASK':
      return (
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
          <span className="col-span-2">Tytul: <b className="text-gray-800">{data.title}</b></span>
          {data.priority && <span>Priorytet: <b className="text-gray-800">{data.priority}</b></span>}
          {data.deadline && <span>Deadline: <b className="text-gray-800">{data.deadline}</b></span>}
        </div>
      )
    default:
      return <div className="text-xs text-gray-500">{JSON.stringify(data).slice(0, 100)}</div>
  }
}

export default function AnalysisPreviewModal({
  isOpen,
  onClose,
  onComplete,
  classification,
  confidence,
  proposals,
  analysis,
}: AnalysisPreviewModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(proposals.map(p => p.id)))
  const [processing, setProcessing] = useState(false)

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === proposals.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(proposals.map(p => p.id)))
    }
  }

  const handleAcceptSelected = async () => {
    if (selected.size === 0) {
      toast.error('Nie zaznaczono zadnych propozycji')
      return
    }

    setProcessing(true)
    try {
      const acceptIds = Array.from(selected)
      const rejectIds = proposals.filter(p => !selected.has(p.id)).map(p => p.id)

      const results: string[] = []

      if (acceptIds.length > 0) {
        const acceptResult = await bulkActionSuggestions(acceptIds, 'accept')
        results.push(`Utworzono: ${acceptResult.data.accepted}`)
      }
      if (rejectIds.length > 0) {
        await bulkActionSuggestions(rejectIds, 'reject')
        results.push(`Odrzucono: ${rejectIds.length}`)
      }

      toast.success(results.join(', '))
      onComplete()
      onClose()
    } catch {
      toast.error('Blad przetwarzania propozycji')
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectAll = async () => {
    setProcessing(true)
    try {
      const allIds = proposals.map(p => p.id)
      await bulkActionSuggestions(allIds, 'reject')
      toast.success(`Odrzucono ${allIds.length} propozycji`)
      onComplete()
      onClose()
    } catch {
      toast.error('Blad odrzucania propozycji')
    } finally {
      setProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Wyniki analizy AI</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CLASS_COLORS[classification] || CLASS_COLORS.INBOX}`}>
                    {classification}
                  </span>
                  <span className="text-xs text-gray-500">
                    Pewnosc: {Math.round(confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Proposals */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {proposals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                <p>Brak propozycji do zatwierdzenia</p>
                <p className="text-sm mt-1">Analiza nie wykryla nowych encji CRM</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">
                    {proposals.length} {proposals.length === 1 ? 'propozycja' : 'propozycji'} do zatwierdzenia
                  </p>
                  <button
                    onClick={toggleAll}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    {selected.size === proposals.length ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
                  </button>
                </div>

                {proposals.map((proposal) => {
                  const config = TYPE_CONFIG[proposal.type] || TYPE_CONFIG.CREATE_TASK
                  const Icon = config.icon
                  const isChecked = selected.has(proposal.id)

                  return (
                    <div
                      key={proposal.id}
                      className={`border rounded-xl p-4 transition-all cursor-pointer ${
                        isChecked
                          ? 'border-indigo-300 bg-indigo-50/50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => toggleSelect(proposal.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 text-white" />}
                        </div>

                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bgColor}`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                              {config.label}
                            </span>
                            <span className="text-xs text-gray-400">
                              {proposal.confidence}%
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate mb-1">
                            {proposal.title}
                          </p>
                          <ProposalFields type={proposal.type} data={proposal.data} />
                          {proposal.reasoning && (
                            <p className="text-xs text-gray-400 mt-1 italic">{proposal.reasoning}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between p-5 border-t bg-gray-50 rounded-b-2xl">
            <button
              onClick={handleRejectAll}
              disabled={processing || proposals.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Odrzuc wszystkie
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Zamknij
              </button>
              <button
                onClick={handleAcceptSelected}
                disabled={processing || selected.size === 0}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
              >
                {processing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Zatwierdz wybrane ({selected.size})
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
