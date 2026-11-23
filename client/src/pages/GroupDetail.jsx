import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import MemberList from '../components/groups/MemberList';
import InviteMemberModal from '../components/groups/InviteMemberModal';
import ExpenseList from '../components/expenses/ExpenseList';
import BalanceSummary from '../components/balances/BalanceSummary';
import SettleUpSuggestions from '../components/balances/SettleUpSuggestions';
import SettleModal from '../components/balances/SettleModal';
import useGroupSocket from '../hooks/useGroupSocket';
import ExportButtons from '../components/groups/ExportButtons';
import Loading from '../components/Loading';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ActivityFeed from '../components/groups/ActivityFeed';
import usePageTitle from '../hooks/usePageTitle';
import { ChevronLeft, Loader2, Plus } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';

const METHOD_LABELS = { cash: 'Cash', upi: 'UPI', bank: 'Bank transfer', other: 'Other' };

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  usePageTitle(group?.name);
  const { formatCurrency, currencyCode } = useCurrency(group?.currency);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [remindingId, setRemindingId] = useState(null);
  const [activeTab, setActiveTab] = useState('expenses');

  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [settlements, setSettlements] = useState([]);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  const onExpenseAdded = (data) => {
    setExpenses((prev) => {
      const exists = prev.some((e) => e._id === data.expense._id);
      if (exists) return prev;
      return [data.expense, ...prev];
    });
    fetchBalancesAndSuggestions();
  };

  const onExpenseUpdated = (data) => {
    setExpenses((prev) => prev.map((e) => e._id === data.expense._id ? data.expense : e));
    fetchBalancesAndSuggestions();
  };

  const onExpenseDeleted = (data) => {
    setExpenses((prev) => prev.filter((e) => e._id !== data.expenseId));
    fetchBalancesAndSuggestions();
  };

  const onSettlementMade = (data) => {
    fetchBalancesAndSuggestions();
    setSettlements((prev) => {
      const exists = prev.some((s) => s._id === data.settlement._id);
      if (exists) return prev;
      return [data.settlement, ...prev];
    });
  };

  useGroupSocket(id, onExpenseAdded, onExpenseUpdated, onExpenseDeleted, onSettlementMade);

  useEffect(() => {
    if (id) {
      fetchGroupDetails();
      fetchExpenses();
      fetchBalancesAndSuggestions();
    }
  }, [id]);

  // The history is only loaded while its tab is open, and refreshed when an
  // expense or payment arrives so it stays current.
  useEffect(() => {
    if (!id || activeTab !== 'activity') return;
    let cancelled = false;
    const fetchActivity = async () => {
      setActivityLoading(true);
      try {
        const response = await axiosInstance.get(`/groups/${id}/activity`);
        if (!cancelled) setActivity(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    };
    fetchActivity();
    return () => {
      cancelled = true;
    };
  }, [id, activeTab, expenses, settlements]);

  const fetchGroupDetails = async () => {
    try {
      const response = await axiosInstance.get(`/groups/${id}`);
      setGroup(response.data);
      setEditName(response.data.name);
      setEditDesc(response.data.description || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await axiosInstance.get(`/groups/${id}/expenses`);
      setExpenses(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBalancesAndSuggestions = async () => {
    try {
      const balRes = await axiosInstance.get(`/groups/${id}/balances`);
      setBalances(balRes.data);
      const sugRes = await axiosInstance.get(`/groups/${id}/settlements/suggested`);
      setSuggestions(sugRes.data);
      const setRes = await axiosInstance.get(`/groups/${id}/settlements`);
      setSettlements(setRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <Loading />;
  }

  // `error` is only for a failed page load. Failures of individual actions go
  // to `actionError` so they show inline instead of replacing the whole page.
  if (error || !group) {
    return (
      <div className="mx-auto w-full max-w-sm px-4 py-14 sm:py-20">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          We couldn't open this group
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{error || 'Group not found.'}</p>
        <Link to="/dashboard" className="btn btn-primary mt-6">
          Back to your groups
        </Link>
      </div>
    );
  }

  const currentMember = group.members.find(
    (m) => m.userId?._id === user?._id || m.userId === user?._id
  );
  const memberRole = currentMember ? currentMember.role : 'viewer';
  const isAdmin = memberRole === 'admin';
  const isViewer = memberRole === 'viewer';

  const closeConfirm = () => setConfirm(null);

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    setActionError('');
    setEditSuccess(false);

    if (!editName.trim()) {
      setActionError('Group name is required');
      return;
    }

    setEditLoading(true);
    try {
      const response = await axiosInstance.put(`/groups/${id}`, {
        name: editName,
        description: editDesc,
      });
      setGroup((prev) => ({
        ...prev,
        name: response.data.name,
        description: response.data.description,
      }));
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update group');
    } finally {
      setEditLoading(false);
    }
  };

  const regenerateCode = async () => {
    closeConfirm();
    setActionError('');
    try {
      const response = await axiosInstance.post(`/groups/${id}/invite`);
      setGroup((prev) => ({
        ...prev,
        inviteCode: response.data.inviteCode,
      }));
    } catch (err) {
      setActionError('Failed to regenerate invite code');
    }
  };

  const handleRegenerateCode = () => {
    setConfirm({
      title: 'Get a new invite code?',
      message: 'The current code and link will stop working straight away. People already in the group are not affected.',
      confirmLabel: 'Regenerate code',
      danger: false,
      action: regenerateCode,
    });
  };

  const deleteGroup = async () => {
    closeConfirm();
    setActionError('');
    try {
      await axiosInstance.delete(`/groups/${id}`);
      navigate('/dashboard');
    } catch (err) {
      setActionError('Failed to delete group');
    }
  };

  const handleDeleteGroup = () => {
    setConfirm({
      title: `Delete ${group.name}?`,
      message: 'This removes the group for every member, along with its expenses and payment history. It cannot be undone.',
      confirmLabel: 'Delete group',
      danger: true,
      action: deleteGroup,
    });
  };

  const handleMembersUpdate = (hasLeft = false) => {
    if (hasLeft) {
      navigate('/dashboard');
    } else {
      fetchGroupDetails();
    }
  };

  const leaveGroup = async () => {
    closeConfirm();
    setActionError('');
    try {
      await axiosInstance.delete(`/groups/${id}/members/${user._id}`);
      handleMembersUpdate(true);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to leave group');
    }
  };

  const handleLeaveGroup = () => {
    setConfirm({
      title: 'Leave this group?',
      message: "You'll lose access to this group's expenses and balances. You can rejoin with an invite code.",
      confirmLabel: 'Leave group',
      danger: true,
      action: leaveGroup,
    });
  };

  const handleEditExpense = (expense) => {
    navigate(`/groups/${id}/expenses/${expense._id}/edit`);
  };

  const deleteExpense = async (expenseId) => {
    closeConfirm();
    setActionError('');
    try {
      await axiosInstance.delete(`/expenses/${expenseId}`);
      setExpenses((prev) => prev.filter((e) => e._id !== expenseId));
      fetchBalancesAndSuggestions();
    } catch (err) {
      setActionError('Failed to delete expense');
    }
  };

  const handleDeleteExpense = (expenseId) => {
    const target = expenses.find((e) => e._id === expenseId);
    setConfirm({
      title: 'Delete this expense?',
      message: target
        ? `"${target.description}" will be removed and everyone's balance recalculated.`
        : "It will be removed and everyone's balance recalculated.",
      confirmLabel: 'Delete expense',
      danger: true,
      action: () => deleteExpense(expenseId),
    });
  };

  const triggerSettleUp = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setIsSettleOpen(true);
  };

  // Free-form payment: no suggestion, the user picks who they paid and how much.
  const openRecordPayment = () => {
    setSelectedSuggestion(null);
    setIsSettleOpen(true);
  };

  const handleSettleSuccess = () => {
    fetchBalancesAndSuggestions();
  };

  const handleRemind = async (suggestion) => {
    const debtorId = suggestion.fromUser._id;
    setActionError('');
    setActionNotice('');
    setRemindingId(debtorId);
    try {
      const response = await axiosInstance.post(`/groups/${id}/remind/${debtorId}`);
      setActionNotice(response.data.message);
      setTimeout(() => setActionNotice(''), 4000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to send reminder');
    } finally {
      setRemindingId(null);
    }
  };

  const memberCount = group.members?.length || 0;
  const myBalance = balances.find((b) => b.userId === user?._id);
  const tabs = [
    { key: 'expenses', label: 'Expenses' },
    { key: 'balances', label: 'Balances' },
    { key: 'activity', label: 'Activity' },
    { key: 'members', label: `Members (${memberCount})` },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" />
        All groups
      </Link>

      <header className="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {group.name}
          </h1>
          {group.description && (
            <p className="mt-1 max-w-xl text-sm text-muted">{group.description}</p>
          )}
          <p className="mt-1 text-xs text-muted">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
            <span className="mx-1.5 text-faint">·</span>
            amounts in {group.currency || currencyCode}
          </p>
          {myBalance && (
            <p className="mt-3">
              {myBalance.net > 0.01 ? (
                <span className="pill bg-accent-soft text-pos">
                  You get back <span className="tabular-nums">{formatCurrency(myBalance.net)}</span>
                </span>
              ) : myBalance.net < -0.01 ? (
                <span className="pill bg-neg-soft text-neg">
                  You owe <span className="tabular-nums">{formatCurrency(Math.abs(myBalance.net))}</span>
                </span>
              ) : (
                <span className="pill bg-sunken text-muted">You're settled up</span>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isViewer && (
            <Link to={`/groups/${id}/expenses/add`} className="btn btn-primary">
              <Plus className="h-4 w-4" />
              Add expense
            </Link>
          )}
          <button onClick={() => setIsInviteOpen(true)} className="btn btn-secondary">
            Invite
          </button>
          <Link to={`/groups/${id}/analytics`} className="btn btn-secondary">
            Spending
          </Link>
          <ExportButtons groupId={id} />
          {!isAdmin && (
            <button onClick={handleLeaveGroup} className="btn btn-ghost px-2.5 text-neg hover:bg-neg-soft hover:text-neg">
              Leave
            </button>
          )}
        </div>
      </header>

      {actionError && (
        <p role="alert" className="notice-error mt-5 flex items-start justify-between gap-3">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError('')}
            className="shrink-0 text-xs font-medium underline underline-offset-2"
          >
            Dismiss
          </button>
        </p>
      )}

      {actionNotice && (
        <p role="status" className="notice-ok mt-5">{actionNotice}</p>
      )}

      <div role="tablist" className="mt-6 flex gap-6 overflow-x-auto border-b border-line">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`-mb-px shrink-0 border-b-2 pb-2.5 text-sm transition-colors ${
              activeTab === tab.key
                ? 'border-ink font-medium text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-6">
        {activeTab === 'expenses' && (
          <ExpenseList
            expenses={expenses}
            members={group.members}
            currentUserId={user?._id}
            currentUserRole={memberRole}
            currency={group.currency}
            onEdit={handleEditExpense}
            onDelete={handleDeleteExpense}
          />
        )}

        {activeTab === 'balances' && (
          <div className="space-y-10">
            <div className="grid gap-8 md:grid-cols-2">
              <BalanceSummary balances={balances} currency={group.currency} />
              <SettleUpSuggestions
                suggestions={suggestions}
                currentUserId={user?._id}
                currency={group.currency}
                onSettle={triggerSettleUp}
                onRemind={handleRemind}
                remindingId={remindingId}
              />
            </div>

            <section>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-base font-semibold text-ink">Payments so far</h3>
                {memberCount > 1 && (
                  <button onClick={openRecordPayment} className="btn btn-secondary">
                    Record a payment
                  </button>
                )}
              </div>
              {settlements.length === 0 ? (
                <p className="panel mt-3 px-4 py-8 text-center text-sm text-muted">
                  No payments recorded yet.
                </p>
              ) : (
                <ul className="panel mt-3 max-h-72 divide-y divide-line overflow-y-auto">
                  {settlements.map((settle) => (
                    <li key={settle._id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate text-ink">
                          <span className="font-medium">{settle.fromUser?.name}</span>
                          {' paid '}
                          <span className="font-medium">{settle.toUser?.name}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {new Date(settle.settledAt).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                          <span className="mx-1.5 text-faint">·</span>
                          {METHOD_LABELS[settle.method] || settle.method}
                        </p>
                      </div>
                      <span className="shrink-0 font-medium tabular-nums text-ink">
                        {formatCurrency(settle.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {activeTab === 'activity' && (
          <ActivityFeed activity={activity} loading={activityLoading} currentUserId={user?._id} />
        )}

        {activeTab === 'members' && (
          <MemberList
            members={group.members}
            currentUserId={user?._id}
            currentUserRole={memberRole}
            groupId={group._id}
            onMembersUpdated={handleMembersUpdate}
          />
        )}

        {activeTab === 'settings' && (
          <div className="max-w-xl space-y-10">
            <section>
              <h3 className="font-display text-base font-semibold text-ink">Group details</h3>
              {!isAdmin && (
                <p className="mt-1 text-sm text-muted">Only admins can change these.</p>
              )}
              {editSuccess && <p role="status" className="notice-ok mt-3">Group updated.</p>}
              <form onSubmit={handleUpdateGroup} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="groupName" className="field-label">Name</label>
                  <input
                    id="groupName"
                    type="text"
                    disabled={!isAdmin}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor="groupDesc" className="field-label">Description</label>
                  <textarea
                    id="groupDesc"
                    disabled={!isAdmin}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows="3"
                    className="field resize-none"
                  />
                </div>
                {isAdmin && (
                  <button type="submit" disabled={editLoading} className="btn btn-primary">
                    {editLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save changes
                  </button>
                )}
              </form>
            </section>

            <section className="border-t border-line pt-8">
              <h3 className="font-display text-base font-semibold text-ink">Invite code</h3>
              <p className="mt-1 text-sm text-muted">
                Getting a new code stops the current code and link from working. Useful if the
                old one was shared with the wrong people.
              </p>
              <button
                onClick={handleRegenerateCode}
                disabled={!isAdmin}
                className="btn btn-secondary mt-3"
              >
                Regenerate code
              </button>
            </section>

            <section className="border-t border-line pt-8">
              <h3 className="font-display text-base font-semibold text-ink">Delete group</h3>
              <p className="mt-1 text-sm text-muted">
                Removes the group for everyone, including all expenses and payment history. This
                cannot be undone.
              </p>
              <button
                onClick={handleDeleteGroup}
                disabled={!isAdmin}
                className="btn btn-danger mt-3"
              >
                Delete group
              </button>
            </section>
          </div>
        )}
      </div>

      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        inviteCode={group.inviteCode}
        groupName={group.name}
      />

      {/* Mounted only while open so each opening starts with fresh values */}
      {isSettleOpen && (
        <SettleModal
          isOpen
          onClose={() => setIsSettleOpen(false)}
          suggestion={selectedSuggestion}
          members={group.members}
          currentUserId={user?._id}
          groupId={group._id}
          currency={group.currency}
          onSuccess={handleSettleSuccess}
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        onConfirm={() => confirm?.action()}
        onCancel={closeConfirm}
      />
    </div>
  );
};

export default GroupDetail;
