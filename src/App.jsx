import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { TransactionsProvider } from './contexts/TransactionsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/header';


import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AddExpensePage from './pages/AddExpensePage';
import MetasGastos from './pages/MetasGastos';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/metas" element={
              <ProtectedRoute>
                <TransactionsProvider>
                  <Header/>
                  <MetasGastos />
                </TransactionsProvider>
              </ProtectedRoute>
            }
            />

          
          <Route 
            path="/"
            element={
              <ProtectedRoute>
                <TransactionsProvider>
                  <DashboardPage />
                </TransactionsProvider>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/dashboard"
            element={
              <ProtectedRoute>
                <TransactionsProvider>
                  <DashboardPage />
                </TransactionsProvider>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/adicionar"
            element={
              <ProtectedRoute>
                <TransactionsProvider>
                  <AddExpensePage />
                </TransactionsProvider>
              </ProtectedRoute>
            } 
          />

        </Routes>
      </Router>
    </AuthProvider>
  );
}