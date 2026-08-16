import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup, user } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if user session exists
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const validateForm = () => {
    const localErrors = {};
    if (!name.trim()) {
      localErrors.name = 'Full name is required';
    }
    if (!email) {
      localErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      localErrors.email = 'Please provide a valid email format';
    }
    if (!password) {
      localErrors.password = 'Password is required';
    } else if (password.length < 8) {
      localErrors.password = 'Password must be at least 8 characters long';
    }
    setErrors(localErrors);
    return Object.keys(localErrors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signup(name, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-900 bg-slate-900/30 p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-emerald-400 hover:text-emerald-300">
              Sign In
            </Link>
          </p>
        </div>

        {apiError && (
          <div className="flex items-center gap-2.5 rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 ring-1 ring-rose-500/20">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="font-medium">{apiError}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleFormSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                Full Name
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`block w-full rounded-lg border bg-slate-950 py-2.5 pl-10 pr-3 text-white placeholder-slate-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                    errors.name
                      ? 'border-rose-500/50 focus:border-rose-500'
                      : 'border-slate-800 focus:border-emerald-500'
                  }`}
                  placeholder="John Doe"
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-xs text-rose-400 font-medium">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full rounded-lg border bg-slate-950 py-2.5 pl-10 pr-3 text-white placeholder-slate-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                    errors.email
                      ? 'border-rose-500/50 focus:border-rose-500'
                      : 'border-slate-800 focus:border-emerald-500'
                  }`}
                  placeholder="name@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-400 font-medium">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full rounded-lg border bg-slate-950 py-2.5 pl-10 pr-3 text-white placeholder-slate-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                    errors.password
                      ? 'border-rose-500/50 focus:border-rose-500'
                      : 'border-slate-800 focus:border-emerald-500'
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-400 font-medium">{errors.password}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-slate-950 transition-all duration-200 hover:bg-emerald-400 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
