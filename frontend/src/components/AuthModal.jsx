import React, { useState } from 'react';
import { X, Lock, User, Sparkles, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
    const payload = { username, password };

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      if (isSignUp) {
        setSuccessMsg('Account created successfully! You can now sign in.');
        setIsSignUp(false);
        setPassword('');
      } else {
        // Login success
        onLoginSuccess(data.username, data.token);
        setUsername('');
        setPassword('');
        onClose();
      }
    } catch (err) {
      console.error('Auth request failed:', err);
      setError(err.message || 'Could not connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-deep-charcoal/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      {/* Modal Container */}
      <div 
        className="w-full max-w-md bg-[#FDFBF7] border-4 border-deep-charcoal rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(58,51,53,1)] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-9 h-9 rounded-xl border-3 border-deep-charcoal bg-white flex items-center justify-center text-deep-charcoal hover:bg-blush-pink hover:rotate-6 cursor-pointer active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(58,51,53,1)]"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Tabs */}
        <div className="flex border-b-4 border-deep-charcoal bg-[#EBE7DF]">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-4 font-display font-black text-sm uppercase tracking-wider transition-all cursor-pointer ${
              !isSignUp
                ? 'bg-muted-lavender text-deep-charcoal border-r-4 border-deep-charcoal'
                : 'text-deep-charcoal/50 hover:bg-white/40 border-r-4 border-deep-charcoal'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-4 font-display font-black text-sm uppercase tracking-wider transition-all cursor-pointer ${
              isSignUp
                ? 'bg-blush-pink text-deep-charcoal'
                : 'text-deep-charcoal/50 hover:bg-white/40'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-5">
          {/* Welcome Title */}
          <div className="text-center">
            <h3 className="font-display font-black text-xl text-deep-charcoal uppercase tracking-wider flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-blush-pink fill-blush-pink" />
              <span>{isSignUp ? 'Create Vault Account' : 'Welcome Back'}</span>
            </h3>
            <p className="text-xs font-bold text-deep-charcoal/40 uppercase tracking-widest mt-1">
              {isSignUp ? 'Sync your photos securely' : 'Access your synced polaroids'}
            </p>
          </div>

          {/* Success / Error Banners */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border-2 border-red-400 text-red-700 text-xs font-bold uppercase tracking-wide">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-green-50 border-2 border-green-400 text-green-700 text-xs font-bold uppercase tracking-wide">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Input Fields */}
          <div className="flex flex-col gap-4">
            {/* Username Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-deep-charcoal/60">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-deep-charcoal/50">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white border-3 border-deep-charcoal rounded-xl py-3 pl-10 pr-4 text-xs font-bold uppercase tracking-wider text-deep-charcoal outline-none focus:bg-[#FFFDF9] transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-deep-charcoal/60">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-deep-charcoal/50">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border-3 border-deep-charcoal rounded-xl py-3 pl-10 pr-4 text-xs font-bold uppercase tracking-wider text-deep-charcoal outline-none focus:bg-[#FFFDF9] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="retro-btn mt-4 py-3.5 w-full bg-matcha-green border-3 border-deep-charcoal rounded-xl font-display font-black text-xs uppercase tracking-widest text-deep-charcoal shadow-[4px_4px_0px_0px_rgba(58,51,53,1)] hover:bg-[#A9D79F] cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{isSignUp ? 'Register Account' : 'Open Vault'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
