import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import Loading from '../components/Loading';
import { ShieldAlert } from 'lucide-react';

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
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-transparent px-4">
      <div className="mx-auto max-w-md w-full p-6 text-center space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-none">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Join Group Failed</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{error}</p>
        <Link
          to="/dashboard"
          className="inline-block w-full bg-emerald-500 text-slate-950 py-2.5 rounded-lg font-bold text-sm hover:bg-emerald-400 transition-colors text-slate-950"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default JoinGroup;
