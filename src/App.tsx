import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DatabaseProvider } from './contexts/DatabaseContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TransactionForm from './pages/TransactionForm';
import TransactionHistory from './pages/TransactionHistory';
import AdminPanel from './pages/AdminPanel';
import Navbar from './components/Navbar';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <DatabaseProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Toaster position="top-right" />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <Dashboard />
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/transaction" element={
                <ProtectedRoute>
                  <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <TransactionForm />
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <TransactionHistory />
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <AdminPanel />
                  </div>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </DatabaseProvider>
    </AuthProvider>
  );
}

export default App;