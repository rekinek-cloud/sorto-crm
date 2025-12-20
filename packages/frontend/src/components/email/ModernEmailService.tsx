'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  EnvelopeIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  CursorArrowRaysIcon
} from '@heroicons/react/24/outline';

interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  subject: string;
  category?: string;
  variables: string[];
}

interface EmailStats {
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  bounced: number;
  spam: number;
}

interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export default function ModernEmailService() {
  const [activeTab, setActiveTab] = useState<'send' | 'templates' | 'stats' | 'config'>('send');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [configTest, setConfigTest] = useState<{ success: boolean; provider: string; error?: string } | null>(null);

  // Send email form
  const [emailForm, setEmailForm] = useState<EmailMessage>({
    to: '',
    subject: '',
    text: '',
    html: ''
  });

  // Template email form
  const [templateForm, setTemplateForm] = useState({
    templateId: '',
    to: '',
    templateData: {}
  });

  useEffect(() => {
    loadTemplates();
    loadStats();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/v1/modern-email/templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error: any) {
      console.error('Error loading templates:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/v1/modern-email/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const sendEmail = async () => {
    if (!emailForm.to || !emailForm.subject || (!emailForm.text && !emailForm.html)) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/v1/modern-email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailForm),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Email sent successfully!');
        setEmailForm({ to: '', subject: '', text: '', html: '' });
        loadStats(); // Refresh stats
      } else {
        toast.error(data.error || 'Failed to send email');
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const sendTemplateEmail = async () => {
    if (!templateForm.templateId || !templateForm.to) {
      toast.error('Please select template and recipient');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/v1/modern-email/send-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateForm),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Template email sent successfully!');
        setTemplateForm({ templateId: '', to: '', templateData: {} });
        loadStats();
      } else {
        toast.error(data.error || 'Failed to send template email');
      }
    } catch (error: any) {
      console.error('Error sending template email:', error);
      toast.error('Failed to send template email');
    } finally {
      setLoading(false);
    }
  };

  const testConfiguration = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/modern-email/test-config', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setConfigTest(data.test);
        if (data.test.success) {
          toast.success(`Email configuration working! Using ${data.test.provider}`);
        } else {
          toast.error(data.test.error || 'Configuration test failed');
        }
      }
    } catch (error: any) {
      console.error('Error testing configuration:', error);
      toast.error('Failed to test configuration');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedTemplate = () => {
    return templates.find(t => t.id === templateForm.templateId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <EnvelopeIcon className="w-8 h-8 mr-3 text-blue-600" />
              Modern Email Service
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Send emails using SendGrid, AWS SES, or SMTP with templates and tracking
            </p>
          </div>
          <button
            onClick={testConfiguration}
            disabled={loading}
            className="btn btn-outline flex items-center"
          >
            <CogIcon className="w-4 h-4 mr-2" />
            Test Config
          </button>
        </div>
      </div>

      {/* Configuration Test Result */}
      {configTest && (
        <div className={`p-4 rounded-lg border ${
          configTest.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center">
            {configTest.success ? (
              <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-red-600 mr-2" />
            )}
            <span className="font-medium">
              {configTest.success 
                ? `Email service working! Using ${configTest.provider}` 
                : `Configuration failed: ${configTest.error}`
              }
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'send', label: 'Send Email', icon: PaperAirplaneIcon },
              { key: 'templates', label: 'Templates', icon: DocumentTextIcon },
              { key: 'stats', label: 'Statistics', icon: ChartBarIcon },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Send Email Tab */}
          {activeTab === 'send' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Send Custom Email</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipients (To) *
                  </label>
                  <input
                    type="email"
                    value={emailForm.to}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, to: e.target.value }))}
                    className="input"
                    placeholder="recipient@example.com"
                    multiple
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="input"
                    placeholder="Email subject"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Content *
                </label>
                <textarea
                  value={emailForm.text}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, text: e.target.value }))}
                  rows={8}
                  className="input"
                  placeholder="Email content..."
                />
              </div>

              <button
                onClick={sendEmail}
                disabled={loading}
                className="btn btn-primary flex items-center"
              >
                <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                {loading ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Send Template Email</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Template *
                  </label>
                  <select
                    value={templateForm.templateId}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, templateId: e.target.value }))}
                    className="input"
                  >
                    <option value="">Select a template...</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipients (To) *
                  </label>
                  <input
                    type="email"
                    value={templateForm.to}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, to: e.target.value }))}
                    className="input"
                    placeholder="recipient@example.com"
                  />
                </div>
              </div>

              {/* Template Variables */}
              {getSelectedTemplate() && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Template Variables</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getSelectedTemplate()!.variables.map(variable => (
                      <div key={variable}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {variable}
                        </label>
                        <input
                          type="text"
                          value={(templateForm.templateData as any)[variable] || ''}
                          onChange={(e) => setTemplateForm(prev => ({
                            ...prev,
                            templateData: {
                              ...prev.templateData,
                              [variable]: e.target.value
                            }
                          }))}
                          className="input"
                          placeholder={`Enter ${variable}...`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Template Preview */}
              {getSelectedTemplate() && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Template Preview</h4>
                  <div className="text-sm text-gray-600">
                    <p><strong>Name:</strong> {getSelectedTemplate()!.name}</p>
                    <p><strong>Subject:</strong> {getSelectedTemplate()!.subject}</p>
                    <p><strong>Description:</strong> {getSelectedTemplate()!.description}</p>
                  </div>
                </div>
              )}

              <button
                onClick={sendTemplateEmail}
                disabled={loading || !templateForm.templateId}
                className="btn btn-primary flex items-center"
              >
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                {loading ? 'Sending...' : 'Send Template Email'}
              </button>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Email Statistics</h3>
                <button
                  onClick={loadStats}
                  className="btn btn-outline btn-sm"
                >
                  Refresh
                </button>
              </div>

              {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center">
                      <PaperAirplaneIcon className="w-8 h-8 text-blue-600" />
                      <div className="ml-3">
                        <div className="text-2xl font-bold text-blue-900">{stats.sent}</div>
                        <div className="text-sm text-blue-600">Sent</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-8 h-8 text-green-600" />
                      <div className="ml-3">
                        <div className="text-2xl font-bold text-green-900">{stats.delivered}</div>
                        <div className="text-sm text-green-600">Delivered</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center">
                      <XCircleIcon className="w-8 h-8 text-red-600" />
                      <div className="ml-3">
                        <div className="text-2xl font-bold text-red-900">{stats.failed}</div>
                        <div className="text-sm text-red-600">Failed</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center">
                      <EyeIcon className="w-8 h-8 text-purple-600" />
                      <div className="ml-3">
                        <div className="text-2xl font-bold text-purple-900">{stats.opened}</div>
                        <div className="text-sm text-purple-600">Opened</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Available Templates List */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Available Templates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(template => (
                    <div key={template.id} className="bg-gray-50 p-4 rounded-lg border">
                      <h5 className="font-medium text-gray-900">{template.name}</h5>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {template.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {template.variables.length} variables
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}