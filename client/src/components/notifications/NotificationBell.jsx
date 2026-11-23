import React, { useEffect, useState, useRef } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useSocket } from '../../context/SocketContext';
import { Bell, Check } from 'lucide-react';

const NotificationBell = () => {
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get('/notifications?unread=true');
      setNotifications(response.data);
      setUnreadCount(response.data.length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleSocketNotification = () => {
      fetchNotifications();
    };

    socket.on('expense:added', handleSocketNotification);
    socket.on('expense:updated', handleSocketNotification);
    socket.on('expense:deleted', handleSocketNotification);
    socket.on('settlement:made', handleSocketNotification);
    socket.on('member:role-changed', handleSocketNotification);

    // Reminders aren't pushed over the socket, so also pick them up whenever
    // the user comes back to the tab.
    window.addEventListener('focus', handleSocketNotification);

    return () => {
      window.removeEventListener('focus', handleSocketNotification);
      socket.off('expense:added', handleSocketNotification);
      socket.off('expense:updated', handleSocketNotification);
      socket.off('expense:deleted', handleSocketNotification);
      socket.off('settlement:made', handleSocketNotification);
      socket.off('member:role-changed', handleSocketNotification);
    };
  }, [socket]);

  const handleMarkAllRead = async () => {
    try {
      await axiosInstance.put('/notifications/read-all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await axiosInstance.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative rounded-md p-2 text-muted transition-colors hover:bg-sunken hover:text-ink"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-neg px-1 text-[10px] font-semibold text-on-neg">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="anim-pop absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-line bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h4 className="text-sm font-semibold text-ink">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-muted underline-offset-2 hover:text-ink hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 divide-y divide-line overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">You're all caught up.</p>
            ) : (
              notifications.map((n) => (
                <div key={n._id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <p className="flex-grow text-sm leading-snug text-ink">{n.message}</p>
                  <button
                    onClick={(e) => handleMarkRead(n._id, e)}
                    className="shrink-0 rounded p-1 text-faint transition-colors hover:bg-sunken hover:text-ink"
                    title="Mark as read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
