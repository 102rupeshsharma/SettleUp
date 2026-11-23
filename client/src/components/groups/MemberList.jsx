import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import Avatar from '../ui/Avatar';
import ConfirmDialog from '../ui/ConfirmDialog';
import { Loader2 } from 'lucide-react';

const ROLE_LABELS = { admin: 'Admin', member: 'Member', viewer: 'Viewer' };

const MemberList = ({ members, currentUserId, currentUserRole, groupId, onMembersUpdated }) => {
  const [loadingMemberId, setLoadingMemberId] = useState(null);
  const [error, setError] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState(null);

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
    setPendingRemoval(null);
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

  const removingSelf = pendingRemoval?.id === currentUserId;

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="notice-error">{error}</p>
      )}

      <ul className="panel divide-y divide-line">
        {members.map((member) => {
          const userObj = member.userId;
          if (!userObj) return null;
          const isSelf = userObj._id === currentUserId;

          return (
            <li key={userObj._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={userObj.name} src={userObj.avatar} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {userObj.name}
                    {isSelf && <span className="font-normal text-muted"> (you)</span>}
                  </p>
                  <p className="truncate text-xs text-muted">{userObj.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {loadingMemberId === userObj._id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-faint" />
                ) : (
                  <>
                    {isAdmin && !isSelf ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(userObj._id, e.target.value)}
                        aria-label={`Role for ${userObj.name}`}
                        className="field w-auto py-1.5 text-xs"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="text-xs text-muted">{ROLE_LABELS[member.role] || member.role}</span>
                    )}

                    {(isAdmin || isSelf) && (
                      <button
                        onClick={() => setPendingRemoval({ id: userObj._id, name: userObj.name })}
                        className="rounded-md px-2 py-1.5 text-xs font-medium text-neg transition-colors hover:bg-neg-soft"
                        title={isSelf ? 'Leave Group' : 'Remove Member'}
                      >
                        {isSelf ? 'Leave' : 'Remove'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={!!pendingRemoval}
        title={removingSelf ? 'Leave this group?' : `Remove ${pendingRemoval?.name}?`}
        message={
          removingSelf
            ? "You'll lose access to this group's expenses and balances. You can rejoin with an invite code."
            : "They'll lose access to this group. Their past expenses stay in the ledger."
        }
        confirmLabel={removingSelf ? 'Leave group' : 'Remove'}
        danger
        onConfirm={() => handleRemoveMember(pendingRemoval.id)}
        onCancel={() => setPendingRemoval(null)}
      />
    </div>
  );
};

export default MemberList;
