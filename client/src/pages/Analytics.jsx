import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import Loading from '../components/Loading';
import { ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChevronLeft } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';

const CATEGORY_LABELS = {
  food: 'Food',
  travel: 'Travel',
  rent: 'Rent',
  utilities: 'Utilities',
  entertainment: 'Entertainment',
  other: 'Other',
};

// "2026-11" -> "Nov 26"
const formatMonth = (value) => {
  const [year, month] = String(value).split('-').map(Number);
  if (!year || !month) return value;
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
};

const Analytics = () => {
  const { groupId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupCurrency, setGroupCurrency] = useState('');
  const [categoryData, setCategoryData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const { formatCurrency } = useCurrency(groupCurrency || undefined);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const groupRes = await axiosInstance.get(`/groups/${groupId}`);
        setGroupName(groupRes.data.name);
        setGroupCurrency(groupRes.data.currency || '');

        const breakdownRes = await axiosInstance.get(`/groups/${groupId}/analytics/category-breakdown`);
        setCategoryData(breakdownRes.data);

        const trendRes = await axiosInstance.get(`/groups/${groupId}/analytics/monthly-trend`);
        setTrendData(trendRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [groupId]);

  if (loading) {
    return <Loading />;
  }

  const totalSpent = categoryData.reduce((sum, item) => sum + item.total, 0);
  const sortedCategories = [...categoryData].sort((a, b) => b.total - a.total);
  const largest = sortedCategories[0]?.total || 0;

  const tooltipStyle = {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: '6px',
    color: 'var(--ink)',
    fontSize: '12px',
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        to={`/groups/${groupId}`}
        className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" />
        {groupName || 'Back to group'}
      </Link>

      <header className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Spending
        </h1>
        <div className="sm:text-right">
          <p className="text-sm text-muted">Total spent by the group</p>
          <p className="font-display text-2xl font-semibold tabular-nums text-ink">
            {formatCurrency(totalSpent)}
          </p>
        </div>
      </header>

      {error && (
        <p role="alert" className="notice-error mt-5">{error}</p>
      )}

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <section>
          <h2 className="font-display text-base font-semibold text-ink">By category</h2>
          {sortedCategories.length === 0 ? (
            <p className="panel mt-3 px-4 py-12 text-center text-sm text-muted">
              No expenses recorded yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {sortedCategories.map((item) => {
                const share = totalSpent > 0 ? (item.total / totalSpent) * 100 : 0;
                const width = largest > 0 ? (item.total / largest) * 100 : 0;
                return (
                  <li key={item.category}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-ink">{CATEGORY_LABELS[item.category] || item.category}</span>
                      <span className="tabular-nums text-ink">
                        {formatCurrency(item.total)}
                        <span className="ml-2 text-xs text-muted">{share.toFixed(0)}%</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-sunken">
                      <div
                        className="h-2 rounded-full bg-accent"
                        style={{ width: `${Math.max(width, 2)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-display text-base font-semibold text-ink">Month by month</h2>
          {trendData.length === 0 ? (
            <p className="panel mt-3 px-4 py-12 text-center text-sm text-muted">
              No expenses recorded yet.
            </p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={formatMonth}
                    stroke="var(--line)"
                    tick={{ fill: 'var(--muted)', fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    width={48}
                    stroke="var(--line)"
                    tick={{ fill: 'var(--muted)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Spent']}
                    labelFormatter={formatMonth}
                    contentStyle={tooltipStyle}
                    cursor={{ stroke: 'var(--faint)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'var(--accent)', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Analytics;
