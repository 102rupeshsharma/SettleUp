import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import AuthShell from '../components/layout/AuthShell';
import usePageTitle from '../hooks/usePageTitle';

const Signup = () => {
  usePageTitle('Create account');
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
    <AuthShell>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Create your account</h1>
      <p className="mt-1.5 text-sm text-muted">
        Already have one?{' '}
        <Link to="/login" className="font-medium text-ink underline underline-offset-2">
          Sign in
        </Link>
      </p>

      {apiError && (
        <p role="alert" className="notice-error mt-6">{apiError}</p>
      )}

      <form className="mt-6 space-y-4" onSubmit={handleFormSubmit} noValidate>
        <div>
          <label htmlFor="name" className="field-label">Your name</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`field ${errors.name ? 'border-neg' : ''}`}
          />
          <p className={`mt-1.5 text-xs ${errors.name ? 'text-neg' : 'text-muted'}`}>
            {errors.name || 'This is what your group members will see.'}
          </p>
        </div>

        <div>
          <label htmlFor="email" className="field-label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`field ${errors.email ? 'border-neg' : ''}`}
            placeholder="name@example.com"
          />
          {errors.email && <p className="mt-1.5 text-xs text-neg">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="field-label">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`field ${errors.password ? 'border-neg' : ''}`}
          />
          <p className={`mt-1.5 text-xs ${errors.password ? 'text-neg' : 'text-muted'}`}>
            {errors.password || 'At least 8 characters.'}
          </p>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>
    </AuthShell>
  );
};

export default Signup;
