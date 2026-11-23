import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { Loader2 } from 'lucide-react';
import AuthShell from '../components/layout/AuthShell';
import usePageTitle from '../hooks/usePageTitle';

const ResetPassword = () => {
  usePageTitle('Choose a new password');
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
    <AuthShell>
      {success ? (
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Password updated</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            You can now sign in with your new password.
          </p>
          <Link to="/login" className="btn btn-primary mt-6 w-full py-2.5">
            Sign in
          </Link>
        </div>
      ) : (
        <>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Choose a new password</h1>
          <p className="mt-1.5 text-sm text-muted">At least 8 characters.</p>

          {error && (
            <p role="alert" className="notice-error mt-6">{error}</p>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleFormSubmit} noValidate>
            <div>
              <label htmlFor="password" className="field-label">New password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className={`field ${error ? 'border-neg' : ''}`}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="field-label">Repeat new password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                className={`field ${error ? 'border-neg' : ''}`}
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving changes...
                </>
              ) : (
                'Update password'
              )}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
};

export default ResetPassword;
