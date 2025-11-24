
import React, { useState, useEffect } from 'react';
import { AppConfig } from '../types';

interface ConfigModalProps {
  isOpen: boolean;
  onSave: (config: AppConfig) => void;
  initialConfig: AppConfig;
  departmentMap?: Record<string, string>;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onSave, initialConfig, departmentMap }) => {

  const [interval, setInterval] = useState(initialConfig.refreshInterval);
  const [sla, setSla] = useState(initialConfig.slaLimit || 15);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (isOpen) {

      setInterval(initialConfig.refreshInterval);
      setSla(initialConfig.slaLimit || 15);
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({

      refreshInterval: interval,
      slaLimit: sla
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 bg-red-600">
          <h2 className="text-xl font-bold text-white">Configuração Suri API</h2>
          <p className="text-red-100 text-sm mt-1">Conecte-se ao seu endpoint do Chatbot Maker</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">




          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Atualização (s)</label>
              <input
                type="number"
                min="5"
                max="300"
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alerta SLA (min)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={sla}
                onChange={(e) => setSla(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-red-50 text-red-900 font-bold"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
            <p className="text-xs text-blue-800">
              <strong>Nota:</strong> Os nomes dos departamentos serão carregados automaticamente da API.
            </p>
          </div>

          {/* Debug Section */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-gray-500 hover:text-gray-700 underline mb-2"
            >
              {showDebug ? 'Ocultar Debug' : 'Mostrar Debug de Departamentos'}
            </button>

            {showDebug && departmentMap && (
              <div className="bg-gray-100 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                <p className="font-bold mb-1">Mapeamento Atual ({Object.keys(departmentMap).length}):</p>
                {Object.entries(departmentMap).map(([id, name]) => (
                  <div key={id} className="flex justify-between border-b border-gray-200 py-1">
                    <span className="text-gray-600">{id}:</span>
                    <span className="font-bold text-gray-800">{name}</span>
                  </div>
                ))}
                {Object.keys(departmentMap).length === 0 && (
                  <p className="text-red-500">Nenhum departamento carregado.</p>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-md"
            >
              Salvar e Conectar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigModal;
