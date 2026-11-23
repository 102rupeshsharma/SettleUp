import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';
import { Loader2 } from 'lucide-react';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY'];

const CreateGroupModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Until the user picks one, follow their profile default.
  const selectedCurrency = currency || user?.defaultCurrency || 'INR';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/groups', {
        name,
        description,
        currency: selectedCurrency,
      });
      onSuccess(response.data);
      setName('');
      setDescription('');
      setCurrency('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="New group" onClose={onClose}>
      {error && (
        <p role="alert" className="notice-error mt-4">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="groupName" className="field-label">Name</label>
          <input
            id="groupName"
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field"
            placeholder="Flat 4B, Goa trip, Friday football"
          />
        </div>

        <div>
          <label htmlFor="groupDesc" className="field-label">
            Description <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="groupDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="2"
            className="field resize-none"
          />
        </div>

        <div>
          <label htmlFor="groupCurrency" className="field-label">Currency</label>
          <select
            id="groupCurrency"
            value={selectedCurrency}
            onChange={(e) => setCurrency(e.target.value)}
            className="field"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-muted">
            Every expense in this group is recorded in this currency.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create group'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateGroupModal;
