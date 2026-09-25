import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert, X, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AdminAuthModal({ isOpen, onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMessage('');
      setIsShaking(false);
      setShowPassword(false);
      // Automatically focus the password input when opened
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password) {
      setErrorMessage('Please enter the access password.');
      return;
    }

    if (password === 'admin@123') {
      setErrorMessage('');
      onSuccess();
    } else {
      setErrorMessage('Incorrect password. Access denied.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`w-full max-w-md bg-[#131B2E] border border-blue-500/30 rounded-2xl shadow-2xl p-6 relative overflow-hidden transition-transform duration-200 ${
          isShaking ? 'animate-shake border-rose-500/60' : ''
        }`}
      >
        {/* Glow ambient background effect */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-gray-400 hover:text-white bg-gray-800/60 hover:bg-gray-700/80 p-1.5 rounded-lg border border-gray-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Icon */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
            <Lock className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/60">
                Restricted Access
              </span>
            </div>
            <h2 id="modal-title" className="text-lg font-bold text-white tracking-tight mt-0.5">
              Municipal Desk Authorization
            </h2>
          </div>
        </div>

        {/* Message / Instruction */}
        <div className="bg-[#1A2338] border border-gray-700/60 rounded-xl p-3.5 mb-5">
          <p className="text-sm font-medium text-gray-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Enter password for access</span>
          </p>
          <p className="text-xs text-gray-400 mt-1 pl-6">
            Access to grievance triage, complaint resolution, and municipal dispatch operations requires administrative credentials.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="municipal-admin-password"
              className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5"
            >
              Admin Password
            </label>
            <div className="relative">
              <input
                id="municipal-admin-password"
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Enter password for access..."
                autoComplete="current-password"
                className={`w-full px-3.5 py-2.5 bg-gray-900/90 border rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none transition-all pr-10 ${
                  errorMessage
                    ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/50'
                    : 'border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 focus:outline-none p-0.5 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2 animate-fadeIn font-medium">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="admin-auth-submit-btn"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
            >
              <span>Unlock Desk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
