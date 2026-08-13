import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';

// Layouts
import { ManagerLayout } from '../components/layout/ManagerLayout';
import { VendorLayout } from '../components/layout/VendorLayout';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { VendorSignupPage } from '../pages/auth/VendorSignupPage';
import { OrganizationSignupPage } from '../pages/auth/OrganizationSignupPage';
import { LandingPage } from '../pages/LandingPage';
import { DeactivatedPage } from '../pages/DeactivatedPage';

// Manager Pages
import { ManagerDashboard } from '../pages/manager/ManagerDashboard';
import { ManagerVendors } from '../pages/manager/ManagerVendors';
import { VendorDetailPage } from '../pages/manager/VendorDetailPage';
import { ManagerProcurement } from '../pages/manager/ManagerProcurement';
import { PODetailPage } from '../pages/manager/PODetailPage';
import { ManagerInvoices } from '../pages/manager/ManagerInvoices';
import { ManagerPayments } from '../pages/manager/ManagerPayments';
import { ManagerReports } from '../pages/manager/ManagerReports';
import { ManagerProfile } from '../pages/manager/ManagerProfile';

// Vendor Pages
import { VendorDashboard } from '../pages/vendor/VendorDashboard';
import { VendorProducts } from '../pages/vendor/VendorProducts';
import { VendorOrders } from '../pages/vendor/VendorOrders';
import { VendorInvoices } from '../pages/vendor/VendorInvoices';
import { VendorPayments } from '../pages/vendor/VendorPayments';
import { VendorProfile } from '../pages/vendor/VendorProfile';

export const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Root: logged in → dashboard (or /deactivated), guest → landing home page */}
      <Route
        path="/"
        element={
          user ? (
            user.isDeactivated ? (
              <Navigate to="/deactivated" replace />
            ) : (
              <Navigate to={user.role === 'manager' ? '/manager/dashboard' : '/vendor/dashboard'} replace />
            )
          ) : (
            <Navigate to="/home" replace />
          )
        }
      />

      {/* Deactivated Account Page */}
      <Route path="/deactivated" element={<DeactivatedPage />} />

      {/* Landing & Auth */}
      <Route path="/home" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/vendor/signup" element={<VendorSignupPage />} />
      <Route path="/organization/signup" element={<OrganizationSignupPage />} />
      <Route path="/signup/organization" element={<OrganizationSignupPage />} />

      {/* Manager Protected Routes */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute allowedRole="manager">
            <ManagerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/manager/dashboard" replace />} />
        <Route path="dashboard" element={<ManagerDashboard />} />
        <Route path="vendors" element={<ManagerVendors />} />
        <Route path="vendors/:id" element={<VendorDetailPage />} />
        <Route path="procurement" element={<ManagerProcurement />} />
        <Route path="procurement/:id" element={<PODetailPage />} />
        <Route path="invoices" element={<ManagerInvoices />} />
        <Route path="payments" element={<ManagerPayments />} />
        <Route path="reports" element={<ManagerReports />} />
        <Route path="profile" element={<ManagerProfile />} />
      </Route>

      {/* Vendor Protected Routes */}
      <Route
        path="/vendor"
        element={
          <ProtectedRoute allowedRole="vendor">
            <VendorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/vendor/dashboard" replace />} />
        <Route path="dashboard" element={<VendorDashboard />} />
        <Route path="products" element={<VendorProducts />} />
        <Route path="orders" element={<VendorOrders />} />
        <Route path="invoices" element={<VendorInvoices />} />
        <Route path="payments" element={<VendorPayments />} />
        <Route path="profile" element={<VendorProfile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
