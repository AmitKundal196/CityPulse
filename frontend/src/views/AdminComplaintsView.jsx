import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Filter,
  CheckCircle,
  Clock,
  RefreshCw,
  Search,
  ArrowRight,
  RotateCcw,
  Check,
  AlertCircle,
  FileText,
  MapPin,
  ExternalLink,
  ChevronRight,
  Lock
} from 'lucide-react';
import { useCivicData } from '../context/CivicDataContext';

const CATEGORIES = [
  'Road Damage',
  'Garbage / Waste',
  'Streetlight',
  'Water Supply',
  'Drainage / Sewage',
  'Traffic Signal',
  'Public Infrastructure',
  'Public Safety',
  'Other'
];

export default function AdminComplaintsView({ onLock }) {
  const { activeCity, activeCitiesList, refreshData } = useCivicData();

  const [complaints, setComplaints] = useState([]);
  const [summary, setSummary] = useState({ total: 0, open: 0, inReview: 0, resolved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Operator identification
  const [operatorRole, setOperatorRole] = useState('admin'); // 'municipal_operator' | 'admin'
  const [operatorId] = useState('ADMIN-MUNI-01');

  // Filters
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Resolution Modal State
  const [resolvingComplaint, setResolvingComplaint] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [actionError, setActionError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Reopen Modal State
  const [reopeningComplaint, setReopeningComplaint] = useState(null);
  const [reopenReason, setReopenReason] = useState('');

  // Fetch complaints & summary
  const fetchComplaintsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (selectedCity !== 'all') queryParams.append('city', selectedCity);
      if (selectedCategory !== 'all') queryParams.append('category', selectedCategory);
      if (selectedStatus !== 'all') queryParams.append('status', selectedStatus);

      const [complaintsRes, summaryRes] = await Promise.all([
        fetch(`/api/complaints?${queryParams.toString()}`),
        fetch(`/api/complaints/summary${selectedCity !== 'all' ? `?city=${selectedCity}` : ''}`)
      ]);

      if (!complaintsRes.ok) throw new Error(`HTTP ${complaintsRes.status} fetching complaints`);
      if (!summaryRes.ok) throw new Error(`HTTP ${summaryRes.status} fetching summary`);

      const complaintsData = await complaintsRes.json();
      const summaryData = await summaryRes.json();

      setComplaints(complaintsData.complaints || []);
      setSummary(summaryData);
    } catch (err) {
      console.error('[AdminComplaintsView] Error loading complaints:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintsData();
  }, [selectedCity, selectedCategory, selectedStatus]);

  // Execute authenticated status update with role headers
  const executeStatusUpdate = async (id, newStatus, options = {}) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-user-role': operatorRole,
        'x-user-id': operatorId
      };

      const res = await fetch(`/api/complaints/${id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: newStatus,
          resolutionNote: options.resolutionNote,
          reopen: options.reopen || false
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update complaint status');
      }

      setResolvingComplaint(null);
      setReopeningComplaint(null);
      setResolutionNote('');
      setReopenReason('');

      await fetchComplaintsData();
      if (refreshData) refreshData();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Move OPEN -> IN_REVIEW
  const handleStartReview = async (complaint) => {
    await executeStatusUpdate(complaint._id, 'IN_REVIEW', {
      resolutionNote: `Triage initiated by ${operatorId}`
    });
  };

  // Submit Resolution
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolvingComplaint) return;
    if (!resolutionNote.trim() || resolutionNote.trim().length < 5) {
      setActionError('Please enter a resolution explanation of at least 5 characters.');
      return;
    }

    await executeStatusUpdate(resolvingComplaint._id, 'RESOLVED', {
      resolutionNote: resolutionNote.trim()
    });
  };

  // Submit Reopen
  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!reopeningComplaint) return;
    if (!reopenReason.trim() || reopenReason.trim().length < 5) {
      setActionError('Please enter a reopening reason of at least 5 characters.');
      return;
    }

    await executeStatusUpdate(reopeningComplaint._id, 'OPEN', {
      resolutionNote: reopenReason.trim(),
      reopen: true
    });
  };

  // Filter complaints in-memory by search query
  const filteredComplaints = complaints.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c._id.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q) ||
      c.resolutionNote?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            OPEN
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <RefreshCw className="w-3 h-3" />
            IN REVIEW
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3" />
            RESOLVED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-800 text-gray-400 border border-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Municipal Operator & Administration Console
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase">
            Grievance Workflow Operations
          </h1>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Restricted municipal desk for transitioning civic complaints (OPEN → IN_REVIEW → RESOLVED), logging official resolution notes, and tracking municipal accountability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Operator Badge */}
          <div className="flex items-center gap-2 bg-[#131B2E] border border-gray-700/80 px-3.5 py-2 rounded-xl text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-gray-400">Authenticated As:</span>
            <span className="font-bold text-white uppercase">{operatorRole.replace('_', ' ')}</span>
            <span className="text-gray-500 font-mono text-[10px]">({operatorId})</span>
          </div>

          {/* Return to Citizen View */}
          <button
            onClick={() => {
              window.location.hash = '#/complaints';
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-semibold text-xs transition-all cursor-pointer"
          >
            <span>Public Citizen View</span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </button>

          {/* Lock Desk Action */}
          {onLock && (
            <button
              onClick={onLock}
              id="lock-municipal-desk-btn"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold text-xs transition-all cursor-pointer shadow-sm"
              title="Lock Municipal Desk & require admin password"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Lock Desk</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#131B2E] border border-gray-800/80 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Registered Grievances
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white">{summary.total}</div>
          <span className="text-[11px] text-gray-500 mt-1 block">Live citizen submissions</span>
        </div>

        <div className="bg-[#131B2E] border border-gray-800/80 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
            Open (Pending Triage)
          </span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">{summary.open}</div>
          <span className="text-[11px] text-gray-500 mt-1 block">Awaiting field assessment</span>
        </div>

        <div className="bg-[#131B2E] border border-gray-800/80 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-1">
            Under Active Review
          </span>
          <div className="text-2xl sm:text-3xl font-black text-blue-400">{summary.inReview}</div>
          <span className="text-[11px] text-gray-500 mt-1 block">Assigned to municipal crews</span>
        </div>

        <div className="bg-[#131B2E] border border-gray-800/80 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
            Resolved & Verified
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">{summary.resolved}</div>
          <span className="text-[11px] text-gray-500 mt-1 block">With documented notes</span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-[#131B2E] border border-gray-800/80 rounded-2xl p-4 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="flex items-center gap-2 bg-[#0B0F19] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300">
            <Search className="w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search ID, desc, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-white focus:outline-none w-full placeholder:text-gray-600"
            />
          </div>

          {/* City Filter */}
          <div className="flex items-center gap-2 bg-[#0B0F19] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-gray-500">City:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent border-none text-white font-medium focus:outline-none cursor-pointer w-full"
            >
              <option value="all" className="bg-gray-900 text-white">All Cities</option>
              {activeCitiesList.map((c) => (
                <option key={c} value={c} className="bg-gray-900 text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-[#0B0F19] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300">
            <Filter className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-gray-500">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent border-none text-white font-medium focus:outline-none cursor-pointer w-full"
            >
              <option value="all" className="bg-gray-900 text-white">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-gray-900 text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-[#0B0F19] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-gray-500">Workflow:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent border-none text-white font-medium focus:outline-none cursor-pointer w-full"
            >
              <option value="all" className="bg-gray-900 text-white">All States</option>
              <option value="OPEN" className="bg-gray-900 text-amber-400">OPEN Only</option>
              <option value="IN_REVIEW" className="bg-gray-900 text-blue-400">IN REVIEW Only</option>
              <option value="RESOLVED" className="bg-gray-900 text-emerald-400">RESOLVED Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Admin Complaints Table */}
      <div className="bg-[#131B2E] border border-gray-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-gray-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Municipal Grievance Dispatch & Triage Log
            </h2>
          </div>
          <span className="text-xs font-mono text-gray-400">
            Showing {filteredComplaints.length} of {complaints.length} records
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
            Synchronizing administrative records...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-sm">
            Could not load complaints: {error}
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-gray-300">No complaints matching the active filter.</p>
            <p className="text-xs text-gray-500 mt-1">Citizen submissions will appear here for municipal review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 uppercase tracking-wider bg-gray-900/60 font-semibold">
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 max-w-xs">Description</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 max-w-sm">Resolution Note</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Workflow Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-sans">
                {filteredComplaints.map((c) => {
                  const submitDateStr = new Date(c.createdAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const updateDateStr = new Date(c.updatedAt || c.createdAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={c._id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-gray-400 whitespace-nowrap">
                        {c._id.slice(-8)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                        {c.city}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                        {c.category}
                      </td>

                      <td className="py-3.5 px-4 text-gray-300 font-mono text-[11px]">
                        <div>Zone {c.zone || 'General'}</div>
                        <div className="text-[10px] text-gray-500">
                          {c.location?.lat.toFixed(4)}, {c.location?.lng.toFixed(4)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-gray-300 max-w-xs">
                        <p className="line-clamp-2">{c.description}</p>
                      </td>

                      <td className="py-3.5 px-4 text-gray-400 whitespace-nowrap font-mono text-[11px]">
                        {submitDateStr}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          CITIZEN
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(c.status)}
                      </td>

                      <td className="py-3.5 px-4 text-gray-300 max-w-sm">
                        {c.resolutionNote ? (
                          <div className="text-[11px] bg-gray-900/60 p-2 rounded border border-gray-800">
                            <p className="line-clamp-2 text-emerald-300">{c.resolutionNote}</p>
                            {c.resolvedBy && (
                              <span className="text-[9px] text-gray-500 block mt-0.5 font-mono">
                                By {c.resolvedBy}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-600 italic">None logged</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-gray-400 whitespace-nowrap font-mono text-[11px]">
                        {updateDateStr}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {c.status === 'OPEN' && (
                          <button
                            onClick={() => handleStartReview(c)}
                            id={`btn-review-${c._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold text-[11px] cursor-pointer transition-all active:scale-95"
                          >
                            <span>Start Review</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {c.status === 'IN_REVIEW' && (
                          <button
                            onClick={() => {
                              setActionError(null);
                              setResolvingComplaint(c);
                              setResolutionNote('Issue inspected, rectified, and validated on-site.');
                            }}
                            id={`btn-resolve-${c._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer shadow-sm transition-all active:scale-95"
                          >
                            <Check className="w-3 h-3" />
                            <span>Resolve</span>
                          </button>
                        )}

                        {c.status === 'RESOLVED' && (
                          <button
                            onClick={() => {
                              setActionError(null);
                              setReopeningComplaint(c);
                              setReopenReason('Reopened per municipal audit verification.');
                            }}
                            id={`btn-reopen-${c._id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 font-semibold text-[11px] cursor-pointer transition-all"
                          >
                            <RotateCcw className="w-3 h-3 text-amber-400" />
                            <span>Reopen</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Log Municipal Resolution
                </h3>
              </div>
              <button
                onClick={() => setResolvingComplaint(null)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="mt-4 space-y-4">
              <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Complaint:</span>
                  <span className="font-bold text-white">{resolvingComplaint.category} ({resolvingComplaint.city})</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Description:</span>
                  <p className="text-gray-300 italic mt-0.5 line-clamp-2">"{resolvingComplaint.description}"</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Official Resolution Explanation *
                </label>
                <textarea
                  rows="3"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Detail work performed (e.g. Streetlight luminaire replaced and verified operational by night crew)..."
                  className="w-full bg-[#0D1322] border border-gray-700 rounded-xl p-3 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {actionError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setResolvingComplaint(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Confirm Resolution</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {reopeningComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2 text-amber-400">
                <RotateCcw className="w-5 h-5" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Reopen Complaint (Admin Override)
                </h3>
              </div>
              <button
                onClick={() => setReopeningComplaint(null)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReopenSubmit} className="mt-4 space-y-4">
              <p className="text-xs text-gray-400">
                Authorized operators can reopen a resolved complaint if further inspection indicates recurring issues or incomplete repairs.
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Reopening Justification *
                </label>
                <textarea
                  rows="3"
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Explain why issue is being reopened..."
                  className="w-full bg-[#0D1322] border border-gray-700 rounded-xl p-3 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {actionError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setReopeningComplaint(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-600/20 transition-all flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  <span>Reopen Case</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
