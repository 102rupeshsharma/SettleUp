import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!email) {
      setError('Email address is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please provide a valid email format');
      return false;
    }
    return true;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      await axiosInstance.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request password reset. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-900 bg-slate-900/30 p-8 shadow-2xl backdrop-blur-md">
        {success ? (
          <div className="text-center space-y-5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 animate-bounce">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">Reset Link Sent</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              We've emailed a password reset link to <span className="font-semibold text-slate-200">{email}</span>.
            </p>
            <div className="rounded-lg bg-slate-950 border border-slate-900/80 p-4 text-xs text-left text-slate-400 space-y-1">
              <span className="font-semibold text-emerald-400 block">Developer Testing Note:</span>
              <p>Since we are using Ethereal email testing, <strong>check the console output logs of the Node.js server</strong> to copy the direct URL or view the email preview.</p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                Forgot Password
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Provide your email address below, and we will send you a password reset URL.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 ring-1 ring-rose-500/20">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleFormSubmit}>
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
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    className={`block w-full rounded-lg border bg-slate-950 py-2.5 pl-10 pr-3 text-white placeholder-slate-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                      error
                        ? 'border-rose-500/50 focus:border-rose-500'
                        : 'border-slate-800 focus:border-emerald-500'
                    }`}
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-slate-950 transition-all duration-200 hover:bg-emerald-400 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors duration-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
