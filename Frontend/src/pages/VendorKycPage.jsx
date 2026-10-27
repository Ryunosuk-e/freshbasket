import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  CreditCard,
  User,
  ArrowRight,
  UploadCloud,
  Loader2,
  Check,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Footer from '../components/Footer.jsx';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getMyVendorKyc, submitVendorKyc } from '../api/kyc.js';

const MARKET_ZONES = [
  'Ogige Market',
  'Hilltop Commercial Area',
  'Behind Flat / Market Rd',
  'Odenigwe & Green House',
  'UNN Campus Environs',
];

const NIGERIAN_BANKS = [
  'Access Bank',
  'First Bank of Nigeria',
  'Guaranty Trust Bank (GTBank)',
  'United Bank for Africa (UBA)',
  'Zenith Bank',
  'Fidelity Bank',
  'Stanbic IBTC Bank',
  'Union Bank',
  'Wema Bank (ALAT)',
  'OPay (PayCom)',
  'Palmpay',
  'Kuda Microfinance Bank',
  'Moniepoint MFB',
];

export default function VendorKycPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    nin: '',
    phoneNumber: user?.phone_number || '',
    residentialAddress: '',
    idType: 'NIN Slip',
    idDocumentUrl: '',
    passportPhotoUrl: '',
    businessName: user?.shop_name || '',
    marketZone: 'Ogige Market',
    stallLocation: '',
    businessCategory: 'Fruits & Vegetables',
    cacNumber: '',
    stallProofUrl: '',
    bankName: 'First Bank of Nigeria',
    accountNumber: '',
    accountName: '',
  });

  const loadKyc = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getMyVendorKyc(token);
      if (data && data.submission) {
        setSubmission(data.submission);
        setFormData({
          fullName: data.submission.full_name || '',
          nin: data.submission.nin || '',
          phoneNumber: data.submission.phone_number || '',
          residentialAddress: data.submission.residential_address || '',
          idType: data.submission.id_type || 'NIN Slip',
          idDocumentUrl: data.submission.id_document_url || '',
          passportPhotoUrl: data.submission.passport_photo_url || '',
          businessName: data.submission.business_name || '',
          marketZone: data.submission.market_zone || 'Ogige Market',
          stallLocation: data.submission.stall_location || '',
          businessCategory: data.submission.business_category || 'Fruits & Vegetables',
          cacNumber: data.submission.cac_number || '',
          stallProofUrl: data.submission.stall_proof_url || '',
          bankName: data.submission.bank_name || 'First Bank of Nigeria',
          accountNumber: data.submission.account_number || '',
          accountName: data.submission.account_name || '',
        });
      }
    } catch (err) {
      console.error('loadKyc error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKyc();
  }, [token]);

  const updateField = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (
      !formData.fullName.trim() ||
      !formData.nin.trim() ||
      !formData.phoneNumber.trim() ||
      !formData.residentialAddress.trim() ||
      !formData.businessName.trim() ||
      !formData.stallLocation.trim() ||
      !formData.accountNumber.trim() ||
      !formData.accountName.trim()
    ) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (formData.nin.trim().length < 11) {
      setErrorMessage('NIN must be 11 digits.');
      return;
    }

    if (!formData.idDocumentUrl.trim()) {
      // Default to a placeholder if user didn't enter custom doc URL
      formData.idDocumentUrl = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80';
    }

    setIsSubmitting(true);
    try {
      const res = await submitVendorKyc(token, formData);
      setSuccessMessage(res.message || 'KYC application submitted successfully!');
      setSubmission(res.submission);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit KYC verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <AppHeader tag="Vendor Portal" />

        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-emerald-900 to-emerald-800 p-8 text-white shadow-xl">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                <ShieldCheck size={26} className="text-emerald-300" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Vendor KYC Verification</h1>
                <p className="mt-1 text-xs text-emerald-100">
                  Submit your identity and market stall details for platform administrator vetting.
                </p>
              </div>
            </div>
          </div>

          {/* Status Alert Cards */}
          {loading ? (
            <div className="mt-6 flex items-center justify-center p-12 text-sm text-gray-500">
              <Loader2 size={20} className="animate-spin mr-2" />
              Checking verification records…
            </div>
          ) : (
            <div className="mt-6">
              {submission?.status === 'approved' && (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-xs">
                      <CheckCircle2 size={22} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-emerald-950">Verified Vendor Account</p>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        Your KYC has been vetted and approved by FreshBasket administrators. Your stall is live for orders.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/vendor/products"
                    className="flex items-center gap-1.5 rounded-full bg-emerald-800 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition shrink-0"
                  >
                    <span>Manage Store Products</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )}

              {submission?.status === 'submitted' && (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-xs">
                    <Clock size={22} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-amber-950">KYC Verification Under Review</p>
                    <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                      Your identity documents, NIN ({submission.nin}), and stall location at {submission.stall_location} are currently being reviewed by administrators. You will receive an in-app Mail update once approved.
                    </p>
                  </div>
                </div>
              )}

              {submission?.status === 'rejected' && (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-6 flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-xs">
                    <AlertCircle size={22} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-red-950">Verification Action Required</p>
                    <p className="text-xs text-red-800 mt-0.5 leading-relaxed">
                      {submission.rejection_reason || 'Please correct your details or upload clearer identity documents and re-submit below.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mt-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            {/* 1. Personal Verification */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <User size={16} />
                </span>
                <h2 className="text-base font-bold text-gray-900">1. Personal Identity Verification</h2>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  id="fullName"
                  label="Legal Full Name (as on NIN)"
                  value={formData.fullName}
                  onChange={updateField('fullName')}
                  placeholder="e.g. Ngozi Chidinma Okafor"
                />

                <FormField
                  id="nin"
                  label="National Identification Number (NIN)"
                  value={formData.nin}
                  onChange={updateField('nin')}
                  placeholder="11-digit NIN"
                  maxLength={11}
                />

                <FormField
                  id="phoneNumber"
                  label="Registered Phone Number"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={updateField('phoneNumber')}
                  placeholder="080XXXXXXXX"
                />

                <div>
                  <label htmlFor="idType" className="block text-xs font-bold text-gray-700 mb-1.5">
                    Means of Identification
                  </label>
                  <select
                    id="idType"
                    value={formData.idType}
                    onChange={updateField('idType')}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="NIN Slip">National Identity (NIN Slip / Card)</option>
                    <option value="Voters Card">INEC Permanent Voters Card (PVC)</option>
                    <option value="Drivers License">FRSC Driver&rsquo;s License</option>
                    <option value="International Passport">International Passport</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <FormField
                    id="residentialAddress"
                    label="Current Residential Address in Nsukka"
                    value={formData.residentialAddress}
                    onChange={updateField('residentialAddress')}
                    placeholder="e.g. No. 12 University Market Road, Nsukka"
                  />
                </div>

                <div className="sm:col-span-2">
                  <FormField
                    id="idDocumentUrl"
                    label="ID Document Link or Photo Reference"
                    value={formData.idDocumentUrl}
                    onChange={updateField('idDocumentUrl')}
                    placeholder="Paste image link to uploaded NIN slip or ID document"
                    required={false}
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    You can paste a direct photo link (e.g., Imgur, Google Drive, or Cloudinary).
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Business & Market Stall Verification */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <Building2 size={16} />
                </span>
                <h2 className="text-base font-bold text-gray-900">2. Market Stall & Business Information</h2>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  id="businessName"
                  label="Trading / Shop Name"
                  value={formData.businessName}
                  onChange={updateField('businessName')}
                  placeholder="e.g. Mama Ngozi Fresh Tomatoes & Spices"
                />

                <div>
                  <label htmlFor="marketZone" className="block text-xs font-bold text-gray-700 mb-1.5">
                    Market Zone / Trading Area
                  </label>
                  <select
                    id="marketZone"
                    value={formData.marketZone}
                    onChange={updateField('marketZone')}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-emerald-600"
                  >
                    {MARKET_ZONES.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <FormField
                    id="stallLocation"
                    label="Exact Stall Location in Market"
                    value={formData.stallLocation}
                    onChange={updateField('stallLocation')}
                    placeholder="e.g. Line 3, Stall 14, Modern Market Ogige, Nsukka"
                  />
                </div>

                <FormField
                  id="businessCategory"
                  label="Primary Produce Category"
                  value={formData.businessCategory}
                  onChange={updateField('businessCategory')}
                  placeholder="e.g. Fresh Produce, Grains, Catfish, Utensils"
                  required={false}
                />

                <FormField
                  id="cacNumber"
                  label="CAC Business Reg. Number (Optional)"
                  value={formData.cacNumber}
                  onChange={updateField('cacNumber')}
                  placeholder="e.g. BN-3849102 (if registered)"
                  required={false}
                />

                <div className="sm:col-span-2">
                  <FormField
                    id="stallProofUrl"
                    label="Proof of Market Stall (Levy Ticket, Lease or Photo)"
                    value={formData.stallProofUrl}
                    onChange={updateField('stallProofUrl')}
                    placeholder="Link to market union ticket, shop photo, or utility document"
                    required={false}
                  />
                </div>
              </div>
            </div>

            {/* 3. Payout Bank Account Details */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <CreditCard size={16} />
                </span>
                <h2 className="text-base font-bold text-gray-900">3. Bank Account for Order Payouts</h2>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="bankName" className="block text-xs font-bold text-gray-700 mb-1.5">
                    Settlement Bank
                  </label>
                  <select
                    id="bankName"
                    value={formData.bankName}
                    onChange={updateField('bankName')}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-emerald-600"
                  >
                    {NIGERIAN_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <FormField
                  id="accountNumber"
                  label="10-Digit NUBAN Account Number"
                  value={formData.accountNumber}
                  onChange={updateField('accountNumber')}
                  placeholder="0123456789"
                  maxLength={10}
                />

                <div className="sm:col-span-2">
                  <FormField
                    id="accountName"
                    label="Account Name (Must match legal name on NIN)"
                    value={formData.accountName}
                    onChange={updateField('accountName')}
                    placeholder="e.g. NGOZI OKAFOR"
                  />
                </div>
              </div>
            </div>

            {/* Submission Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <p className="text-xs text-gray-500">
                By submitting, you certify that all information and documents supplied are genuine and comply with NDPA 2023 regulations.
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-emerald-800 px-8 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg hover:bg-emerald-700 transition disabled:opacity-50 shrink-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting KYC…
                  </>
                ) : (
                  <>
                    <span>{submission ? 'Update & Re-Submit KYC' : 'Submit KYC for Verification'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>

      <Footer />
    </div>
  );
}
