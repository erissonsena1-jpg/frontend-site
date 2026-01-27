import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { Toaster } from './components/ui/sonner';
import '@/App.css';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PDV from './pages/PDV';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Expiration from './pages/Expiration';
import Financial from './pages/Financial';
import Reports from './pages/Reports';
import CashRegister from './pages/CashRegister';
import MainLayout from './components/MainLayout';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useApp();
  return currentUser ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pdv" element={<PDV />} />
        <Route path="produtos" element={<Products />} />
        <Route path="estoque" element={<Stock />} />
        <Route path="validade" element={<Expiration />} />
        <Route path="financeiro" element={<Financial />} />
        <Route path="relatorios" element={<Reports />} />
        <Route path="caixa" element={<CashRegister />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;