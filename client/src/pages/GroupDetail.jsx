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
import { Users, CreditCard, Settings, ChevronLeft, UserPlus, Trash2, ShieldAlert, Loader2, RefreshCw, LogOut, Plus, Coins, Receipt, BarChart2 } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  if (error || !group) {
    return (
      <div className="mx-auto max-w-md mt-20 p-6 text-center space-y-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Error Loading Group</h2>
        <p className="text-slate-400 text-sm">{error || 'Group not found.'}</p>
        <Link to="/dashboard" className="inline-block bg-emerald-500 text-slate-950 px-4 py-2 rounded-lg font-semibold text-sm">
          Back to Dashboard
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

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    setError('');
    setEditSuccess(false);

    if (!editName.trim()) {
      setError('Group name is required');
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
      setError(err.response?.data?.message || 'Failed to update group');
    } finally {
      setEditLoading(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!window.confirm('Are you sure you want to regenerate the invite code? The old code will stop working.')) return;
    try {
      const response = await axiosInstance.post(`/groups/${id}/invite`);
      setGroup((prev) => ({
        ...prev,
        inviteCode: response.data.inviteCode,
      }));
    } catch (err) {
      setError('Failed to regenerate invite code');
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('WARNING: Are you sure you want to delete this group? This action is permanent.')) return;
    try {
      await axiosInstance.delete(`/groups/${id}`);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to delete group');
    }
  };

  const handleMembersUpdate = (hasLeft = false) => {
    if (hasLeft) {
      navigate('/dashboard');
    } else {
      fetchGroupDetails();
    }
  };

  const handleEditExpense = (expense) => {
    navigate(`/groups/${id}/expenses/${expense._id}/edit`);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await axiosInstance.delete(`/expenses/${expenseId}`);
      setExpenses((prev) => prev.filter((e) => e._id !== expenseId));
      fetchBalancesAndSuggestions();
    } catch (err) {
      setError('Failed to delete expense');
    }
  };

  const triggerSettleUp = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setIsSettleOpen(true);
  };

  const handleSettleSuccess = () => {
    fetchBalancesAndSuggestions();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-transparent text-slate-800 dark:text-white space-y-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/30 backdrop-blur-sm shadow-sm dark:shadow-none">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {group.name}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl">
            {group.description || 'No description provided.'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to={`/groups/${id}/analytics`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-650 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <BarChart2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            Analytics
          </Link>
          <ExportButtons groupId={id} />
          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Invite Code
          </button>
          {!isAdmin && (
            <button
              onClick={() => handleMembersUpdate(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 px-4 py-2.5 text-sm font-semibold text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Leave Group
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-900">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-bold transition-colors ${activeTab === 'expenses'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
        >
          <CreditCard className="h-4 w-4" />
          Expenses
        </button>
        <button
          onClick={() => setActiveTab('balances')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-bold transition-colors ${activeTab === 'balances'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
        >
          <Coins className="h-4 w-4" />
          Balances & Settlements
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-bold transition-colors ${activeTab === 'members'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
        >
          <Users className="h-4 w-4" />
          Members
          <span className="rounded-full bg-slate-100 dark:bg-slate-900 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-500">
            {group.members?.length || 0}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-bold transition-colors ${activeTab === 'settings'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>

      <div className="pt-4">
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Expenses Log</h3>
              {!isViewer && (
                <Link
                  to={`/groups/${id}/expenses/add`}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Expense
                </Link>
              )}
            </div>

            <ExpenseList
              expenses={expenses}
              currentUserId={user?._id}
              currentUserRole={memberRole}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
            />
          </div>
        )}

        {activeTab === 'balances' && (
          <div className="space-y-8">
            <div className="grid gap-8 md:grid-cols-2">
              <BalanceSummary balances={balances} />
              <SettleUpSuggestions
                suggestions={suggestions}
                currentUserId={user?._id}
                onSettle={triggerSettleUp}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                Settlements History (Ledger)
              </h3>
              {settlements.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/10 shadow-sm dark:shadow-none">
                  No settlements recorded yet.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/10 shadow-sm dark:shadow-none">
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-900">
                    {settlements.map((settle) => (
                      <div key={settle._id} className="flex justify-between items-center p-4 text-xs hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                        <div className="text-slate-600 dark:text-slate-300">
                          <span className="font-bold text-slate-800 dark:text-slate-100">{settle.fromUser?.name}</span>
                          {' paid '}
                          <span className="font-bold text-slate-800 dark:text-slate-100">{settle.toUser?.name}</span>
                          {' via '}
                          <span className="capitalize text-slate-500 dark:text-slate-400 font-semibold">{settle.method}</span>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block">{formatCurrency(settle.amount)}</span>
                          <span className="text-[10px] text-slate-500 block">
                            {new Date(settle.settledAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
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
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/10 p-6 space-y-6 shadow-sm dark:shadow-none">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Update Group Details</h3>
              {editSuccess && (
                <div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
                  Group updated successfully!
                </div>
              )}
              <form onSubmit={handleUpdateGroup} className="space-y-4">
                <div>
                  <label htmlFor="groupName" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Group Name
                  </label>
                  <input
                    id="groupName"
                    type="text"
                    disabled={!isAdmin}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1.5 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label htmlFor="groupDesc" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    id="groupDesc"
                    disabled={!isAdmin}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows="3"
                    className="mt-1.5 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none resize-none disabled:opacity-50"
                  />
                </div>
                {isAdmin ? (
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 transition-colors"
                  >
                    {editLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Changes
                  </button>
                ) : (
                  <p className="text-xs text-slate-550 dark:text-slate-500">
                    * Admin permissions are required to modify these fields.
                  </p>
                )}
              </form>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/10 p-6 space-y-6 shadow-sm dark:shadow-none">
              <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100">Danger Zone</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/40 space-y-2">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Regenerate Invite Code</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Forces regeneration of the invite code. The existing invite code will instantly become invalid.
                  </p>
                  <button
                    onClick={handleRegenerateCode}
                    disabled={!isAdmin}
                    className="mt-2 flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-3.5 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-900 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Regenerate Code
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-rose-200/50 dark:border-rose-905/20 bg-rose-50/50 dark:bg-rose-950/5 space-y-2">
                  <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400">Delete This Group</h4>
                  <p className="text-xs text-rose-500/70">
                    Permanently deletes this group, all memberships, and ledger transaction histories. This cannot be undone.
                  </p>
                  <button
                    onClick={handleDeleteGroup}
                    disabled={!isAdmin}
                    className="mt-2 flex items-center gap-1.5 rounded-lg bg-rose-550 dark:bg-rose-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-rose-400 disabled:opacity-50 transition-colors text-slate-950"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Group
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        inviteCode={group.inviteCode}
        groupName={group.name}
      />

      <SettleModal
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        suggestion={selectedSuggestion}
        groupId={group._id}
        onSuccess={handleSettleSuccess}
      />
    </div>
  );
};

export default GroupDetail;
