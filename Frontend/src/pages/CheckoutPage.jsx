import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Building2,
  CheckCircle2,
  Info,
  Loader2,
  MapPin,
  Store,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Footer from '../components/Footer.jsx';
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

  // Fulfillment Selection: 'delivery' or 'pickup'
  const [fulfillmentType, setFulfillmentType] = useState('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Payment Selection: 'card', 'bank_transfer', 'cash_on_delivery'
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [transferReference, setTransferReference] = useState('');
  const [transferSenderName, setTransferSenderName] = useState('');

  const [isPlacing, setIsPlacing] = useState(false);
  const [placeError, setPlaceError] = useState('');

  const fetchSummary = (type) => {
    setIsLoading(true);
    getCheckoutSummary(token, type)
      .then((summaryData) => {
        setSummary(summaryData);
      })
      .catch((err) => setLoadError(err.message || 'Could not update checkout summary.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    Promise.all([
      getCheckoutSummary(token, 'delivery'),
      getMyCustomerProfile(token).catch(() => null),
    ])
      .then(([summaryData, profileData]) => {
        setSummary(summaryData);
        if (profileData?.customer?.default_delivery_address) {
          setDeliveryAddress(profileData.customer.default_delivery_address);
        }
      })
      .catch((err) => setLoadError(err.message || 'Could not load checkout.'))
      .finally(() => setIsLoading(false));
  }, [token]);

  const handleFulfillmentChange = (type) => {
    setFulfillmentType(type);
    if (type === 'delivery' && paymentMethod === 'cash_on_delivery') {
      setPaymentMethod('card');
    }
    fetchSummary(type);
  };

  const finishOrder = async (extraFields = {}) => {
    const finalAddress =
      fulfillmentType === 'pickup'
        ? 'Self-Pickup at Vendor Stall'
        : deliveryAddress;

    const data = await placeOrder(token, {
      deliveryAddress: finalAddress,
      fulfillmentType,
      paymentMethod,
      transferReference: transferReference ? `${transferReference} (${transferSenderName || 'Customer'})` : undefined,
      ...extraFields,
    });

    refreshCart();
    navigate(`/orders/${data.orderId}`, { state: { justPlaced: true, orderCode: data.orderCode } });
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    setPlaceError('');

    if (fulfillmentType === 'delivery' && !deliveryAddress.trim()) {
      setPlaceError('Please provide your UNN hostel or Nsukka street delivery address.');
      return;
    }

    if (fulfillmentType === 'delivery' && paymentMethod === 'cash_on_delivery') {
      setPlaceError('Prepayment via Card or Bank Transfer is compulsory for Home Delivery.');
      return;
    }

    if (paymentMethod === 'bank_transfer' && !transferSenderName.trim()) {
      setPlaceError('Please enter your transfer account/depositor name for verification.');
      return;
    }

    setIsPlacing(true);
    try {
      if (paymentMethod === 'cash_on_delivery' || paymentMethod === 'bank_transfer') {
        await finishOrder();
        return;
      }

      // Card payment via Paystack Inline
      const PaystackPop = await loadPaystackScript();
      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error('Card payment gateway is in test mode. You can use Bank Transfer or Cash on Pickup.');
      }

      const handler = PaystackPop.setup({
        key: publicKey,
        email: user.email,
        amount: Math.round(summary.total * 100),
        currency: 'NGN',
        ref: `fb_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        callback: (response) => {
          finishOrder({ paystackReference: response.reference }).catch((err) => {
            setPlaceError(
              err.message ||
                `Payment succeeded but placing order failed — reference: ${response.reference}`
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
      setPlaceError(err.message || 'Something went wrong with order processing.');
      setIsPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col justify-between">
      <div>
        <AppHeader />

        <main className="mx-auto max-w-3xl px-6 py-10 sm:px-12">
          <div className="flex items-center justify-between border-b border-gray-200 pb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Checkout & Payment</h1>
              <p className="mt-1 text-xs text-gray-500">
                Confirm your fulfillment method and complete payment for your groceries.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              Nsukka Direct
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-gray-400">
              <Loader2 size={24} className="animate-spin text-emerald-700" />
              <p className="text-xs">Preparing checkout…</p>
            </div>
          ) : loadError ? (
            <div role="alert" className="mt-6 rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">
              {loadError}
            </div>
          ) : summary?.itemCount === 0 ? (
            <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-xs">
              <p className="font-bold text-gray-900">Your FreshBasket is empty</p>
              <p className="mt-1 text-xs text-gray-500">Explore our local market stalls to add items.</p>
              <Link
                to="/shop"
                className="mt-4 inline-block rounded-full bg-emerald-800 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <form onSubmit={handlePlaceOrder} className="mt-6 space-y-6" noValidate>
              {placeError && (
                <div role="alert" className="rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-100">
                  {placeError}
                </div>
              )}

              {/* 1. Fulfillment Mode Selection */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Step 1: Choose Fulfillment Option
                </span>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                      fulfillmentType === 'delivery'
                        ? 'border-emerald-700 bg-emerald-50/50 ring-2 ring-emerald-600/10'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fulfillmentType"
                      value="delivery"
                      checked={fulfillmentType === 'delivery'}
                      onChange={() => handleFulfillmentChange('delivery')}
                      className="mt-0.5 h-4 w-4 text-emerald-700 focus:ring-emerald-600"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-gray-900 text-xs sm:text-sm">
                        <Truck size={16} className="text-emerald-700" />
                        <span>Home / Hostel Delivery</span>
                      </div>
                      <p className="mt-1 text-[11px] text-gray-500 leading-relaxed">
                        Delivered to UNN Hostels (Bello, Franco, Okpara), Hilltop, or Behind Flat (₦500.00).
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                      fulfillmentType === 'pickup'
                        ? 'border-emerald-700 bg-emerald-50/50 ring-2 ring-emerald-600/10'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fulfillmentType"
                      value="pickup"
                      checked={fulfillmentType === 'pickup'}
                      onChange={() => handleFulfillmentChange('pickup')}
                      className="mt-0.5 h-4 w-4 text-emerald-700 focus:ring-emerald-600"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-gray-900 text-xs sm:text-sm">
                        <Store size={16} className="text-emerald-700" />
                        <span>Self-Pickup at Vendor Stall</span>
                      </div>
                      <p className="mt-1 text-[11px] text-gray-500 leading-relaxed">
                        Pick up directly from vendor stall in Ogige Market or Hilltop (Free - ₦0.00).
                      </p>
                    </div>
                  </label>
                </div>

                {/* Delivery Address Input */}
                {fulfillmentType === 'delivery' ? (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <label htmlFor="deliveryAddress" className="block text-xs font-bold text-gray-700">
                      Delivery Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1.5">
                      <MapPin size={16} className="absolute left-3.5 top-3 text-emerald-700" />
                      <input
                        id="deliveryAddress"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="e.g. Room 214, Bello Hall, UNN Campus OR Hilltop Lodge"
                        className="w-full rounded-2xl border border-gray-200 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-700 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl bg-gray-50 p-3.5 text-xs text-gray-600 border border-gray-100 flex items-center gap-2">
                    <Info size={16} className="text-emerald-700 shrink-0" />
                    <span>
                      Vendor stall directions and pickup contacts will be shown on your order tracking receipt.
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Payment Method Selection */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Step 2: Select Payment Method
                  </span>
                  {fulfillmentType === 'delivery' && (
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Card / Transfer required for delivery
                    </span>
                  )}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {/* Option 1: Card */}
                  <label
                    className={`flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition ${
                      paymentMethod === 'card'
                        ? 'border-emerald-700 bg-emerald-50/50 ring-2 ring-emerald-600/10'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <CreditCard size={18} className="text-emerald-800" />
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="h-4 w-4 text-emerald-700 focus:ring-emerald-600"
                      />
                    </div>
                    <div className="mt-3">
                      <span className="text-xs sm:text-sm font-bold text-gray-900 block">Debit Card</span>
                      <span className="text-[10px] text-gray-500">Instant Paystack</span>
                    </div>
                  </label>

                  {/* Option 2: Bank Transfer */}
                  <label
                    className={`flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-emerald-700 bg-emerald-50/50 ring-2 ring-emerald-600/10'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Building2 size={18} className="text-emerald-800" />
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={paymentMethod === 'bank_transfer'}
                        onChange={() => setPaymentMethod('bank_transfer')}
                        className="h-4 w-4 text-emerald-700 focus:ring-emerald-600"
                      />
                    </div>
                    <div className="mt-3">
                      <span className="text-xs sm:text-sm font-bold text-gray-900 block">Bank Transfer</span>
                      <span className="text-[10px] text-gray-500">Direct UNN / Bank</span>
                    </div>
                  </label>

                  {/* Option 3: Cash (Only for pickup, disabled for home delivery) */}
                  <label
                    className={`flex flex-col justify-between rounded-2xl border p-4 transition ${
                      fulfillmentType === 'delivery'
                        ? 'cursor-not-allowed border-gray-100 bg-gray-50/70 opacity-60'
                        : paymentMethod === 'cash_on_delivery'
                          ? 'cursor-pointer border-emerald-700 bg-emerald-50/50 ring-2 ring-emerald-600/10'
                          : 'cursor-pointer border-gray-200 hover:border-emerald-300'
                    }`}
                    title={
                      fulfillmentType === 'delivery'
                        ? 'Prepayment via Card or Bank Transfer is required for Home Delivery'
                        : undefined
                    }
                  >
                    <div className="flex items-center justify-between">
                      <Store size={18} className="text-emerald-800" />
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash_on_delivery"
                        disabled={fulfillmentType === 'delivery'}
                        checked={paymentMethod === 'cash_on_delivery'}
                        onChange={() => setPaymentMethod('cash_on_delivery')}
                        className="h-4 w-4 text-emerald-700 focus:ring-emerald-600"
                      />
                    </div>
                    <div className="mt-3">
                      <span className="text-xs sm:text-sm font-bold text-gray-900 block">Cash on Pickup</span>
                      <span className="text-[10px] text-gray-500">
                        {fulfillmentType === 'delivery' ? 'Not for delivery' : 'Pay at stall'}
                      </span>
                    </div>
                  </label>
                </div>

                {/* Bank Transfer Details Drawer */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 text-xs text-gray-700 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                      <span className="font-bold text-emerald-950">Platform Bank Account Details</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Official Escrow
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Bank:</span>
                        <span className="font-bold text-gray-900">Access Bank / UNN Microfinance</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Account Number:</span>
                        <span className="font-extrabold text-emerald-900 text-sm">0123456789</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400 block text-[10px]">Account Name:</span>
                        <span className="font-bold text-gray-900">FreshBasket Market Platform</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-emerald-100 space-y-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700">
                          Depositor / Account Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={transferSenderName}
                          onChange={(e) => setTransferSenderName(e.target.value)}
                          placeholder="Name appearing on your transfer debit"
                          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-emerald-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700">
                          Transfer Reference / Session ID (Optional):
                        </label>
                        <input
                          type="text"
                          value={transferReference}
                          onChange={(e) => setTransferReference(e.target.value)}
                          placeholder="e.g. 090123... or Bank Ref"
                          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-emerald-700"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Order Summary & Total */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Order Summary</span>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Items Subtotal ({summary.itemCount} items)</span>
                  <span className="font-semibold text-gray-900">
                    {formatNaira(summary.itemsTotal || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Fulfillment Fee ({fulfillmentType === 'delivery' ? 'Hostel Dispatch' : 'Self-Pickup'})</span>
                  <span className="font-semibold text-gray-900">
                    {summary.deliveryFee > 0 ? formatNaira(summary.deliveryFee) : 'FREE (₦0.00)'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-sm font-bold text-gray-900">Total Payable</span>
                  <span className="text-2xl font-extrabold text-emerald-800">
                    {formatNaira(summary.total)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPlacing}
                className="w-full rounded-full bg-emerald-800 py-3.5 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {isPlacing
                  ? 'Confirming Order…'
                  : paymentMethod === 'card'
                    ? `Pay ${formatNaira(summary.total)} with Card`
                    : paymentMethod === 'bank_transfer'
                      ? `Confirm Transfer • ${formatNaira(summary.total)}`
                      : `Place Order for Self-Pickup (${formatNaira(summary.total)})`}
              </button>
            </form>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default CheckoutPage;
