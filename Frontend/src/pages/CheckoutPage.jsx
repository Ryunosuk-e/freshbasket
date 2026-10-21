import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, Loader2, Truck } from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { getCheckoutSummary, placeOrder } from '../api/orders.js';
import { getMyCustomerProfile } from '../api/profile.js';
import { loadPaystackScript } from '../utils/paystack.js';

function formatNaira(amount) {
  return `\u20a6${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function CheckoutPage() {
  const { user, token } = useAuth();
  const { refreshCart } = useCart();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [isPlacing, setIsPlacing] = useState(false);
  const [placeError, setPlaceError] = useState('');

  useEffect(() => {
    Promise.all([getCheckoutSummary(token), getMyCustomerProfile(token).catch(() => null)])
      .then(([summaryData, profileData]) => {
        setSummary(summaryData);
        if (profileData?.customer?.default_delivery_address) {
          setDeliveryAddress(profileData.customer.default_delivery_address);
        }
        if (summaryData.paystackConfigured) {
          setPaymentMethod('card');
        }
      })
      .catch((err) => setLoadError(err.message || 'Could not load checkout.'))
      .finally(() => setIsLoading(false));
  }, [token]);

  const finishOrder = async (extraFields = {}) => {
    const data = await placeOrder(token, { deliveryAddress, paymentMethod, ...extraFields });
    refreshCart();
    navigate(`/orders/${data.orderId}`, { state: { justPlaced: true } });
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    setPlaceError('');

    if (!deliveryAddress.trim()) {
      setPlaceError('Delivery address is required.');
      return;
    }

    setIsPlacing(true);
    try {
      if (paymentMethod === 'cash_on_delivery') {
        await finishOrder();
        return;
      }

      // Card: open Paystack's Inline popup and only place the order once
      // it reports success — the backend re-verifies independently anyway.
      const PaystackPop = await loadPaystackScript();
      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error('Card payment is not configured on this device yet — try Cash on Delivery.');
      }

      const handler = PaystackPop.setup({
        key: publicKey,
        email: user.email,
        amount: Math.round(summary.total * 100),
        currency: 'NGN',
        ref: `fb_${Date.now()}`,
        callback: (response) => {
          finishOrder({ paystackReference: response.reference }).catch((err) => {
            setPlaceError(
              err.message ||
                `Payment succeeded but placing the order failed — contact support with your reference: ${response.reference}`
            );
            setIsPlacing(false);
          });
        },
        onClose: () => {
          setIsPlacing(false);
        },
      });
      handler.openIframe();
    } catch (err) {
      setPlaceError(err.message || 'Something went wrong. Please try again.');
      setIsPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />

      <main className="mx-auto max-w-2xl px-6 py-12 sm:px-12">
        <h1 className="text-2xl font-semibold text-gray-900">Checkout</h1>

        {isLoading ? (
          <div className="flex items-center gap-2 py-16 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            Loading…
          </div>
        ) : loadError ? (
          <div role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        ) : summary.itemCount === 0 ? (
          <div className="mt-6 rounded-3xl bg-emerald-50 py-16 text-center">
            <p className="font-medium text-gray-900">Your cart is empty</p>
            <Link to="/shop" className="mt-2 inline-block text-sm font-medium text-emerald-700 underline">
              Browse groceries
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="mt-6 space-y-6" noValidate>
            {placeError && (
              <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {placeError}
              </div>
            )}

            <div>
              <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-900">
                Delivery Address <span aria-hidden="true">*</span>
              </label>
              <input
                id="deliveryAddress"
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
                placeholder="Where should this order be delivered?"
                className="mt-1.5 w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>

            <div>
              <span className="block text-sm font-medium text-gray-900">Payment Method</span>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${
                    paymentMethod === 'cash_on_delivery' ? 'border-emerald-600 bg-emerald-50/50' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash_on_delivery"
                    checked={paymentMethod === 'cash_on_delivery'}
                    onChange={() => setPaymentMethod('cash_on_delivery')}
                    className="h-4 w-4 text-emerald-700 focus:ring-emerald-600"
                  />
                  <Truck size={18} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">Cash on Delivery</span>
                </label>

                <label
                  className={`flex items-center gap-3 rounded-2xl border p-4 ${
                    !summary.paystackConfigured
                      ? 'cursor-not-allowed border-gray-100 opacity-50'
                      : paymentMethod === 'card'
                        ? 'cursor-pointer border-emerald-600 bg-emerald-50/50'
                        : 'cursor-pointer border-gray-200'
                  }`}
                  title={!summary.paystackConfigured ? 'Card payments are not configured on this server yet' : undefined}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    disabled={!summary.paystackConfigured}
                    onChange={() => setPaymentMethod('card')}
                    className="h-4 w-4 text-emerald-700 focus:ring-emerald-600"
                  />
                  <CreditCard size={18} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">Card (Paystack)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-6">
              <span className="text-gray-500">
                {summary.itemCount} item{summary.itemCount === 1 ? '' : 's'}
              </span>
              <span className="text-xl font-semibold text-gray-900">{formatNaira(summary.total)}</span>
            </div>

            <button
              type="submit"
              disabled={isPlacing}
              className="w-full rounded-full bg-emerald-800 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {isPlacing ? 'Processing…' : paymentMethod === 'card' ? `Pay ${formatNaira(summary.total)}` : 'Place Order'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

export default CheckoutPage;
