import React, { useEffect, useState, useRef } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useSocket } from '../../context/SocketContext';
import { Bell, Check, MailOpen } from 'lucide-react';

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

    return () => {
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
        className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-white transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white ring-2 ring-white dark:ring-slate-950">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 p-4 shadow-2xl dark:shadow-none z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-2 mb-3">
            <h4 className="text-xs font-bold text-slate-850 dark:text-slate-300 uppercase tracking-wider">
              Notifications
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-0.5"
              >
                <Check className="h-3 w-3" />
                Clear All
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <MailOpen className="h-6 w-6 text-slate-400 dark:text-slate-700" />
                No unread notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/80 transition-colors text-xs border border-slate-200 dark:border-slate-900/60"
                >
                  <p className="text-slate-650 dark:text-slate-300 leading-relaxed flex-grow">{n.message}</p>
                  <button
                    onClick={(e) => handleMarkRead(n._id, e)}
                    className="p-1 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
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
