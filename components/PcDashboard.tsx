import React, { useState, useMemo } from 'react';
import { AppConfig, SuriContact, SuriAttendant } from '../types';
import { useAuth } from '../contexts/AuthContext';
import PcWaitingTable from './PcWaitingTable';
import PcActiveTeamDashboard from './PcActiveTeamDashboard';
import PcAttendantStatusDashboard from './PcAttendantStatusDashboard';
import PcDepartmentStatusDashboard from './PcDepartmentStatusDashboard';
import { generateDashboardPages } from '../utils';

interface PcDashboardProps {
    config: AppConfig;
    waitingContacts: SuriContact[];
    activeContacts: SuriContact[];
    attendants: SuriAttendant[];
    departmentMap: Record<string, string>;
}

const PcDashboard: React.FC<PcDashboardProps> = ({
    config,
    waitingContacts,
    activeContacts,
    attendants,
    departmentMap,
}) => {
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'waiting' | 'active' | 'attendants' | 'departments'>('waiting');

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
                        onClick={() => window.location.href = '/'}
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

            {/* Main Content */}
            <main className="flex-1 overflow-hidden relative bg-zinc-950">
                {activeTab === 'waiting' && (
                    <PcWaitingTable columns={waitingColumns} slaLimit={config.slaLimit} />
                )}
                {activeTab === 'active' && (
                    <PcActiveTeamDashboard columns={activeColumns} attendants={attendants} />
                )}
                {activeTab === 'attendants' && (
                    <PcAttendantStatusDashboard attendants={attendants} activeContacts={activeContacts} />
                )}
                {activeTab === 'departments' && (
                    <PcDepartmentStatusDashboard activeContacts={activeContacts} departmentMap={departmentMap} attendants={attendants} />
                )}
            </main>
        </div>
    );
};

export default PcDashboard;
