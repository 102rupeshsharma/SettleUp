import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import Loading from '../components/Loading';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChevronLeft, Loader2, BarChart2, DollarSign } from 'lucide-react';

const COLORS = {
  food: '#fbbf24',
  travel: '#38bdf8',
  rent: '#6366f1',
  utilities: '#2dd4bf',
  entertainment: '#fb7185',
  other: '#94a3b8',
};

const Analytics = () => {
  const { groupId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groupName, setGroupName] = useState('');
  const [categoryData, setCategoryData] = useState([]);
  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const groupRes = await axiosInstance.get(`/groups/${groupId}`);
        setGroupName(groupRes.data.name);

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 bg-transparent text-slate-800 dark:text-white space-y-6">
      <Link
        to={`/groups/${groupId}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Group
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
            Financial Analytics
          </h1>
          <p className="text-xs text-slate-550 dark:text-slate-500 mt-1">Group: {groupName}</p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/20 px-4 py-3 flex items-center gap-2 shadow-sm dark:shadow-none">
          <DollarSign className="h-5 w-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Total Group Spend</span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">${totalSpent.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-500 dark:text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/10 p-6 space-y-4 shadow-sm dark:shadow-none">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Category Breakdown</h3>
          {categoryData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">No expenses recorded yet.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.category] || COLORS.other} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value}`} contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/10 p-6 space-y-4 shadow-sm dark:shadow-none">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Monthly Spending Trend</h3>
          {trendData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">No expenses recorded yet.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '10px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                  <Tooltip formatter={(value) => `$${value}`} contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
                  <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
