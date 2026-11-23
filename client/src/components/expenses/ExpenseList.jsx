import React, { useState } from 'react';
import ExpenseCard from './ExpenseCard';
import { Search, SlidersHorizontal } from 'lucide-react';

// When the money was spent; older expenses only have createdAt.
const spentOn = (exp) => new Date(exp.date || exp.createdAt);

const monthLabel = (dateValue) =>
  dateValue.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

const idOf = (value) => (value && value._id ? value._id : value);

const ExpenseList = ({ expenses, members = [], currentUserId, currentUserRole, currency, onEdit, onDelete }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [payer, setPayer] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fromDate = from ? new Date(`${from}T00:00:00`) : null;
  const toDate = to ? new Date(`${to}T23:59:59.999`) : null;

  const filteredExpenses = expenses
    .filter((exp) => {
      const matchesSearch = exp.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category ? exp.category === category : true;
      const matchesPayer = payer ? idOf(exp.paidBy) === payer : true;
      const when = spentOn(exp);
      const matchesFrom = fromDate ? when >= fromDate : true;
      const matchesTo = toDate ? when <= toDate : true;
      const involvesMe =
        idOf(exp.paidBy) === currentUserId ||
        exp.splits.some((s) => idOf(s.userId) === currentUserId && s.amount > 0);
      return (
        matchesSearch &&
        matchesCategory &&
        matchesPayer &&
        matchesFrom &&
        matchesTo &&
        (onlyMine ? involvesMe : true)
      );
    })
    .sort((a, b) => spentOn(b) - spentOn(a));

  // Start a new section whenever the month changes.
  const sections = [];
  filteredExpenses.forEach((exp) => {
    const label = monthLabel(spentOn(exp));
    const last = sections[sections.length - 1];
    if (last && last.label === label) {
      last.items.push(exp);
    } else {
      sections.push({ label, items: [exp] });
    }
  });

  const extraFilterCount = [payer, onlyMine, from, to].filter(Boolean).length;
  const isFiltering = search !== '' || category !== '' || extraFilterCount > 0;

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setPayer('');
    setOnlyMine(false);
    setFrom('');
    setTo('');
  };

  return (
    <div className="space-y-5">
      {expenses.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-grow">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint" />
              <input
                type="text"
                placeholder="Search expenses"
                aria-label="Search expenses"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="field pl-9"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
              className="field sm:w-44"
            >
              <option value="">All categories</option>
              <option value="food">Food</option>
              <option value="travel">Travel</option>
              <option value="rent">Rent</option>
              <option value="utilities">Utilities</option>
              <option value="entertainment">Entertainment</option>
              <option value="other">Other</option>
            </select>
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              aria-expanded={showMore}
              className="btn btn-secondary"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters{extraFilterCount > 0 ? ` (${extraFilterCount})` : ''}
            </button>
          </div>

          {showMore && (
            <div className="grid gap-3 rounded-md border border-line p-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="filterPayer" className="mb-1 block text-xs text-muted">Paid by</label>
                <select
                  id="filterPayer"
                  value={payer}
                  onChange={(e) => setPayer(e.target.value)}
                  className="field"
                >
                  <option value="">Anyone</option>
                  {members.map((m) =>
                    m.userId ? (
                      <option key={m.userId._id} value={m.userId._id}>
                        {m.userId._id === currentUserId ? 'You' : m.userId.name}
                      </option>
                    ) : null
                  )}
                </select>
              </div>
              <div>
                <label htmlFor="filterFrom" className="mb-1 block text-xs text-muted">From</label>
                <input
                  id="filterFrom"
                  type="date"
                  value={from}
                  max={to || undefined}
                  onChange={(e) => setFrom(e.target.value)}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="filterTo" className="mb-1 block text-xs text-muted">To</label>
                <input
                  id="filterTo"
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(e) => setTo(e.target.value)}
                  className="field"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 self-end pb-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={onlyMine}
                  onChange={(e) => setOnlyMine(e.target.checked)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Only ones involving me
              </label>
            </div>
          )}
        </div>
      )}

      {filteredExpenses.length === 0 ? (
        <div className="panel px-4 py-12 text-center">
          <p className="text-sm font-medium text-ink">
            {isFiltering ? 'Nothing matches those filters.' : 'No expenses yet.'}
          </p>
          <p className="mt-1 text-sm text-muted">
            {isFiltering
              ? 'Try a different word, category or date range.'
              : 'Add the first one and the balances will appear here.'}
          </p>
          {isFiltering && (
            <button type="button" onClick={clearFilters} className="btn btn-secondary mt-4">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        sections.map((section) => (
          <section key={section.label}>
            <h4 className="mb-2 text-xs font-medium text-muted">{section.label}</h4>
            <ul className="panel divide-y divide-line">
              {section.items.map((exp) => (
                <ExpenseCard
                  key={exp._id}
                  expense={exp}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  currency={currency}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
};

export default ExpenseList;
