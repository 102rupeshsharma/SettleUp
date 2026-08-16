import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import { User, Mail, DollarSign, Edit3, Save, CheckCircle, AlertCircle, Loader2, Users, Plus, Hash } from 'lucide-react';

const Dashboard = () => {
  const { user, updateProfile } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.defaultCurrency || 'INR');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [overview, setOverview] = useState(null);

  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY'];

  useEffect(() => {
    fetchGroups();
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await axiosInstance.get('/users/me/analytics/overview');
      setOverview(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await axiosInstance.get('/groups');
      setGroups(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError('');
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({ name, defaultCurrency: currency, avatar });
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    setJoinError('');
    setJoinSuccess('');

    if (!joinCode.trim()) {
      setJoinError('Invite code is required');
      return;
    }

    setJoinLoading(true);
    try {
      const response = await axiosInstance.post(`/groups/join/${joinCode}`);
      setJoinSuccess(`Successfully joined ${response.data.name}!`);
      setJoinCode('');
      fetchGroups();
      setTimeout(() => setJoinSuccess(''), 3000);
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Failed to join group. Verify code.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCreateSuccess = (newGroup) => {
    setGroups((prev) => [newGroup, ...prev]);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-transparent text-slate-800 dark:text-white space-y-8">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-900 bg-gradient-to-r from-slate-100 to-slate-200/30 dark:from-slate-900/50 dark:to-emerald-950/20 p-8 shadow-xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          Welcome back, <span className="text-emerald-500 dark:text-emerald-400">{user?.name}</span>!
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Simplify your group expenses and view your shared balances in real time.
        </p>
      </div>

      {overview && (
        <div className="grid gap-6 sm:grid-cols-3 animate-in fade-in duration-200">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/15 p-6 flex items-center justify-between shadow-sm dark:shadow-none">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total You Owe</span>
              <div className="text-2xl font-extrabold text-rose-500 dark:text-rose-400">
                ${overview.totalOwing.toFixed(2)}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/15 p-6 flex items-center justify-between shadow-sm dark:shadow-none">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total You Are Owed</span>
              <div className="text-2xl font-extrabold text-emerald-500 dark:text-emerald-400">
                ${overview.totalOwed.toFixed(2)}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/15 p-6 flex items-center justify-between shadow-sm dark:shadow-none">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Active Groups</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {overview.groupCount}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
            Your Groups
          </h2>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/10"
          >
            <Plus className="h-4 w-4" />
            Create Group
          </button>
        </div>

        {groupsLoading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/10 shadow-sm dark:shadow-none">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/10 space-y-3 shadow-sm dark:shadow-none">
            <p className="text-slate-500 dark:text-slate-400 font-medium">You are not a member of any groups yet.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs">Create a new group or enter an invitation code to split bills with friends.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Link
                key={group._id}
                to={`/groups/${group._id}`}
                className="group block rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/10 p-6 hover:border-emerald-500 dark:hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-all duration-200 shadow-sm dark:shadow-none"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                      {group.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-400">
                      <Users className="h-3 w-3" />
                      {group.members?.length || 0}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 h-10">
                    {group.description || 'No description provided.'}
                  </p>
                  <div className="border-t border-slate-100 dark:border-slate-900 pt-4 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                    <span>Created by {group.createdBy?.name || 'Unknown'}</span>
                    <span className="font-semibold text-emerald-500 dark:text-emerald-400">View Details &rarr;</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/10 p-6 shadow-sm dark:shadow-none space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              Profile Information
            </h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-emerald-500/10 transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit Profile
              </button>
            )}
          </div>

          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3.5 text-sm text-emerald-500 dark:text-emerald-400 ring-1 ring-emerald-500/20">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span className="font-medium">Profile updated successfully!</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 p-3.5 text-sm text-rose-500 dark:text-rose-400 ring-1 ring-rose-500/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="currencySelect" className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Default Currency
                </label>
                <select
                  id="currencySelect"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-850 dark:text-white focus:border-emerald-500 focus:outline-none"
                >
                  {currencies.map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="avatarUrl" className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Avatar URL (Optional)
                </label>
                <input
                  id="avatarUrl"
                  type="text"
                  value={avatar}
                  placeholder="https://example.com/avatar.png"
                  onChange={(e) => setAvatar(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-850 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setName(user?.name || '');
                    setCurrency(user?.defaultCurrency || 'INR');
                    setAvatar(user?.avatar || '');
                    setError('');
                  }}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 p-4 border border-slate-100 dark:border-slate-900">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Full Name
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{user?.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 p-4 border border-slate-100 dark:border-slate-900">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Email Address
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{user?.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 p-4 border border-slate-100 dark:border-slate-900">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Default Currency
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {user?.defaultCurrency || 'INR'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/10 p-6 shadow-sm dark:shadow-none space-y-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Hash className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
            Join Existing Group
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Have an invitation code? Enter it below to join and start splitting expenses.
          </p>

          {joinSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3.5 text-sm text-emerald-500 dark:text-emerald-400 ring-1 ring-emerald-500/20">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span className="font-medium">{joinSuccess}</span>
            </div>
          )}

          {joinError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 p-3.5 text-sm text-rose-500 dark:text-rose-400 ring-1 ring-rose-500/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-medium">{joinError}</span>
            </div>
          )}

          <form onSubmit={handleJoinGroup} className="space-y-4">
            <div>
              <label htmlFor="joinCode" className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Invitation Code
              </label>
              <input
                id="joinCode"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="e.g. A9B8C7"
                className="mt-1.5 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-emerald-500 focus:outline-none uppercase tracking-widest text-center"
              />
            </div>

            <button
              type="submit"
              disabled={joinLoading}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 transition-colors"
            >
              {joinLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Group'
              )}
            </button>
          </form>
        </div>
      </div>

      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default Dashboard;
