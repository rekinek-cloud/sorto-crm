'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { SmartMailbox, SmartMailboxRule, mailboxColors } from './types'
import { RuleBuilder } from './RuleBuilder'
import { MailboxPreview } from './MailboxPreview'
import { createSmartMailbox, updateSmartMailbox } from '@/lib/api/smartMailboxes'
import { toast } from 'react-hot-toast'
import {
  Mail,
  MailOpen,
  Inbox,
  ArrowDownToLine,
  Send,
  Flame,
  Zap,
  Rocket,
  Lightbulb,
  Star,
  Trophy,
  Sparkles,
  Paintbrush,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Bell,
  Clock,
  Calendar,
  CalendarDays,
  Users,
  User,
  Cpu,
  Briefcase,
  Building2,
  ClipboardList,
  CheckCircle,
  Heart,
  Folder,
  FolderOpen,
  Tag,
  Flag,
  AlertTriangle,
  ShieldCheck,
  X,
  Pencil,
  Plus,
  Eye,
  EyeOff,
  Archive,
  Trash2,
  Search,
} from 'lucide-react'

interface SmartMailboxBuilderProps {
  mailbox?: SmartMailbox | null
  onClose: () => void
}

// Definicja ikon dostępnych do wyboru
const iconOptions = [
  { name: 'envelope', Icon: Mail, label: 'Koperta' },
  { name: 'envelope-open', Icon: MailOpen, label: 'Otwarta koperta' },
  { name: 'inbox', Icon: Inbox, label: 'Skrzynka' },
  { name: 'inbox-arrow', Icon: ArrowDownToLine, label: 'Przychodzące' },
  { name: 'paper-airplane', Icon: Send, label: 'Wysłane' },
  { name: 'fire', Icon: Flame, label: 'Ogień' },
  { name: 'bolt', Icon: Zap, label: 'Błyskawica' },
  { name: 'rocket', Icon: Rocket, label: 'Rakieta' },
  { name: 'lightbulb', Icon: Lightbulb, label: 'Żarówka' },
  { name: 'star', Icon: Star, label: 'Gwiazda' },
  { name: 'trophy', Icon: Trophy, label: 'Trofeum' },
  { name: 'sparkles', Icon: Sparkles, label: 'Iskry' },
  { name: 'paint-brush', Icon: Paintbrush, label: 'Pędzel' },
  { name: 'chart-bar', Icon: BarChart3, label: 'Wykres' },
  { name: 'trending-up', Icon: TrendingUp, label: 'W górę' },
  { name: 'trending-down', Icon: TrendingDown, label: 'W dół' },
  { name: 'currency', Icon: DollarSign, label: 'Pieniądze' },
  { name: 'bell', Icon: Bell, label: 'Dzwonek' },
  { name: 'clock', Icon: Clock, label: 'Zegar' },
  { name: 'calendar', Icon: Calendar, label: 'Kalendarz' },
  { name: 'calendar-days', Icon: CalendarDays, label: 'Dni' },
  { name: 'user-group', Icon: Users, label: 'Zespół' },
  { name: 'user', Icon: User, label: 'Osoba' },
  { name: 'cpu', Icon: Cpu, label: 'AI' },
  { name: 'briefcase', Icon: Briefcase, label: 'Teczka' },
  { name: 'building', Icon: Building2, label: 'Firma' },
  { name: 'clipboard', Icon: ClipboardList, label: 'Lista' },
  { name: 'check-circle', Icon: CheckCircle, label: 'Gotowe' },
  { name: 'heart', Icon: Heart, label: 'Serce' },
  { name: 'folder', Icon: Folder, label: 'Folder' },
  { name: 'folder-open', Icon: FolderOpen, label: 'Otwarty folder' },
  { name: 'tag', Icon: Tag, label: 'Tag' },
  { name: 'flag', Icon: Flag, label: 'Flaga' },
  { name: 'warning', Icon: AlertTriangle, label: 'Ostrzeżenie' },
  { name: 'shield', Icon: ShieldCheck, label: 'Bezpieczeństwo' },
]

