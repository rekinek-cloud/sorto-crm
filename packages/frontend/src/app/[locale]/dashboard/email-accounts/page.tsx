'use client';

/**
 * Email Accounts Management Page
 * Interface for configuring IMAP/SMTP email accounts
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Inbox,
  Settings,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  CloudUpload,
  Mail,
  Monitor,
  Circle,
  Building2,
  Mailbox,
  Lightbulb,
  X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { emailAccountsApi, type EmailAccount, type EmailProvider } from '@/lib/api/emailAccounts';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

const GLASS_CARD = 'bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm';

// Types imported from @/lib/api/emailAccounts

interface FormData {
  name: string;
  email: string;
  provider: string;
  imapPassword: string;
  smtpPassword: string;
  syncIntervalMin: number;
  maxMessages: number;
  syncFolders: string;
}

export default function EmailAccountsPage() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [providers, setProviders] = useState<EmailProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<EmailProvider | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    provider: '',
    imapPassword: '',
    smtpPassword: '',
    syncIntervalMin: 5,
    maxMessages: 1000,
    syncFolders: 'INBOX, Sent'
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState<'provider' | 'config' | 'test'>('provider');

  // Load data
  useEffect(() => {
    loadAccounts();
    loadProviders();
  }, []);

  const loadAccounts = async () => {
    try {
      const { data } = await emailAccountsApi.getAccounts();
      setAccounts(data || []);
    } catch (error: any) {
      console.error('Failed to load email accounts:', error);
      toast.error('Nie udało się pobrać kont email');
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      const { data } = await emailAccountsApi.getProviders();
      setProviders((data || []) as any);
    } catch (error: any) {
      console.error('Failed to load providers:', error);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const result = await emailAccountsApi.syncAllAccounts();

      if (result.success) {
        toast.success((result as any).message || 'Synchronizacja ukończona');
        loadAccounts(); // Refresh data
      } else {
        toast.error('Synchronizacja nie powiodła się');
      }
    } catch (error: any) {
      console.error('Sync failed:', error);
      toast.error('Błąd podczas synchronizacji');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncAccount = async (accountId: string) => {
    try {
      const result = await emailAccountsApi.syncAccount(accountId);

      if (result.success) {
        toast.success('Konto zsynchronizowane');
        loadAccounts();
      } else {
        toast.error('Synchronizacja nie powiodła się');
      }
    } catch (error: any) {
      console.error('Account sync failed:', error);
      toast.error('Błąd podczas synchronizacji konta');
    }
  };

  const handleDeleteAccount = async (accountId: string, email: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć konto ${email}?`)) {
      return;
    }

    try {
      await emailAccountsApi.deleteAccount(accountId);
      toast.success('Konto email zostało usunięte');
      loadAccounts();
    } catch (error: any) {
      console.error('Failed to delete account:', error);
      toast.error('Nie udało się usunąć konta');
    }
  };

  const handleProviderSelect = (provider: EmailProvider) => {
    setSelectedProvider(provider);
    setFormData(prev => ({
      ...prev,
      provider: provider.provider,
      name: `${provider.name} - ${formData.email || 'Konto'}`,
      email: formData.email || ''
    }));
    setStep('config');
  };

  const handleTestConnection = async () => {
    if (!selectedProvider) return;

    setTestingConnection(true);
    try {
      const testData = {
        provider: selectedProvider.provider,
        imapHost: selectedProvider.imapHost,
        imapPort: selectedProvider.imapPort,
        imapSecure: selectedProvider.imapSecure,
        imapUsername: formData.email,
        imapPassword: formData.imapPassword,
        smtpHost: selectedProvider.smtpHost,
        smtpPort: selectedProvider.smtpPort,
        smtpSecure: selectedProvider.smtpSecure,
        smtpUsername: formData.email,
        smtpPassword: formData.smtpPassword
      };

      const result = await emailAccountsApi.testConnection(testData);

      if (result.success) {
        toast.success('Połączenie udane! Możesz utworzyć konto.');
        setStep('test');
      } else {
        const errors = [];
        if (!result.data.imap.success) {
          errors.push(`IMAP: ${result.data.imap.error}`);
        }
        if (!result.data.smtp.success) {
          errors.push(`SMTP: ${result.data.smtp.error}`);
        }
        toast.error(`Błąd połączenia:\n${errors.join('\n')}`);
      }
    } catch (error: any) {
      console.error('Connection test failed:', error);
      toast.error('Nie udało się przetestować połączenia');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!selectedProvider) return;

    setCreating(true);
    try {
      const accountData = {
        name: formData.name,
        email: formData.email,
        provider: selectedProvider.provider,
        imapHost: selectedProvider.imapHost,
        imapPort: selectedProvider.imapPort,
        imapSecure: selectedProvider.imapSecure,
        imapUsername: formData.email,
        imapPassword: formData.imapPassword,
        smtpHost: selectedProvider.smtpHost,
        smtpPort: selectedProvider.smtpPort,
        smtpSecure: selectedProvider.smtpSecure,
        smtpUsername: formData.email,
        smtpPassword: formData.smtpPassword,
        syncIntervalMin: formData.syncIntervalMin,
        maxMessages: formData.maxMessages,
        syncFolders: formData.syncFolders.split(',').map(f => f.trim())
      };

      const result = await emailAccountsApi.createAccount(accountData) as any;

      if (result.success) {
        toast.success('Konto email zostało utworzone!');
        setShowCreateModal(false);
        resetForm();
        loadAccounts();
      } else {
        toast.error('Nie udało się utworzyć konta email');
      }
    } catch (error: any) {
      console.error('Failed to create account:', error);
      const errorMsg = error.response?.data?.error || 'Nie udało się utworzyć konta';
      toast.error(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      provider: '',
      imapPassword: '',
      smtpPassword: '',
      syncIntervalMin: 5,
      maxMessages: 1000,
      syncFolders: 'INBOX, Sent'
    });
    setSelectedProvider(null);
    setStep('provider');
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const getStatusColor = (status: string): "default" | "outline" | "destructive" | "secondary" | "success" | "warning" | "info" => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'ERROR': return 'destructive';
      case 'DISABLED': return 'default';
      default: return 'default';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'GMAIL': return <Mail className="w-8 h-8 text-red-500" />;
      case 'OUTLOOK': return <Monitor className="w-8 h-8 text-blue-500" />;
      case 'YAHOO': return <Circle className="w-8 h-8 text-purple-500" />;
      case 'EXCHANGE': return <Building2 className="w-8 h-8 text-slate-600 dark:text-slate-400" />;
      default: return <Mailbox className="w-8 h-8 text-slate-500" />;
    }
  };

  const getProviderIconSmall = (provider: string) => {
    switch (provider) {
      case 'GMAIL': return <Mail className="w-6 h-6 text-red-500" />;
      case 'OUTLOOK': return <Monitor className="w-6 h-6 text-blue-500" />;
      case 'YAHOO': return <Circle className="w-6 h-6 text-purple-500" />;
      case 'EXCHANGE': return <Building2 className="w-6 h-6 text-slate-600 dark:text-slate-400" />;
      default: return <Mailbox className="w-6 h-6 text-slate-500" />;
    }
  };

  const formatLastSync = (lastSyncAt?: string) => {
    if (!lastSyncAt) return 'Nigdy';

    const date = new Date(lastSyncAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Przed chwilą';
    if (diffMins < 60) return `${diffMins} min temu`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} godz. temu`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} dni temu`;
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Konta Email"
        subtitle="Zarządzaj kontami IMAP/SMTP dla automatycznej synchronizacji emaili"
        icon={Mail}
        iconColor="text-blue-600"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Konta Email' },
        ]}
        actions={
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleSyncAll}
              disabled={syncing || accounts.length === 0}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Synchronizacja...' : 'Synchronizuj Wszystkie'}
            </Button>

            <Button
              variant="default"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Dodaj Konto Email
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className={`${GLASS_CARD} p-4`}>
          <div className="flex items-center">
            <Inbox className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{accounts.length}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Wszystkie konta</div>
            </div>
          </div>
        </div>

        <div className={`${GLASS_CARD} p-4`}>
          <div className="flex items-center">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {accounts.filter(a => a.status === 'ACTIVE').length}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Aktywne</div>
            </div>
          </div>
        </div>

        <div className={`${GLASS_CARD} p-4`}>
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-500" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {accounts.filter(a => a.status === 'ERROR').length}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Błędy</div>
            </div>
          </div>
        </div>

        <div className={`${GLASS_CARD} p-4`}>
          <div className="flex items-center">
            <CloudUpload className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {accounts.reduce((sum, a) => sum + a.syncCount, 0)}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Zsynchronizowane</div>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="space-y-4">
        {accounts.length === 0 ? (
          <div className={`${GLASS_CARD} p-8 text-center`}>
            <Inbox className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              Brak kont email
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Dodaj swoje pierwsze konto email, aby automatycznie synchronizować wiadomości
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Dodaj Konto Email
            </Button>
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className={`${GLASS_CARD} p-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    {getProviderIcon(account.provider)}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {account.name}
                      </h3>
                      <Badge variant={getStatusColor(account.status)}>
                        {account.status}
                      </Badge>
                      {!account.isActive && (
                        <Badge variant="default">Nieaktywne</Badge>
                      )}
                    </div>

                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      <div>{account.email}</div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span>Provider: {account.provider}</span>
                        <span className="text-slate-400 dark:text-slate-500">|</span>
                        <span>Ostatnia sync: {formatLastSync(account.lastSyncAt)}</span>
                        <span className="text-slate-400 dark:text-slate-500">|</span>
                        <span>{account.syncCount} wiadomości</span>
                      </div>
                    </div>

                    {account.errorMessage && (
                      <div className="flex items-center mt-2 text-red-600 dark:text-red-400 text-sm">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {account.errorMessage}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSyncAccount(account.id)}
                    disabled={!account.isActive}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {/* TODO: Edit account */}}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAccount(account.id, account.email)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Account Details */}
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Interwał sync:</span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">{account.syncIntervalMin} min</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Max wiadomości:</span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">{account.maxMessages}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Foldery:</span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">{account.syncFolders.join(', ')}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full border border-slate-200 dark:border-slate-700 mx-4 overflow-y-auto" style={{ maxWidth: '48rem', maxHeight: '90vh' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Dodaj Konto Email</h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Step 1: Provider Selection */}
            {step === 'provider' && (
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Wybierz dostawcę email</h3>
                <div className="grid grid-cols-2 gap-4">
                  {providers.map((provider) => (
                    <button
                      key={provider.provider}
                      onClick={() => handleProviderSelect(provider)}
                      className="p-4 border-2 border-slate-200 dark:border-slate-600 rounded-2xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div>{getProviderIconSmall(provider.provider)}</div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{provider.name}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">{provider.description}</div>
                        </div>
                      </div>
                      {provider.helpText && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-start gap-1">
                          <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500" />
                          <span>{provider.helpText}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Configuration */}
            {step === 'config' && selectedProvider && (
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <button
                    onClick={() => setStep('provider')}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    &larr; Powrót
                  </button>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Konfiguracja {selectedProvider.name}</h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Nazwa konta
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="Np. Główne konto Gmail"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Adres email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value, name: `${selectedProvider.name} - ${e.target.value}` }))}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Hasło IMAP {selectedProvider.provider === 'GMAIL' ? '(App Password)' : ''}
                      </label>
                      <input
                        type="password"
                        value={formData.imapPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, imapPassword: e.target.value, smtpPassword: e.target.value }))}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="Hasło do konta email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Hasło SMTP
                      </label>
                      <input
                        type="password"
                        value={formData.smtpPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, smtpPassword: e.target.value }))}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="Zwykle takie samo jak IMAP"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Interwał sync (min)
                      </label>
                      <select
                        value={formData.syncIntervalMin}
                        onChange={(e) => setFormData(prev => ({ ...prev, syncIntervalMin: parseInt(e.target.value) }))}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      >
                        <option value={1}>1 minuta</option>
                        <option value={5}>5 minut</option>
                        <option value={15}>15 minut</option>
                        <option value={30}>30 minut</option>
                        <option value={60}>1 godzina</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Max wiadomości
                      </label>
                      <select
                        value={formData.maxMessages}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxMessages: parseInt(e.target.value) }))}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      >
                        <option value={100}>100</option>
                        <option value={500}>500</option>
                        <option value={1000}>1000</option>
                        <option value={2000}>2000</option>
                        <option value={5000}>5000</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Foldery
                      </label>
                      <input
                        type="text"
                        value={formData.syncFolders}
                        onChange={(e) => setFormData(prev => ({ ...prev, syncFolders: e.target.value }))}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="INBOX, Sent, Drafts"
                      />
                    </div>
                  </div>

                  {/* Connection Details */}
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Ustawienia połączenia</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-700 dark:text-slate-300">
                      <div>
                        <strong>IMAP:</strong> {selectedProvider.imapHost}:{selectedProvider.imapPort}
                        ({selectedProvider.imapSecure ? 'SSL' : 'STARTTLS'})
                      </div>
                      <div>
                        <strong>SMTP:</strong> {selectedProvider.smtpHost}:{selectedProvider.smtpPort}
                        ({selectedProvider.smtpSecure ? 'SSL' : 'STARTTLS'})
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={handleCloseModal}
                  >
                    Anuluj
                  </Button>
                  <Button
                    onClick={handleTestConnection}
                    disabled={!formData.email || !formData.imapPassword || testingConnection}
                  >
                    {testingConnection ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Testowanie...
                      </>
                    ) : (
                      'Testuj Połączenie'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Test Results & Create */}
            {step === 'test' && selectedProvider && (
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <button
                    onClick={() => setStep('config')}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    &larr; Powrót
                  </button>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Gotowe do utworzenia</h3>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                    <div>
                      <h4 className="font-medium text-green-900 dark:text-green-100">Połączenie udane!</h4>
                      <p className="text-green-700 dark:text-green-300 text-sm">Konto {formData.email} jest gotowe do synchronizacji</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl mb-6">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Podsumowanie konfiguracji</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-700 dark:text-slate-300">
                    <div>
                      <strong>Nazwa:</strong> {formData.name}
                    </div>
                    <div>
                      <strong>Email:</strong> {formData.email}
                    </div>
                    <div>
                      <strong>Provider:</strong> {selectedProvider.name}
                    </div>
                    <div>
                      <strong>Synchronizacja:</strong> co {formData.syncIntervalMin} min
                    </div>
                    <div>
                      <strong>Max wiadomości:</strong> {formData.maxMessages}
                    </div>
                    <div>
                      <strong>Foldery:</strong> {formData.syncFolders}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleCloseModal}
                  >
                    Anuluj
                  </Button>
                  <Button
                    onClick={handleCreateAccount}
                    disabled={creating}
                  >
                    {creating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Tworzenie...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Utwórz Konto
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
