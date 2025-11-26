import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppConfig, SuriContact, SuriAttendant } from '../types';
import { useAuth } from '../contexts/AuthContext';
import PcWaitingTable from './PcWaitingTable';
import PcActiveTeamDashboard from './PcActiveTeamDashboard';
import PcAttendantStatusDashboard from './PcAttendantStatusDashboard';
import PcDepartmentStatusDashboard from './PcDepartmentStatusDashboard';
import UserGuide from './UserGuide';
import ContactDetailsModal from './ContactDetailsModal';
import ConfigModal from './ConfigModal';
import { generateDashboardPages, getBusinessMinutes, formatSmartDuration, sortActiveContactsByDuration, formatDurationFromSeconds, getBusinessDurationInSeconds } from '../utils';
import { parseISO, subSeconds } from 'date-fns';

/**
 * @interface PcDashboardProps
 * Propriedades para o componente PcDashboard.
 */
interface PcDashboardProps {
    /** A configuração atual da aplicação. */
    config: AppConfig;
    /** Lista de contatos aguardando na fila. */
    waitingContacts: SuriContact[];
    /** Lista de contatos em atendimento. */
    activeContacts: SuriContact[];
    /** Lista de todos os atendentes. */
    attendants: SuriAttendant[];
    /** Mapa de IDs de departamento para nomes. */
    departmentMap: Record<string, string>;
    /** Controla a visibilidade do modal de configuração. */
    isConfigOpen: boolean;
    /** Função para alterar a visibilidade do modal de configuração. */
    setIsConfigOpen: (isOpen: boolean) => void;
    /** Função para salvar as configurações. */
    onSaveConfig: (config: AppConfig) => void;
}

/**
 * @component PcDashboard
 * O componente principal do dashboard para desktops. Ele integra várias visualizações
 * (fila de espera, atendimentos ativos, status de atendentes e departamentos)
 * em uma interface com abas. Também gerencia modais para detalhes de contato,
 * guia do usuário e configurações.
 *
 * @param {PcDashboardProps} props - As propriedades para renderizar o dashboard.
 * @returns O componente de dashboard completo para PC.
 */
