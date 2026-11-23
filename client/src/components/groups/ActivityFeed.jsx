import React from 'react';
import Avatar from '../ui/Avatar';

const timeAgo = (value) => {
  const then = new Date(value);
  const minutes = Math.round((Date.now() - then.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const ActivityFeed = ({ activity, loading, currentUserId }) => {
  if (loading && activity.length === 0) {
    return <p className="panel px-4 py-8 text-center text-sm text-muted">Loading activity...</p>;
  }

  if (activity.length === 0) {
    return (
      <div className="panel px-4 py-12 text-center">
        <p className="text-sm font-medium text-ink">Nothing has happened here yet.</p>
        <p className="mt-1 text-sm text-muted">
          Expenses, payments and member changes will be listed here as they happen.
        </p>
      </div>
    );
  }

  return (
    <ul className="panel divide-y divide-line">
      {activity.map((item) => {
        const actorName = item.actor?._id === currentUserId ? 'You' : item.actor?.name || 'Someone';
        return (
          <li key={item._id} className="flex items-start gap-3 px-4 py-3">
            <Avatar name={item.actor?.name} src={item.actor?.avatar} size="sm" className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink">
                <span className="font-medium">{actorName}</span> {item.summary}
              </p>
              <p className="mt-0.5 text-xs text-muted" title={new Date(item.createdAt).toLocaleString()}>
                {timeAgo(item.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default ActivityFeed;
