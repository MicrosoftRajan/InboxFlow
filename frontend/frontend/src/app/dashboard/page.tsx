"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, RefreshCcw, Search, Filter } from 'lucide-react';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Email {
  id: string;
  subject: string;
  body: string;
  recipients: string[];
  scheduledAt: string;
  sentAt?: string;
  status: 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'FAILED';
  _count?: {
    jobs: number;
  };
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === 'scheduled' ? '/emails/scheduled' : '/emails/sent';
      const response = await api.get(endpoint);
      setEmails(response.data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load emails');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [activeTab]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Campaigns</h2>
          <p className="text-gray-500">Manage your scheduled and sent email campaigns</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm shadow-blue-200"
        >
          <Plus className="w-5 h-5" />
          Compose New Email
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('scheduled')}
              className={cn(
                "py-4 px-4 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'scheduled'
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Scheduled Emails
              </div>
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={cn(
                "py-4 px-4 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'sent'
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Sent Emails
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-500">Loading your emails...</p>
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === 'scheduled' ? <Clock className="w-8 h-8 text-gray-400" /> : <CheckCircle className="w-8 h-8 text-gray-400" />}
              </div>
              <h3 className="text-lg font-medium text-gray-900">No emails found</h3>
              <p className="text-gray-500 mt-1">
                {activeTab === 'scheduled' 
                  ? "You don't have any emails scheduled for later." 
                  : "You haven't sent any emails yet."}
              </p>
              {activeTab === 'scheduled' && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-6 text-blue-600 font-medium hover:text-blue-700"
                >
                  Create your first campaign
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3 pb-4 border-b border-gray-100">Subject</th>
                    <th className="px-4 py-3 pb-4 border-b border-gray-100">Recipients</th>
                    <th className="px-4 py-3 pb-4 border-b border-gray-100">
                      {activeTab === 'scheduled' ? 'Scheduled For' : 'Sent At'}
                    </th>
                    <th className="px-4 py-3 pb-4 border-b border-gray-100">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {emails.map((email) => (
                    <tr key={email.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{email.subject}</div>
                        <div className="text-sm text-gray-500 line-clamp-1 truncate max-w-xs">{email.body}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-700">
                          {email.recipients.length} {email.recipients.length === 1 ? 'recipient' : 'recipients'}
                        </div>
                        <div className="text-xs text-gray-400 truncate max-w-[150px]">
                          {email.recipients[0]}{email.recipients.length > 1 ? `, +${email.recipients.length - 1} more` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-700">
                          {new Date(activeTab === 'scheduled' ? email.scheduledAt : email.sentAt || '').toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          email.status === 'COMPLETED' ? "bg-green-100 text-green-800" :
                          email.status === 'SCHEDULED' ? "bg-blue-100 text-blue-800" :
                          email.status === 'SENDING' ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        )}>
                          {email.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {isModalOpen && (
        <ComposeModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchEmails();
          }} 
        />
      )}
    </div>
  );
}

// Separate component for clarity
import { X, Upload, Send, FileText } from 'lucide-react';

function ComposeModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [delay, setDelay] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(200);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileError, setFileError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Extract emails using regex
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const foundEmails = text.match(emailRegex) || [];
      const uniqueEmails = Array.from(new Set(foundEmails));
      
      if (uniqueEmails.length === 0) {
        setFileError('No valid email addresses found in the file.');
      } else {
        setRecipients(uniqueEmails);
        setFileError('');
        toast.success(`Found ${uniqueEmails.length} unique recipients`);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recipients.length === 0) {
      toast.error('Please provide at least one recipient');
      return;
    }
    if (!scheduledAt) {
      toast.error('Please set a scheduled time');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/emails/schedule', {
        subject,
        body,
        recipients,
        scheduledAt: new Date(scheduledAt).toISOString(),
        delay,
        hourlyLimit
      });
      toast.success('Email campaign scheduled successfully!');
      onSuccess();
    } catch (error) {
      console.error('Schedule error:', error);
      toast.error('Failed to schedule campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Compose New Email</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
              <input
                required
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter email subject"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Body</label>
              <textarea
                required
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                placeholder="Write your email content here..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Recipients (Upload CSV/Text)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all text-gray-500"
                  >
                    <Upload className="w-4 h-4" />
                    {recipients.length > 0 ? `${recipients.length} emails selected` : 'Select File'}
                  </label>
                </div>
                {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
                <input
                  required
                  type="datetime-local"
                  value={scheduledAt}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Delay between emails (seconds)</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={delay}
                  onChange={(e) => setDelay(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Hourly Limit</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={hourlyLimit}
                  onChange={(e) => setHourlyLimit(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Schedule Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
