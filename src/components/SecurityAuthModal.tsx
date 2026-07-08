import React, { useState } from 'react';
import { ShieldAlert, Eye, EyeOff, Lock, X } from 'lucide-react';

interface SecurityAuthModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  theme: 'green' | 'blue';
}

export default function SecurityAuthModal({
  isOpen,
  title = 'Authenticity Verification Required',
  message,
  onConfirm,
  onCancel,
  theme,
}: SecurityAuthModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isGreen = theme === 'green';

  const handleVerifyAndConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);

    try {
      // Validate against stored passwords
      const storedAdminPwd = localStorage.getItem('aiou_pwd_admin') || 'admin123';
      const storedAiouPwd = localStorage.getItem('aiou_pwd_aiou') || 'aiou123';

      if (password === storedAdminPwd || password === storedAiouPwd) {
        // Authenticated! Trigger action
        await onConfirm();
        setPassword('');
        setError('');
      } else {
        setError('Invalid authenticity permission password. Access Denied.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-gray-250 shadow-xl overflow-hidden transition-all transform scale-100">
        
        {/* Header decoration bar */}
        <div className={`h-1.5 w-full ${isGreen ? 'bg-red-500' : 'bg-red-500'}`} />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="p-6">
          {/* Icon and Title */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl shrink-0">
              <ShieldAlert size={24} className="animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                {title}
              </h3>
              <p className="text-xs text-gray-500 mt-1 font-semibold uppercase tracking-wider">
                Delete Authorization Required
              </p>
            </div>
          </div>

          {/* Action Message Warning */}
          <div className="mt-4 p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-sm text-gray-700 leading-relaxed font-medium">
            {message}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold flex items-center gap-1.5">
              <Lock size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Password Input Form */}
          <form onSubmit={handleVerifyAndConfirm} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                Authenticity Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password to authorize"
                  className={`w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:bg-white transition-all ${
                    isGreen
                      ? 'focus:ring-emerald-500/20 focus:border-emerald-500'
                      : 'focus:ring-sky-500/20 focus:border-sky-500'
                  }`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 cursor-pointer transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex-1 py-2.5 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:brightness-95 transition-all ${
                  isGreen ? 'bg-red-600 shadow-red-100' : 'bg-red-600 shadow-red-100'
                }`}
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Authorize Delete'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
