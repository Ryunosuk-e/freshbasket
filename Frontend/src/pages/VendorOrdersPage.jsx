import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  ShoppingBag,
  Truck,
  User,
  XCircle,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getVendorOrders, updateOrderStatus } from '../api/orders.js';

function formatNaira(amount) {
  return `\u20a6${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'active', label: 'To Fulfill' },
  { key: 'delivered', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const ORDER_STATUS_CONFIG = {
  placed: { label: 'New / Placed', style: 'bg-amber-50 text-amber-800 border-amber-200' },
  confirmed: { label: 'Confirmed', style: 'bg-blue-50 text-blue-800 border-blue-200' },
  preparing: { label: 'Preparing', style: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  out_for_delivery: { label: 'Out for Delivery', style: 'bg-purple-50 text-purple-800 border-purple-200' },
  delivered: { label: 'Delivered', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  cancelled: { label: 'Cancelled', style: 'bg-red-50 text-red-800 border-red-200' },
};

function VendorOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const loadOrders = () => {
    setIsLoading(true);
    setLoadError('');
    setActionError('');
    getVendorOrders(token)
      .then((data) => setOrders(data.orders || []))
      .catch((err) => setLoadError(err.message || 'Could not load store orders.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, [token]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    setActionError('');
    try {
      await updateOrderStatus(token, orderId, newStatus);
      setOrders((prev) =>
        prev.map((ord) => (ord.order_id === orderId ? { ...ord, order_status: newStatus } : ord))
      );
    } catch (err) {
      setActionError(err.message || 'Could not update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Metrics
  const totalOrders = orders.length;
  const activeOrdersCount = orders.filter((o) =>
    ['placed', 'confirmed', 'preparing', 'out_for_delivery'].includes(o.order_status)
  ).length;
  const totalRevenue = orders
    .filter((o) => o.order_status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.vendor_total || 0), 0);

  // Tab Filtering
  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'active') {
      return ['placed', 'confirmed', 'preparing', 'out_for_delivery'].includes(order.order_status);
    }
    if (activeTab === 'delivered') {
      return order.order_status === 'delivered';
    }
    if (activeTab === 'cancelled') {
      return order.order_status === 'cancelled';
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AppHeader tag="Vendor Portal" />

      <main className="mx-auto max-w-5xl px-6 py-10 sm:px-12">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Shop Orders</h1>
            <p className="mt-1 text-sm text-gray-500">Track and fulfill customer orders for your store products.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/vendor/products"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              My Products
            </Link>
            <button
              type="button"
              onClick={loadOrders}
              className="flex items-center gap-1.5 rounded-full bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Store Orders</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                <Package size={16} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{totalOrders}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">To Fulfill</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <Clock size={16} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-700">{activeOrdersCount}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Store Sales</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                <DollarSign size={16} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-800">{formatNaira(totalRevenue)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-2 border-b border-gray-200 pb-3">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                activeTab === tab.key
                  ? 'bg-emerald-800 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {actionError && (
          <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} />
            {actionError}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-gray-400">
            <Loader2 size={24} className="animate-spin text-emerald-700" />
            <p className="text-sm">Loading orders…</p>
          </div>
        ) : loadError ? (
          <div role="alert" className="mt-8 rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">
            {loadError}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <ShoppingBag size={24} />
            </div>
            <p className="text-base font-semibold text-gray-900">No orders in this category</p>
            <p className="text-xs text-gray-500">Orders placed by customers for your store products will appear here.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {filteredOrders.map((order) => {
              const status = order.order_status;
              const statusCfg = ORDER_STATUS_CONFIG[status] || { label: status, style: 'bg-gray-100 text-gray-700' };
              const isUpdating = updatingId === order.order_id;

              return (
                <div
                  key={order.order_id}
                  className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs transition hover:border-gray-300"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg font-bold text-gray-900">Order #{order.order_id}</span>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.style}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={12} />
                        Placed {formatDate(order.created_at)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-400">Store Subtotal</p>
                      <p className="text-lg font-bold text-emerald-800">{formatNaira(order.vendor_total)}</p>
                    </div>
                  </div>

                  {/* Customer & Delivery Details */}
                  <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-gray-50/70 p-4 sm:grid-cols-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                        <User size={14} className="text-emerald-700" />
                        {order.customer_name || 'Customer'}
                      </div>
                      {order.customer_phone && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Phone size={13} className="text-gray-400" />
                          <a href={`tel:${order.customer_phone}`} className="hover:underline text-emerald-800 font-medium">
                            {order.customer_phone}
                          </a>
                        </div>
                      )}
                      <p className="text-gray-500 capitalize">
                        Payment: {order.payment_method === 'card' ? 'Card' : 'Cash on Delivery'} ({order.payment_status})
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-start gap-1.5 text-gray-700">
                        <MapPin size={14} className="mt-0.5 shrink-0 text-emerald-700" />
                        <span>{order.delivery_address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Items for this vendor */}
                  <div className="mt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Items Ordered</h3>
                    <ul className="mt-2 divide-y divide-gray-100 border-t border-b border-gray-100">
                      {order.items.map((item) => (
                        <li key={`${item.product_id}-${item.product_name}`} className="flex items-center justify-between py-2.5 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold">
                              {item.quantity}×
                            </span>
                            <span className="font-medium text-gray-900">{item.product_name}</span>
                            <span className="text-xs text-gray-400">
                              (@ {formatNaira(item.unit_price)}{item.unit ? `/${item.unit}` : ''})
                            </span>
                          </div>
                          <span className="font-semibold text-gray-900">{formatNaira(item.line_total)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Controls for Status Progression */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="text-xs text-gray-500">
                      Next Step:{' '}
                      <span className="font-medium text-gray-700">
                        {status === 'placed' && 'Review & confirm order'}
                        {status === 'confirmed' && 'Pack and prepare grocery items'}
                        {status === 'preparing' && 'Hand over to delivery agent'}
                        {status === 'out_for_delivery' && 'Awaiting delivery confirmation'}
                        {status === 'delivered' && 'Order successfully completed'}
                        {status === 'cancelled' && 'Order was cancelled'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {status === 'placed' && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(order.order_id, 'confirmed')}
                          className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                          Confirm Order
                        </button>
                      )}

                      {status === 'confirmed' && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(order.order_id, 'preparing')}
                          className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <Package size={14} />}
                          Start Preparing
                        </button>
                      )}

                      {status === 'preparing' && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(order.order_id, 'out_for_delivery')}
                          className="flex items-center gap-1.5 rounded-full bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                        >
                          {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <Truck size={14} />}
                          Dispatch / Out for Delivery
                        </button>
                      )}

                      {status === 'out_for_delivery' && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(order.order_id, 'delivered')}
                          className="flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                        >
                          {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                          Mark as Delivered
                        </button>
                      )}

                      {['placed', 'confirmed', 'preparing'].includes(status) && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to cancel Order #${order.order_id}?`)) {
                              handleStatusChange(order.order_id, 'cancelled');
                            }
                          }}
                          className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <XCircle size={13} />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default VendorOrdersPage;
