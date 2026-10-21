import { useEffect, useState } from 'react';
import { Check, Loader2, Package, RefreshCw, ShoppingBag, Store, Users, X } from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getAdminOrders,
  getAllCustomers,
  getAllVendors,
  getPendingVendors,
  getPlatformStats,
  rejectVendor,
  verifyVendor,
} from '../api/admin.js';

function formatNaira(amount) {
  return `\u20a6${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const TABS = [
  { key: 'pending', label: 'Pending Applications' },
  { key: 'vendors', label: 'All Vendors' },
  { key: 'customers', label: 'All Customers' },
  { key: 'orders', label: 'Platform Orders' },
];

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700',
  verified: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  placed: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  preparing: 'bg-indigo-50 text-indigo-700',
  out_for_delivery: 'bg-purple-50 text-purple-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
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

  const [allOrders, setAllOrders] = useState(null);
  const [allOrdersLoading, setAllOrdersLoading] = useState(false);
  const [allOrdersError, setAllOrdersError] = useState('');

  const loadStats = () => {
    getPlatformStats(token)
      .then((data) => setStats(data.stats))
      .catch(() => {});
  };

  const loadPending = () => {
    setPendingLoading(true);
    setPendingError('');
    getPendingVendors(token)
      .then((data) => setPendingVendors(data.vendors || []))
      .catch((err) => setPendingError(err.message || 'Could not load pending applications.'))
      .finally(() => setPendingLoading(false));
  };

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

  const loadAllOrders = () => {
    setAllOrdersLoading(true);
    setAllOrdersError('');
    getAdminOrders(token)
      .then((data) => setAllOrders(data.orders || []))
      .catch((err) => setAllOrdersError(err.message || 'Could not load orders.'))
      .finally(() => setAllOrdersLoading(false));
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
    if (key === 'orders' && allOrders === null) loadAllOrders();
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
      loadStats();
      if (allVendors !== null) loadAllVendors();
    } catch (err) {
      setActionError(err.message || `Could not ${decision} this vendor.`);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <AppHeader tag="Admin" />

      <main className="mx-auto max-w-5xl px-6 py-10 sm:px-12">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Overview of users, vendor applications, and orders across FreshBasket.</p>
        </div>

        {/* Stats Row */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Customers" value={stats?.customersCount} />
          <StatCard label="Pending Vendors" value={stats?.pendingVendorsCount} />
          <StatCard label="Verified Vendors" value={stats?.verifiedVendorsCount} />
          <StatCard label="Rejected Vendors" value={stats?.rejectedVendorsCount} />
        </div>

        {/* Tab Controls */}
        <div className="mt-8 flex gap-2 border-b border-gray-100 pb-3">
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  isSelected
                    ? 'bg-emerald-800 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                {tab.key === 'pending' && pendingVendors.length > 0 && (
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                      isSelected ? 'bg-emerald-700 text-white' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {pendingVendors.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Tab Content */}
        <div className="mt-6">
          {actionError && (
            <div role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {actionError}
            </div>
          )}

          {activeTab === 'pending' && (
            <>
              {pendingLoading ? (
                <div className="flex items-center gap-2 py-16 text-gray-400">
                  <Loader2 size={18} className="animate-spin" />
                  Loading pending applications…
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

          {activeTab === 'orders' && (
            <>
              {allOrdersLoading ? (
                <div className="flex items-center gap-2 py-16 text-gray-400">
                  <Loader2 size={18} className="animate-spin" />
                  Loading platform orders…
                </div>
              ) : allOrdersError ? (
                <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {allOrdersError}
                </div>
              ) : !allOrders || allOrders.length === 0 ? (
                <EmptyState icon={Package} title="No orders yet" subtitle="Customer orders placed on the platform will appear here." />
              ) : (
                <div className="space-y-3">
                  {allOrders.map((ord) => (
                    <div key={ord.order_id} className="rounded-2xl border border-gray-100 p-4 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">Order #{ord.order_id}</span>
                          <StatusBadge status={ord.order_status} />
                          <span className="rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
                            {ord.payment_method === 'card' ? 'Card' : 'Cash'} ({ord.payment_status})
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          Buyer: <span className="font-medium text-gray-900">{ord.customer_name}</span> ({ord.customer_phone || ord.customer_email})
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Delivery: {ord.delivery_address} · {formatDate(ord.created_at)}
                        </p>
                      </div>
                      <div className="mt-3 text-left sm:mt-0 sm:text-right">
                        <p className="text-base font-bold text-emerald-800">{formatNaira(ord.total_amount)}</p>
                        <p className="text-xs text-gray-400">{ord.item_count || 1} items</p>
                      </div>
                    </div>
                  ))}
                </div>
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
            if (activeTab === 'orders') loadAllOrders();
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
