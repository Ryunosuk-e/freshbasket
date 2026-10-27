import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, CheckCheck, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getMyNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications.js';

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotes = () => {
    if (!token) return;
    getMyNotifications(token)
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotes();
      const interval = setInterval(fetchNotes, 20000); // Polling every 20s
      return () => clearInterval(interval);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllNotificationsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await markNotificationRead(token, notif.notification_id);
        setNotifications((prev) =>
          prev.map((n) => (n.notification_id === notif.notification_id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {}
    }
    setIsOpen(false);
    navigate(`/mail?id=${notif.notification_id}`);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View mail and messages"
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition"
      >
        <Mail size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-emerald-700 px-1 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl border border-gray-200 bg-white p-4 shadow-xl z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <p className="text-sm font-bold text-gray-900">Mail & Messages</p>
              <p className="text-[11px] text-gray-500">Live order & KYC updates</p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:underline"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No mail yet.
              </div>
            ) : (
              notifications.slice(0, 6).map((n) => (
                <div
                  key={n.notification_id}
                  onClick={() => handleItemClick(n)}
                  className={`py-2.5 px-2 rounded-2xl cursor-pointer transition flex items-start gap-2.5 ${
                    n.is_read ? 'hover:bg-gray-50' : 'bg-emerald-50/40 hover:bg-emerald-50/70 font-medium'
                  }`}
                >
                  <span
                    className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                      n.is_read ? 'bg-transparent' : 'bg-emerald-700'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-900 truncate capitalize">
                        {n.title || n.type.replace(/_/g, ' ')}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0 font-normal">
                        {formatRelativeTime(n.created_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom link to dedicated full screen */}
          <div className="mt-3 border-t border-gray-100 pt-3">
            <Link
              to="/mail"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-800 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
            >
              <span>Open Mailbox (Full Screen)</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
