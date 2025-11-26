import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDashboardData } from './hooks/useDashboardData';
import TvDashboard from './components/TvDashboard';
import AttendantView from './components/AttendantView';
import PcDashboard from './components/PcDashboard';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';

/**
 * @component App
 * O componente raiz da aplicação.
 *
 * Responsabilidades:
 * - Inicializa o provedor de autenticação (`AuthProvider`).
 * - Configura o roteamento (`BrowserRouter`, `Routes`, `Route`) para as diferentes
 *   visualizações do dashboard (TV, PC, Atendente).
 * - Utiliza o hook `useDashboardData` para buscar e gerenciar todos os dados
 *   da aplicação e os distribui para os componentes filhos.
 * - Protege as rotas principais para que exijam autenticação.
 *
 * @returns O componente da aplicação com as rotas configuradas.
 */
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

          {/* Rota do TV Dashboard (Rota Padrão) */}
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

          {/* Rota do Console do Atendente */}
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

          {/* Rota do PC Dashboard */}
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

          {/* Rota de Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
