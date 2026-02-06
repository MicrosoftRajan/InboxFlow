'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { LogOut, Plus, Mail, Send, Clock, Trash2, Search, Star, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import ComposeModal from '@/components/emails/ComposeModal';

export default function Dashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [stats, setStats] = useState({ scheduled: 0, sent: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      fetchEmails();
      fetchStats();
    }
  }, [user, authLoading, activeTab]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/emails');
      let s = { scheduled: 0, sent: 0 };
      data.forEach((email: any) => {
        if (email.status === 'SCHEDULED') s.scheduled++;
        else if (email.status === 'COMPLETED' || email.status === 'SENDING') s.sent++;
      });
      setStats(s);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchEmails = async () => {
    try {
      setLoading(true);
      if (activeTab === 'scheduled') {
        const { data } = await api.get('/emails/scheduled');
        setEmails(data);
      } else {
        const { data } = await api.get('/emails/sent?type=jobs');
        setEmails(data);
      }
    } catch (error) {
      toast.error('Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this campaign?')) return;
    try {
      await api.delete(`/emails/${id}`);
      toast.success('Campaign cancelled');
      fetchEmails();
      fetchStats();
    } catch (error) {
      toast.error('Failed to cancel campaign');
    }
  };

  const filteredEmails = emails.filter((email: any) => {
    const subject = (activeTab === 'scheduled' ? email.subject : email.email?.subject) ?? '';
    const to = activeTab === 'scheduled' ? '' : (email.recipient ?? '');
    const q = searchQuery.toLowerCase();
    return subject.toLowerCase().includes(q) || to.toLowerCase().includes(q);
  });

  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#1a1a1a] overflow-hidden">
      {/* Left Sidebar - dark Figma style */}
      <aside className="w-[260px] flex flex-col bg-[#1a1a1a] border-r border-[#2d2d2d]">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#4CAF50] flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-white/70 truncate">{user?.email}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-white/50 shrink-0" />
          </div>
          <button
            onClick={() => setIsComposeOpen(true)}
            className="w-full py-3 bg-[#4CAF50] hover:bg-[#45a049] text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Compose
          </button>
        </div>
        <div className="px-3 py-2">
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider px-2 mb-1">Core</p>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors ${
              activeTab === 'scheduled' ? 'bg-[#2d4a2e] text-[#4CAF50]' : 'text-white/80 hover:bg-white/5'
            }`}
          >
            <Clock className="w-5 h-5" />
            Scheduled
            <span className={`ml-auto text-xs font-semibold ${activeTab === 'scheduled' ? 'text-[#4CAF50]' : 'text-white/60'}`}>
              {stats.scheduled}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors ${
              activeTab === 'sent' ? 'bg-[#2d4a2e] text-[#4CAF50]' : 'text-white/80 hover:bg-white/5'
            }`}
          >
            <Send className="w-5 h-5" />
            Sent
            <span className={`ml-auto text-xs font-semibold ${activeTab === 'sent' ? 'text-[#4CAF50]' : 'text-white/60'}`}>
              {stats.sent}
            </span>
          </button>
        </div>
        <div className="mt-auto p-4 border-t border-[#2d2d2d]">
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main - email list */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#252525]">
        <header className="h-14 px-4 border-b border-[#2d2d2d] flex items-center gap-3">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#4CAF50] text-sm"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-white/60 text-sm">Loading emails...</div>
          ) : filteredEmails.length === 0 ? (
            <div className="py-24 text-center">
              <Mail className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-white/80">No emails found</h3>
              <p className="text-sm text-white/50 mt-1">
                {activeTab === 'scheduled' ? "You don't have any scheduled emails." : "You haven't sent any emails yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#2d2d2d]">
              {filteredEmails.map((email: any) => {
                const subject = activeTab === 'scheduled' ? email.subject : (email.email?.subject || 'No subject');
                const toLabel = activeTab === 'scheduled'
                  ? (Array.isArray(email.recipients) && email.recipients.length > 0 ? email.recipients[0] : `${email.recipients?.length || 0} recipients`)
                  : email.recipient;
                const snippet = activeTab === 'scheduled'
                  ? (email.body?.substring(0, 60) || '') + (email.body?.length > 60 ? '...' : '')
                  : (email.email?.body?.substring(0, 60) || '') + (email.email?.body?.length > 60 ? '...' : '');
                const timeStr = activeTab === 'scheduled'
                  ? new Date(email.scheduledAt).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
                  : email.sentAt ? new Date(email.sentAt).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }) : '';
                const statusLabel = activeTab === 'scheduled' ? 'Scheduled' : 'Sent';

                return (
                  <div
                    key={email.id}
                    className="flex items-start gap-4 px-6 py-4 hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white">To: {toLabel}</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e67e22]/20 text-[#e67e22] text-xs font-medium">
                          {timeStr} - {subject}
                        </span>
                      </div>
                      {snippet && (
                        <p className="text-sm text-white/70 mt-1 truncate">{snippet}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {activeTab === 'scheduled' && (
                        <button
                          onClick={() => handleCancel(email.id)}
                          className="p-1.5 text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Cancel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-1.5 text-white/40 hover:text-[#4CAF50] transition-colors">
                        <Star className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={() => { fetchEmails(); fetchStats(); }}
      />
    </div>
  );
}
