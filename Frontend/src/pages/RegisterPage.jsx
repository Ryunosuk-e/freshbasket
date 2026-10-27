import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import GoogleIcon from '../components/GoogleIcon.jsx';
import { registerCustomer, registerVendor } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';

const ROLE_COPY = {
  customer: {
    subheading: 'Sign up to shop fresh groceries from local vendors around Nsukka.',
    submitLabel: 'Create account',
  },
  vendor: {
    subheading: 'Register your shop to start selling on FreshBasket.',
    submitLabel: 'Submit application',
  },
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(role, formData, agree) {
  const name = role === 'customer' ? formData.fullName : formData.ownerName;
  if (!name.trim()) return role === 'customer' ? 'Full name is required.' : 'Owner name is required.';
  if (!formData.email.trim()) return 'Email is required.';
  if (!EMAIL_PATTERN.test(formData.email)) return 'Please enter a valid email address.';
  if (!formData.phoneNumber.trim()) return 'Phone number is required.';
  if (formData.password.length < 8) return 'Password must be at least 8 characters long.';
  if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
  if (role === 'vendor') {
    if (!formData.shopName.trim()) return 'Shop name is required.';
    if (!formData.businessAddress.trim()) return 'Business address is required.';
  }
  if (!agree) return 'Please agree to the Terms of Service and Privacy Policy.';
  return null;
}

function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [role, setRole] = useState(location.state?.role === 'vendor' ? 'vendor' : 'customer');
  const [formData, setFormData] = useState({
    fullName: '',
    ownerName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    deliveryAddress: '',
    shopName: '',
    businessAddress: '',
    category: '',
  });
  const [agree, setAgree] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [googleNotice, setGoogleNotice] = useState('');

  const updateField = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setErrorMessage('');
  };

  const handleGoogleClick = () => {
    setGoogleNotice("Google sign-up isn't connected yet — please use the form for now.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    const validationError = validate(role, formData, agree);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      if (role === 'customer') {
        const result = await registerCustomer({
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          deliveryAddress: formData.deliveryAddress || undefined,
        });

        if (result.token && result.user) {
          login(result.user, result.token, true);
          // Redirect customer to the landing page as requested
          navigate('/', { replace: true, state: { welcomeMessage: 'Account created successfully! Welcome to FreshBasket.' } });
          return;
        }
        navigate('/sign-in', { state: { message: result.message || 'Account created! Please sign in.' } });
      } else {
        const result = await registerVendor({
          ownerName: formData.ownerName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          shopName: formData.shopName,
          businessAddress: formData.businessAddress,
          category: formData.category || undefined,
        });

        if (result.token && (result.user || result.vendor)) {
          const vendorUser = result.user || result.vendor;
          login(vendorUser, result.token, true);
          // Redirect newly registered vendor to KYC page to complete verification
          navigate('/vendor/kyc', {
            replace: true,
            state: { message: 'Vendor account created! Please submit your KYC verification to begin listing products.' },
          });
          return;
        }
        navigate('/sign-in', { state: { message: result.message || 'Registration submitted! Please sign in.' } });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  const copy = ROLE_COPY[role];

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create your account</h1>
      <p className="mt-1 text-xs text-gray-500">{copy.subheading}</p>

      <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => handleRoleChange('customer')}
          className={`rounded-full py-2 text-sm font-medium transition ${
            role === 'customer' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Shop as a customer
        </button>
        <button
          type="button"
          onClick={() => handleRoleChange('vendor')}
          className={`rounded-full py-2 text-sm font-medium transition ${
            role === 'vendor' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Sell as a vendor
        </button>
      </div>

      {errorMessage && (
        <div role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        {role === 'customer' ? (
          <FormField
            id="fullName"
            label="Full Name"
            value={formData.fullName}
            onChange={updateField('fullName')}
            placeholder="Enter your full name"
            autoComplete="name"
          />
        ) : (
          <FormField
            id="ownerName"
            label="Owner Name"
            value={formData.ownerName}
            onChange={updateField('ownerName')}
            placeholder="Enter the owner's full name"
            autoComplete="name"
          />
        )}

        <FormField
          id="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={updateField('email')}
          placeholder="Enter Email Address"
          autoComplete="email"
        />

        <FormField
          id="phoneNumber"
          label="Phone Number"
          type="tel"
          value={formData.phoneNumber}
          onChange={updateField('phoneNumber')}
          placeholder="Enter Phone Number"
          autoComplete="tel"
        />

        {role === 'vendor' && (
          <>
            <FormField
              id="shopName"
              label="Shop Name"
              value={formData.shopName}
              onChange={updateField('shopName')}
              placeholder="Enter your shop name"
            />
            <FormField
              id="businessAddress"
              label="Business Address"
              value={formData.businessAddress}
              onChange={updateField('businessAddress')}
              placeholder="Stall/shop address in the market"
            />
            <FormField
              id="category"
              label="Category"
              required={false}
              value={formData.category}
              onChange={updateField('category')}
              placeholder="e.g. Fresh Produce, Grains, Dairy"
            />
          </>
        )}

        {role === 'customer' && (
          <FormField
            id="deliveryAddress"
            label="Delivery Address"
            required={false}
            value={formData.deliveryAddress}
            onChange={updateField('deliveryAddress')}
            placeholder="Where should orders be delivered?"
            autoComplete="street-address"
          />
        )}

        <FormField
          id="password"
          label="Password"
          type="password"
          value={formData.password}
          onChange={updateField('password')}
          placeholder="Enter Password"
          autoComplete="new-password"
        />

        <FormField
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          value={formData.confirmPassword}
          onChange={updateField('confirmPassword')}
          placeholder="Re-enter Password"
          autoComplete="new-password"
        />

        <label className="flex items-start gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={agree}
            onChange={(event) => setAgree(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
          />
          <span>
            I agree to the <a href="#terms" className="underline">Terms of Service</a> and{' '}
            <a href="#privacy" className="underline">Privacy Policy</a>.
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-emerald-800 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Please wait…' : copy.submitLabel}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3 text-sm text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        or sign up with
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <button
        type="button"
        onClick={handleGoogleClick}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <GoogleIcon />
        Sign up with Google
      </button>
      {googleNotice && <p className="mt-2 text-center text-xs text-gray-400">{googleNotice}</p>}

      <p className="mt-8 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/sign-in" className="font-medium text-emerald-700 underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default RegisterPage;
