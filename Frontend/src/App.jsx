import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import ShopPage from './pages/ShopPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import CompleteProfilePage from './pages/CompleteProfilePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import VendorProductsPage from './pages/VendorProductsPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderDetailPage from './pages/OrderDetailPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/shop/:productId" element={<ProductDetailPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route
        path="/complete-profile"
        element={
          <ProtectedRoute requireIncompleteProfile allowedRoles={['customer', 'vendor']}>
            <CompleteProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['customer', 'vendor']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/products"
        element={
          <ProtectedRoute allowedRoles={['vendor']}>
            <VendorProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CartPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:orderId"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <OrderDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
