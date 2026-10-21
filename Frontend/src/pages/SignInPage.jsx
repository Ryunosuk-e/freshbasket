import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import GoogleIcon from '../components/GoogleIcon.jsx';
import { login as loginRequest } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getPostLoginPath } from '../utils/routing.js';

const HIGHLIGHTS = [
  'Fresh produce from trusted vendors across Nsukka, delivered to your door.',
  'Every vendor is verified before their storefront goes live, so you can order with confidence.',
  'Pay by card or cash on delivery — whichever works for you.',
];

function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [googleNotice, setGoogleNotice] = useState('');

  // Carried over from Register's redirect — e.g. "Account created." or the
  // vendor "pending verification" message. Cleared automatically since it
  // only ever comes from router state, never re-appears on refresh.
  const infoMessage = location.state?.message;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginRequest({ email, password });
      login(result.user, result.token, rememberMe);
      navigate(getPostLoginPath(result.user), { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout highlights={HIGHLIGHTS}>
      <h1 className="text-2xl font-semibold text-gray-900">Sign In</h1>
      <p className="mt-2 text-sm text-gray-500">Please fill your detail to access your account.</p>

      {infoMessage && (
        <div role="status" className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {infoMessage}
        </div>
      )}
      {errorMessage && (
        <div role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <FormField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter Email Address"
          autoComplete="email"
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter Password"
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-gray-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
            />
            Remember me
          </label>
          <a href="#forgot-password" className="font-medium text-emerald-700 underline">
            Forgot Password?
          </a>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-emerald-800 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3 text-sm text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        or sign in with
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <button
        type="button"
        onClick={() => setGoogleNotice("Google sign-in isn't connected yet — please use the form for now.")}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <GoogleIcon />
        Sign In With Google
      </button>
      {googleNotice && <p className="mt-2 text-center text-xs text-gray-400">{googleNotice}</p>}

      <p className="mt-8 text-center text-sm text-gray-500">
        Don&rsquo;t have an account?{' '}
        <Link to="/register" className="font-medium text-emerald-700 underline">
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  );
}

export default SignInPage;
