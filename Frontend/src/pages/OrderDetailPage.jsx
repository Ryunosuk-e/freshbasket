import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, Loader2, MapPin, Package } from 'lucide-react';
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

const PAYMENT_STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-700',
};

function OrderDetailPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const { token } = useAuth();

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

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />

      <main className="mx-auto max-w-2xl px-6 py-12 sm:px-12">
        {isLoading ? (
          <div className="flex items-center gap-2 py-16 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            Loading…
          </div>
        ) : loadError || !order ? (
          <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError || 'Order not found.'}
          </div>
        ) : (
          <>
            {justPlaced && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-4">
                <CheckCircle2 className="shrink-0 text-emerald-700" size={22} />
                <div>
                  <p className="font-medium text-gray-900">Order placed!</p>
                  <p className="text-sm text-gray-600">
                    {order.payment_method === 'card'
                      ? 'Your payment was confirmed.'
                      : "You'll pay the vendor's delivery agent on arrival."}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-2xl font-semibold text-gray-900">Order #{order.order_id}</h1>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  PAYMENT_STATUS_STYLES[order.payment_status] || 'bg-gray-100 text-gray-600'
                }`}
              >
                {order.payment_method === 'card' ? 'Card' : 'Cash on Delivery'} · {order.payment_status}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Placed {formatDate(order.created_at)}</p>

            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-gray-100 p-4 text-sm text-gray-600">
              <MapPin size={16} className="mt-0.5 shrink-0 text-emerald-700" />
              {order.delivery_address}
            </div>

            <ul className="mt-6 divide-y divide-gray-100">
              {order.items.map((item) => (
                <li key={`${item.product_id}-${item.product_name}`} className="flex items-center gap-4 py-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                    <Package size={18} />
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-sm text-gray-500">
                      {item.shop_name} · {item.quantity} × {formatNaira(item.unit_price)}
                    </p>
                  </div>
                  <p className="font-medium text-gray-900">{formatNaira(item.line_total)}</p>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-6">
              <span className="text-gray-500">Total</span>
              <span className="text-xl font-semibold text-gray-900">{formatNaira(order.total_amount)}</span>
            </div>

            <Link to="/shop" className="mt-8 inline-block text-sm font-medium text-emerald-700 underline">
              Continue shopping
            </Link>
          </>
        )}
      </main>
    </div>
  );
}

export default OrderDetailPage;
