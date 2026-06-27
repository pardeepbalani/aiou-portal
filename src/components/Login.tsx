import React, { useState, useEffect } from 'react';
import { Lock, User, CheckCircle2, AlertCircle, ArrowLeft, KeyRound, Mail } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
  theme: 'green' | 'blue';
}

export default function Login({ onLoginSuccess, theme }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password forgot view state
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetUsername, setResetUsername] = useState('admin');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const isGreen = theme === 'green';

  // Make sure default passwords exist in localStorage
  useEffect(() => {
    if (!localStorage.getItem('aiou_pwd_admin')) {
      localStorage.setItem('aiou_pwd_admin', 'admin123');
    }
    if (!localStorage.getItem('aiou_pwd_aiou')) {
      localStorage.setItem('aiou_pwd_aiou', 'aiou123');
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const storedAdminPwd = localStorage.getItem('aiou_pwd_admin') || 'admin123';
      const storedAiouPwd = localStorage.getItem('aiou_pwd_aiou') || 'aiou123';

      const userLower = username.toLowerCase();
      if (
        (userLower === 'admin' && password === storedAdminPwd) ||
        (userLower === 'aiou' && password === storedAiouPwd)
      ) {
        onLoginSuccess();
      } else {
        setError('Invalid username or password.');
      }
      setLoading(false);
    }, 400);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccessMessage('');

    if (!recoveryEmail.trim()) {
      setResetError('Please enter your recovery email address.');
      return;
    }

    if (!newPassword.trim()) {
      setResetError('Please enter your new password.');
      return;
    }

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // Save new password in localStorage
      const storageKey = resetUsername === 'admin' ? 'aiou_pwd_admin' : 'aiou_pwd_aiou';
      localStorage.setItem(storageKey, newPassword);

      setResetSuccessMessage(`Password for account "${resetUsername}" has been reset successfully!`);
      setNewPassword('');
      setConfirmPassword('');
      setRecoveryEmail('');
      setLoading(false);
    }, 600);
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border shadow-sm transition-all duration-300">
        
        {!isResetMode ? (
          <>
            {/* Top Branding Header */}
            <div className="text-center">
              <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center ${
                isGreen ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'
              }`}>
                <Lock size={24} />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900 tracking-tight">
                Sign in to Your Account
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                AIOU Student Record Portal login
              </p>
            </div>

            {/* Success message from reset */}
            {resetSuccessMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl flex items-start gap-2 text-sm">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                <span>{resetSuccessMessage}</span>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              <div className="space-y-4">
                {/* Username Input */}
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1">
                    Username
                  </label>
                  <div className="relative rounded-md shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-hidden transition-all duration-200 ${
                        isGreen
                          ? 'border-gray-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                          : 'border-gray-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500'
                      }`}
                      placeholder="Enter username"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(true);
                        setResetError('');
                        setResetSuccessMessage('');
                        setError('');
                      }}
                      className={`text-xs font-bold hover:underline cursor-pointer ${
                        isGreen ? 'text-emerald-700' : 'text-sky-700'
                      }`}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative rounded-md shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-hidden transition-all duration-200 ${
                        isGreen
                          ? 'border-gray-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                          : 'border-gray-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500'
                      }`}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  id="login-submit-button"
                  className={`group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white focus:outline-hidden transition-all duration-200 cursor-pointer ${
                    isGreen
                      ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500'
                      : 'bg-sky-600 hover:bg-sky-700 focus:ring-2 focus:ring-offset-2 focus:ring-sky-500'
                  } disabled:opacity-50`}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            {/* Password Reset Section */}
            <div>
              <button
                type="button"
                onClick={() => setIsResetMode(false)}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 cursor-pointer mb-4"
              >
                <ArrowLeft size={14} />
                <span>Back to Sign In</span>
              </button>

              <div className="text-center">
                <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center ${
                  isGreen ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'
                }`}>
                  <KeyRound size={24} />
                </div>
                <h2 className="mt-4 text-xl font-bold text-gray-900 tracking-tight">
                  Reset Password Portal
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Update your administrative account password
                </p>
              </div>
            </div>

            {/* Error message */}
            {resetError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm animate-shake">
                <AlertCircle size={16} className="shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleResetPassword}>
              {/* Account Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Select Portal Account
                </label>
                <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setResetUsername('admin')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      resetUsername === 'admin'
                        ? 'bg-white text-gray-900 shadow-3xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetUsername('aiou')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      resetUsername === 'aiou'
                        ? 'bg-white text-gray-900 shadow-3xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    aiou
                  </button>
                </div>
              </div>

              {/* Recovery Email Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Recovery Email Address
                </label>
                <div className="relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="e.g. admin@aiou.edu.pk"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* New Password Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 border border-transparent text-sm font-semibold rounded-lg text-white shadow-xs transition-all cursor-pointer ${
                  isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                }`}
              >
                {loading ? 'Saving new credentials...' : 'Reset & Save Password'}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
