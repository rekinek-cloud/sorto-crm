'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SmartMailboxRule, ruleFields, ruleOperators } from './types'

interface RuleBuilderProps {
  rules: SmartMailboxRule[]
  onChange: (rules: SmartMailboxRule[]) => void
}

export function RuleBuilder({ rules, onChange }: RuleBuilderProps) {
  const addRule = () => {
    const newRule: SmartMailboxRule = {
      field: 'subject',
      operator: 'contains',
      value: '',
      logicOperator: 'AND',
      ruleOrder: rules.length
    }
    onChange([...rules, newRule])
  }

  const updateRule = (index: number, updates: Partial<SmartMailboxRule>) => {
    const updatedRules = rules.map((rule, i) => 
      i === index ? { ...rule, ...updates } : rule
    )
    onChange(updatedRules)
  }

  const removeRule = (index: number) => {
    const updatedRules = rules.filter((_, i) => i !== index)
    onChange(updatedRules.map((rule, i) => ({ ...rule, ruleOrder: i })))
  }

  const getAvailableOperators = (field: string) => {
    return ruleOperators[field as keyof typeof ruleOperators] || []
  }

  const getValuePlaceholder = (field: string, operator: string) => {
    switch (field) {
      case 'urgencyScore':
        return 'np. 70'
      case 'subject':
      case 'content':
        return 'Wpisz tekst do wyszukania'
      case 'fromAddress':
        return 'np. example@domain.com'
      case 'receivedAt':
        return operator === 'equals' ? 'today' : 'YYYY-MM-DD'
      case 'priority':
        return 'HIGH, MEDIUM, LOW'
      case 'actionNeeded':
      case 'autoProcessed':
      case 'needsResponse':
      case 'contact.isVIP':
        return 'true/false'
      default:
        return 'Wartość'
    }
  }

  const getValueInput = (rule: SmartMailboxRule, index: number) => {
    const { field, operator, value } = rule

    // BETWEEN operator needs two values
    if (operator === 'between') {
      const values = value.split(',')
      return (
        <div className="flex items-center space-x-2 flex-1">
          <input
            type={field === 'urgencyScore' ? 'number' : field === 'receivedAt' ? 'date' : 'text'}
            value={values[0] || ''}
            onChange={(e) => {
              const newValues = [e.target.value, values[1] || '']
              updateRule(index, { value: newValues.join(',') })
            }}
            placeholder="Od"
            className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            min={field === 'urgencyScore' ? 0 : undefined}
            max={field === 'urgencyScore' ? 100 : undefined}
          />
          <span className="text-gray-500">do</span>
          <input
            type={field === 'urgencyScore' ? 'number' : field === 'receivedAt' ? 'date' : 'text'}
            value={values[1] || ''}
            onChange={(e) => {
              const newValues = [values[0] || '', e.target.value]
              updateRule(index, { value: newValues.join(',') })
            }}
            placeholder="Do"
            className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            min={field === 'urgencyScore' ? 0 : undefined}
            max={field === 'urgencyScore' ? 100 : undefined}
          />
        </div>
      )
    }

    // IN / NOT IN operators need multiple values
    if (['in', 'not_in'].includes(operator)) {
      return (
        <textarea
          value={value}
          onChange={(e) => updateRule(index, { value: e.target.value })}
          placeholder={field === 'priority' ? 'HIGH,MEDIUM,LOW' : 'wartość1,wartość2,wartość3'}
          className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 h-20 resize-none"
          title="Wprowadź wartości oddzielone przecinkami"
        />
      )
    }

    // Boolean fields
    if (['actionNeeded', 'autoProcessed', 'needsResponse', 'contact.isVIP'].includes(field)) {
      return (
        <select
          value={value}
          onChange={(e) => updateRule(index, { value: e.target.value })}
          className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        >
          <option value="">Wybierz...</option>
          <option value="true">Tak</option>
          <option value="false">Nie</option>
        </select>
      )
    }

    // Priority field
    if (field === 'priority') {
      return (
        <select
          value={value}
          onChange={(e) => updateRule(index, { value: e.target.value })}
          className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        >
          <option value="">Wybierz...</option>
          <option value="HIGH">Wysoki</option>
          <option value="MEDIUM">Średni</option>
          <option value="LOW">Niski</option>
        </select>
      )
    }

    // REGEX operator
    if (operator === 'regex') {
      return (
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => updateRule(index, { value: e.target.value })}
            placeholder="np. ^[A-Z].*urgent.*"
            className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            title="Wprowadź wyrażenie regularne"
          />
          <div className="text-xs text-gray-500 mt-1">
            💡 Użyj wyrażeń regularnych (regex) dla zaawansowanego dopasowywania
          </div>
        </div>
      )
    }

    // Empty/Not Empty operators
    if (['is_empty', 'is_not_empty', 'empty', 'not_empty'].includes(operator)) {
      return (
        <input
          type="text"
          value={operator.includes('empty') ? 'bez zawartości' : 'z zawartością'}
          disabled
          className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-100 text-gray-500"
        />
      )
    }

    // Date field with special operators
    if (field === 'receivedAt') {
      if (operator === 'equals') {
        return (
          <select
            value={value}
            onChange={(e) => updateRule(index, { value: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">Wybierz...</option>
            <option value="today">Dzisiaj</option>
            <option value="yesterday">Wczoraj</option>
            <option value="this_week">W tym tygodniu</option>
            <option value="this_month">W tym miesiącu</option>
          </select>
        )
      } else if (operator === 'in_last_days') {
        return (
          <div className="flex items-center space-x-2 flex-1">
            <input
              type="number"
              value={value}
              onChange={(e) => updateRule(index, { value: e.target.value })}
              placeholder="7"
              className="px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-20"
              min="1"
              max="365"
            />
            <span className="text-gray-500">dni</span>
          </div>
        )
      } else if (['greater_than', 'less_than'].includes(operator)) {
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => updateRule(index, { value: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        )
      }
    }

    // Attachments field with count
    if (field === 'attachments') {
      if (operator === 'count_greater_than') {
        return (
          <div className="flex items-center space-x-2 flex-1">
            <input
              type="number"
              value={value}
              onChange={(e) => updateRule(index, { value: e.target.value })}
              placeholder="3"
              className="px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-20"
              min="0"
            />
            <span className="text-gray-500">załączników</span>
          </div>
        )
      } else {
        return (
          <input
            type="text"
            value={operator === 'not_empty' ? 'ma załączniki' : 'bez załączników'}
            disabled
            className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-100 text-gray-500"
          />
        )
      }
    }

    // Word count for content
    if (field === 'content' && operator === 'word_count_greater_than') {
      return (
        <div className="flex items-center space-x-2 flex-1">
          <input
            type="number"
            value={value}
            onChange={(e) => updateRule(index, { value: e.target.value })}
            placeholder="100"
            className="px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-20"
            min="1"
          />
          <span className="text-gray-500">słów</span>
        </div>
      )
    }

    // Default text input
    return (
      <input
        type={field === 'urgencyScore' ? 'number' : 'text'}
        value={value}
        onChange={(e) => updateRule(index, { value: e.target.value })}
        placeholder={getValuePlaceholder(field, operator)}
        className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        min={field === 'urgencyScore' ? 0 : undefined}
        max={field === 'urgencyScore' ? 100 : undefined}
      />
    )
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              ⚙️ Reguły filtrowania
            </h4>
            <p className="text-gray-600 mt-1">
              Zdefiniuj warunki które muszą spełniać wiadomości
            </p>
          </div>
          <motion.button
            onClick={addRule}
            className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ➕ Dodaj regułę
          </motion.button>
        </div>
      </div>

      {rules.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">🎯 Brak reguł</p>
          <p className="text-sm">Dodaj przynajmniej jedną regułę aby utworzyć Smart Mailbox</p>
        </div>
      )}

      <AnimatePresence>
        {rules.map((rule, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative overflow-hidden glass-card hover-lift p-6 space-y-4 mb-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Floating Elements */}
            <div className="absolute inset-0 opacity-5">
              <div className="floating absolute -right-2 -top-2 h-8 w-8 rounded-full bg-blue-500"></div>
              <div className="absolute -bottom-1 -left-1 h-4 w-4 rounded-full bg-purple-500 opacity-30"></div>
            </div>

            {/* Logic Operator (only for non-first rules) */}
            {index > 0 && (
              <div className="relative flex items-center justify-center mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg"></div>
                <div className="relative flex items-center space-x-3 p-3">
                  <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Operator logiczny:
                  </span>
                  <select
                    value={rule.logicOperator}
                    onChange={(e) => updateRule(index, { logicOperator: e.target.value as 'AND' | 'OR' })}
                    className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="AND">I (AND)</option>
                    <option value="OR">LUB (OR)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Rule Configuration */}
            <div className="relative">
              <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                {/* Field Selection */}
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Pole
                  </label>
                  <select
                    value={rule.field}
                    onChange={(e) => {
                      const newField = e.target.value
                      const availableOps = getAvailableOperators(newField)
                      updateRule(index, {
                        field: newField,
                        operator: availableOps[0]?.value || 'equals',
                        value: ''
                      })
                    }}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    {ruleFields.map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operator Selection */}
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Operator
                  </label>
                  <select
                    value={rule.operator}
                    onChange={(e) => updateRule(index, { operator: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    {getAvailableOperators(rule.field).map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Value Input */}
                <div className="flex-2 min-w-[200px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Wartość
                  </label>
                  {getValueInput(rule, index)}
                </div>

                {/* Remove Button */}
                <div className="flex-shrink-0">
                  <label className="block text-xs font-medium text-transparent mb-1">
                    .
                  </label>
                  <motion.button
                    onClick={() => removeRule(index)}
                    className="glass p-3 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-all duration-200"
                    title="Usuń regułę"
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Rule Description */}
            <div className="relative">
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    #{index + 1}
                  </span>
                  {index > 0 && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      rule.logicOperator === 'AND' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200'
                    }`}>
                      {rule.logicOperator === 'AND' ? 'I' : 'LUB'}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-medium">{ruleFields.find(f => f.value === rule.field)?.label}</span>
                  {' '}
                  <span className="text-slate-500 dark:text-slate-400">{getAvailableOperators(rule.field).find(op => op.value === rule.operator)?.label}</span>
                  {' '}
                  <span className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    "{rule.value || '...'}"
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Rules Summary */}
      {rules.length > 0 && (
        <motion.div 
          className="mt-8 relative overflow-hidden glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-50"></div>
          
          {/* Floating Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="floating absolute -right-3 -top-3 h-12 w-12 rounded-full bg-blue-500"></div>
            <div className="absolute -bottom-1 -left-1 h-6 w-6 rounded-full bg-indigo-500 opacity-30"></div>
          </div>

          <div className="relative">
            <h5 className="flex items-center text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              📋 Podsumowanie reguł
            </h5>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Wiadomości będą pokazane jeśli spełniają{' '}
              {rules.length === 1 ? 'regułę' : 'następujące warunki'}:
            </p>
            <div className="glass-card p-4 bg-white/50 dark:bg-slate-800/50">
              <div className="font-mono text-sm space-y-1">
                {rules.map((rule, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    {index > 0 && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        rule.logicOperator === 'AND' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200'
                      }`}>
                        {rule.logicOperator}
                      </span>
                    )}
                    <span className="text-slate-700 dark:text-slate-300">
                      <span className="font-medium text-blue-600 dark:text-blue-400">{rule.field}</span>
                      {' '}
                      <span className="text-slate-500">{rule.operator}</span>
                      {' '}
                      <span className="font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        "{rule.value}"
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}