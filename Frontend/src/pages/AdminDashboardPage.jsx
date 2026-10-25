import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Store,
  Tag,
  Users,
  X,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Footer from '../components/Footer.jsx';
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
import {
  approveProduct,
  getAdminAllProducts,
  rejectProduct,
} from '../api/products.js';
import {
  getAllDisputes,
  resolveDispute,
} from '../api/orders.js';
import { getProductImageUrl, handleImageFallback } from '../utils/productImages.js';

function formatNaira(amount) {
  return `\u20a6${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const TABS = [
  { key: 'pending', label: 'Vendor Applications' },
  { key: 'products', label: 'Product Approvals' },
  { key: 'disputes', label: 'Customer Disputes' },
  { key: 'orders', label: 'Platform Orders' },
  { key: 'vendors', label: 'All Vendors' },
  { key: 'customers', label: 'All Customers' },
];

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  verified: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
  placed: 'bg-amber-50 text-amber-700 border border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border border-blue-200',
  preparing: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  out_for_delivery: 'bg-purple-50 text-purple-700 border border-purple-200',
  delivered: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
  open: 'bg-rose-50 text-rose-700 border border-rose-200',
  resolved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  dismissed: 'bg-gray-100 text-gray-700 border border-gray-200',
};

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatCard({ label, value, loading, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-emerald-200 transition">
      <div className="flex items-center justify-between">
        <p className="text-2xl font-black text-gray-900">
          {loading ? (
            <span className="inline-block h-7 w-8 animate-pulse rounded bg-gray-200" />
          ) : (
            Number(value ?? 0).toLocaleString()
          )}
        </p>
        {Icon && (
          <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
            <Icon size={18} />
          </div>
        )}
      </div>
      <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {status ? status.replace(/_/g, ' ') : 'unknown'}
    </span>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl bg-emerald-50/50 border border-emerald-100 py-16 text-center">
      <Icon className="text-emerald-700" size={32} />
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="text-sm text-gray-500 max-w-sm">{subtitle}</p>
    </div>
  );
}

function AdminDashboardPage() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Vendor approvals
  const [pendingVendors, setPendingVendors] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState('');
  const [actioningId, setActioningId] = useState(null);
  const [actionError, setActionError] = useState('');

  // Products
  const [allProducts, setAllProducts] = useState(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [productFilter, setProductFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [modifyingProductId, setModifyingProductId] = useState(null);

  // Disputes
  const [disputes, setDisputes] = useState(null);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputesError, setDisputesError] = useState('');
  const [activeDisputeModal, setActiveDisputeModal] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolvingState, setResolvingState] = useState(false);

  // All Vendors
  const [allVendors, setAllVendors] = useState(null);
  const [allVendorsLoading, setAllVendorsLoading] = useState(false);
  const [allVendorsError, setAllVendorsError] = useState('');

  // Customers
  const [allCustomers, setAllCustomers] = useState(null);
  const [allCustomersLoading, setAllCustomersLoading] = useState(false);
  const [allCustomersError, setAllCustomersError] = useState('');

  // Orders
  const [allOrders, setAllOrders] = useState(null);
  const [allOrdersLoading, setAllOrdersLoading] = useState(false);
  const [allOrdersError, setAllOrdersError] = useState('');

  const loadStats = () => {
    setStatsLoading(true);
    getPlatformStats(token)
      .then((data) => {
        if (data && data.stats) {
          setStats(data.stats);
        }
      })
      .catch((err) => {
        console.error('getPlatformStats error:', err);
      })
      .finally(() => {
        setStatsLoading(false);
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

  const loadProducts = () => {
    setProductsLoading(true);
    setProductsError('');
    getAdminAllProducts(token)
      .then((data) => setAllProducts(data.products || []))
      .catch((err) => setProductsError(err.message || 'Could not load products.'))
      .finally(() => setProductsLoading(false));
  };

  const loadDisputes = () => {
    setDisputesLoading(true);
    setDisputesError('');
    getAllDisputes(token)
      .then((data) => setDisputes(data.disputes || []))
      .catch((err) => setDisputesError(err.message || 'Could not load order disputes.'))
      .finally(() => setDisputesLoading(false));
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
    if (key === 'products' && allProducts === null) loadProducts();
    if (key === 'disputes' && disputes === null) loadDisputes();
    if (key === 'vendors' && allVendors === null) loadAllVendors();
    if (key === 'customers' && allCustomers === null) loadAllCustomers();
    if (key === 'orders' && allOrders === null) loadAllOrders();
  };

  const handleVendorDecision = async (vendorId, decision) => {
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

  const handleProductApproval = async (productId, status) => {
    setModifyingProductId(productId);
    try {
      if (status === 'approved') {
        await approveProduct(token, productId);
      } else {
        await rejectProduct(token, productId);
      }
      setAllProducts((prev) =>
        prev.map((p) => (p.product_id === productId ? { ...p, approval_status: status } : p))
      );
    } catch (err) {
      alert(err.message || `Failed to update product approval status.`);
    } finally {
      setModifyingProductId(null);
    }
  };

  const handleResolveDispute = async (status) => {
    if (!activeDisputeModal) return;
    if (!resolutionNote.trim()) {
      alert('Please enter an official resolution statement for the customer.');
      return;
    }

    setResolvingState(true);
    try {
      await resolveDispute(token, activeDisputeModal.dispute_id, status, resolutionNote.trim());
      setDisputes((prev) =>
        prev.map((d) =>
          d.dispute_id === activeDisputeModal.dispute_id
            ? { ...d, status, resolution: resolutionNote.trim(), updated_at: new Date().toISOString() }
            : d
        )
      );
      setActiveDisputeModal(null);
      setResolutionNote('');
    } catch (err) {
      alert(err.message || 'Failed to submit resolution.');
    } finally {
      setResolvingState(false);
    }
  };

  // Filter products for approval tab
  const filteredProducts = (allProducts || []).filter((p) => {
    if (productFilter === 'all') return true;
    return (p.approval_status || 'approved') === productFilter;
  });

  const pendingDisputesCount = (disputes || []).filter((d) => d.status === 'open').length;
  const pendingProductsCount = (allProducts || []).filter((p) => p.approval_status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <AppHeader tag="Admin Control" />

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Platform Admin Console</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage vendors, moderate catalog items, oversee orders, and resolve customer complaints across UNN Nsukka.
            </p>
          </div>

          {/* Platform Stats Row */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard
              label="Registered Customers"
              value={stats?.customersCount ?? stats?.total_customers}
              loading={statsLoading}
              icon={Users}
            />
            <StatCard
              label="Pending Applications"
              value={stats?.pendingVendorsCount ?? stats?.pending_vendors}
              loading={statsLoading}
              icon={Clock}
            />
            <StatCard
              label="Verified Vendors"
              value={stats?.verifiedVendorsCount ?? stats?.verified_vendors}
              loading={statsLoading}
              icon={Store}
            />
            <StatCard
              label="Platform Orders"
              value={stats?.totalOrdersCount ?? stats?.total_orders}
              loading={statsLoading}
              icon={Package}
            />
            <StatCard
              label="Catalog Products"
              value={stats?.productsCount ?? stats?.total_products}
              loading={statsLoading}
              icon={Tag}
            />
            <StatCard
              label="Open Disputes"
              value={stats?.openDisputesCount ?? stats?.open_disputes}
              loading={statsLoading}
              icon={AlertCircle}
            />
          </div>

          {/* Navigation Tabs */}
          <div className="mt-8 flex gap-2 overflow-x-auto border-b border-gray-200 pb-3 scrollbar-none">
            {TABS.map((tab) => {
              const isSelected = activeTab === tab.key;
              let badgeCount = 0;
              if (tab.key === 'pending') badgeCount = pendingVendors.length;
              if (tab.key === 'products') badgeCount = pendingProductsCount;
              if (tab.key === 'disputes') badgeCount = pendingDisputesCount;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isSelected
                      ? 'bg-emerald-900 text-white shadow-sm'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {tab.label}
                  {badgeCount > 0 && (
                    <span
                      className={`ml-1 rounded-full px-1.5 py-0.5 text-xs font-bold ${
                        isSelected ? 'bg-emerald-700 text-white' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {actionError && (
              <div role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                {actionError}
              </div>
            )}

            {/* TAB 1: PENDING VENDORS */}
            {activeTab === 'pending' && (
              <>
                {pendingLoading ? (
                  <div className="flex items-center gap-2 py-16 text-gray-400 justify-center">
                    <Loader2 size={20} className="animate-spin text-emerald-700" />
                    Loading pending applications…
                  </div>
                ) : pendingError ? (
                  <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    {pendingError}
                  </div>
                ) : pendingVendors.length === 0 ? (
                  <EmptyState
                    icon={Store}
                    title="No pending vendor applications"
                    subtitle="All vendor registrations have been reviewed. New submissions will appear here."
                  />
                ) : (
                  <ul className="space-y-4">
                    {pendingVendors.map((vendor) => (
                      <li
                        key={vendor.user_id}
                        className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 text-lg">{vendor.shop_name}</p>
                            {vendor.market_zone && (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-200">
                                📍 {vendor.market_zone}
                              </span>
                            )}
                            {vendor.category && (
                              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                                {vendor.category}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-600">Owner: <span className="font-medium text-gray-900">{vendor.full_name}</span></p>
                          <p className="text-sm text-gray-500">
                            {vendor.email} · {vendor.phone_number}
                          </p>
                          <p className="text-sm text-gray-500">{vendor.business_address}</p>
                          <p className="mt-1 text-xs text-gray-400">Applied {formatDate(vendor.created_at)}</p>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => handleVendorDecision(vendor.user_id, 'reject')}
                            disabled={actioningId === vendor.user_id}
                            className="flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition disabled:opacity-60"
                          >
                            <X size={16} />
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVendorDecision(vendor.user_id, 'verify')}
                            disabled={actioningId === vendor.user_id}
                            className="flex items-center gap-1.5 rounded-full bg-emerald-800 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 shadow transition disabled:opacity-60"
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

            {/* TAB 2: PRODUCT APPROVALS */}
            {activeTab === 'products' && (
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {['all', 'pending', 'approved', 'rejected'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setProductFilter(f)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${
                          productFilter === f
                            ? 'bg-emerald-900 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    Showing {filteredProducts.length} items
                  </span>
                </div>

                {productsLoading ? (
                  <div className="flex items-center gap-2 py-16 text-gray-400 justify-center">
                    <Loader2 size={20} className="animate-spin text-emerald-700" />
                    Loading catalog listings…
                  </div>
                ) : productsError ? (
                  <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    {productsError}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <EmptyState
                    icon={Package}
                    title="No products in this category"
                    subtitle="Vendor products ready for approval or catalog moderation will be listed here."
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((p) => {
                      const packaging = Array.isArray(p.packaging_options)
                        ? p.packaging_options
                        : (typeof p.packaging_options === 'string' ? JSON.parse(p.packaging_options || '[]') : []);

                      return (
                        <div
                          key={p.product_id}
                          className="flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                        >
                          <div>
                            <div className="relative mb-3 h-40 w-full overflow-hidden rounded-xl bg-gray-100">
                              <img
                                src={getProductImageUrl(p)}
                                alt={p.name}
                                onError={handleImageFallback}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute top-2 left-2">
                                <span className="inline-flex items-center rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-bold text-gray-800 shadow">
                                  📍 {p.market_zone || 'Ogige Market'}
                                </span>
                              </div>
                              <div className="absolute top-2 right-2">
                                <StatusBadge status={p.approval_status || 'approved'} />
                              </div>
                            </div>

                            <h3 className="font-bold text-gray-900 text-base">{p.name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Vendor: <span className="font-semibold text-gray-700">{p.vendor_name || p.shop_name}</span>
                            </p>
                            <p className="mt-1 text-sm font-bold text-emerald-800">
                              {formatNaira(p.price)}{' '}
                              <span className="text-xs font-normal text-gray-500">/ {p.unit || 'item'}</span>
                            </p>

                            {packaging.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {packaging.map((pkg, idx) => (
                                  <span key={idx} className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 border border-emerald-100">
                                    {pkg.unit_name}: {formatNaira(pkg.price)}
                                  </span>
                                ))}
                              </div>
                            )}

                            {p.description && (
                              <p className="mt-2 text-xs text-gray-500 line-clamp-2">{p.description}</p>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                            {p.approval_status !== 'approved' && (
                              <button
                                type="button"
                                onClick={() => handleProductApproval(p.product_id, 'approved')}
                                disabled={modifyingProductId === p.product_id}
                                className="flex items-center gap-1 rounded-full bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                              >
                                <Check size={14} /> Approve Listing
                              </button>
                            )}
                            {p.approval_status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={() => handleProductApproval(p.product_id, 'rejected')}
                                disabled={modifyingProductId === p.product_id}
                                className="flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 transition disabled:opacity-50"
                              >
                                <X size={14} /> Reject
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ORDER DISPUTES */}
            {activeTab === 'disputes' && (
              <div>
                {disputesLoading ? (
                  <div className="flex items-center gap-2 py-16 text-gray-400 justify-center">
                    <Loader2 size={20} className="animate-spin text-emerald-700" />
                    Loading customer dispute tickets…
                  </div>
                ) : disputesError ? (
                  <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    {disputesError}
                  </div>
                ) : !disputes || disputes.length === 0 ? (
                  <EmptyState
                    icon={ShieldCheck}
                    title="No disputes reported"
                    subtitle="Customer order issues, missing item reports, or refund requests will show up here."
                  />
                ) : (
                  <div className="space-y-4">
                    {disputes.map((d) => (
                      <div
                        key={d.dispute_id}
                        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-base">
                              Dispute #{d.dispute_id}
                            </span>
                            <span className="font-semibold text-emerald-800 text-sm">
                              (Order {d.order_code || `#${d.order_id}`})
                            </span>
                            <StatusBadge status={d.status} />
                          </div>
                          <span className="text-xs text-gray-400">
                            Logged {formatDate(d.created_at)}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="text-gray-400 text-xs uppercase font-medium">Customer:</span>
                            <p className="font-semibold text-gray-900">{d.customer_name} ({d.customer_phone || d.customer_email})</p>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs uppercase font-medium">Order Total:</span>
                            <p className="font-bold text-emerald-800">{formatNaira(d.total_amount)}</p>
                          </div>
                        </div>

                        <div className="mt-3 rounded-xl bg-rose-50/60 border border-rose-100 p-3 text-sm text-rose-950">
                          <p className="text-xs font-bold uppercase text-rose-800 mb-1">Customer Grievance:</p>
                          <p className="italic">"{d.reason}"</p>
                        </div>

                        {d.resolution && (
                          <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-950">
                            <p className="text-xs font-bold uppercase text-emerald-800 mb-1">Admin Resolution ({formatDate(d.updated_at)}):</p>
                            <p>{d.resolution}</p>
                          </div>
                        )}

                        {d.status === 'open' && (
                          <div className="mt-4 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDisputeModal(d);
                                setResolutionNote('');
                              }}
                              className="rounded-full bg-emerald-900 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 shadow transition"
                            >
                              Resolve Dispute
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: PLATFORM ORDERS */}
            {activeTab === 'orders' && (
              <>
                {allOrdersLoading ? (
                  <div className="flex items-center gap-2 py-16 text-gray-400 justify-center">
                    <Loader2 size={20} className="animate-spin text-emerald-700" />
                    Loading platform orders…
                  </div>
                ) : allOrdersError ? (
                  <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    {allOrdersError}
                  </div>
                ) : !allOrders || allOrders.length === 0 ? (
                  <EmptyState icon={Package} title="No orders placed yet" subtitle="Orders placed by UNN students and staff will appear here." />
                ) : (
                  <div className="space-y-3">
                    {allOrders.map((ord) => (
                      <div key={ord.order_id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 text-base">
                              Order {ord.order_code || `#${ord.order_id}`}
                            </span>
                            <StatusBadge status={ord.order_status} />
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-200">
                              {ord.fulfillment_type === 'pickup' ? '🏪 Self-Pickup' : '🛵 Campus Delivery'}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ord.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {ord.payment_method?.toUpperCase()} ({ord.payment_status})
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">
                            Buyer: <span className="font-semibold text-gray-900">{ord.customer_name}</span> ({ord.customer_phone || ord.customer_email})
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Destination: {ord.delivery_address || 'Self-Pickup at Vendor Stall'} · {formatDate(ord.created_at)}
                          </p>
                        </div>
                        <div className="mt-3 text-left sm:mt-0 sm:text-right">
                          <p className="text-lg font-extrabold text-emerald-800">{formatNaira(ord.total_amount)}</p>
                          <p className="text-xs text-gray-400">{ord.item_count || 1} items</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* TAB 5: ALL VENDORS */}
            {activeTab === 'vendors' && (
              <>
                {allVendorsLoading ? (
                  <div className="flex items-center gap-2 py-16 text-gray-400 justify-center">
                    <Loader2 size={20} className="animate-spin text-emerald-700" />
                    Loading vendors…
                  </div>
                ) : allVendorsError ? (
                  <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    {allVendorsError}
                  </div>
                ) : !allVendors || allVendors.length === 0 ? (
                  <EmptyState icon={Store} title="No vendors yet" subtitle="Approved and rejected vendors will appear here." />
                ) : (
                  <ul className="space-y-3">
                    {allVendors.map((vendor) => (
                      <li key={vendor.user_id} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900">{vendor.shop_name}</p>
                            <StatusBadge status={vendor.verification_status} />
                            {vendor.market_zone && (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800 border border-emerald-100 font-medium">
                                📍 {vendor.market_zone}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {vendor.full_name} · {vendor.email} · {vendor.phone_number}
                          </p>
                        </div>
                        <p className="shrink-0 text-xs text-gray-400">Joined {formatDate(vendor.created_at)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {/* TAB 6: ALL CUSTOMERS */}
            {activeTab === 'customers' && (
              <>
                {allCustomersLoading ? (
                  <div className="flex items-center gap-2 py-16 text-gray-400 justify-center">
                    <Loader2 size={20} className="animate-spin text-emerald-700" />
                    Loading customers…
                  </div>
                ) : allCustomersError ? (
                  <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    {allCustomersError}
                  </div>
                ) : !allCustomers || allCustomers.length === 0 ? (
                  <EmptyState icon={Users} title="No customers yet" subtitle="Customer accounts will show up here." />
                ) : (
                  <ul className="space-y-3">
                    {allCustomers.map((customer) => (
                      <li key={customer.user_id} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div>
                          <p className="font-bold text-gray-900">{customer.full_name}</p>
                          <p className="text-sm text-gray-500">
                            {customer.email} · {customer.phone_number}
                          </p>
                          {customer.default_delivery_address && (
                            <p className="text-xs text-gray-400 mt-0.5">📍 {customer.default_delivery_address}</p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs text-gray-400">Joined {formatDate(customer.created_at)}</p>
                          {!customer.profile_completed && (
                            <p className="mt-1 text-xs font-semibold text-amber-600">Profile Incomplete</p>
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
              if (activeTab === 'products') loadProducts();
              if (activeTab === 'disputes') loadDisputes();
              if (activeTab === 'vendors') loadAllVendors();
              if (activeTab === 'customers') loadAllCustomers();
              if (activeTab === 'orders') loadAllOrders();
            }}
            className="mt-8 flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-900"
          >
            <RefreshCw size={14} />
            Refresh current view
          </button>
        </main>
      </div>

      {/* DISPUTE RESOLUTION MODAL */}
      {activeDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                Resolve Dispute #{activeDisputeModal.dispute_id}
              </h3>
              <button
                type="button"
                onClick={() => setActiveDisputeModal(null)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600 space-y-1">
                <p><span className="font-bold text-gray-800">Order:</span> {activeDisputeModal.order_code || `#${activeDisputeModal.order_id}`}</p>
                <p><span className="font-bold text-gray-800">Customer:</span> {activeDisputeModal.customer_name} ({activeDisputeModal.customer_phone})</p>
                <p><span className="font-bold text-gray-800">Grievance:</span> "{activeDisputeModal.reason}"</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Official Admin Resolution Statement *
                </label>
                <textarea
                  rows={4}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g. Verified with dispatch rider; ₦1,500 refunded to customer Paystack balance due to damaged produce."
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="mt-5 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => handleResolveDispute('dismissed')}
                  disabled={resolvingState}
                  className="rounded-full border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
                >
                  Dismiss Dispute
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveDispute('resolved')}
                  disabled={resolvingState}
                  className="rounded-full bg-emerald-800 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50 shadow"
                >
                  {resolvingState ? 'Submitting…' : 'Approve & Mark Resolved'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default AdminDashboardPage;