import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import Loading from '../components/Loading';

const JoinGroup = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const performJoin = async () => {
      try {
        const response = await axiosInstance.post(`/groups/join/${inviteCode}`);
        navigate(`/groups/${response.data._id}`, { replace: true });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to join group. Code might be invalid or expired.');
        setLoading(false);
      }
    };

    performJoin();
  }, [inviteCode, navigate]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-14 sm:py-20">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Couldn't join that group</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{error}</p>
      <Link to="/dashboard" className="btn btn-primary mt-6">
        Back to your groups
      </Link>
    </div>
  );
};

export default JoinGroup;
