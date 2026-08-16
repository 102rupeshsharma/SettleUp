import React, { useState } from 'react';
import ExpenseCard from './ExpenseCard';
import { Search, Filter } from 'lucide-react';

const ExpenseList = ({ expenses, currentUserId, currentUserRole, onEdit, onDelete }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category ? exp.category === category : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search expenses by description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-9 pr-4 text-xs text-slate-850 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
            <Filter className="h-4 w-4" />
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-9 pr-4 text-xs text-slate-700 dark:text-slate-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="food">Food</option>
            <option value="travel">Travel</option>
            <option value="rent">Rent</option>
            <option value="utilities">Utilities</option>
            <option value="entertainment">Entertainment</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/10 text-slate-500 shadow-sm dark:shadow-none">
          <p className="font-semibold text-sm">No expenses found matching filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredExpenses.map((exp) => (
            <ExpenseCard
              key={exp._id}
              expense={exp}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
