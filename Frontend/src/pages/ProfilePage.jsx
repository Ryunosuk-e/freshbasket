import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
  User,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getMyCustomerProfile,
  getMyVendorProfile,
  updateCustomerProfile,
  updateVendorProfile,
} from '../api/profile.js';
import { changePassword } from '../api/auth.js';

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const CATEGORIES = [
  'Fruits & Vegetables',
  'Grains & Cereals',
  'Dairy & Eggs',
  'Meat & Fish',
  'Beverages',
  'Household Essentials',
  'Fresh Produce',
  'General Provisions',
];

function ProfilePage() {
  const { user, token, updateUser } = useAuth();
  const isVendor = user?.role === 'vendor';
  const isCustomer = user?.role === 'customer';
  const isAdmin = user?.role === 'admin';

  // Profile Data State
  const [profileData, setProfileData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState('cash_on_delivery');

  // Vendor-Specific Form Fields
  const [shopName, setShopName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [category, setCategory] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // Save states
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveProfileSuccess, setSaveProfileSuccess] = useState('');
  const [saveProfileError, setSaveProfileError] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setIsLoadingProfile(true);
    setProfileError('');

    if (isCustomer) {
      getMyCustomerProfile(token)
        .then((data) => {
          const cust = data.customer;
          setProfileData(cust);
          setFullName(cust.full_name || '');
          setPhoneNumber(cust.phone_number || '');
          setDeliveryAddress(cust.default_delivery_address || '');
          setPreferredPaymentMethod(cust.preferred_payment_method || 'cash_on_delivery');
        })
        .catch((err) => setProfileError(err.message || 'Could not load your profile.'))
        .finally(() => setIsLoadingProfile(false));
    } else if (isVendor) {
      getMyVendorProfile(token)
        .then((data) => {
          const vend = data.vendor;
          setProfileData(vend);
          setFullName(vend.full_name || '');
          setPhoneNumber(vend.phone_number || '');
          setShopName(vend.shop_name || '');
          setBusinessAddress(vend.business_address || '');
          setCategory(vend.category || '');
          if (vend.bank_details) {
            setBankName(vend.bank_details.bankName || '');
            setAccountNumber(vend.bank_details.accountNumber || '');
            setAccountName(vend.bank_details.accountName || '');
          }
        })
        .catch((err) => setProfileError(err.message || 'Could not load your profile.'))
        .finally(() => setIsLoadingProfile(false));
    } else {
      // Admin
      setFullName(user?.full_name || '');
      setPhoneNumber(user?.phone_number || '');
      setIsLoadingProfile(false);
    }
  }, [token, isCustomer, isVendor, user]);

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setSaveProfileSuccess('');
    setSaveProfileError('');
    setIsSavingProfile(true);

    try {
      if (isCustomer) {
        const payload = {
          fullName,
          phoneNumber,
          deliveryAddress,
          preferredPaymentMethod,
        };
        const res = await updateCustomerProfile(token, payload);
        updateUser({ full_name: fullName, phone_number: phoneNumber });
        setSaveProfileSuccess('Profile details saved successfully.');
      } else if (isVendor) {
        const payload = {
          ownerName: fullName,
          phoneNumber,
          shopName,
          businessAddress,
          category,
          bankName,
          accountNumber,
          accountName,
        };
        const res = await updateVendorProfile(token, payload);
        updateUser({ full_name: fullName, phone_number: phoneNumber });
        setSaveProfileSuccess('Store and payout details saved successfully.');
      }
    } catch (err) {
      setSaveProfileError(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(token, { currentPassword, newPassword });
      setPasswordSuccess('Password successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Could not change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-6 py-10 sm:px-12">
        {/* Page Title & Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your personal information, delivery preferences, and security.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-800 text-white shadow-xs">
              {isVendor ? <Store size={22} /> : <User size={22} />}
            </span>
            <div>
              <p className="text-sm font-bold text-gray-900">{user?.full_name}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1 font-semibold capitalize text-emerald-800">
                  <ShieldCheck size={13} />
                  {user?.role} Account
                </span>
                {profileData?.created_at && (
                  <span>· Joined {formatDate(profileData.created_at)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {isLoadingProfile ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-gray-400">
            <Loader2 size={24} className="animate-spin text-emerald-700" />
            <p className="text-sm">Loading your profile details…</p>
          </div>
        ) : profileError ? (
          <div role="alert" className="mt-8 rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">
            {profileError}
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Left 2 Cols: Profile Info Form */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSaveProfile} className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
                  <User size={18} className="text-emerald-700" />
                  <h2 className="text-base font-bold text-gray-900">
                    {isVendor ? 'Storefront & Contact Information' : 'Personal Information'}
                  </h2>
                </div>

                {saveProfileSuccess && (
                  <div className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-700" />
                    <span>{saveProfileSuccess}</span>
                  </div>
                )}

                {saveProfileError && (
                  <div className="mt-5 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle size={16} className="shrink-0 text-red-600" />
                    <span>{saveProfileError}</span>
                  </div>
                )}

                <div className="mt-6 space-y-4">
                  {/* Read-Only Email Field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Email Address
                    </label>
                    <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500">
                      <Mail size={16} className="text-gray-400" />
                      <span className="flex-1">{user?.email}</span>
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                        Primary ID
                      </span>
                    </div>
                  </div>

                  {/* Customer / Vendor Name */}
                  <FormField
                    id="fullName"
                    label={isVendor ? 'Owner / Contact Name' : 'Full Name'}
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />

                  {/* Phone Number */}
                  <FormField
                    id="phoneNumber"
                    label="Phone Number"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />

                  {/* Customer Delivery Address */}
                  {isCustomer && (
                    <>
                      <FormField
                        id="deliveryAddress"
                        label="Default Delivery Address"
                        type="text"
                        placeholder="e.g. 14 Ogige Road, Near Campus Gate, Nsukka"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        required
                      />

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Preferred Payment Method
                        </label>
                        <select
                          value={preferredPaymentMethod}
                          onChange={(e) => setPreferredPaymentMethod(e.target.value)}
                          className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-emerald-700 focus:outline-hidden"
                        >
                          <option value="cash_on_delivery">Cash on Delivery</option>
                          <option value="card">Debit / Credit Card (Paystack)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Vendor Store Details */}
                  {isVendor && (
                    <>
                      <FormField
                        id="shopName"
                        label="Shop / Business Name"
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        required
                      />

                      <FormField
                        id="businessAddress"
                        label="Market Stall / Business Address"
                        type="text"
                        placeholder="e.g. Stall B12, Meat Section, Ogige Main Market"
                        value={businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                        required
                      />

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Primary Product Category
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-emerald-700 focus:outline-hidden"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Bank Payout Details */}
                      <div className="mt-6 border-t border-gray-100 pt-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Building size={16} className="text-emerald-700" />
                          <h3 className="text-sm font-bold text-gray-900">Payout Bank Account</h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">
                          Direct deposits for orders paid via card are disbursed to this account.
                        </p>

                        <div className="space-y-3">
                          <FormField
                            id="bankName"
                            label="Bank Name"
                            type="text"
                            placeholder="e.g. Access Bank, First Bank, GTBank, OPay"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            required
                          />
                          <FormField
                            id="accountNumber"
                            label="10-Digit Account Number"
                            type="text"
                            maxLength={10}
                            placeholder="0123456789"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            required
                          />
                          <FormField
                            id="accountName"
                            label="Account Name (as registered with bank)"
                            type="text"
                            placeholder="Chiemela Great Okoro"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex items-center gap-2 rounded-full bg-emerald-800 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>

            {/* Right 1 Col: Security & Password */}
            <div>
              <form onSubmit={handleChangePassword} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
                  <KeyRound size={18} className="text-emerald-700" />
                  <h2 className="text-base font-bold text-gray-900">Change Password</h2>
                </div>

                {passwordSuccess && (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800">
                    <CheckCircle2 size={15} className="shrink-0 text-emerald-700" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2.5 text-xs text-red-700">
                    <AlertCircle size={15} className="shrink-0 text-red-600" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  <FormField
                    id="currentPassword"
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />

                  <FormField
                    id="newPassword"
                    label="New Password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />

                  <FormField
                    id="confirmPassword"
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="mt-5">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-gray-50 py-2.5 text-xs font-semibold text-gray-800 transition hover:bg-gray-100 disabled:opacity-60"
                  >
                    {isChangingPassword ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ProfilePage;
