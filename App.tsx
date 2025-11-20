import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDashboardData } from './hooks/useDashboardData';
import TvDashboard from './components/TvDashboard';
import AttendantView from './components/AttendantView';

const App: React.FC = () => {
  const {
    config,
    isConfigOpen,
    setIsConfigOpen,
    waitingContacts,
    activeContacts,
    attendants,
    departmentMap,
    error,
    handleSaveConfig
  } = useDashboardData();

  return (
    <BrowserRouter>
      <Routes>
        {/* TV Dashboard (Default Route) */}
        <Route
          path="/"
          element={
            <TvDashboard
              config={config}
              isConfigOpen={isConfigOpen}
              setIsConfigOpen={setIsConfigOpen}
              waitingContacts={waitingContacts}
              activeContacts={activeContacts}
              attendants={attendants}
              departmentMap={departmentMap}
              error={error}
              onSaveConfig={handleSaveConfig}
            />
          }
        />

        {/* Attendant Console */}
        <Route
          path="/attendant"
          element={
            <AttendantView
              waitingContacts={waitingContacts}
              activeContacts={activeContacts}
              attendants={attendants}
              departmentMap={departmentMap}
            />
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
