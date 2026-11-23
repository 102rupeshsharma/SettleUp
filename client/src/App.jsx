import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import GroupDetail from './pages/GroupDetail';
import JoinGroup from './pages/JoinGroup';
import AddExpense from './pages/AddExpense';
import Analytics from './pages/Analytics';
import { SocketProvider } from './context/SocketContext';
import Toast from './components/notifications/Toast';
import Loading from './components/Loading';
import { useAuth } from './context/AuthContext';

const Home = () => {
  const { user, loading } = useAuth();

  // Wait for the silent refresh check to complete before deciding what to show
  if (loading) {
    return <Loading />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="font-display text-4xl leading-[1.05] font-semibold tracking-tight text-ink sm:text-5xl">
            Shared costs, without the awkward maths.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            Add what each person paid on the trip, in the flat or at dinner. SettleUp keeps a
            running tally and works out the fewest payments needed to square everyone up.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/signup" className="btn btn-primary px-5 py-2.5">
              Create an account
            </Link>
            <Link to="/login" className="btn btn-secondary px-5 py-2.5">
              Sign in
            </Link>
          </div>
        </div>

        {/* A small worked example instead of feature cards */}
        <div className="panel p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Goa, long weekend</h2>
            <span className="text-xs text-faint">example</span>
          </div>
          <ul className="mt-3 divide-y divide-line text-sm">
            <li className="flex justify-between py-2.5">
              <span className="text-ink">Villa, two nights <span className="text-muted">· Meera paid</span></span>
              <span className="tabular-nums text-ink">₹18,000</span>
            </li>
            <li className="flex justify-between py-2.5">
              <span className="text-ink">Scooter rental <span className="text-muted">· Arjun paid</span></span>
              <span className="tabular-nums text-ink">₹2,400</span>
            </li>
            <li className="flex justify-between py-2.5">
              <span className="text-ink">Dinner at the shack <span className="text-muted">· Kabir paid</span></span>
              <span className="tabular-nums text-ink">₹3,600</span>
            </li>
          </ul>
          <div className="mt-3 rounded-md bg-sunken px-3 py-3 text-sm">
            <p className="text-xs text-muted">To settle up, two payments:</p>
            <p className="mt-1.5 flex justify-between text-ink">
              <span>Arjun pays Meera</span>
              <span className="tabular-nums">₹5,600</span>
            </p>
            <p className="mt-1 flex justify-between text-ink">
              <span>Kabir pays Meera</span>
              <span className="tabular-nums">₹4,400</span>
            </p>
          </div>
        </div>
      </div>

      <dl className="mt-16 grid gap-8 border-t border-line pt-10 sm:grid-cols-3">
        <div>
          <dt className="font-medium text-ink">Fewer payments</dt>
          <dd className="mt-1.5 text-sm leading-relaxed text-muted">
            Debts inside a group are netted against each other, so nobody ends up paying three
            people when one transfer would do.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-ink">Split it your way</dt>
          <dd className="mt-1.5 text-sm leading-relaxed text-muted">
            Equally, by exact amounts or by percentage. Attach the receipt if anyone asks.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-ink">Everyone sees the same numbers</dt>
          <dd className="mt-1.5 text-sm leading-relaxed text-muted">
            Balances update for the whole group as soon as an expense or payment is added.
          </dd>
        </div>
      </dl>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="flex min-h-screen flex-col bg-page text-ink">
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
                <Route path="/verify-email/:token" element={<VerifyEmail />} />

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
