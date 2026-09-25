import React, { useState, useEffect } from 'react';
import { CivicDataProvider, useCivicData } from './context/CivicDataContext';
import Header from './components/Header';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminAuthModal from './components/AdminAuthModal';
import { Lock } from 'lucide-react';

// Views
import OverviewView from './views/OverviewView';
import LiveMapView from './views/LiveMapView';
import CityDetailsView from './views/CityDetailsView';
import AirQualityView from './views/AirQualityView';
import TrendsView from './views/TrendsView';
import AlertsView from './views/AlertsView';
import EventsView from './views/EventsView';
import ComplaintsView from './views/ComplaintsView';
import AdminComplaintsView from './views/AdminComplaintsView';

function MainApp() {
  const { activeCity, setActiveCity } = useCivicData();

  // Admin authentication state for Municipal Desk
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('municipal_desk_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Helper to extract clean route string from URL hash
  const getHashRoute = () => {
    const raw = window.location.hash.replace(/^#\/?/, '');
    return raw || 'overview';
  };

  const [currentRoute, setCurrentRoute] = useState(getHashRoute());

  // Listen to browser hash changes (back/forward history support)
  useEffect(() => {
    const handleHashChange = () => {
      const newRoute = getHashRoute();
      if (newRoute === 'admin-complaints' && !isAdminAuthenticated) {
        setShowAuthModal(true);
      }
      setCurrentRoute(newRoute);

      // If route is /city/name, sync activeCity
      if (newRoute.startsWith('city/')) {
        const cityPart = newRoute.split('/')[1];
        if (cityPart) {
          const capitalized = cityPart.charAt(0).toUpperCase() + cityPart.slice(1).toLowerCase();
          setActiveCity(capitalized);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setActiveCity, isAdminAuthenticated]);

  // Initial check on load if landed on admin-complaints directly
  useEffect(() => {
    if (currentRoute === 'admin-complaints' && !isAdminAuthenticated) {
      setShowAuthModal(true);
    }
  }, []);

  // Route navigation handler
  const handleNavigate = (route) => {
    if (route === 'admin-complaints' && !isAdminAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    window.location.hash = `#/${route}`;
    setCurrentRoute(route);
  };

  const handleCitySelect = (cityName) => {
    setActiveCity(cityName);
    handleNavigate(`city/${cityName.toLowerCase()}`);
  };

  // Auth Modal Handlers
  const handleAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    try {
      sessionStorage.setItem('municipal_desk_auth', 'true');
    } catch {
      // ignore
    }
    setShowAuthModal(false);
    window.location.hash = '#/admin-complaints';
    setCurrentRoute('admin-complaints');
  };

  const handleAuthClose = () => {
    setShowAuthModal(false);
    // If user was on or tried to enter admin-complaints directly without auth, return safely to complaints
    if (currentRoute === 'admin-complaints' && !isAdminAuthenticated) {
      window.location.hash = '#/complaints';
      setCurrentRoute('complaints');
    }
  };

  const handleLockAdmin = () => {
    setIsAdminAuthenticated(false);
    try {
      sessionStorage.removeItem('municipal_desk_auth');
    } catch {
      // ignore
    }
    window.location.hash = '#/complaints';
    setCurrentRoute('complaints');
  };

  // Render view depending on route
  const renderView = () => {
    if (currentRoute === 'overview') {
      return <OverviewView onNavigate={handleNavigate} />;
    }

    if (currentRoute === 'map') {
      return <LiveMapView onSelectCity={handleCitySelect} />;
    }

    if (currentRoute.startsWith('city')) {
      const parts = currentRoute.split('/');
      const targetCity = parts[1] || activeCity;
      return (
        <CityDetailsView
          selectedCityName={targetCity}
          onCityChange={handleCitySelect}
        />
      );
    }

    if (currentRoute === 'air-quality') {
      return <AirQualityView />;
    }

    if (currentRoute === 'trends') {
      return <TrendsView />;
    }

    if (currentRoute === 'alerts') {
      return <AlertsView />;
    }

    if (currentRoute === 'events') {
      return <EventsView />;
    }

    if (currentRoute === 'complaints') {
      return <ComplaintsView onNavigate={handleNavigate} />;
    }

    if (currentRoute === 'admin-complaints') {
      if (!isAdminAuthenticated) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-[#131B2E]/60 border border-gray-800 rounded-3xl backdrop-blur-md max-w-md mx-auto my-12 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
              <Lock className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 mb-3">
              Restricted Area
            </span>
            <h2 className="text-xl font-bold text-white mb-2">Municipal Desk Locked</h2>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              Enter password for access to municipal grievance workflows, dispatch queues, and resolution logging.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAuthModal(true)}
                id="prompt-auth-modal-btn"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Enter Password For Access</span>
              </button>
              <button
                onClick={() => handleNavigate('complaints')}
                className="px-3.5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs border border-gray-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        );
      }
      return <AdminComplaintsView onLock={handleLockAdmin} />;
    }

    // Default fallback
    return <OverviewView onNavigate={handleNavigate} />;
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col justify-between selection:bg-blue-600/30 selection:text-white">
      <div>
        {/* Global Header */}
        <Header currentRoute={currentRoute} onNavigate={handleNavigate} />

        {/* Global Navigation Bar */}
        <Navbar
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          isAdminAuthenticated={isAdminAuthenticated}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderView()}
        </main>
      </div>

      {/* Password Popup Modal for Municipal Desk Access */}
      <AdminAuthModal
        isOpen={showAuthModal}
        onClose={handleAuthClose}
        onSuccess={handleAuthSuccess}
      />

      {/* Global Civic Platform Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <CivicDataProvider>
      <MainApp />
    </CivicDataProvider>
  );
}
