import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getPostLoginPath } from '../utils/routing.js';

// Wrap any page that requires login.
// - allowedRoles restricts a page to specific roles (e.g. ["admin"] for the
//   dashboard) — anyone else gets sent to wherever THEY belong instead.
// - requireIncompleteProfile marks the one page (Complete Profile) that
//   should only be reachable before it's done.
// Admins are exempt from the profile-completion check entirely — there's
// nothing role-specific for them to fill in, so that concept doesn't apply.
function ProtectedRoute({ children, allowedRoles, requireIncompleteProfile = false }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  if (user.role !== 'admin' && user.role !== 'agent') {
    if (requireIncompleteProfile && user.profile_completed) {
      return <Navigate to="/dashboard" replace />;
    }
    if (!requireIncompleteProfile && !user.profile_completed) {
      return <Navigate to="/complete-profile" replace />;
    }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getPostLoginPath(user)} replace />;
  }

  return children;
}

export default ProtectedRoute;
