import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import GroupDetail from './pages/GroupDetail';
import JoinGroup from './pages/JoinGroup';
import AddExpense from './pages/AddExpense';
import Analytics from './pages/Analytics';
import { SocketProvider } from './context/SocketContext';
import Toast from './components/notifications/Toast';
import { ArrowRight, Share2, Shield, RefreshCw } from 'lucide-react';

const Home = () => {
  return (
    <div className="bg-transparent text-slate-800 dark:text-white min-h-[calc(100vh-4rem)] flex flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-650 dark:text-emerald-400 ring-1 ring-emerald-500/25">
          Introducing SettleUp
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-900 dark:text-slate-100">
          Smart Group Expense Splitter, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-emerald-400 dark:to-teal-300">
            Simplified
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          SettleUp uses an advanced debt-simplification graph algorithm to minimize transactions, 
          supports custom group roles, and syncs split balances in real time.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/signup"
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3.5 text-base font-bold text-slate-950 hover:bg-emerald-400 transition-all duration-200 active:scale-95 shadow-lg shadow-emerald-500/15 text-slate-950"
          >
            Create Free Account
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 px-6 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white transition-colors duration-200"
          >
            Sign In
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid gap-6 md:grid-cols-3 pt-16">
          <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/15 p-6 text-left space-y-2 shadow-sm dark:shadow-none">
            <RefreshCw className="h-6 w-6 text-emerald-500 dark:text-emerald-400 mb-2" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Debt Minimization</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Min-cash-flow graph solver simplifies complex multi-person IOUs into a minimal set of direct bank payments.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/15 p-6 text-left space-y-2 shadow-sm dark:shadow-none">
            <Shield className="h-6 w-6 text-emerald-500 dark:text-emerald-400 mb-2" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Per-Group Roles</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Granular group memberships (Admin, Member, Viewer) control exact viewing and modifications.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/15 p-6 text-left space-y-2 shadow-sm dark:shadow-none">
            <Share2 className="h-6 w-6 text-emerald-500 dark:text-emerald-400 mb-2" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Real-Time Sync</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Instant notification updates across user groups when transactions are modified.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200 flex flex-col">
            <Navbar />
            <Toast />
            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/groups/:id" element={<GroupDetail />} />
                  <Route path="/groups/join/:inviteCode" element={<JoinGroup />} />
                  <Route path="/groups/:groupId/expenses/add" element={<AddExpense />} />
                  <Route path="/groups/:groupId/expenses/:expenseId/edit" element={<AddExpense />} />
                  <Route path="/groups/:groupId/analytics" element={<Analytics />} />
                </Route>

                {/* Redirect any unmatched path */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
