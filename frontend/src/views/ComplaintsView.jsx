import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Filter,
  Building2,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Send,
  X,
  Layers,
  ChevronDown,
  ShieldCheck
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

const STATUSES = ['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED'];

const CITY_COORDINATES = {
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Delhi: { lat: 28.6139, lng: 77.2090 },
  Mumbai: { lat: 19.0760, lng: 72.8777 }
};

export default function ComplaintsView({ onNavigate }) {
  const { activeCity, activeCitiesList, refreshData } = useCivicData();

  const [complaints, setComplaints] = useState([]);
  const [summary, setSummary] = useState({ total: 0, open: 0, inReview: 0, resolved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Filters
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    city: activeCity || 'Jaipur',
    category: 'Road Damage',
    description: '',
    lat: CITY_COORDINATES[activeCity]?.lat || 26.9124,
    lng: CITY_COORDINATES[activeCity]?.lng || 75.7873,
    address: '',
    imageUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

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
      console.error('[ComplaintsView] Error loading complaints:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintsData();
  }, [selectedCity, selectedCategory, selectedStatus]);

  // Handle City Change in Form
  const handleFormCityChange = (city) => {
    const coords = CITY_COORDINATES[city] || { lat: 26.9124, lng: 75.7873 };
    setFormData((prev) => ({
      ...prev,
      city,
      lat: coords.lat,
      lng: coords.lng
    }));
  };

  // Submit Complaint
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formData.description.trim() || formData.description.trim().length < 5) {
      setFormError('Please enter a description of at least 5 characters.');
      return;
    }

    const latNum = parseFloat(formData.lat);
    const lngNum = parseFloat(formData.lng);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setFormError('Latitude must be a valid number between -90 and 90.');
      return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setFormError('Longitude must be a valid number between -180 and 180.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: formData.city,
          category: formData.category,
          description: formData.description.trim(),
          location: { lat: latNum, lng: lngNum },
          address: formData.address.trim(),
          imageUrl: formData.imageUrl.trim() || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to submit complaint');
      }

      setFormSuccess('Citizen complaint recorded successfully!');
      // Reset description & address
      setFormData((prev) => ({
        ...prev,
        description: '',
        address: '',
        imageUrl: ''
      }));

      // Refresh list & overall context
      await fetchComplaintsData();
      if (refreshData) refreshData();

      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
      }, 1500);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };



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
            <RefreshCw className="w-3 h-3 animate-spin" />
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
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            REJECTED
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <FileText className="w-3.5 h-3.5" />
            First-Party Citizen Reporting System
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase">
            Citizen Complaints & Grievances
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Empirical citizen-submitted civic reports across Jaipur, Delhi, and Mumbai with zero synthetic generation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (onNavigate) {
                onNavigate('admin-complaints');
              } else {
                window.location.hash = '#/admin-complaints';
              }
            }}
            id="operator-portal-btn"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Municipal Operator Console
          </button>

          <button
            onClick={() => {
              setFormError(null);
              setFormSuccess(null);
              setIsModalOpen(true);
            }}
            id="report-issue-btn"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Report New Issue
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#131B2E] border border-gray-800/80 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Total Reports
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {summary.total}
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block">All registered complaints</span>
        </div>

        <div className="bg-[#131B2E] border border-gray-800/80 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
            Open
          </span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">
            {summary.open}
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block">Awaiting review</span>
        </div>

        <div className="bg-[#131B2E] border border-gray-800/80 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-1">
            In Review
          </span>
          <div className="text-2xl sm:text-3xl font-black text-blue-400">
            {summary.inReview}
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block">Under municipal triage</span>
        </div>

        <div className="bg-[#131B2E] border border-gray-800/80 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
            Resolved
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            {summary.resolved}
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block">Successfully addressed</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#131B2E] border border-gray-800/80 rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* City Filter */}
          <div className="flex items-center gap-2 bg-gray-900/80 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300">
            <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="font-medium">City:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent border-none text-white font-semibold focus:outline-none cursor-pointer"
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
          <div className="flex items-center gap-2 bg-gray-900/80 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300">
            <Filter className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent border-none text-white font-semibold focus:outline-none cursor-pointer"
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
          <div className="flex items-center gap-2 bg-gray-900/80 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent border-none text-white font-semibold focus:outline-none cursor-pointer"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st.toLowerCase()} className="bg-gray-900 text-white">
                  {st.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={fetchComplaintsData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Complaints Table */}
      <div className="bg-[#131B2E] border border-gray-800/80 rounded-2xl p-6 shadow-xl overflow-hidden">
        <h2 className="text-base font-bold text-white uppercase tracking-wider mb-4">
          Citizen Complaint Registry
        </h2>

        {error ? (
          <div className="p-6 text-center text-rose-400 text-sm">
            Could not retrieve complaints: {error}
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <FileText className="w-10 h-10 mx-auto text-gray-600 mb-2" />
            <p className="text-sm font-semibold text-gray-300">No citizen complaints recorded</p>
            <p className="text-xs text-gray-500 mt-1">
              Use the "Report New Issue" button to submit a first-party civic grievance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider bg-gray-900/40">
                  <th className="py-3 px-4 font-semibold">Time</th>
                  <th className="py-3 px-4 font-semibold">City</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Location / Address</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Source</th>
                  <th className="py-3 px-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-sm">
                {complaints.map((c) => {
                  const isExpanded = expandedId === c._id;
                  const dateStr = new Date(c.createdAt).toLocaleDateString();
                  const timeStr = new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <React.Fragment key={c._id}>
                      <tr className="hover:bg-gray-900/30 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-gray-300 font-mono">
                          <div>{timeStr}</div>
                          <div className="text-[10px] text-gray-500">{dateStr}</div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                          {c.city}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-semibold text-white">
                            {c.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-gray-300 max-w-xs">
                          {c.address ? (
                            <div className="truncate font-medium">{c.address}</div>
                          ) : null}
                          <div className="text-[11px] text-gray-500 font-mono">
                            {c.location?.lat.toFixed(4)}, {c.location?.lng.toFixed(4)} (Zone {c.zone || 'N/A'})
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-gray-300 max-w-md">
                          <p className="line-clamp-2">{c.description}</p>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(c.status)}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-xs font-bold text-blue-400">
                            CITIZEN
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : c._id)}
                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#090D17]">
                          <td colSpan="8" className="p-4 border-b border-gray-800 text-xs">
                            <div className="bg-[#0D1322] p-4 rounded-xl border border-gray-800 space-y-3 font-sans">
                              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                                <span className="font-bold text-white">Public Grievance Record Inspection</span>
                                <span className="text-[11px] text-gray-500 font-mono">ID: {c._id}</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-gray-300">
                                <div>
                                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">Coordinates</span>
                                  <span className="font-mono text-xs">{c.location?.lat}, {c.location?.lng}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">Municipal Ward / Zone</span>
                                  <span className="font-mono text-purple-300">Zone {c.zone || 'General'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">Current State</span>
                                  <span className="font-semibold text-white">{c.status}</span>
                                </div>
                              </div>
                              {c.resolutionNote && (
                                <div className="mt-2 pt-2 border-t border-gray-800/80 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/20">
                                  <span className="text-emerald-400 font-bold block text-xs mb-1">Official Municipal Resolution Note</span>
                                  <p className="text-gray-200 text-xs">{c.resolutionNote}</p>
                                  {c.resolvedAt && (
                                    <span className="text-[10px] text-gray-400 block mt-1 font-mono">
                                      Resolved at {new Date(c.resolvedAt).toLocaleString()} by {c.resolvedBy || 'Authorized Operator'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#131B2E] border border-gray-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative animate-scaleUp max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-5">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                  Report Civic Issue
                </h3>
                <p className="text-xs text-gray-400">
                  Submit a first-party grievance directly to the municipal monitoring grid
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* City Selection */}
              <div>
                <label className="block text-gray-300 font-bold mb-1.5 uppercase tracking-wider">
                  Target Urban Center *
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => handleFormCityChange(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-blue-500"
                >
                  {activeCitiesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-gray-300 font-bold mb-1.5 uppercase tracking-wider">
                  Complaint Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-300 font-bold mb-1.5 uppercase tracking-wider">
                  Description of Issue * (Min 5 chars)
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the hazard or civic malfunction in detail..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1.5 uppercase tracking-wider">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1.5 uppercase tracking-wider">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Address / Landmark */}
              <div>
                <label className="block text-gray-300 font-bold mb-1.5 uppercase tracking-wider">
                  Street Address / Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Near Hawa Mahal, MI Road Crossing"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Image URL (Optional) */}
              <div>
                <label className="block text-gray-300 font-bold mb-1.5 uppercase tracking-wider">
                  Photo / Evidence Link (Optional)
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit Citizen Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
