import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Menu from './pages/Menu/Menu';
import Customers from './pages/Customers/Customers';
import Orders from './pages/Orders/Orders';
import OrderForm from './pages/Orders/OrderForm';
import OrderDetail from './pages/Orders/OrderDetail';
import Production from './pages/Production/Production';
import Kitchen from './pages/Kitchen/Kitchen';
import AdminSettings from './pages/Admin/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'sonner';
import useAuthStore from './store/authStore';
import { getMe } from './api/auth';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const setAuth = useAuthStore(state => state.setAuth);
  const logout = useAuthStore(state => state.logout);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const user = await getMe();
          setAuth(user, token, true); // Restore state
        } catch (error) {
          console.error("Session restore failed", error);
          logout();
        }
      }
      setIsInitializing(false);
    };

    initAuth();
  }, [token, setAuth, logout]);

  if (isInitializing) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Dashboard Route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Menu Route */}
        <Route 
          path="/menu" 
          element={
            <ProtectedRoute>
              <Menu />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Customers Route */}
        <Route 
          path="/customers" 
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Orders Routes */}
        <Route 
          path="/orders" 
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/orders/new" 
          element={
            <ProtectedRoute>
              <OrderForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/orders/:id" 
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/orders/:id/edit" 
          element={
            <ProtectedRoute>
              <OrderForm />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Production Route */}
        <Route 
          path="/production" 
          element={
            <ProtectedRoute>
              <Production />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Kitchen Route */}
        <Route 
          path="/kitchen" 
          element={
            <ProtectedRoute>
              <Kitchen />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminSettings />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirect root to dashboard -> routing auto protects to login */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
