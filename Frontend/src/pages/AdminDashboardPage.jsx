import { useEffect, useState } from 'react';
import { Check, Loader2, RefreshCw, Store, Users, X } from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getAllCustomers,
  getAllVendors,
  getPendingVendors,
  getPlatformStats,
  rejectVendor,
  verifyVendor,
} from '../api/admin.js';

const TABS = [
  { key: 'pending', label: 'Pending Applications' },
  { key: 'vendors', label: 'All Vendors' },
  { key: 'customers', label: 'All Customers' },
];

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700',
  verified: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
};

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 p-4">
      <p className="text-2xl font-semibold text-gray-900">{value ?? '—'}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl bg-emerald-50 py-16 text-center">
      <Icon className="text-emerald-700" size={28} />
      <p className="font-medium text-gray-900">{title}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

function AdminDashboardPage() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');

  const [stats, setStats] = useState(null);

  const [pendingVendors, setPendingVendors] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState('');
  const [actioningId, setActioningId] = useState(null);
  const [actionError, setActionError] = useState('');

  const [allVendors, setAllVendors] = useState(null);
  const [allVendorsLoading, setAllVendorsLoading] = useState(false);
  const [allVendorsError, setAllVendorsError] = useState('');

  const [allCustomers, setAllCustomers] = useState(null);
  const [allCustomersLoading, setAllCustomersLoading] = useState(false);
  const [allCustomersError, setAllCustomersError] = useState('');

  const loadStats = () => {
    getPlatformStats(token)
      .then((data) => setStats(data.stats))
      .catch(() => {
        // Non-fatal — the cards just show "—" instead of blocking the page.
      });
  };

  const loadPending = () => {
    setPendingLoading(true);
    setPendingError('');
    getPendingVendors(token)
      .then((data) => setPendingVendors(data.vendors || []))
      .catch((err) => setPendingError(err.message || 'Could not load pending applications.'))
      .finally(() => setPendingLoading(false));
  };

  // Fetched once on first visit to each tab, not on every switch.
  const loadAllVendors = () => {
    setAllVendorsLoading(true);
    setAllVendorsError('');
    getAllVendors(token)
      .then((data) => setAllVendors(data.vendors || []))
      .catch((err) => setAllVendorsError(err.message || 'Could not load vendors.'))
      .finally(() => setAllVendorsLoading(false));
  };

  const loadAllCustomers = () => {
    setAllCustomersLoading(true);
    setAllCustomersError('');
    getAllCustomers(token)
      .then((data) => setAllCustomers(data.customers || []))
      .catch((err) => setAllCustomersError(err.message || 'Could not load customers.'))
      .finally(() => setAllCustomersLoading(false));
  };

  useEffect(() => {
    loadStats();
    loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === 'vendors' && allVendors === null) loadAllVendors();
    if (key === 'customers' && allCustomers === null) loadAllCustomers();
  };

  const handleDecision = async (vendorId, decision) => {
    if (decision === 'reject' && !window.confirm('Reject this vendor application?')) {
      return;
    }

    setActionError('');
    setActioningId(vendorId);
    try {
      const action = decision === 'verify' ? verifyVendor : rejectVendor;
      await action(token, vendorId);
      setPendingVendors((prev) => prev.filter((vendor) => vendor.user_id !== vendorId));
      setAllVendors(null); // stale now — refetch next time that tab is opened
      loadStats();
    } catch (err) {
      setActionError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <AppHeader tag="Admin" />

      <main className="mx-auto max-w-4xl px-6 py-12 sm:px-12">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Signed in as {user?.full_name}</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard label="Customers" value={stats?.total_customers} />
          <StatCard label="Vendors" value={stats?.total_vendors} />
          <StatCard label="Pending" value={stats?.pending_vendors} />
          <StatCard label="Verified" value={stats?.verified_vendors} />
          <StatCard label="Rejected" value={stats?.rejected_vendors} />
        </div>

        <div className="mt-8 flex gap-1 rounded-full bg-gray-100 p-1 sm:inline-flex">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition sm:flex-none ${
                activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {actionError && (
          <div role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        <div className="mt-6">
          {activeTab === 'pending' && (
            <>
              {pendingLoading ? (
                <div className="flex items-center gap-2 py-16 text-gray-400">
                  <Loader2 size={18} className="animate-spin" />
                  Loading applications…
                </div>
              ) : pendingError ? (
                <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {pendingError}
                </div>
              ) : pendingVendors.length === 0 ? (
                <EmptyState
                  icon={Store}
                  title="No pending applications"
                  subtitle="New vendor sign-ups will show up here for review."
                />
              ) : (
                <ul className="space-y-4">
                  {pendingVendors.map((vendor) => (
                    <li
                      key={vendor.user_id}
                      className="flex flex-col gap-4 rounded-2xl border border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{vendor.shop_name}</p>
                          {vendor.category && (
                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                              {vendor.category}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">Owner: {vendor.full_name}</p>
                        <p className="text-sm text-gray-500">
                          {vendor.email} · {vendor.phone_number}
                        </p>
                        <p className="text-sm text-gray-500">{vendor.business_address}</p>
                        <p className="mt-1 text-xs text-gray-400">Applied {formatDate(vendor.created_at)}</p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => handleDecision(vendor.user_id, 'reject')}
                          disabled={actioningId === vendor.user_id}
                          className="flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                        >
                          <X size={16} />
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecision(vendor.user_id, 'verify')}
                          disabled={actioningId === vendor.user_id}
                          className="flex items-center gap-1.5 rounded-full bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          <Check size={16} />
                          Approve
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {activeTab === 'vendors' && (
            <>
              {allVendorsLoading ? (
                <div className="flex items-center gap-2 py-16 text-gray-400">
                  <Loader2 size={18} className="animate-spin" />
                  Loading vendors…
                </div>
              ) : allVendorsError ? (
                <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {allVendorsError}
                </div>
              ) : !allVendors || allVendors.length === 0 ? (
                <EmptyState icon={Store} title="No vendors yet" subtitle="Approved and rejected vendors will appear here too." />
              ) : (
                <ul className="space-y-3">
                  {allVendors.map((vendor) => (
                    <li key={vendor.user_id} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{vendor.shop_name}</p>
                          <StatusBadge status={vendor.verification_status} />
                        </div>
                        <p className="text-sm text-gray-500">
                          {vendor.full_name} · {vendor.email}
                        </p>
                      </div>
                      <p className="shrink-0 text-xs text-gray-400">Joined {formatDate(vendor.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {activeTab === 'customers' && (
            <>
              {allCustomersLoading ? (
                <div className="flex items-center gap-2 py-16 text-gray-400">
                  <Loader2 size={18} className="animate-spin" />
                  Loading customers…
                </div>
              ) : allCustomersError ? (
                <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {allCustomersError}
                </div>
              ) : !allCustomers || allCustomers.length === 0 ? (
                <EmptyState icon={Users} title="No customers yet" subtitle="New sign-ups will show up here." />
              ) : (
                <ul className="space-y-3">
                  {allCustomers.map((customer) => (
                    <li key={customer.user_id} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 p-4">
                      <div>
                        <p className="font-semibold text-gray-900">{customer.full_name}</p>
                        <p className="text-sm text-gray-500">
                          {customer.email} · {customer.phone_number}
                        </p>
                        {customer.default_delivery_address && (
                          <p className="text-sm text-gray-500">{customer.default_delivery_address}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-gray-400">Joined {formatDate(customer.created_at)}</p>
                        {!customer.profile_completed && (
                          <p className="mt-1 text-xs font-medium text-amber-600">Profile incomplete</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            loadStats();
            if (activeTab === 'pending') loadPending();
            if (activeTab === 'vendors') loadAllVendors();
            if (activeTab === 'customers') loadAllCustomers();
          }}
          className="mt-8 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <RefreshCw size={14} />
          Refresh this tab
        </button>
      </main>
    </div>
  );
}

export default AdminDashboardPage;
