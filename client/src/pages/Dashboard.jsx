import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import Avatar from '../components/ui/Avatar';
import { Loader2, Plus, ChevronRight } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';

const Dashboard = () => {
  const { user, updateProfile } = useAuth();
  const { formatCurrency, currencyCode } = useCurrency();
  
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

  const [verifySending, setVerifySending] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState('');

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
      fetchOverview();
      setTimeout(() => setJoinSuccess(''), 3000);
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Failed to join group. Verify code.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setVerifySending(true);
    try {
      const response = await axiosInstance.post('/auth/resend-verification');
      setVerifyNotice(response.data.message);
    } catch (err) {
      setVerifyNotice(err.response?.data?.message || 'Could not send the link. Try again later.');
    } finally {
      setVerifySending(false);
    }
  };

  const handleCreateSuccess = (newGroup) => {
    setGroups((prev) => [newGroup, ...prev]);
    fetchOverview();
  };

  // Balances are reported per currency because groups can use different ones.
  // Older servers only send the combined totals, so fall back to those.
  const totals = overview?.totals?.length
    ? overview.totals
    : overview
      ? [{ currency: currencyCode, owed: overview.totalOwed, owing: overview.totalOwing }]
      : [];
  const owingParts = totals.filter((t) => t.owing > 0);
  const owedParts = totals.filter((t) => t.owed > 0);
  const zeroAmount = formatCurrency(0, totals[0]?.currency || currencyCode);

  const netByGroup = {};
  (overview?.groups || []).forEach((g) => {
    netByGroup[g.groupId] = g;
  });

  const firstName = (user?.name || '').trim().split(/\s+/)[0];

  const groupBalanceLabel = (group) => {
    const entry = netByGroup[group._id];
    if (!entry) return null;
    const code = entry.currency || group.currency;
    if (entry.net > 0.01) {
      return (
        <span className="text-pos">
          you get back <span className="font-semibold tabular-nums">{formatCurrency(entry.net, code)}</span>
        </span>
      );
    }
    if (entry.net < -0.01) {
      return (
        <span className="text-neg">
          you owe <span className="font-semibold tabular-nums">{formatCurrency(Math.abs(entry.net), code)}</span>
        </span>
      );
    }
    return <span className="text-faint">settled up</span>;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-6 sm:py-10">
      {user && user.isVerified === false && (
        <div className="flex flex-col gap-2 rounded-md border border-line bg-surface px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-ink">
            Please confirm your email address.{' '}
            <span className="text-muted">
              {verifyNotice || `We sent a link to ${user.email}.`}
            </span>
          </p>
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={verifySending}
            className="btn btn-secondary shrink-0 self-start sm:self-auto"
          >
            {verifySending && <Loader2 className="h-4 w-4 animate-spin" />}
            Resend link
          </button>
        </div>
      )}

      <header>
        <p className="text-sm text-muted">Hi {firstName || 'there'}</p>
        <div className="mt-3 grid grid-cols-2 gap-6 sm:max-w-md">
          <div>
            <p className="text-sm text-muted">You owe</p>
            <div className={`mt-1 font-display text-2xl font-semibold tabular-nums sm:text-3xl ${owingParts.length ? 'text-neg' : 'text-ink'}`}>
              {owingParts.length === 0
                ? zeroAmount
                : owingParts.map((t) => (
                    <div key={t.currency}>{formatCurrency(t.owing, t.currency)}</div>
                  ))}
            </div>
          </div>
          <div className="border-l border-line pl-6">
            <p className="text-sm text-muted">You're owed</p>
            <div className={`mt-1 font-display text-2xl font-semibold tabular-nums sm:text-3xl ${owedParts.length ? 'text-pos' : 'text-ink'}`}>
              {owedParts.length === 0
                ? zeroAmount
                : owedParts.map((t) => (
                    <div key={t.currency}>{formatCurrency(t.owed, t.currency)}</div>
                  ))}
            </div>
          </div>
        </div>
      </header>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-ink">Your groups</h2>
          <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
            <Plus className="h-4 w-4" />
            New group
          </button>
        </div>

        {groupsLoading ? (
          <ul className="panel mt-4 divide-y divide-line" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-4">
                <span className="h-10 w-10 animate-pulse rounded-md bg-sunken" />
                <span className="h-3 w-40 animate-pulse rounded bg-sunken" />
              </li>
            ))}
          </ul>
        ) : groups.length === 0 ? (
          <div className="panel mt-4 px-6 py-12 text-center">
            <p className="font-medium text-ink">You're not in any groups yet.</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              Start one for your flat, a trip or a regular dinner, or join a friend's group with
              the code they sent you.
            </p>
            <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary mt-5">
              <Plus className="h-4 w-4" />
              New group
            </button>
          </div>
        ) : (
          <ul className="panel mt-4 divide-y divide-line">
            {groups.map((group) => {
              const memberCount = group.members?.length || 0;
              return (
                <li key={group._id}>
                  <Link
                    to={`/groups/${group._id}`}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-sunken"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sunken font-display text-base font-semibold text-ink">
                      {group.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{group.name}</p>
                      <p className="truncate text-xs text-muted">
                        {memberCount} {memberCount === 1 ? 'member' : 'members'}
                        {group.description ? ` · ${group.description}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-right text-sm">{groupBalanceLabel(group)}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-faint" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid gap-10 border-t border-line pt-8 md:grid-cols-2">
        <section>
          <h2 className="font-display text-base font-semibold text-ink">Have an invite code?</h2>
          <p className="mt-1 text-sm text-muted">Enter it to join someone else's group.</p>

          {joinSuccess && <p role="status" className="notice-ok mt-3">{joinSuccess}</p>}
          {joinError && <p role="alert" className="notice-error mt-3">{joinError}</p>}

          <form onSubmit={handleJoinGroup} className="mt-3 flex gap-2">
            <input
              id="joinCode"
              type="text"
              aria-label="Invite code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="A9B8C7"
              autoComplete="off"
              className="field max-w-[11rem] font-mono tracking-[0.2em] uppercase placeholder:tracking-[0.2em]"
            />
            <button type="submit" disabled={joinLoading} className="btn btn-secondary">
              {joinLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join'
              )}
            </button>
          </form>
        </section>

        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold text-ink">Your profile</h2>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="btn btn-ghost px-2.5 py-1">
                Edit
              </button>
            )}
          </div>

          {success && <p role="status" className="notice-ok mt-3">Profile updated.</p>}
          {error && <p role="alert" className="notice-error mt-3">{error}</p>}

          {isEditing ? (
            <form onSubmit={handleUpdate} className="mt-3 space-y-4">
              <div>
                <label htmlFor="fullName" className="field-label">Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field"
                />
              </div>

              <div>
                <label htmlFor="currencySelect" className="field-label">Default currency</label>
                <select
                  id="currencySelect"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="field"
                >
                  {currencies.map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-muted">
                  Used for new groups you create. Existing groups keep their own currency.
                </p>
              </div>

              <div>
                <label htmlFor="avatarUrl" className="field-label">
                  Photo URL <span className="font-normal text-muted">(optional)</span>
                </label>
                <input
                  id="avatarUrl"
                  type="text"
                  value={avatar}
                  placeholder="https://example.com/avatar.png"
                  onChange={(e) => setAvatar(e.target.value)}
                  className="field"
                />
              </div>

              <div className="flex items-center gap-2">
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save changes
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
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={user?.name} src={user?.avatar} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{user?.name}</p>
                <p className="truncate text-sm text-muted">{user?.email}</p>
                <p className="mt-0.5 text-xs text-muted">
                  New groups default to {user?.defaultCurrency || 'INR'}
                </p>
              </div>
            </div>
          )}
        </section>
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
