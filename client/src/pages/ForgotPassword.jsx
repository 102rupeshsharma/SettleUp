import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { ArrowLeft, Loader2 } from 'lucide-react';

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

  const backLink = (
    <Link
      to="/login"
      className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to sign in
    </Link>
  );

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-14 sm:py-20">
      {success ? (
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Check your inbox</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            We've sent a reset link to <span className="font-medium text-ink">{email}</span>. It
            can take a minute to arrive.
          </p>

          {/* Only shown while running the Vite dev server */}
          {import.meta.env.DEV && (
            <p className="mt-5 rounded-md border border-dashed border-line px-3 py-2.5 text-xs leading-relaxed text-muted">
              <span className="font-medium text-ink">Dev only:</span> email goes through Ethereal, so
              the reset URL and preview link are printed in the server console.
            </p>
          )}

          <div className="mt-6">{backLink}</div>
        </div>
      ) : (
        <>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Reset your password</h1>
          <p className="mt-1.5 text-sm text-muted">
            Enter the email you signed up with and we'll send you a reset link.
          </p>

          {error && (
            <p role="alert" className="notice-error mt-6">{error}</p>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleFormSubmit} noValidate>
            <div>
              <label htmlFor="email" className="field-label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className={`field ${error ? 'border-neg' : ''}`}
                placeholder="name@example.com"
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          <div className="mt-6">{backLink}</div>
        </>
      )}
    </div>
  );
};

export default ForgotPassword;
