import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import SplitEditor from '../components/expenses/SplitEditor';
import ReceiptUpload from '../components/expenses/ReceiptUpload';
import Loading from '../components/Loading';
import { ChevronLeft, Loader2, Save, AlertCircle } from 'lucide-react';

const AddExpense = () => {
  const { groupId, expenseId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [splits, setSplits] = useState([]);
  const [file, setFile] = useState(null);

  const isEdit = !!expenseId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const groupRes = await axiosInstance.get(`/groups/${groupId}`);
        setGroup(groupRes.data);
        if (groupRes.data.members?.length > 0) {
          setPaidBy(groupRes.data.members[0].userId._id);
        }

        if (isEdit) {
          const expensesRes = await axiosInstance.get(`/groups/${groupId}/expenses`);
          const expense = expensesRes.data.find((e) => e._id === expenseId);
          if (expense) {
            setDescription(expense.description);
            setAmount(expense.amount.toString());
            setCategory(expense.category);
            setPaidBy(expense.paidBy._id || expense.paidBy);
            setSplitType(expense.splitType);
            setSplits(expense.splits.map((s) => ({ userId: s.userId._id || s.userId, amount: s.amount, percentage: s.percentage || 0 })));
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [groupId, expenseId, isEdit]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setError('Please provide a valid amount greater than zero');
      return;
    }

    if (splitType === 'exact') {
      const sum = splits.reduce((acc, s) => acc + (s.amount || 0), 0);
      if (Math.abs(sum - parsedAmt) > 0.01) {
        setError('Sum of split amounts must match the total expense amount');
        return;
      }
    } else if (splitType === 'percentage') {
      const sum = splits.reduce((acc, s) => acc + (s.percentage || 0), 0);
      if (Math.abs(sum - 100) > 0.01) {
        setError('Sum of split percentages must equal 100%');
        return;
      }
    }

    setSubmitLoading(true);
    try {
      let expenseRes;
      if (isEdit) {
        expenseRes = await axiosInstance.put(`/expenses/${expenseId}`, {
          description,
          amount: parsedAmt,
          category,
          paidBy,
          splitType,
          splits,
        });
      } else {
        expenseRes = await axiosInstance.post(`/groups/${groupId}/expenses`, {
          description,
          amount: parsedAmt,
          category,
          paidBy,
          splitType,
          splits,
        });
      }

      if (file) {
        const savedExpense = expenseRes.data;
        const formData = new FormData();
        formData.append('receipt', file);
        await axiosInstance.post(`/expenses/${savedExpense._id}/receipt`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      navigate(`/groups/${groupId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 bg-transparent text-slate-800 dark:text-white space-y-6">
      <Link
        to={`/groups/${groupId}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-555 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Group
      </Link>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/30 p-6 shadow-xl dark:shadow-none backdrop-blur-sm space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {isEdit ? 'Edit Expense' : 'Add Expense'}
        </h1>

        {error && (
          <div className="flex items-center gap-2.5 rounded-lg bg-rose-500/10 p-4 text-sm text-rose-500 dark:text-rose-400 ring-1 ring-rose-500/20">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label htmlFor="expenseDesc" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Description
            </label>
            <input
              id="expenseDesc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none"
              placeholder="e.g. Dinner at Italian Bistro"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="expenseAmt" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Amount ($)
              </label>
              <input
                id="expenseAmt"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="expenseCat" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Category
              </label>
              <select
                id="expenseCat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="other">Other</option>
                <option value="food">Food</option>
                <option value="travel">Travel</option>
                <option value="rent">Rent</option>
                <option value="utilities">Utilities</option>
                <option value="entertainment">Entertainment</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="expensePaidBy" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Paid By
              </label>
              <select
                id="expensePaidBy"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                {group.members.map((m) => (
                  <option key={m.userId._id} value={m.userId._id}>
                    {m.userId.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="expenseSplit" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Split Type
              </label>
              <select
                id="expenseSplit"
                value={splitType}
                onChange={(e) => setSplitType(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="equal">Split Equally</option>
                <option value="exact">Split by Exact Amounts</option>
                <option value="percentage">Split by Percentages</option>
              </select>
            </div>
          </div>

          <ReceiptUpload file={file} setFile={setFile} />

          <SplitEditor
            members={group.members}
            amount={amount}
            splitType={splitType}
            splits={splits}
            onChange={setSplits}
          />

          <button
            type="submit"
            disabled={submitLoading}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 transition-colors"
          >
            {submitLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEdit ? 'Save Changes' : 'Add Expense'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;
