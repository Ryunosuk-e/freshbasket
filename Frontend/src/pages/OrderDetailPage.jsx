import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  MapPin,
  Package,
  PackageCheck,
  Send,
  ShoppingBag,
  Store,
  Truck,
  X,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getOrder, submitOrderDispute } from '../api/orders.js';

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

  // Dispute resolution state
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState('');
  const [disputeError, setDisputeError] = useState('');

  const justPlaced = Boolean(location.state?.justPlaced);

  useEffect(() => {
    setIsLoading(true);
    setLoadError('');
    getOrder(token, orderId)
      .then((data) => setOrder(data.order))
      .catch((err) => setLoadError(err.message || 'Could not load this order.'))
      .finally(() => setIsLoading(false));
  }, [token, orderId]);

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    setIsSubmittingDispute(true);
    setDisputeError('');
    setDisputeSuccess('');
    try {
      await submitOrderDispute(token, order.order_id, disputeReason);
      setDisputeSuccess('Your dispute has been logged. FreshBasket administrators have been notified.');
      setDisputeReason('');
    } catch (err) {
      setDisputeError(err.message || 'Failed to submit dispute.');
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const currentStepIndex = order
    ? ORDER_STEPS.findIndex((s) => s.key === order.order_status)
    : -1;
  const isCancelled = order?.order_status === 'cancelled';

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col justify-between">
      <div>
        <AppHeader />

        <main className="mx-auto max-w-3xl px-6 py-10 sm:px-12">
          <div className="mb-6 flex items-center justify-between">
            <Link
              to={user?.role === 'vendor' ? '/vendor/orders' : '/orders'}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft size={15} />
              {user?.role === 'vendor' ? 'Back to Shop Orders' : 'Back to My Orders'}
            </Link>

            {user?.role === 'customer' && (
              <button
                type="button"
                onClick={() => setIsDisputeOpen(true)}
                className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-red-700"
              >
                <HelpCircle size={14} />
                Report an Issue
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-gray-400">
              <Loader2 size={24} className="animate-spin text-emerald-700" />
              <p className="text-xs">Loading order details…</p>
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
                    <p className="font-bold text-gray-900">Order successfully placed!</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Your order code is <strong className="text-emerald-900">{order.order_code || `#${order.order_id}`}</strong>. The vendor and dispatch riders have been notified.
                    </p>
                  </div>
                </div>
              )}

              {/* Header Card */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
                  <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">
                      Order {order.order_code || `#${order.order_id}`}
                    </h1>
                    <p className="mt-1 text-xs text-gray-400">Placed on {formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${
                        PAYMENT_STATUS_STYLES[order.payment_status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {order.payment_method?.replace(/_/g, ' ')} • {order.payment_status}
                    </span>
                    <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-bold capitalize">
                      {order.fulfillment_type || 'delivery'}
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
                      <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Live Fulfilment Stepper</h2>
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
                                  ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
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
                                className={`mt-2 text-xs font-semibold ${
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

                {/* Delivery Rider & Destination */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4 text-xs text-gray-700">
                    <MapPin size={18} className="mt-0.5 shrink-0 text-emerald-700" />
                    <div>
                      <p className="font-bold text-gray-900">Delivery / Pickup Location</p>
                      <p className="mt-0.5 text-gray-600">{order.delivery_address}</p>
                    </div>
                  </div>

                  {order.delivery?.agent_name ? (
                    <div className="flex items-start gap-3 rounded-2xl bg-purple-50/70 border border-purple-100 p-4 text-xs text-gray-700">
                      <Truck size={18} className="mt-0.5 shrink-0 text-purple-700" />
                      <div>
                        <p className="font-bold text-gray-900">Assigned Delivery Courier</p>
                        <p className="text-purple-900 font-bold">{order.delivery.agent_name}</p>
                        <p className="text-[11px] text-gray-500">{order.delivery.vehicle_type || 'Motorcycle'}</p>
                        {order.delivery.agent_phone && (
                          <a
                            href={`tel:${order.delivery.agent_phone}`}
                            className="mt-1 inline-block text-xs font-bold text-emerald-800 underline"
                          >
                            Call Courier: {order.delivery.agent_phone}
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4 text-xs text-gray-700">
                      <Truck size={18} className="mt-0.5 shrink-0 text-gray-400" />
                      <div>
                        <p className="font-bold text-gray-900">Courier Dispatch</p>
                        <p className="mt-0.5 text-gray-500">
                          {order.fulfillment_type === 'pickup'
                            ? 'Self-pickup chosen. Present your order code at the vendor stall.'
                            : 'A local Nsukka rider is coordinating pickup from the vendor stall.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Card */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
                <h2 className="text-base font-bold text-gray-900">Order Items</h2>

                <ul className="mt-4 divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <li key={`${item.product_id}-${item.product_name}`} className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3.5">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                          <Package size={20} />
                        </span>
                        <div>
                          <p className="font-bold text-gray-900 text-xs sm:text-sm">{item.product_name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <Store size={12} className="text-emerald-700" />
                            <span>{item.shop_name}</span>
                            <span className="text-gray-300">•</span>
                            <span className="font-medium text-emerald-900">{item.packaging_unit || 'Single Unit'}</span>
                            <span className="text-gray-300">•</span>
                            <span>{item.quantity} × {formatNaira(item.unit_price)}</span>
                          </p>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-gray-900">{formatNaira(item.line_total)}</p>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 border-t border-gray-100 pt-5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-gray-500">
                    <span>Items Subtotal</span>
                    <span>{formatNaira(Number(order.total_amount) - Number(order.delivery_fee || 0))}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span>Fulfillment / Delivery Fee</span>
                    <span>{Number(order.delivery_fee) > 0 ? formatNaira(order.delivery_fee) : 'FREE (₦0.00)'}</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-50">
                    <span>Total Amount</span>
                    <span className="text-xl text-emerald-800">{formatNaira(order.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Dispute Resolution Modal */}
              {isDisputeOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
                  <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">Report an Issue / Dispute</h3>
                        <p className="text-xs text-gray-500">Order {order.order_code || `#${order.order_id}`}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsDisputeOpen(false)}
                        className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {disputeSuccess ? (
                      <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
                        {disputeSuccess}
                      </div>
                    ) : (
                      <form onSubmit={handleDisputeSubmit} className="mt-4 space-y-3">
                        {disputeError && (
                          <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700">
                            {disputeError}
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700">
                            Describe the problem (e.g. incorrect items, poor produce freshness, rider delay):
                          </label>
                          <textarea
                            rows={4}
                            required
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            placeholder="Please explain in detail…"
                            className="mt-1.5 w-full rounded-2xl border border-gray-200 p-3 text-xs text-gray-900 focus:outline-none focus:border-emerald-700"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsDisputeOpen(false)}
                            className="rounded-full px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingDispute}
                            className="flex items-center gap-1.5 rounded-full bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            {isSubmittingDispute ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                            Submit to Admin
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs"
                >
                  <ShoppingBag size={15} />
                  Continue Shopping
                </Link>
                <Link
                  to="/orders"
                  className="text-xs font-semibold text-emerald-800 hover:underline"
                >
                  View all my orders →
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default OrderDetailPage;
