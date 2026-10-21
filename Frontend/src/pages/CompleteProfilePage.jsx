import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ImagePlus } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  completeCustomerProfile,
  completeVendorProfile,
  getMyCustomerProfile,
  getMyVendorProfile,
} from '../api/profile.js';

const NIGERIAN_BANKS = [
  'Access Bank',
  'Citibank Nigeria',
  'Ecobank Nigeria',
  'Fidelity Bank',
  'First Bank of Nigeria',
  'First City Monument Bank (FCMB)',
  'Globus Bank',
  'Guaranty Trust Bank (GTBank)',
  'Heritage Bank',
  'Keystone Bank',
  'Kuda Bank',
  'Moniepoint MFB',
  'Opay',
  'Palmpay',
  'Polaris Bank',
  'Providus Bank',
  'Stanbic IBTC Bank',
  'Standard Chartered Bank',
  'Sterling Bank',
  'Union Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Unity Bank',
  'Wema Bank',
  'Zenith Bank',
  'Other',
];

const HIGHLIGHTS = [
  "You're almost in — just a couple more details first.",
  "This information is only used to run your account — it's never shown publicly.",
];

function SelectField({ id, label, value, onChange, options, required = true, placeholder = 'Select' }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-900">
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      <div className="relative mt-1.5">
        <select
          id={id}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full appearance-none rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </div>
    </div>
  );
}

function CompleteProfilePage() {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();
  const isVendor = user?.role === 'vendor';

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState('');
  const [bankName, setBankName] = useState('');
  const [customBankName, setCustomBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Pre-fill anything already on file — a customer may have set a delivery
  // address at registration (it was optional there), so no need to ask twice.
  useEffect(() => {
    if (!token) return;
    const fetchProfile = isVendor ? getMyVendorProfile : getMyCustomerProfile;
    fetchProfile(token)
      .then((data) => {
        if (!isVendor && data.customer?.default_delivery_address) {
          setDeliveryAddress(data.customer.default_delivery_address);
        }
        if (!isVendor && data.customer?.preferred_payment_method) {
          setPreferredPaymentMethod(data.customer.preferred_payment_method);
        }
      })
      .catch(() => {
        // Non-fatal — the form just starts blank instead of pre-filled.
      });
  }, [isVendor, token]);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (isVendor) {
      const finalBankName = bankName === 'Other' ? customBankName.trim() : bankName;
      if (!finalBankName || !accountNumber || !accountName.trim()) {
        setErrorMessage('Bank name, account number and account name are all required.');
        return;
      }
      if (!/^\d{10}$/.test(accountNumber)) {
        setErrorMessage('Account number must be exactly 10 digits.');
        return;
      }

      setIsSubmitting(true);
      try {
        await completeVendorProfile(token, { bankName: finalBankName, accountNumber, accountName });
        updateUser({ profile_completed: true });
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setErrorMessage(err.message || 'Something went wrong. Please try again.');
        setIsSubmitting(false);
      }
    } else {
      if (!deliveryAddress.trim()) {
        setErrorMessage('Delivery address is required.');
        return;
      }

      setIsSubmitting(true);
      try {
        await completeCustomerProfile(token, {
          deliveryAddress,
          preferredPaymentMethod: preferredPaymentMethod || undefined,
        });
        updateUser({ profile_completed: true });
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setErrorMessage(err.message || 'Something went wrong. Please try again.');
        setIsSubmitting(false);
      }
    }
  };

  return (
    <AuthLayout highlights={HIGHLIGHTS}>
      <h1 className="text-2xl font-semibold text-gray-900">Complete Your Profile</h1>
      <p className="mt-2 text-sm text-gray-500">
        {isVendor
          ? 'A couple more details so customers can order from you and you can get paid.'
          : "Don't worry, only you can see your personal data."}
      </p>

      {errorMessage && (
        <div role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <div>
          <label className="block text-sm font-medium text-gray-900">
            {isVendor ? 'Shop Logo (Optional)' : 'Profile Photo (Optional)'}
          </label>
          <label
            htmlFor="photo"
            className="mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-gray-300 py-6 text-center hover:bg-gray-50"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <ImagePlus className="text-gray-400" size={22} />
            )}
            <span className="text-sm text-gray-500">Drag a Photo</span>
            <span className="text-sm font-medium text-emerald-700">Browse</span>
            <input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </label>
          <p className="mt-1 text-xs text-gray-400">
            Not wired up to storage yet — this just previews locally for now.
          </p>
        </div>

        {isVendor ? (
          <>
            <SelectField id="bankName" label="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} options={NIGERIAN_BANKS} />

            {bankName === 'Other' && (
              <FormField
                id="customBankName"
                label="Bank Name"
                value={customBankName}
                onChange={(event) => setCustomBankName(event.target.value)}
                placeholder="Enter your bank's name"
              />
            )}

            <FormField
              id="accountNumber"
              label="Account Number"
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit NUBAN account number"
              autoComplete="off"
            />

            <FormField
              id="accountName"
              label="Account Name"
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              placeholder="Name on the bank account"
            />
          </>
        ) : (
          <>
            <FormField
              id="deliveryAddress"
              label="Delivery Address"
              value={deliveryAddress}
              onChange={(event) => setDeliveryAddress(event.target.value)}
              placeholder="Where should orders be delivered?"
              autoComplete="street-address"
            />

            <SelectField
              id="paymentMethod"
              label="Preferred Payment Method"
              required={false}
              value={preferredPaymentMethod}
              onChange={(e) => setPreferredPaymentMethod(e.target.value)}
              options={['card', 'cash_on_delivery']}
            />
          </>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-emerald-800 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Saving…' : 'Complete Profile'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default CompleteProfilePage;
