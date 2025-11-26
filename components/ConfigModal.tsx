import React, { useState, useEffect } from 'react';
import { AppConfig } from '../types';

/**
 * @interface ConfigModalProps
 * Propriedades para o componente ConfigModal.
 */
interface ConfigModalProps {
  /** Se o modal está aberto ou fechado. */
  isOpen: boolean;
  /** Função a ser chamada quando o modal for fechado. */
  onClose: () => void;
  /** Função a ser chamada para salvar as novas configurações. */
  onSave: (config: AppConfig) => void;
  /** A configuração inicial a ser exibida no modal. */
  initialConfig: AppConfig;
  /** Mapa opcional de departamentos para exibição. */
  departmentMap?: Record<string, string>;
}

/**
 * @component ConfigModal
 * Um modal para configurar as preferências do dashboard, como o intervalo de atualização
 * e o limite de SLA. Também exibe as variáveis de ambiente.
 *
 * @param {ConfigModalProps} props - As propriedades para o modal.
 * @returns O componente do modal de configuração renderizado, ou `null` se `isOpen` for falso.
 */
const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, onSave, initialConfig, departmentMap }) => {
  const [interval, setInterval] = useState(initialConfig.refreshInterval);
  const [sla, setSla] = useState(initialConfig.slaLimit || 15);
  const [activeTab, setActiveTab] = useState<'settings' | 'env'>('settings');
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setInterval(initialConfig.refreshInterval);
      setSla(initialConfig.slaLimit || 15);

      // Carrega as variáveis de ambiente
      const vars: Record<string, string> = {};
      for (const key in import.meta.env) {
        if (key.startsWith('VITE_')) {
          vars[key] = import.meta.env[key];
        }
      }
      setEnvVars(vars);
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  /**
   * Manipula o envio do formulário, salvando as configurações.
   * @param {React.FormEvent} e - O evento do formulário.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      refreshInterval: interval,
      slaLimit: sla
    });
    onClose();
  };

  /**
   * Restaura as configurações para os valores padrão do ambiente.
   */
  const handleReset = () => {
    const defaultInterval = Number(import.meta.env.VITE_REFRESH_INTERVAL) || 15;
    const defaultSla = Number(import.meta.env.VITE_SLA_LIMIT) || 15;
    setInterval(defaultInterval);
    setSla(defaultSla);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

        {/* Cabeçalho */}
        <div className="px-6 py-5 bg-gradient-to-r from-red-600 to-red-700 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Configurações do Sistema</h2>
            <p className="text-red-100 text-xs mt-0.5 opacity-90">Gerencie as preferências do dashboard</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-gray-100 px-6 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 pt-4 px-4 text-sm font-medium transition-colors relative ${activeTab === 'settings'
                ? 'text-red-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Geral
            {activeTab === 'settings' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`pb-3 pt-4 px-4 text-sm font-medium transition-colors relative ${activeTab === 'env'
                ? 'text-red-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Variáveis de Ambiente (.env)
            {activeTab === 'env' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-t-full" />
            )}
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">

          {activeTab === 'settings' && (
            <form id="config-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Intervalo de Atualização
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={interval}
                      onChange={(e) => setInterval(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-mono text-gray-700"
                    />
                    <span className="text-gray-400 text-sm font-medium">seg</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Tempo entre requisições à API.</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Limite de Alerta SLA
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={sla}
                      onChange={(e) => setSla(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-red-50 border border-red-100 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-mono text-red-700 font-bold"
                    />
                    <span className="text-gray-400 text-sm font-medium">min</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Tempo máximo de espera antes do alerta.</p>
                </div>
              </div>

              {departmentMap && Object.keys(departmentMap).length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-700">Departamentos Mapeados</h3>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                      {Object.keys(departmentMap).length}
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto p-2">
                    {Object.entries(departmentMap).map(([id, name]) => (
                      <div key={id} className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors group">
                        <span className="text-xs font-mono text-gray-400 group-hover:text-gray-500">{id}</span>
                        <span className="text-sm font-medium text-gray-700">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}

          {activeTab === 'env' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-bold text-blue-900">Modo de Leitura</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Estas variáveis são carregadas do arquivo <code className="bg-blue-100 px-1 rounded">.env</code> no momento da build ou inicialização. Para alterá-las, é necessário editar o arquivo e reiniciar a aplicação.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 divide-y divide-gray-100">
                  {Object.entries(envVars).map(([key, value]) => (
                    <div key={key} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <span className="text-xs font-bold text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded self-start">
                          {key}
                        </span>
                        <div className="flex items-center gap-2 max-w-full sm:max-w-[60%]">
                          <code className="text-sm text-gray-800 font-mono break-all bg-gray-50 px-2 py-1 rounded border border-gray-100 w-full">
                            {value || <span className="text-gray-300 italic">vazio</span>}
                          </code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center shrink-0">
          {activeTab === 'settings' ? (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Restaurar Padrões
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all shadow-lg shadow-red-600/20 hover:shadow-red-600/30 active:scale-95 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Salvar Alterações
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigModal;
