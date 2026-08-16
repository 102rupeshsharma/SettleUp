import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Confirm password does not match new password');
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
      await axiosInstance.post(`/auth/reset-password/${token}`, {
        newPassword: password,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired or is invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-900 bg-slate-900/30 p-8 shadow-2xl backdrop-blur-md">
        {success ? (
          <div className="text-center space-y-5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">Password Changed</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your password has been successfully updated. You may now sign in using your new credentials.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="flex w-full items-center justify-center rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-slate-950 transition-all duration-200 hover:bg-emerald-400 active:scale-[0.98]"
              >
                Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                New Password
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Please enter a secure password containing at least 8 characters.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 ring-1 ring-rose-500/20">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleFormSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                    New Password
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
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      className={`block w-full rounded-lg border bg-slate-950 py-2.5 pl-10 pr-3 text-white placeholder-slate-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                        error
                          ? 'border-rose-500/50 focus:border-rose-500'
                          : 'border-slate-800 focus:border-emerald-500'
                      }`}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
                    Confirm New Password
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      className={`block w-full rounded-lg border bg-slate-950 py-2.5 pl-10 pr-3 text-white placeholder-slate-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                        error
                          ? 'border-rose-500/50 focus:border-rose-500'
                          : 'border-slate-800 focus:border-emerald-500'
                      }`}
                      placeholder="••••••••"
                    />
                  </div>
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
                      Saving changes...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
