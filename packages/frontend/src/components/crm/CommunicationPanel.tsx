'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { communicationApi } from '@/lib/api/communication';
import { CommunicationHistory as CommunicationHistoryComponent } from './CommunicationHistory';
import { apiClient } from '@/lib/api/client';

interface CommunicationPanelProps {
  companyId: string;
  contacts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  }>;
  onCommunicationSent?: () => void;
}

interface CommunicationHistoryItem {
  id: string;
  type: string;
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  fromAddress?: string;
  fromName?: string;
  toAddress?: string;
  createdAt: string;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  channel?: {
    name: string;
    type: string;
  };
}

export function CommunicationPanel({ companyId, contacts, onCommunicationSent }: CommunicationPanelProps) {
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('history');
  const [communicationType, setCommunicationType] = useState<'email' | 'sms' | 'call'>('email');
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<CommunicationHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      loadCommunicationHistory();
    }
  }, [activeTab, companyId]);

  const loadCommunicationHistory = async () => {
    try {
      setLoadingHistory(true);
      console.log('Loading communication history for company:', companyId);
      
      // Use apiClient with proper authentication
      const response = await apiClient.get(`/communications/company/${companyId}`);
      console.log('Communication history response:', {
        status: response.status,
        dataLength: response.data?.length,
        data: response.data
      });
      
      setHistory(response.data || []);
      
    } catch (error: any) {
      console.error('Error loading communication history:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Check if it's a 404 (no communications) vs real error
      if (error.response?.status === 404) {
        console.log('No communications found for company - setting empty array');
        setHistory([]);
      } else {
        toast.error('Błąd podczas ładowania historii komunikacji');
        setHistory([]); // Set empty array on error too
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendCommunication = async () => {
    if (!selectedContact) {
      toast.error('Wybierz kontakt');
      return;
    }

    if (!message.trim()) {
      toast.error('Wpisz wiadomość');
      return;
    }

    if (communicationType === 'email' && !subject.trim()) {
      toast.error('Wpisz temat emaila');
      return;
    }

    try {
      setSending(true);
      
      const contact = contacts.find(c => c.id === selectedContact);
      if (!contact) {
        toast.error('Kontakt nie znaleziony');
        return;
      }

      // Send communication based on type
      let result;
      
      switch (communicationType) {
        case 'email':
          if (!contact.email) {
            toast.error('Kontakt nie ma adresu email');
            return;
          }
          
          result = await (communicationApi as any).logCommunicationActivity({
            type: 'email',
            direction: 'outbound',
            subject: subject,
            body: message,
            companyId: companyId,
            contactId: selectedContact,
            status: 'sent'
          });
          
          toast.success('Email wysłany!');
          break;
          
        case 'sms':
          if (!contact.phone) {
            toast.error('Kontakt nie ma numeru telefonu');
            return;
          }
          
          result = await (communicationApi as any).logCommunicationActivity({
            type: 'sms',
            direction: 'outbound',
            body: message,
            companyId: companyId,
            contactId: selectedContact,
            status: 'sent'
          });
          
          toast.success('SMS wysłany!');
          break;
          
        case 'call':
          result = await (communicationApi as any).logCommunicationActivity({
            type: 'phone',
            direction: 'outbound',
            body: message,
            duration: 0, // Will be updated when call ends
            companyId: companyId,
            contactId: selectedContact,
            status: 'completed'
          });
          
          toast.success('Połączenie zarejestrowane!');
          break;
      }

      // Clear form
      setSubject('');
      setMessage('');
      setSelectedContact('');
      
      // Refresh history and parent component
      if (activeTab === 'history') {
        loadCommunicationHistory();
      }
      
      if (onCommunicationSent) {
        onCommunicationSent();
      }
      
    } catch (error: any) {
      console.error('Error sending communication:', error);
      toast.error('Błąd podczas wysyłania');
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes} min temu`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} godz. temu`;
    } else if (diffInHours < 48) {
      return 'Wczoraj';
    } else {
      return date.toLocaleDateString('pl-PL');
    }
  };

  const getCommunicationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return <EnvelopeIcon className="w-4 h-4" />;
      case 'phone':
      case 'call':
        return <PhoneIcon className="w-4 h-4" />;
      case 'sms':
      case 'chat':
        return <ChatBubbleLeftIcon className="w-4 h-4" />;
      default:
        return <EnvelopeIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header with tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('send')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'send'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <PaperAirplaneIcon className="w-4 h-4" />
              <span>Wyślij komunikację</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-4 h-4" />
              <span>Historia komunikacji</span>
            </div>
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'send' ? (
          /* Send Communication Form */
          <div className="space-y-6">
            {/* Communication Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Typ komunikacji
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setCommunicationType('email')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    communicationType === 'email'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <EnvelopeIcon className="w-4 h-4" />
                  <span>Email</span>
                </button>
                <button
                  onClick={() => setCommunicationType('sms')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    communicationType === 'sms'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <ChatBubbleLeftIcon className="w-4 h-4" />
                  <span>SMS</span>
                </button>
                <button
                  onClick={() => setCommunicationType('call')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    communicationType === 'call'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <PhoneIcon className="w-4 h-4" />
                  <span>Połączenie</span>
                </button>
              </div>
            </div>

            {/* Contact Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kontakt
              </label>
              <select
                value={selectedContact}
                onChange={(e) => setSelectedContact(e.target.value)}
                className="w-full input"
              >
                <option value="">Wybierz kontakt</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName}
                    {communicationType === 'email' && contact.email && ` (${contact.email})`}
                    {communicationType === 'sms' && contact.phone && ` (${contact.phone})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject (for email) */}
            {communicationType === 'email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temat
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full input"
                  placeholder="Wpisz temat emaila"
                />
              </div>
            )}

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {communicationType === 'email' ? 'Treść emaila' : 
                 communicationType === 'sms' ? 'Treść SMS' : 'Notatki z rozmowy'}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={communicationType === 'email' ? 6 : 4}
                className="w-full input"
                placeholder={
                  communicationType === 'email' ? 'Wpisz treść emaila...' :
                  communicationType === 'sms' ? 'Wpisz treść SMS...' :
                  'Dodaj notatki z rozmowy...'
                }
              />
            </div>

            {/* Send Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSendCommunication}
                disabled={sending}
                className="btn btn-primary"
              >
                {sending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Wysyłanie...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <PaperAirplaneIcon className="w-4 h-4" />
                    <span>
                      {communicationType === 'email' ? 'Wyślij email' :
                       communicationType === 'sms' ? 'Wyślij SMS' :
                       'Zarejestruj połączenie'}
                    </span>
                  </div>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Communication History */
          <CommunicationHistoryComponent
            history={history}
            loading={loadingHistory}
            onRefresh={loadCommunicationHistory}
          />
        )}
      </div>
    </div>
  );
}