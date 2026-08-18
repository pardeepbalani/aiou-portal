import React from 'react';
import { AlertTriangle, Trash2, X, Check } from 'lucide-react';

interface DeleteDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
}

export default function DeleteDemoModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}: DeleteDemoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        id="delete-demo-modal-dialog"
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-100 overflow-hidden transform transition-all"
      >
        {/* Header */}
        <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <Trash2 size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Delete Demo Student Records</h3>
              <p className="text-xs text-rose-700 font-medium">Clear pre-populated sample and test data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-200">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              This action will permanently delete all <strong>pre-populated demo students</strong> and <strong>sample degree records</strong> from your device storage and Cloud Firestore.
            </p>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            Your real, manually created student records, payments, exams, quizzes, research projects, and workshop candidates will <strong className="text-gray-900">remain safe and unaffected</strong>.
          </p>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-delete-demo-btn"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Deleting Demo Records...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Yes, Delete Demo Records</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
