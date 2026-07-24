import React, { useState } from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  confirmVariant = "danger", // 'danger' | 'primary'
  requireReason = false,
  reasonPlaceholder = "Please specify the reason..."
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError('A reason is mandatory for this action.');
      return;
    }
    setError('');
    onConfirm(reason);
    setReason('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>{message}</div>
        </div>

        {requireReason && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setError('');
              }}
              placeholder={reasonPlaceholder}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 focus:outline-none"
            />
            {error && <p className="text-xs font-medium text-rose-600 mt-1">{error}</p>}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-md transition-smooth ${
              confirmVariant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
