import React from 'react';
import { Server, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SystemStatusCard({ status, loading, onCheck }) {
  const isOnline = status === 'Online';

  return (
    <div className="max-w-md w-full bg-[#131B2E] border border-gray-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">System Status</h2>
            <p className="text-xs text-gray-400">Backend connectivity status</p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
            loading
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
              : isOnline
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : isOnline ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5" />
          )}
          {loading ? 'checking...' : status}
        </span>
      </div>

      <div className="py-6 space-y-4">
        <div className="flex items-center justify-between text-sm bg-gray-900/50 p-3.5 rounded-xl border border-gray-800/80">
          <span className="text-gray-400">Backend Status:</span>
          <span className={`font-semibold ${loading ? 'text-amber-400' : isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
            Backend: {loading ? 'checking...' : status}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
          <span>Service Name</span>
          <span className="font-mono text-gray-300">neighborhood-pulse</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
          <span>Target Endpoint</span>
          <span className="font-mono text-gray-300">GET /api/health</span>
        </div>
      </div>

      <button
        onClick={onCheck}
        disabled={loading}
        id="check-system-btn"
        className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20 cursor-pointer"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        Check System
      </button>
    </div>
  );
}
