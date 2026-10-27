// Where a logged-in user should land — used right after login, and by
// ProtectedRoute for anyone who reaches the wrong page directly.
export function getPostLoginPath(user) {
  if (!user) return '/sign-in';
  if (user.role === 'admin') return '/admin';
  if (user.role === 'agent') return '/agent/deliveries';
  if (user.role === 'vendor') return '/dashboard';
  if (!user.profile_completed) return '/complete-profile';
  // Customers redirect straight to the landing page per requirement
  return '/';
}
