import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';
import ThemeToggle from './ThemeToggle';
import Avatar from '../ui/Avatar';
import { LogOut } from 'lucide-react';

const Logo = () => (
  <span className="flex items-center gap-2">
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="8" cy="11" r="7" fill="var(--accent)" />
      <circle cx="14" cy="11" r="7" fill="none" stroke="var(--ink)" strokeWidth="1.6" />
    </svg>
    <span className="font-display text-lg font-semibold tracking-tight text-ink">SettleUp</span>
  </span>
);

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-line bg-page/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link to={user ? '/dashboard' : '/'} aria-label="SettleUp home">
          <Logo />
        </Link>

        <div className="flex items-center gap-1">
          {user ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `mr-1 hidden rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-sunken hover:text-ink sm:block ${
                    isActive ? 'font-medium text-ink' : 'text-muted'
                  }`
                }
              >
                Groups
              </NavLink>
              <NotificationBell />
              <ThemeToggle />
              <div className="ml-2 flex items-center gap-2 border-l border-line pl-3">
                <Avatar name={user.name} src={user.avatar} size="sm" />
                <span className="hidden max-w-[10rem] truncate text-sm font-medium text-ink sm:block">
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  title="Log out"
                  aria-label="Log out"
                  className="rounded-md p-2 text-muted transition-colors hover:bg-sunken hover:text-ink"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                </button>
              </div>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link to="/login" className="btn btn-ghost">
                Sign in
              </Link>
              <Link to="/signup" className="btn btn-primary">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
