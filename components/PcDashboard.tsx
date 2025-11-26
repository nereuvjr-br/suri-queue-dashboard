import React, { useState, useMemo } from 'react';
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
import { generateDashboardPages, getBusinessMinutes, formatSmartDuration } from '../utils';
import { parseISO, subSeconds } from 'date-fns';

interface PcDashboardProps {
    config: AppConfig;
    waitingContacts: SuriContact[];
    activeContacts: SuriContact[];
    attendants: SuriAttendant[];
    departmentMap: Record<string, string>;
    isConfigOpen: boolean;
    setIsConfigOpen: (isOpen: boolean) => void;
    onSaveConfig: (config: AppConfig) => void;
}

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

    // Generate columns for Waiting View (No pagination, high limits)
    const waitingColumns = useMemo(() => {
        const pages = generateDashboardPages(waitingContacts, departmentMap, 1000, 1000); // High limits to get all in one page
        return pages[0] || [];
    }, [waitingContacts, departmentMap]);

    // Generate columns for Active View (No pagination, high limits)
    const activeColumns = useMemo(() => {
        const pages = generateDashboardPages(activeContacts, departmentMap, 1000, 1000); // High limits
        return pages[0] || [];
    }, [activeContacts, departmentMap]);

    // Metrics Calculation
    const metrics = useMemo(() => {
        const now = new Date();
        let totalWaitingSeconds = 0;
        let maxWaitingSeconds = 0;
        let slaBreachedCount = 0;

        // Active metrics
        let totalActiveSeconds = 0;

        waitingContacts.forEach(c => {
            const activityDate = parseISO(c.lastActivity);
            const businessMinutes = getBusinessMinutes(activityDate, now);
            const businessSeconds = businessMinutes * 60;

            totalWaitingSeconds += businessSeconds;
            if (businessSeconds > maxWaitingSeconds) maxWaitingSeconds = businessSeconds;
            if (businessMinutes >= (config.slaLimit || 15)) slaBreachedCount++;
        });

        activeContacts.forEach(c => {
            const duration = Math.max(0, (now.getTime() - parseISO(c.lastActivity).getTime()) / 1000);
            totalActiveSeconds += duration;
        });

        return {
            totalWaiting: waitingContacts.length,
            activeContacts,
            avgWaitTimeSeconds: waitingContacts.length > 0 ? Math.floor(totalWaitingSeconds / waitingContacts.length) : 0,
            longestWaitTimeSeconds: maxWaitingSeconds,
            slaBreachedCount,
            avgActiveTimeSeconds: activeContacts.length > 0 ? Math.floor(totalActiveSeconds / activeContacts.length) : 0
        };
    }, [waitingContacts, activeContacts, config.slaLimit]);

    return (
        <div className="h-screen bg-zinc-950 text-zinc-200 font-sans flex flex-col relative overflow-hidden selection:bg-blue-500 selection:text-white">
            {/* Header */}
            <header className="h-16 shrink-0 industrial-header px-6 flex items-center justify-between z-20 relative border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center border border-zinc-700 shadow-inner">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter text-white uppercase industrial-gradient-text">
                            Koerner
                        </h1>
                        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                            <span>PC Dashboard</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
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

            {/* Metrics Strip */}
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
                        <span className="text-lg font-mono font-bold text-white leading-none">{formatSmartDuration(subSeconds(new Date(), metrics.avgWaitTimeSeconds))}</span>
                    </div>
                    <div className="w-px h-6 bg-zinc-800 shrink-0" />
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Max Espera</span>
                        <span className={`text-lg font-mono font-bold leading-none ${metrics.longestWaitTimeSeconds > 600 ? 'text-amber-500' : 'text-white'}`}>
                            {formatSmartDuration(subSeconds(new Date(), metrics.longestWaitTimeSeconds))}
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
                        <span className="text-lg font-mono font-bold text-emerald-500 leading-none">{formatSmartDuration(subSeconds(new Date(), metrics.avgActiveTimeSeconds))}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
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
                    <PcAttendantStatusDashboard attendants={attendants} activeContacts={activeContacts} />
                )}
                {activeTab === 'departments' && (
                    <PcDepartmentStatusDashboard activeContacts={activeContacts} departmentMap={departmentMap} attendants={attendants} />
                )}
            </main>
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
        </div>
    );
};

export default PcDashboard;
