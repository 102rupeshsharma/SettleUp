import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import SplitEditor from '../components/expenses/SplitEditor';
import ReceiptUpload from '../components/expenses/ReceiptUpload';
import Loading from '../components/Loading';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';

// Date -> "YYYY-MM-DD" in the user's own timezone, for <input type="date">.
const toInputDate = (value) => {
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

const AddExpense = () => {
  const { groupId, expenseId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const { currencySymbol } = useCurrency(group?.currency);
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
  const [date, setDate] = useState(() => toInputDate(new Date()));

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
            setSplits(expense.splits.map((s) => ({ userId: s.userId._id || s.userId, amount: s.amount, percentage: s.percentage || 0, shares: s.shares || 0 })));
            setDate(toInputDate(expense.date || expense.createdAt));
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
    } else if (splitType === 'shares') {
      const sum = splits.reduce((acc, s) => acc + (s.shares || 0), 0);
      if (sum <= 0) {
        setError('Give at least one person a share');
        return;
      }
    }

    // Noon local time keeps the chosen calendar day the same in every timezone.
    const spentOn = date ? new Date(`${date}T12:00:00`) : null;
    const payload = {
      description,
      amount: parsedAmt,
      category,
      paidBy,
      splitType,
      splits,
      ...(spentOn && !isNaN(spentOn.getTime()) ? { date: spentOn.toISOString() } : {}),
    };

    setSubmitLoading(true);
    try {
      let expenseRes;
      if (isEdit) {
        expenseRes = await axiosInstance.put(`/expenses/${expenseId}`, payload);
      } else {
        expenseRes = await axiosInstance.post(`/groups/${groupId}/expenses`, payload);
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
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <Link
        to={`/groups/${groupId}`}
        className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" />
        {group?.name || 'Back to group'}
      </Link>

      <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
        {isEdit ? 'Edit expense' : 'Add an expense'}
      </h1>

      {error && (
        <p role="alert" className="notice-error mt-5">{error}</p>
      )}

      {group && (
        <form onSubmit={handleFormSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="expenseDesc" className="field-label">What was it for?</label>
            <input
              id="expenseDesc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field"
              placeholder="Groceries, cab to the airport, electricity bill"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="expenseAmt" className="field-label">Amount</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">
                  {currencySymbol}
                </span>
                <input
                  id="expenseAmt"
                  type="number"
                  step="0.01"
                  min="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="field pl-9 tabular-nums"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label htmlFor="expenseCat" className="field-label">Category</label>
              <select
                id="expenseCat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="field"
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
              <label htmlFor="expensePaidBy" className="field-label">Paid by</label>
              <select
                id="expensePaidBy"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="field"
              >
                {group.members.map((m) => (
                  <option key={m.userId._id} value={m.userId._id}>
                    {m.userId.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="expenseSplit" className="field-label">Split</label>
              <select
                id="expenseSplit"
                value={splitType}
                onChange={(e) => setSplitType(e.target.value)}
                className="field"
              >
                <option value="equal">Equally</option>
                <option value="exact">By exact amounts</option>
                <option value="percentage">By percentage</option>
                <option value="shares">By shares</option>
              </select>
            </div>
          </div>

          <div className="sm:max-w-[calc(50%-0.5rem)]">
            <label htmlFor="expenseDate" className="field-label">Date</label>
            <input
              id="expenseDate"
              type="date"
              value={date}
              max={toInputDate(new Date())}
              onChange={(e) => setDate(e.target.value)}
              className="field"
            />
          </div>

          <SplitEditor
            members={group.members}
            amount={amount}
            splitType={splitType}
            splits={splits}
            currency={group.currency}
            onChange={setSplits}
          />

          <ReceiptUpload file={file} setFile={setFile} />

          <div className="flex justify-end gap-2 border-t border-line pt-5">
            <Link to={`/groups/${groupId}`} className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={submitLoading} className="btn btn-primary">
              {submitLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                'Save changes'
              ) : (
                'Add expense'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddExpense;
