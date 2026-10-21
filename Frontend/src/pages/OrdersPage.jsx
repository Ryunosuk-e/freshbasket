import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Clock, Loader2, Package, ShoppingBag } from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getMyOrders } from '../api/orders.js';

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

const ORDER_STATUS_CONFIG = {
  placed: { label: 'Order Placed', style: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmed', style: 'bg-blue-50 text-blue-700 border-blue-200' },
  preparing: { label: 'Preparing', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  out_for_delivery: { label: 'Out for Delivery', style: 'bg-purple-50 text-purple-700 border-purple-200' },
  delivered: { label: 'Delivered', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', style: 'bg-red-50 text-red-700 border-red-200' },
};

const PAYMENT_STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-700',
};

function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadOrders = () => {
    setIsLoading(true);
    setLoadError('');
    getMyOrders(token)
      .then((data) => setOrders(data.orders || []))
      .catch((err) => setLoadError(err.message || 'Could not load your orders.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-6 py-10 sm:px-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="mt-1 text-sm text-gray-500">Track and review your grocery order history.</p>
          </div>
          <Link
            to="/shop"
            className="flex items-center gap-2 rounded-full bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <ShoppingBag size={16} />
            Browse Groceries
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-12 flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
            <Loader2 size={24} className="animate-spin text-emerald-700" />
            <p className="text-sm">Loading your orders…</p>
          </div>
        ) : loadError ? (
          <div role="alert" className="mt-8 rounded-2xl bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">{loadError}</p>
            <button
              type="button"
              onClick={loadOrders}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-red-100 px-4 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-200"
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <Package size={28} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No orders yet</h2>
            <p className="max-w-md text-sm text-gray-500">
              When you order fresh groceries from local vendors, they will appear right here for tracking and details.
            </p>
            <Link
              to="/shop"
              className="mt-3 flex items-center gap-2 rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Start Shopping
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((order) => {
              const statusConfig = ORDER_STATUS_CONFIG[order.order_status] || {
                label: order.order_status,
                style: 'bg-gray-100 text-gray-700',
              };

              return (
                <Link
                  key={order.order_id}
                  to={`/orders/${order.order_id}`}
                  className="group flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-emerald-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 transition group-hover:bg-emerald-100">
                      <Package size={22} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">Order #{order.order_id}</span>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusConfig.style}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={13} />
                          {formatDate(order.created_at)}
                        </span>
                        {order.item_count && (
                          <>
                            <span>·</span>
                            <span>{order.item_count} {order.item_count === 1 ? 'item' : 'items'}</span>
                          </>
                        )}
                        <span>·</span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium capitalize ${
                            PAYMENT_STATUS_STYLES[order.payment_status] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {order.payment_method === 'card' ? 'Card' : 'Cash'} · {order.payment_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-3 sm:border-0 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="text-base font-bold text-gray-900">{formatNaira(order.total_amount)}</p>
                    </div>
                    <ChevronRight size={18} className="ml-4 text-gray-400 transition group-hover:translate-x-1 group-hover:text-emerald-700" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default OrdersPage;
