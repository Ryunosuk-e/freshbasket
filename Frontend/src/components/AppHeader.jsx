import { Leaf, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function AppHeader({ tag }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/sign-in', { replace: true });
  };

  return (
    <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4 sm:px-12">
      <Link to="/" className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800 text-white">
          <Leaf size={18} />
        </span>
        <span className="text-lg font-semibold text-gray-900">
          FreshBasket<span className="text-emerald-700">.</span>
        </span>
        {tag && (
          <span className="ml-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
            {tag}
          </span>
        )}
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </header>
  );
}

export default AppHeader;