// Funkcja pomocnicza do renderowania ikony po nazwie
const getIconByName = (iconName: string, className: string = 'w-5 h-5') => {
  const iconDef = iconOptions.find(i => i.name === iconName)
  if (iconDef) {
    const IconComponent = iconDef.Icon
    return <IconComponent className={className} />
  }
  return <Mail className={className} />
}

export function SmartMailboxBuilder({ mailbox, onClose }: SmartMailboxBuilderProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('envelope')
  const [color, setColor] = useState('blue')
  const [description, setDescription] = useState('')
  const [rules, setRules] = useState<SmartMailboxRule[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(false)

  const isEditing = !!mailbox

  // Initialize form with mailbox data if editing
  useEffect(() => {
    if (mailbox) {
      setName(mailbox.name)
      // Konwersja starego emoji na nową ikonę lub zachowanie nowej ikony
      const existingIcon = iconOptions.find(i => i.name === mailbox.icon)
      setIcon(existingIcon ? mailbox.icon : 'envelope')
      setColor(mailbox.color)
      setDescription(mailbox.description || '')
      setRules(mailbox.rules || [])
    }
  }, [mailbox])

  const colorOptions = Object.keys(mailboxColors)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Nazwa jest wymagana')
      return
    }

    if (rules.length === 0) {
      toast.error('Dodaj przynajmniej jedną regułę')
      return
    }

    // Validate rules
    const invalidRules = rules.filter(rule => !rule.value.trim())
    if (invalidRules.length > 0) {
      toast.error('Wszystkie reguły muszą mieć wartość')
      return
    }

    try {
      setLoading(true)

      const mailboxData = {
        name: name.trim(),
        icon,
        color,
        description: description.trim(),
        rules: rules.map((rule, index) => ({
          ...rule,
          ruleOrder: index
        }))
      }

      if (isEditing) {
        await updateSmartMailbox(mailbox.id, mailboxData)
        toast.success('Smart Mailbox zaktualizowany')
      } else {
        await createSmartMailbox(mailboxData)
        toast.success('Smart Mailbox utworzony')
      }

      onClose()
    } catch (error: any) {
      console.error('Error saving mailbox:', error)
      toast.error('Błąd podczas zapisywania')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (rules.length > 0 || name.trim() || description.trim()) {
      if (confirm('Czy na pewno chcesz anulować? Niezapisane zmiany zostaną utracone.')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  return (
    <motion.div
      className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleCancel}
    >
      <motion.div
        className="relative overflow-hidden bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ 
          scale: 1, 
          opacity: 1, 
          y: 0,
          transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
          }
        }}
        exit={{ scale: 0.9, opacity: 0, y: 50 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-30"></div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="floating absolute -right-4 -top-4 h-16 w-16 rounded-full bg-blue-500"></div>
          <div className="absolute -bottom-2 -left-2 h-8 w-8 rounded-full bg-indigo-500 opacity-30"></div>
          <div className="absolute top-1/3 -right-2 h-12 w-12 rounded-full bg-purple-500 opacity-20"></div>
        </div>
        <form onSubmit={handleSubmit} className="relative p-8 space-y-8">
          {/* Header */}
          <div className="relative">
            <div className="flex items-center justify-between pb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  {isEditing ? <Pencil className="w-7 h-7" /> : <Rocket className="w-7 h-7" />}
                  {isEditing ? 'Edytuj Smart Mailbox' : 'Nowy Smart Mailbox'}
                </h2>
                <p className="text-gray-600 mt-2 text-base sm:text-lg">
                  {isEditing ? 'Modyfikuj reguły i ustawienia swojej skrzynki' : 'Stwórz własną inteligentną skrzynkę z regułami filtrowania'}
                </p>
              </div>
              <motion.button
                type="button"
                onClick={handleCancel}
                className="bg-red-50 hover:bg-red-100 text-red-600 p-3 rounded-xl transition-all duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <ClipboardList className="w-4 h-4" /> Nazwa skrzynki *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="np. Klienci VIP, Pilne sprawy..."
                  className="bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  maxLength={50}
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {name.length}/50 znaków
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <FolderOpen className="w-4 h-4" /> Opis (opcjonalny)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Krótki opis przeznaczenia tej skrzynki..."
                  className="bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all h-20 resize-none"
                  maxLength={200}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {description.length}/200 znaków
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Icon Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Paintbrush className="w-4 h-4" /> Ikona
                </label>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 flex items-center justify-center">
                    {getIconByName(icon, 'w-8 h-8 text-gray-700')}
                  </div>
                  <div className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-600 text-sm">
                    {iconOptions.find(i => i.name === icon)?.label || 'Wybierz ikonę'}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <div className="grid grid-cols-7 gap-2 max-h-40 overflow-y-auto">
                    {iconOptions.map((iconDef) => {
                      const IconComponent = iconDef.Icon
                      return (
                        <motion.button
                          key={iconDef.name}
                          type="button"
                          onClick={() => setIcon(iconDef.name)}
                          className={`p-2 rounded-lg transition-all ${
                            icon === iconDef.name ? 'bg-blue-100 border border-blue-400' : 'hover:bg-gray-100 border border-transparent'
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          title={iconDef.label}
                        >
                          <IconComponent className="w-5 h-5 text-gray-700" />
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Sparkles className="w-4 h-4" /> Kolor motywu
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((colorKey) => {
                    const colorScheme = mailboxColors[colorKey as keyof typeof mailboxColors]
                    return (
                      <motion.button
                        key={colorKey}
                        type="button"
                        onClick={() => setColor(colorKey)}
                        className={`p-3 rounded-xl border transition-all ${
                          color === colorKey
                            ? 'bg-blue-100 border-blue-400 scale-105'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        whileHover={{ scale: color === colorKey ? 1.05 : 1.02 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="text-center">
                          <div className="mb-1 flex justify-center">{getIconByName(icon, 'w-5 h-5 text-gray-700')}</div>
                          <div className="text-xs capitalize text-gray-600">{colorKey}</div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Rules Builder */}
          <div>
            <RuleBuilder rules={rules} onChange={setRules} />
          </div>

          {/* Preview Toggle */}
          {rules.length > 0 && (
            <motion.div 
              className="flex items-center justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-6 py-3 rounded-xl transition-all hover:scale-105 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                {showPreview ? 'Ukryj podgląd' : 'Pokaż podgląd'}
              </motion.button>
            </motion.div>
          )}

          {/* Preview */}
          <MailboxPreview rules={rules} isVisible={showPreview} />

          {/* Actions */}
          <motion.div 
            className="flex items-center justify-between pt-6 border-t border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-6 py-3 rounded-xl transition-all hover:scale-105 disabled:opacity-50 flex items-center gap-2"
              whileHover={{ scale: loading ? 1 : 1.05 }}
              whileTap={{ scale: loading ? 1 : 0.95 }}
            >
              <X className="w-5 h-5" /> Anuluj
            </motion.button>

            <div className="flex items-center space-x-3">
              {isEditing && (
                <div className="text-xs text-gray-500">
                  Edytujesz: {mailbox?.name}
                </div>
              )}
              <motion.button
                type="submit"
                disabled={loading || !name.trim() || rules.length === 0}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-6 py-3 rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                whileHover={{ scale: (loading || !name.trim() || rules.length === 0) ? 1 : 1.05 }}
                whileTap={{ scale: (loading || !name.trim() || rules.length === 0) ? 1 : 0.95 }}
              >
                {loading ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" />
                    <span>Zapisywanie...</span>
                  </>
                ) : isEditing ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Zaktualizuj</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Utwórz</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </form>
      </motion.div>
    </motion.div>
  )
}