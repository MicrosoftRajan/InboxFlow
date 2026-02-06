'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Loader2, Send, Paperclip, Clock, Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ComposeModal({ isOpen, onClose, onSuccess }: ComposeModalProps) {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [senderEmail, setSenderEmail] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [delay, setDelay] = useState(0);
  const [hourlyLimit, setHourlyLimit] = useState(200);
  const [loading, setLoading] = useState(false);
  const [showSendLater, setShowSendLater] = useState(false);
  const [sendLaterOption, setSendLaterOption] = useState<string>('');

  useEffect(() => {
    if (user?.email && !senderEmail) setSenderEmail(user.email);
  }, [user, senderEmail]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      const emails = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      setRecipients(Array.from(new Set(emails)));
      toast.success(`Detected ${emails.length} unique email addresses`);
    };
    reader.readAsText(file);
  };

  const removeRecipient = (index: number) => {
    setRecipients((prev) => prev.filter((_, i) => i !== index));
  };

  const getScheduledTime = (): string => {
    if (!showSendLater) return new Date(Date.now() + 60000).toISOString();
    if (scheduledAt) return new Date(scheduledAt).toISOString();
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (sendLaterOption === 'Tomorrow') {
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow.toISOString();
    }
    if (sendLaterOption === 'Tomorrow, 10:00 AM') {
      tomorrow.setHours(10, 0, 0, 0);
      return tomorrow.toISOString();
    }
    if (sendLaterOption === 'Tomorrow, 11:00 AM') {
      tomorrow.setHours(11, 0, 0, 0);
      return tomorrow.toISOString();
    }
    if (sendLaterOption === 'Tomorrow, 3:00 PM') {
      tomorrow.setHours(15, 0, 0, 0);
      return tomorrow.toISOString();
    }
    return new Date(Date.now() + 60000).toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }
    if (!senderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      toast.error('Please enter a valid sender email address');
      return;
    }

    try {
      setLoading(true);
      await api.post('/emails/schedule', {
        subject,
        body,
        recipients,
        senderEmail,
        scheduledAt: getScheduledTime(),
        delay: Number(delay),
        hourlyLimit: Number(hourlyLimit),
      });
      toast.success(showSendLater ? 'Email scheduled!' : 'Campaign scheduled!');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header: ← Compose New Email, paperclip, Send Later, Send */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded text-black">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-black">Compose New Email</h2>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="p-2 hover:bg-gray-100 rounded text-black" title="Attachment">
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setShowSendLater(!showSendLater)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[#4CAF50] hover:bg-[#e8f5e9] rounded-lg text-sm font-medium"
            >
              <Clock className="w-4 h-4" />
              Send Later
            </button>
            <button
              type="submit"
              form="compose-form"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#4CAF50] hover:bg-[#45a049] text-white font-semibold rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </button>
          </div>
        </div>

        <form id="compose-form" onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* From */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-black w-14 shrink-0">From</label>
              <div className="flex-1 flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <input
                  required
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="flex-1 px-3 py-2 bg-transparent text-black focus:outline-none"
                  placeholder="sender@example.com"
                />
                <ChevronDown className="w-4 h-4 text-black/50 mr-3 shrink-0" />
              </div>
            </div>

            {/* To - green pill tags + Upload List */}
            <div className="flex items-start gap-3">
              <label className="text-sm font-medium text-black w-14 shrink-0 pt-2">To</label>
              <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2 p-2 border border-gray-200 rounded-lg bg-white">
                {recipients.length === 0 ? (
                  <span className="text-gray-400 text-sm">recipient@example.com</span>
                ) : (
                  recipients.map((r, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e8f5e9] text-[#2e7d32] text-sm font-medium"
                    >
                      {r}
                      <button
                        type="button"
                        onClick={() => removeRecipient(i)}
                        className="hover:bg-[#c8e6c9] rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" id="upload-list" />
                <label
                  htmlFor="upload-list"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[#4CAF50] hover:bg-[#e8f5e9] rounded-lg text-sm font-medium cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Upload List
                </label>
              </div>
            </div>

            {/* Subject */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-black w-14 shrink-0">Subject</label>
              <input
                required
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
                placeholder="Subject"
              />
            </div>

            {/* Delay & Hourly Limit - Figma "00" style */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-black">Delay between 2 emails</label>
                <input
                  type="number"
                  min={0}
                  value={delay}
                  onChange={(e) => setDelay(Number(e.target.value))}
                  className="w-16 px-2 py-1.5 border border-gray-200 rounded text-black text-center"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-black">Hourly Limit</label>
                <input
                  type="number"
                  min={1}
                  value={hourlyLimit}
                  onChange={(e) => setHourlyLimit(Number(e.target.value))}
                  className="w-16 px-2 py-1.5 border border-gray-200 rounded text-black text-center"
                />
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-1 py-1 border-y border-gray-100">
              <button type="button" className="p-2 hover:bg-gray-100 rounded text-black"><Bold className="w-4 h-4" /></button>
              <button type="button" className="p-2 hover:bg-gray-100 rounded text-black"><Italic className="w-4 h-4" /></button>
              <button type="button" className="p-2 hover:bg-gray-100 rounded text-black"><Underline className="w-4 h-4" /></button>
              <span className="w-px h-5 bg-gray-200 mx-1" />
              <button type="button" className="p-2 hover:bg-gray-100 rounded text-black"><List className="w-4 h-4" /></button>
              <button type="button" className="p-2 hover:bg-gray-100 rounded text-black"><ListOrdered className="w-4 h-4" /></button>
              <span className="w-px h-5 bg-gray-200 mx-1" />
              <button type="button" className="p-2 hover:bg-gray-100 rounded text-black"><AlignLeft className="w-4 h-4" /></button>
              <button type="button" className="p-2 hover:bg-gray-100 rounded text-black"><AlignCenter className="w-4 h-4" /></button>
              <button type="button" className="p-2 hover:bg-gray-100 rounded text-black"><AlignRight className="w-4 h-4" /></button>
            </div>

            {/* Body */}
            <textarea
              required
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] resize-none"
              placeholder="Type Your Reply..."
            />
          </div>

          {/* Send Later popup */}
          {showSendLater && (
            <div className="absolute right-6 top-24 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-10">
              <h3 className="text-sm font-semibold text-black mb-3">Send Later</h3>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-black text-sm"
                />
              </div>
              <p className="text-xs text-black/60 mb-2">Pick date & time</p>
              <div className="space-y-1 mb-4">
                {['Tomorrow', 'Tomorrow, 10:00 AM', 'Tomorrow, 11:00 AM', 'Tomorrow, 3:00 PM'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSendLaterOption(opt)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${sendLaterOption === opt ? 'bg-[#e8f5e9] text-[#4CAF50]' : 'text-black hover:bg-gray-100'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowSendLater(false)} className="px-3 py-1.5 text-black text-sm font-medium hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button type="button" onClick={() => setShowSendLater(false)} className="px-3 py-1.5 bg-[#4CAF50] text-white text-sm font-medium rounded-lg hover:bg-[#45a049]">
                  Done
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
