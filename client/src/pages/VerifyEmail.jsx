import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const VerifyEmail = () => {
  const { token } = useParams();
  const { user, markVerified } = useAuth();
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      try {
        await axiosInstance.post(`/auth/verify-email/${token}`);
        if (cancelled) return;
        markVerified();
        setStatus('done');
      } catch (err) {
        if (cancelled) return;
        setMessage(err.response?.data?.message || 'This confirmation link is invalid or has expired.');
        setStatus('failed');
      }
    };
    verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === 'checking') {
    return <Loading />;
  }

  const destination = user ? '/dashboard' : '/login';
  const destinationLabel = user ? 'Go to your groups' : 'Sign in';

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-14 sm:py-20">
      {status === 'done' ? (
        <>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Email confirmed</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Thanks, that's all we needed.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            We couldn't confirm your email
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {message} You can request a new link from your groups page after signing in.
          </p>
        </>
      )}
      <Link to={destination} className="btn btn-primary mt-6">
        {destinationLabel}
      </Link>
    </div>
  );
};

export default VerifyEmail;
