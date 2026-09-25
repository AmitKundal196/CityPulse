import React, { useState } from 'react';
import {
  LayoutDashboard,
  Map,
  Building2,
  Wind,
  TrendingUp,
  BellRing,
  Layers,
  ListFilter,
  FileText,
  Menu,
  X,
  Sun,
  Moon,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { useCivicData } from '../context/CivicDataContext';

export default function Navbar({ currentRoute, onNavigate, isAdminAuthenticated }) {
  const { alertsData, insights, activeCity, theme, toggleTheme } = useCivicData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeAlertCount = alertsData?.activeAlerts?.length || 0;
  const insightCount = insights?.length || 0;

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'map',
      label: 'Live Map',
      icon: Map,
      badge: null
    },
    {
      id: `city/${activeCity.toLowerCase()}`,
      activeMatch: 'city',
      label: `${activeCity} Details`,
      icon: Building2,
      badge: null
    },
    {
      id: 'air-quality',
      label: 'Air Quality',
      icon: Wind,
      badge: null
    },
    {
      id: 'trends',
      label: 'Trends',
      icon: TrendingUp,
      badge: null
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: BellRing,
      badge: activeAlertCount > 0 ? activeAlertCount : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    },

    {
      id: 'events',
      label: 'Events',
      icon: ListFilter,
      badge: null
    },
    {
      id: 'complaints',
      label: 'Complaints',
      icon: FileText,
      badge: null
    },
    {
      id: 'admin-complaints',
      label: 'Municipal Desk',
      icon: isAdminAuthenticated ? ShieldCheck : Lock,
      badge: isAdminAuthenticated ? 'Admin' : 'Lock',
      badgeColor: isAdminAuthenticated
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    }
  ];

  const isItemActive = (item) => {
    if (item.activeMatch) {
      return currentRoute.startsWith(item.activeMatch);
    }
    return currentRoute === item.id;
  };

  const handleSelect = (routeId) => {
    onNavigate(routeId);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="app-navbar bg-[#1A1F2C] border-b border-gray-700/80 shadow-md" aria-label="Main Navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Desktop Navigation Tabs */}
          <div className="hidden md:flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none">
            {navItems.map((item) => {
              const active = isItemActive(item);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  id={`nav-${item.id.replace('/', '-')}`}
                  style={{ color: '#FFFFFF' }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-white/20 border border-white/30 font-bold shadow-xs'
                      : 'opacity-90 hover:opacity-100 hover:bg-white/10 border border-transparent font-medium'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                  <span style={{ color: '#FFFFFF' }}>{item.label}</span>
                  {item.badge !== null && (
                    <span
                      style={{ color: '#FFFFFF' }}
                      className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/20 border border-white/30"
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Desktop Theme Switcher on Right Side */}
          <div className="hidden md:flex items-center">
            <button
              onClick={toggleTheme}
              id="theme-toggle-btn"
              style={{ color: '#FFFFFF' }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/20 bg-white/10 hover:bg-white/15 shadow-xs transition-all cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-300" style={{ color: '#fde047' }} />
                  <span style={{ color: '#FFFFFF' }}>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-blue-300" style={{ color: '#93c5fd' }} />
                  <span style={{ color: '#FFFFFF' }}>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Mobile Bar: Active Label + Theme Switcher + Menu Toggle */}
          <div className="flex md:hidden items-center justify-between w-full py-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {navItems.find((n) => isItemActive(n))?.label || 'Navigation'}
            </span>

            <div className="flex items-center gap-2">
              {/* Mobile quick theme toggle */}
              <button
                onClick={toggleTheme}
                id="theme-toggle-btn-mobile"
                className="p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white focus:outline-none border border-gray-700"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-blue-500" />
                )}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-2 pb-3 space-y-1 border-t border-gray-800/80">
            {navItems.map((item) => {
              const active = isItemActive(item);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  style={{ color: '#FFFFFF' }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-[#2a2a32] border border-zinc-500 shadow-sm'
                      : 'bg-[#18181c] hover:bg-[#24242c] border border-zinc-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                    <span style={{ color: '#FFFFFF' }}>{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span
                      style={{ color: '#FFFFFF' }}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor || 'bg-zinc-800 border-zinc-600'}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Mobile menu full theme toggle option */}
            <button
              onClick={toggleTheme}
              style={{ color: '#FFFFFF' }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold bg-[#18181c] hover:bg-[#24242c] border border-zinc-800/80 pt-2 mt-1"
            >
              <div className="flex items-center gap-2.5">
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-300" style={{ color: '#fde047' }} />
                ) : (
                  <Moon className="w-4 h-4 text-blue-400" style={{ color: '#60a5fa' }} />
                )}
                <span style={{ color: '#FFFFFF' }}>Switch to {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
