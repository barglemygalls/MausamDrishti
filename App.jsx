import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

import { Overview } from './pages/Overview';
import { Forecast } from './pages/Forecast';
import { BustDetection } from './pages/BustDetection';
import { Historical } from './pages/Historical';
import { API } from './pages/API';
import { WhyModalDialog } from './components/explainability/WhyModalDialog';

export function App() {
  const [activePage, setActivePage] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Contextual Explainability Modal state ("box type thing whenever we click why")
  const [whyModalLocation, setWhyModalLocation] = useState(null);

  // Opens the dedicated full meteorological analysis map console in a NEW TAB
  const handleOpenMapAnalysisInNewTab = (gridId = null, day = null, variable = null, mode = 'explainability') => {
    const params = new URLSearchParams();
    if (gridId) params.set('grid', gridId);
    if (day) params.set('day', day);
    if (variable) params.set('variable', variable);
    if (mode) params.set('mode', mode);
    const queryString = params.toString();
    const url = queryString ? `#/map?${queryString}` : `#/map`;
    window.open(url, '_blank');
  };

  // Triggers the contextual Explainability popup box
  const handleOpenWhyModal = (gridId = null, day = null) => {
    setWhyModalLocation({ cellId: gridId || 'grid_4821', day: day || 5 });
  };

  return (
    <div className="app-container">
      {/* Light Scientific Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => {
          if (page === 'map-analysis') {
            handleOpenMapAnalysisInNewTab();
          } else {
            setActivePage(page);
          }
        }}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Header onToggleMobile={() => setMobileOpen(!mobileOpen)} />

        {/* 1. Overview Page with Compact Map */}
        {activePage === 'overview' && (
          <Overview
            onNavigateToExplainability={handleOpenWhyModal}
            onNavigateToMapAnalysis={handleOpenMapAnalysisInNewTab}
          />
        )}

        {/* 2. Forecast Evolution (Day 1-10) without duplicate map */}
        {activePage === 'forecast' && (
          <Forecast
            onNavigateToExplainability={handleOpenWhyModal}
            onNavigateToMapAnalysis={handleOpenMapAnalysisInNewTab}
          />
        )}

        {/* 3. Bust Detection & Risk Ranking without duplicate map */}
        {activePage === 'bust-detection' && (
          <BustDetection
            onNavigateToExplainability={handleOpenWhyModal}
            onNavigateToMapAnalysis={handleOpenMapAnalysisInNewTab}
          />
        )}

        {/* 4. Historical Records */}
        {activePage === 'historical' && (
          <Historical onNavigateToMapAnalysis={handleOpenMapAnalysisInNewTab} />
        )}

        {/* 5. API Console */}
        {activePage === 'api' && (
          <API />
        )}
      </div>

      {/* Contextual Meteorological Explainability Box Dialog */}
      {whyModalLocation && (
        <WhyModalDialog
          locationInfo={whyModalLocation}
          onClose={() => setWhyModalLocation(null)}
          onOpenMapAnalysis={handleOpenMapAnalysisInNewTab}
        />
      )}
    </div>
  );
}

export default App;
