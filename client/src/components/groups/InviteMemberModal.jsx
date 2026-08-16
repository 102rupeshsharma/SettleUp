import React, { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';

const InviteMemberModal = ({ isOpen, onClose, inviteCode, groupName }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const joinLink = `${window.location.origin}/groups/join/${inviteCode}`;

  const copyToClipboard = async (text, setCopiedState) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900 p-6 shadow-2xl dark:shadow-none animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Share2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
            Invite to {groupName}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
              Group Invite Code
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-center text-lg font-bold tracking-widest text-emerald-600 dark:text-emerald-400 select-all">
                {inviteCode}
              </div>
              <button
                onClick={() => copyToClipboard(inviteCode, setCopiedCode)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                {copiedCode ? <Check className="h-5 w-5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
              Direct Invitation Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={joinLink}
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(joinLink, setCopiedLink)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                {copiedLink ? <Check className="h-5 w-5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Members can paste the invite code on their dashboard, or click the direct invitation link to join this group.
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 py-2.5 text-sm font-semibold text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteMemberModal;
