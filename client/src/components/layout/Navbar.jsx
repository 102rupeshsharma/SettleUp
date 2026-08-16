import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';
import ThemeToggle from './ThemeToggle';
import { LogOut, User as UserIcon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-emerald-500 dark:text-emerald-400">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 ring-1 ring-emerald-500/30">$</span>
              <span>Settle<span className="text-slate-850 dark:text-white">Up</span></span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                >
                  Dashboard
                </Link>
                <NotificationBell />
                <ThemeToggle />
                <div className="flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-900 px-3.5 py-1.5 text-sm border border-slate-200 dark:border-slate-800/60 text-slate-700 dark:text-slate-300">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  )}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</span>
                  <span className="ml-1.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-500 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                    {user.defaultCurrency}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 px-3.5 py-2 text-sm font-medium text-rose-500 dark:text-rose-400 transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-all duration-200 hover:bg-emerald-400 active:scale-[0.98] shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