const PcDashboard: React.FC<PcDashboardProps> = ({
    config,
    waitingContacts,
    activeContacts,
    attendants,
    departmentMap,
    isConfigOpen,
    setIsConfigOpen,
    onSaveConfig,
}) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'waiting' | 'active' | 'attendants' | 'departments'>('waiting');
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<SuriContact | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const waitingColumns = useMemo(() => {
        const pages = generateDashboardPages(waitingContacts, departmentMap, 1000, 1000);
        return pages[0] || [];
    }, [waitingContacts, departmentMap]);

    const activeColumns = useMemo(() => {
        const pages = generateDashboardPages(sortActiveContactsByDuration(activeContacts), departmentMap, 1000, 1000);
        return pages[0] || [];
    }, [activeContacts, departmentMap]);

    const metrics = useMemo(() => {
        const totalWaiting = waitingContacts.length;
        let longestWaitTimeSeconds = 0;
        let slaBreachedCount = 0;
        let totalWaitTimeSeconds = 0;

        waitingContacts.forEach(contact => {
            const startTime = contact.queue_start_time ? parseISO(contact.queue_start_time) : parseISO(contact.lastActivity);
            const waitDuration = getBusinessDurationInSeconds(startTime, currentTime);

            if (waitDuration > longestWaitTimeSeconds) {
                longestWaitTimeSeconds = waitDuration;
            }
            if (waitDuration > (config.slaLimit * 60)) {
                slaBreachedCount++;
            }
            totalWaitTimeSeconds += waitDuration;
        });

        const avgWaitTimeSeconds = totalWaiting > 0 ? Math.floor(totalWaitTimeSeconds / totalWaiting) : 0;

        let totalActiveSeconds = 0;
        activeContacts.forEach(c => {
            const startTime = c.agent?.dateAnswer ? parseISO(c.agent.dateAnswer) : parseISO(c.lastActivity);
            const duration = getBusinessDurationInSeconds(startTime, currentTime);
            totalActiveSeconds += duration;
        });

        return {
            totalWaiting,
            longestWaitTimeSeconds,
            slaBreachedCount,
            avgWaitTimeSeconds,
            activeContacts,
            avgActiveTimeSeconds: activeContacts.length > 0 ? Math.floor(totalActiveSeconds / activeContacts.length) : 0
        };
    }, [waitingContacts, activeContacts, config.slaLimit, currentTime]);

    return (
        <div className="flex flex-col h-screen bg-zinc-950 text-white font-sans">
            <header className="h-20 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black tracking-tighter text-white uppercase industrial-gradient-text">
                            Koerner
                        </h1>
                        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                            <span>PC Dashboard</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab('waiting')}
                        className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'waiting' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                    >
                        Fila de Espera
                    </button>
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'active' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                    >
                        Atendimentos
                    </button>
                    <button
                        onClick={() => setActiveTab('attendants')}
                        className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'attendants' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                    >
                        Equipe
                    </button>
                    <button
                        onClick={() => setActiveTab('departments')}
                        className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'departments' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                    >
                        Departamentos
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsConfigOpen(true)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors rounded"
                        title="Configurações"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    <button
                        onClick={() => setIsGuideOpen(true)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors rounded"
                        title="Guia do Usuário"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors rounded"
                        title="Voltar para TV"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button
                        onClick={logout}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-800 transition-colors rounded"
                        title="Sair"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                </div>
            </header>

            <div className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center px-6 gap-6 overflow-x-auto custom-scrollbar shrink-0">
                <div className="flex gap-6 flex-1 justify-end">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Em Espera</span>
                        <span className="text-lg font-mono font-bold text-white leading-none">{metrics.totalWaiting}</span>
                    </div>
                    <div className="w-px h-6 bg-zinc-800 shrink-0" />
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Ativos</span>
                        <span className="text-lg font-mono font-bold text-white leading-none">{metrics.activeContacts.length}</span>
                    </div>
                    <div className="w-px h-6 bg-zinc-800 shrink-0" />
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">T. Médio Esp.</span>
                        <span className="text-lg font-mono font-bold text-white leading-none">{formatDurationFromSeconds(metrics.avgWaitTimeSeconds)}</span>
                    </div>
                    <div className="w-px h-6 bg-zinc-800 shrink-0" />
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Max Espera</span>
                        <span className={`text-lg font-mono font-bold leading-none ${metrics.longestWaitTimeSeconds > 600 ? 'text-amber-500' : 'text-white'}`}>
                            {formatDurationFromSeconds(metrics.longestWaitTimeSeconds)}
                        </span>
                    </div>
                    <div className="w-px h-6 bg-zinc-800 shrink-0" />
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">SLA Crítico</span>
                        <span className={`text-lg font-mono font-bold leading-none ${metrics.slaBreachedCount > 0 ? 'text-red-500 animate-pulse' : 'text-zinc-600'}`}>
                            {metrics.slaBreachedCount}
                        </span>
                    </div>
                    <div className="w-px h-6 bg-zinc-800 shrink-0" />
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">T. Médio Ativo</span>
                        <span className="text-lg font-mono font-bold text-emerald-500 leading-none">{formatDurationFromSeconds(metrics.avgActiveTimeSeconds)}</span>
                    </div>
                </div>
            </div>

            <main className="flex-1 overflow-hidden relative bg-zinc-950">
                {activeTab === 'waiting' && (
                    <PcWaitingTable
                        columns={waitingColumns}
                        slaLimit={config.slaLimit}
                        onContactClick={setSelectedContact}
                    />
                )}

                {activeTab === 'active' && (
                    <PcActiveTeamDashboard
                        columns={activeColumns}
                        attendants={attendants}
                        onContactClick={setSelectedContact}
                    />
                )}

                {activeTab === 'attendants' && (
                    <PcAttendantStatusDashboard
                        attendants={attendants}
                        activeContacts={activeContacts}
                        currentTime={currentTime}
                    />
                )}

                {activeTab === 'departments' && (
                    <PcDepartmentStatusDashboard
                        activeContacts={activeContacts}
                        departmentMap={departmentMap}
                        attendants={attendants}
                        currentTime={currentTime}
                    />
                )}

                <UserGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
                <ContactDetailsModal
                    contact={selectedContact}
                    onClose={() => setSelectedContact(null)}
                    departmentMap={departmentMap}
                    attendants={attendants}
                    slaLimit={config.slaLimit}
                />
                <ConfigModal
                    isOpen={isConfigOpen}
                    onClose={() => setIsConfigOpen(false)}
                    onSave={onSaveConfig}
                    initialConfig={config}
                    departmentMap={departmentMap}
                />
            </main>
        </div>
    );
};

export default PcDashboard;
