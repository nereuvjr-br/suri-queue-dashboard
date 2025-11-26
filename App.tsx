import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDashboardData } from './hooks/useDashboardData';
import TvDashboard from './components/TvDashboard';
import AttendantView from './components/AttendantView';
import PcDashboard from './components/PcDashboard';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';

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
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* TV Dashboard (Default Route) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
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
              </ProtectedRoute>
            }
          />

          {/* Attendant Console */}
          <Route
            path="/attendant"
            element={
              <ProtectedRoute>
                <AttendantView
                  waitingContacts={waitingContacts}
                  activeContacts={activeContacts}
                  attendants={attendants}
                  departmentMap={departmentMap}
                />
              </ProtectedRoute>
            }
          />

          {/* PC Dashboard */}
          <Route
            path="/pc"
            element={
              <ProtectedRoute>
                <PcDashboard
                  config={config}
                  waitingContacts={waitingContacts}
                  activeContacts={activeContacts}
                  attendants={attendants}
                  departmentMap={departmentMap}
                  isConfigOpen={isConfigOpen}
                  setIsConfigOpen={setIsConfigOpen}
                  onSaveConfig={handleSaveConfig}
                />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
