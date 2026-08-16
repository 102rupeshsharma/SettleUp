import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { User, Shield, Trash2, Loader2 } from 'lucide-react';

const MemberList = ({ members, currentUserId, currentUserRole, groupId, onMembersUpdated }) => {
  const [loadingMemberId, setLoadingMemberId] = useState(null);
  const [error, setError] = useState('');

  const isAdmin = currentUserRole === 'admin';

  const handleRoleChange = async (userId, newRole) => {
    setError('');
    setLoadingMemberId(userId);
    try {
      await axiosInstance.put(`/groups/${groupId}/members/${userId}/role`, {
        role: newRole,
      });
      onMembersUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update member role');
    } finally {
      setLoadingMemberId(null);
    }
  };

  const handleRemoveMember = async (userId) => {
    const confirmMessage = userId === currentUserId
      ? 'Are you sure you want to leave this group?'
      : 'Are you sure you want to remove this member from the group?';

    if (!window.confirm(confirmMessage)) return;

    setError('');
    setLoadingMemberId(userId);
    try {
      await axiosInstance.delete(`/groups/${groupId}/members/${userId}`);
      onMembersUpdated(userId === currentUserId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setLoadingMemberId(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/10 shadow-sm dark:shadow-none">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
            {members.map((member) => {
              const userObj = member.userId;
              if (!userObj) return null;
              const isSelf = userObj._id === currentUserId;

              return (
                <tr key={userObj._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    {userObj.avatar ? (
                      <img
                        src={userObj.avatar}
                        alt={userObj.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {userObj.name} {isSelf && <span className="text-xs text-slate-550 dark:text-slate-400 font-normal">(You)</span>}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{userObj.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {member.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                          <Shield className="h-3 w-3" />
                          Admin
                        </span>
                      ) : member.role === 'member' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-1 text-xs font-bold text-sky-400 ring-1 ring-sky-500/20">
                          Member
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-500/10 px-2 py-1 text-xs font-bold text-slate-400 ring-1 ring-slate-500/20">
                          Viewer
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {loadingMemberId === userObj._id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                      ) : (
                        <>
                          {isAdmin && !isSelf && (
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(userObj._id, e.target.value)}
                              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          )}

                          {(isAdmin || isSelf) && (
                            <button
                              onClick={() => handleRemoveMember(userObj._id)}
                              className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                              title={isSelf ? 'Leave Group' : 'Remove Member'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberList;
