import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
