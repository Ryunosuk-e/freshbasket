import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mail,
  MailOpen,
  Inbox,
  CheckCheck,
  Package,
  ShieldCheck,
  AlertCircle,
  Truck,
  ArrowLeft,
  Search,
  Clock,
  ExternalLink,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications.js';

function formatMailDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export default function MailPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mailList, setMailList] = useState([]);
  const [selectedMail, setSelectedMail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('inbox'); // 'inbox', 'orders', 'kyc', 'unread'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMail = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getMyNotifications(token);
      const items = data.notifications || [];
      setMailList(items);

      // If URL has a specific mail ID or select first
      const requestedId = searchParams.get('id');
      if (requestedId) {
        const found = items.find((m) => String(m.notification_id) === String(requestedId));
        if (found) setSelectedMail(found);
      } else if (items.length > 0 && window.innerWidth >= 768) {
        setSelectedMail(items[0]);
      }
    } catch (err) {
      console.error('Failed to load mail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMail();
  }, [token]);

  const handleSelectMail = async (mail) => {
    setSelectedMail(mail);
    if (!mail.is_read) {
      try {
        await markNotificationRead(token, mail.notification_id);
        setMailList((prev) =>
          prev.map((m) => (m.notification_id === mail.notification_id ? { ...m, is_read: true } : m))
        );
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(token);
      setMailList((prev) => prev.map((m) => ({ ...m, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered items
  const filteredMail = mailList.filter((m) => {
    if (filterTab === 'unread' && m.is_read) return false;
    if (filterTab === 'orders' && !m.type.includes('order') && !m.type.includes('delivery')) return false;
    if (filterTab === 'kyc' && !m.type.includes('kyc') && !m.type.includes('vendor')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const subject = (m.title || m.type || '').toLowerCase();
      const body = (m.message || '').toLowerCase();
      return subject.includes(q) || body.includes(q);
    }
    return true;
  });

  const unreadTotal = mailList.filter((m) => !m.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <AppHeader />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-800 text-white shadow-xs">
                  <Mail size={20} />
                </span>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mail & Messages</h1>
                  <p className="text-xs text-gray-500">Official order alerts, KYC notices, and dispatch updates</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {unreadTotal > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition"
                >
                  <CheckCheck size={14} className="text-emerald-700" />
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* Mail Client Layout */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Sidebar Filters */}
            <div className="md:col-span-3 space-y-2">
              <div className="rounded-3xl border border-gray-200 bg-white p-3 shadow-xs">
                <button
                  type="button"
                  onClick={() => setFilterTab('inbox')}
                  className={`w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    filterTab === 'inbox' ? 'bg-emerald-800 text-white shadow-xs' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Inbox size={16} />
                    Inbox
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${filterTab === 'inbox' ? 'bg-emerald-900 text-emerald-100' : 'bg-gray-100 text-gray-600'}`}>
                    {mailList.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('unread')}
                  className={`mt-1 w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    filterTab === 'unread' ? 'bg-emerald-800 text-white shadow-xs' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Mail size={16} />
                    Unread
                  </span>
                  {unreadTotal > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                      {unreadTotal}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('orders')}
                  className={`mt-1 w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    filterTab === 'orders' ? 'bg-emerald-800 text-white shadow-xs' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Package size={16} />
                    Orders & Deliveries
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('kyc')}
                  className={`mt-1 w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    filterTab === 'kyc' ? 'bg-emerald-800 text-white shadow-xs' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <ShieldCheck size={16} />
                    KYC & Security
                  </span>
                </button>
              </div>

              {/* Quick Info Box */}
              <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-xs text-xs text-gray-500">
                <p className="font-bold text-gray-900 mb-1">Dispatch Channels</p>
                <p className="leading-relaxed">
                  Important alerts are also delivered via SMS and WhatsApp for active orders in Nsukka.
                </p>
              </div>
            </div>

            {/* Mail List Column */}
            <div className={`md:col-span-4 ${selectedMail ? 'hidden md:block' : 'block'}`}>
              <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-xs">
                {/* Search in mail */}
                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search mail subject, content…"
                      className="w-full rounded-2xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {loading ? (
                    <div className="p-8 text-center text-xs text-gray-400">Loading messages…</div>
                  ) : filteredMail.length === 0 ? (
                    <div className="p-12 text-center text-xs text-gray-400">
                      <MailOpen size={32} className="mx-auto text-gray-300 mb-2" />
                      No mail found in this folder.
                    </div>
                  ) : (
                    filteredMail.map((m) => {
                      const isSelected = selectedMail?.notification_id === m.notification_id;
                      const title = m.title || m.type.replace(/_/g, ' ');
                      return (
                        <div
                          key={m.notification_id}
                          onClick={() => handleSelectMail(m)}
                          className={`p-3.5 cursor-pointer transition flex items-start gap-3 ${
                            isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-800' : m.is_read ? 'hover:bg-gray-50 bg-white' : 'bg-emerald-50/30 hover:bg-emerald-50/50 font-semibold'
                          }`}
                        >
                          <span
                            className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                              m.is_read ? 'bg-transparent' : 'bg-emerald-700'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-xs truncate capitalize ${m.is_read ? 'text-gray-700 font-medium' : 'text-gray-900 font-bold'}`}>
                                {title}
                              </p>
                              <span className="text-[10px] text-gray-400 shrink-0 font-normal">
                                {formatMailDate(m.created_at)}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                              {m.message}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Mail Reader Detail Pane */}
            <div className={`md:col-span-5 ${selectedMail ? 'block' : 'hidden md:block'}`}>
              {selectedMail ? (
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedMail(null)}
                    className="md:hidden flex items-center gap-1.5 text-xs font-semibold text-emerald-800 mb-4"
                  >
                    <ArrowLeft size={14} />
                    Back to mail list
                  </button>

                  <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                    <div>
                      <span className="inline-block rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-2">
                        {selectedMail.type.replace(/_/g, ' ')}
                      </span>
                      <h2 className="text-base font-bold text-gray-900">
                        {selectedMail.title || selectedMail.type.replace(/_/g, ' ')}
                      </h2>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-semibold text-emerald-900">FreshBasket System</span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Clock size={11} />
                          {new Date(selectedMail.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mail Message Body */}
                  <div className="mt-6 text-sm text-gray-700 leading-relaxed bg-gray-50/60 rounded-2xl p-5 border border-gray-100">
                    {selectedMail.message}
                  </div>

                  {/* Contextual Actions */}
                  <div className="mt-6 flex flex-wrap gap-2">
                    {selectedMail.type.includes('order') && (
                      <Link
                        to="/orders"
                        className="flex items-center gap-1.5 rounded-full bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                      >
                        <Package size={14} />
                        View Your Orders
                      </Link>
                    )}
                    {(selectedMail.type.includes('kyc') || selectedMail.type.includes('vendor')) && user?.role === 'vendor' && (
                      <Link
                        to="/vendor/kyc"
                        className="flex items-center gap-1.5 rounded-full bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                      >
                        <ShieldCheck size={14} />
                        Open KYC Verification
                      </Link>
                    )}
                    <Link
                      to="/shop"
                      className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      <ExternalLink size={14} />
                      Go to Marketplace
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-gray-200 p-12 text-center text-xs text-gray-400 bg-white">
                  <MailOpen size={36} className="mx-auto text-gray-300 mb-2" />
                  Select a mail from the inbox to read its details.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
