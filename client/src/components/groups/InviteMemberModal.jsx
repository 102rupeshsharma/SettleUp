import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { Copy, Check } from 'lucide-react';

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

  const CopyButton = ({ copied, onClick, label }) => (
    <button type="button" onClick={onClick} className="btn btn-secondary shrink-0" aria-label={label}>
      {copied ? <Check className="h-4 w-4 text-pos" /> : <Copy className="h-4 w-4" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );

  return (
    <Modal title={`Invite people to ${groupName}`} onClose={onClose}>
      <p className="mt-1.5 text-sm text-muted">
        Send the link, or share the code so they can enter it on their groups page.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="inviteLink" className="field-label">Invite link</label>
          <div className="flex items-center gap-2">
            <input
              id="inviteLink"
              type="text"
              readOnly
              value={joinLink}
              onFocus={(e) => e.target.select()}
              className="field"
            />
            <CopyButton
              copied={copiedLink}
              onClick={() => copyToClipboard(joinLink, setCopiedLink)}
              label="Copy invite link"
            />
          </div>
        </div>

        <div>
          <span className="field-label">Invite code</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border border-line bg-sunken px-3 py-2 font-mono text-base tracking-[0.25em] text-ink select-all">
              {inviteCode}
            </div>
            <CopyButton
              copied={copiedCode}
              onClick={() => copyToClipboard(inviteCode, setCopiedCode)}
              label="Copy invite code"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={onClose} className="btn btn-secondary">
          Done
        </button>
      </div>
    </Modal>
  );
};

export default InviteMemberModal;
