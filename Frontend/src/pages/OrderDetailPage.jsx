import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Package,
  PackageCheck,
  ShoppingBag,
  Store,
  Truck,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getOrder } from '../api/orders.js';

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

const ORDER_STEPS = [
  { key: 'placed', label: 'Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'preparing', label: 'Preparing', icon: Package },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: PackageCheck },
];

const PAYMENT_STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
};

function OrderDetailPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const { token, user } = useAuth();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const justPlaced = Boolean(location.state?.justPlaced);

  useEffect(() => {
    setIsLoading(true);
    setLoadError('');
    getOrder(token, orderId)
      .then((data) => setOrder(data.order))
      .catch((err) => setLoadError(err.message || 'Could not load this order.'))
      .finally(() => setIsLoading(false));
  }, [token, orderId]);

  const currentStepIndex = order
    ? ORDER_STEPS.findIndex((s) => s.key === order.order_status)
    : -1;
  const isCancelled = order?.order_status === 'cancelled';

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-6 py-10 sm:px-12">
        <div className="mb-6">
          <Link
            to={user?.role === 'vendor' ? '/vendor/orders' : '/orders'}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            {user?.role === 'vendor' ? 'Back to Shop Orders' : 'Back to My Orders'}
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-gray-400">
            <Loader2 size={24} className="animate-spin text-emerald-700" />
            <p className="text-sm">Loading order details…</p>
          </div>
        ) : loadError || !order ? (
          <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-700">
            {loadError || 'Order not found.'}
          </div>
        ) : (
          <div className="space-y-6">
            {justPlaced && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                <CheckCircle2 className="shrink-0 text-emerald-700" size={24} />
                <div>
                  <p className="font-semibold text-gray-900">Order successfully placed!</p>
                  <p className="text-sm text-gray-600">
                    {order.payment_method === 'card'
                      ? 'Your payment was confirmed. The vendor has received your order.'
                      : "Your order is confirmed. You'll pay the vendor's delivery agent cash on arrival."}
                  </p>
                </div>
              </div>
            )}

            {/* Header Card */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Order #{order.order_id}</h1>
                  <p className="mt-1 text-sm text-gray-500">Placed on {formatDate(order.created_at)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                      PAYMENT_STATUS_STYLES[order.payment_status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Payment: {order.payment_method === 'card' ? 'Card' : 'Cash on Delivery'} ({order.payment_status})
                  </span>
                </div>
              </div>

              {/* Status Stepper */}
              <div className="py-6">
                {isCancelled ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-800">
                    <AlertCircle size={20} className="shrink-0 text-red-600" />
                    <div>
                      <p className="text-sm font-semibold">This order was cancelled</p>
                      <p className="text-xs text-red-600">If you have questions, please contact vendor support.</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Order Status</h2>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {ORDER_STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const isCompleted = currentStepIndex >= idx;
                        const isCurrent = currentStepIndex === idx;

                        return (
                          <div
                            key={step.key}
                            className={`flex flex-col items-center rounded-2xl border p-3 text-center transition ${
                              isCurrent
                                ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                                : isCompleted
                                  ? 'border-emerald-200 bg-emerald-50/20 text-emerald-900'
                                  : 'border-gray-100 bg-gray-50/50 text-gray-400'
                            }`}
                          >
                            <span
                              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium ${
                                isCompleted
                                  ? 'bg-emerald-800 text-white'
                                  : 'bg-gray-200 text-gray-500'
                              }`}
                            >
                              <Icon size={16} />
                            </span>
                            <span
                              className={`mt-2 text-xs font-medium ${
                                isCurrent
                                  ? 'font-bold text-emerald-900'
                                  : isCompleted
                                    ? 'text-gray-900'
                                    : 'text-gray-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Address */}
              <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                <MapPin size={18} className="mt-0.5 shrink-0 text-emerald-700" />
                <div>
                  <p className="font-semibold text-gray-900">Delivery Address</p>
                  <p className="mt-0.5 text-gray-600">{order.delivery_address}</p>
                </div>
              </div>
            </div>

            {/* Items Card */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
              <h2 className="text-lg font-bold text-gray-900">Order Items</h2>

              <ul className="mt-4 divide-y divide-gray-100">
                {order.items.map((item) => (
                  <li key={`${item.product_id}-${item.product_name}`} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                        <Package size={20} />
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Store size={12} className="text-emerald-700" />
                          {item.shop_name} · {item.quantity} × {formatNaira(item.unit_price)} {item.unit ? `per ${item.unit}` : ''}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{formatNaira(item.line_total)}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-6 border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between text-base font-bold text-gray-900">
                  <span>Total Amount</span>
                  <span className="text-xl text-emerald-800">{formatNaira(order.total_amount)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <ShoppingBag size={16} />
                Continue Shopping
              </Link>
              <Link
                to="/orders"
                className="text-sm font-medium text-emerald-700 hover:underline"
              >
                View all my orders →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default OrderDetailPage;
