import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Store,
  Truck,
  User,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getMyDeliveries, updateDeliveryStatus } from '../api/deliveries.js';

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

const STATUS_CONFIG = {
  assigned: { label: 'Assigned / Awaiting Pickup', style: 'bg-amber-50 text-amber-800 border-amber-200' },
  picked_up: { label: 'In Transit / Out for Delivery', style: 'bg-purple-50 text-purple-800 border-purple-200' },
  delivered: { label: 'Delivered', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  failed: { label: 'Delivery Issue', style: 'bg-red-50 text-red-800 border-red-200' },
};

export default function AgentDeliveriesPage() {
  const { token, user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  const loadDeliveries = () => {
    setIsLoading(true);
    setLoadError('');
    setActionError('');
    getMyDeliveries(token)
      .then((data) => setDeliveries(data.deliveries || []))
      .catch((err) => setLoadError(err.message || 'Could not load your delivery tasks.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadDeliveries();
  }, [token]);

  const handleStatusUpdate = async (assignmentId, newStatus) => {
    setUpdatingId(assignmentId);
    setActionError('');
    try {
      await updateDeliveryStatus(token, assignmentId, newStatus);
      setDeliveries((prev) =>
        prev.map((d) => (d.assignment_id === assignmentId ? { ...d, assignment_status: newStatus } : d))
      );
    } catch (err) {
      setActionError(err.message || 'Could not update delivery status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredDeliveries = deliveries.filter((d) => {
    if (activeTab === 'active') {
      return ['assigned', 'picked_up'].includes(d.assignment_status);
    }
    return d.assignment_status === 'delivered';
  });

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AppHeader tag="Courier Hub" />

      <main className="mx-auto max-w-4xl px-6 py-10 sm:px-12">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-700 text-white shadow-xs">
                <Truck size={20} />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Delivery Dispatch Console</h1>
                <p className="text-xs text-gray-500">Driver: {user?.full_name} · Nsukka Local Logistics</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={loadDeliveries}
            className="flex items-center gap-1.5 rounded-full bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
          >
            <RefreshCw size={14} />
            Refresh Runs
          </button>
        </div>

        {/* Tab switch */}
        <div className="mt-6 flex gap-2 border-b border-gray-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              activeTab === 'active'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Active Deliveries
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              activeTab === 'completed'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Completed History
          </button>
        </div>

        {actionError && (
          <div role="alert" className="mt-4 flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-xs text-red-700">
            <AlertCircle size={16} />
            {actionError}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-gray-400">
            <Loader2 size={24} className="animate-spin text-purple-700" />
            <p className="text-sm">Fetching delivery tasks…</p>
          </div>
        ) : loadError ? (
          <div role="alert" className="mt-6 rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">
            {loadError}
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-400">
            <Truck size={36} className="text-gray-300" />
            <p className="text-sm font-semibold text-gray-900">No {activeTab} tasks found</p>
            <p className="text-xs text-gray-500">
              When new orders in Nsukka are assigned to your motorbike, they appear here.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {filteredDeliveries.map((d) => {
              const statusCfg = STATUS_CONFIG[d.assignment_status] || {
                label: d.assignment_status,
                style: 'bg-gray-100 text-gray-700',
              };
              const isUpdating = updatingId === d.assignment_id;

              return (
                <div
                  key={d.assignment_id}
                  className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs transition hover:border-gray-300"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-gray-900">Order #{d.order_id}</span>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.style}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={12} />
                        Assigned on {formatDate(d.assigned_at)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-400">Order Amount</p>
                      <p className="text-base font-bold text-emerald-800">{formatNaira(d.total_amount)}</p>
                      <p className="text-[11px] text-gray-500 capitalize">
                        {d.payment_method === 'card' ? 'Prepaid (Card)' : 'Cash on Delivery'}
                      </p>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 rounded-2xl bg-gray-50 p-4 text-xs">
                    {/* Pickup / Vendor */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 font-bold text-gray-900">
                        <Store size={14} className="text-emerald-700" />
                        <span>Pickup Point (Vendor Stalls)</span>
                      </div>
                      {d.items?.length > 0 && (
                        <p className="text-gray-700 font-medium">
                          {d.items[0].shop_name} ({d.items[0].business_address})
                        </p>
                      )}
                    </div>

                    {/* Delivery / Customer */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 font-bold text-gray-900">
                        <MapPin size={14} className="text-purple-700" />
                        <span>Delivery Destination</span>
                      </div>
                      <p className="text-gray-900 font-semibold">{d.customer_name}</p>
                      <p className="text-gray-700">{d.delivery_address}</p>
                      {d.customer_phone && (
                        <div className="mt-1 flex items-center gap-1 text-emerald-800 font-bold">
                          <Phone size={12} />
                          <a href={`tel:${d.customer_phone}`} className="hover:underline">
                            {d.customer_phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items Manifest */}
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Package Items</p>
                    <ul className="mt-1.5 divide-y divide-gray-100 text-xs">
                      {d.items?.map((item, idx) => (
                        <li key={idx} className="flex items-center justify-between py-1.5">
                          <span className="text-gray-800">
                            <strong>{item.quantity}×</strong> {item.product_name}
                          </span>
                          <span className="text-gray-500">{item.shop_name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action progression */}
                  <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-4">
                    {d.assignment_status === 'assigned' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusUpdate(d.assignment_id, 'picked_up')}
                        className="flex items-center gap-1.5 rounded-full bg-purple-700 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-800 transition disabled:opacity-50"
                      >
                        {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <Package size={14} />}
                        Confirm Pickup from Vendor
                      </button>
                    )}

                    {d.assignment_status === 'picked_up' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusUpdate(d.assignment_id, 'delivered')}
                        className="flex items-center gap-1.5 rounded-full bg-emerald-700 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition disabled:opacity-50"
                      >
                        {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Mark as Delivered to Customer
                      </button>
                    )}

                    {d.assignment_status === 'delivered' && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-800">
                        <CheckCircle2 size={15} /> Delivery Completed {d.delivered_at && `(${formatDate(d.delivered_at)})`}
                      </span>
                    )}
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
