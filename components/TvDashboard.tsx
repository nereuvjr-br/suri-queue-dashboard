import React, { useState, useEffect, useMemo } from 'react';
import { AppConfig, SuriContact, SuriAttendant } from '../types';
import ConfigModal from './ConfigModal';
import WaitingTable from './WaitingTable';
import ActiveTeamDashboard from './ActiveTeamDashboard';
import { parseISO, subSeconds, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatSmartDuration, getBusinessMinutes, generateDashboardPages, DashboardColumn } from '../utils';
import { useSystemStatus } from '../hooks/useSystemStatus';

interface TvDashboardProps {
    config: AppConfig;
    isConfigOpen: boolean;
    setIsConfigOpen: (isOpen: boolean) => void;
    waitingContacts: SuriContact[];
    activeContacts: SuriContact[];
    attendants: SuriAttendant[];
    departmentMap: Record<string, string>;
    error: string | null;
    onSaveConfig: (config: AppConfig) => void;
}

const VIEW_DURATION = 15000; // 15 seconds per view

type DashboardView =
    | { type: 'waiting'; pageIndex: number; columns: DashboardColumn[] }
    | { type: 'active'; pageIndex: number; columns: DashboardColumn[] };

const TvDashboard: React.FC<TvDashboardProps> = ({
    config,
    isConfigOpen,
    setIsConfigOpen,
    waitingContacts,
    activeContacts,
    attendants,
    departmentMap,
    error,
    onSaveConfig
}) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentViewIndex, setCurrentViewIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [progressKey, setProgressKey] = useState(0);

    const { portalStatus, apiStatus } = useSystemStatus();

    // ... (rest of the component logic)
    const waitingPages = useMemo(() =>
        generateDashboardPages(waitingContacts, departmentMap),
        [waitingContacts, departmentMap]
    );

    const activePages = useMemo(() =>
        generateDashboardPages(activeContacts, departmentMap),
        [activeContacts, departmentMap]
    );

    // Flatten into a list of views
    const views: DashboardView[] = useMemo(() => {
        const v: DashboardView[] = [];
        waitingPages.forEach((page, index) => {
            v.push({ type: 'waiting', pageIndex: index, columns: page });
        });
        activePages.forEach((page, index) => {
            v.push({ type: 'active', pageIndex: index, columns: page });
        });
        return v;
    }, [waitingPages, activePages]);

    // Metrics Calculation
    const metrics = useMemo(() => {
        const now = new Date();
        let totalSeconds = 0;
        let maxSeconds = 0;
        let slaBreachedCount = 0;

        waitingContacts.forEach(c => {
            const activityDate = parseISO(c.lastActivity);
            const businessMinutes = getBusinessMinutes(activityDate, now);
            const businessSeconds = businessMinutes * 60;

            totalSeconds += businessSeconds;
            if (businessSeconds > maxSeconds) maxSeconds = businessSeconds;
            if (businessMinutes >= (config.slaLimit || 15)) slaBreachedCount++;
        });

        return {
            totalWaiting: waitingContacts.length,
            activeContacts,
            avgWaitTimeSeconds: waitingContacts.length > 0 ? Math.floor(totalSeconds / waitingContacts.length) : 0,
            longestWaitTimeSeconds: maxSeconds,
            slaBreachedCount
        };
    }, [waitingContacts, activeContacts, config.slaLimit]);

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Auto Rotation Logic
    useEffect(() => {
        if (isPaused || isConfigOpen || views.length === 0) return;

        const timer = setInterval(() => {
            setCurrentViewIndex(current => (current + 1) % views.length);
            setProgressKey(k => k + 1);
        }, VIEW_DURATION);

        return () => clearInterval(timer);
    }, [isPaused, isConfigOpen, views.length]);

    const currentView = views[currentViewIndex % views.length] || views[0];

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans flex flex-col relative overflow-hidden selection:bg-blue-500 selection:text-white scanline">

            {/* Header */}
            <header className="h-20 shrink-0 industrial-header px-8 flex items-center justify-between z-20 relative">
                {/* Progress Bar */}
                {!isPaused && !isConfigOpen && (
                    <div className="absolute bottom-0 left-0 h-1 bg-zinc-800 w-full">
                        <div
                            key={progressKey}
                            className="h-full bg-blue-500 animate-progress origin-left"
                            style={{ animationDuration: `${VIEW_DURATION}ms` }}
                        />
                    </div>
                )}

                <div className="flex items-center gap-6">
                    <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center border border-zinc-700 shadow-inner">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter text-white uppercase industrial-gradient-text">
                            SURI <span className="text-zinc-500">|</span> KOERNER
                        </h1>
                        <div className="flex items-center gap-3 text-zinc-500 text-xs font-bold uppercase tracking-widest mt-0.5">
                            <span>Queue Management System</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span>v2.0.4</span>
                        </div>
                    </div>
                </div>

                {/* Clock & Date */}
                <div className="flex items-center gap-6 bg-zinc-900/50 px-6 py-2 rounded border border-zinc-800">
                    <div className="text-right">
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{format(currentTime, "EEEE, d 'de' MMMM", { locale: ptBR })}</div>
                        <div className="text-2xl font-mono font-bold text-white leading-none tracking-tight">{format(currentTime, 'HH:mm:ss')}</div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsConfigOpen(true)}
                        className="p-2 text-zinc-600 hover:text-white transition-colors border border-transparent hover:border-zinc-700 rounded"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                </div>
            </header>

            {/* Status Strip */}
            <div className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center px-8 gap-8 overflow-x-auto custom-scrollbar">
                <div className="flex items-center gap-6 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${portalStatus === 'online' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${portalStatus === 'online' ? 'text-emerald-500' : 'text-red-500'}`}>Suri Portal</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${apiStatus === 'online' ? 'text-emerald-500' : 'text-red-500'}`}>Suri API</span>
                    </div>
                </div>
                <div className="w-px h-8 bg-zinc-800 shrink-0" />

                <div className="flex gap-8 flex-1 justify-end">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Em Espera</span>
                        <span className="text-xl font-mono font-bold text-white leading-none">{metrics.totalWaiting}</span>
                    </div>
                    <div className="w-px h-8 bg-zinc-800 shrink-0" />
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Ativos</span>
                        <span className="text-xl font-mono font-bold text-white leading-none">{metrics.activeContacts.length}</span>
                    </div>
                    <div className="w-px h-8 bg-zinc-800 shrink-0" />
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">T. Médio</span>
                        <span className="text-xl font-mono font-bold text-white leading-none">{formatSmartDuration(subSeconds(new Date(), metrics.avgWaitTimeSeconds))}</span>
                    </div>
                    <div className="w-px h-8 bg-zinc-800 shrink-0" />
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Max Espera</span>
                        <span className={`text-xl font-mono font-bold leading-none ${metrics.longestWaitTimeSeconds > 600 ? 'text-amber-500' : 'text-white'}`}>
                            {formatSmartDuration(subSeconds(new Date(), metrics.longestWaitTimeSeconds))}
                        </span>
                    </div>
                    <div className="w-px h-8 bg-zinc-800 shrink-0" />
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">SLA Crítico</span>
                        <span className={`text-xl font-mono font-bold leading-none ${metrics.slaBreachedCount > 0 ? 'text-red-500 animate-pulse' : 'text-zinc-600'}`}>
                            {metrics.slaBreachedCount}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main
                className="flex-1 p-6 flex flex-col gap-4 overflow-hidden relative"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {error && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 text-white px-6 py-3 border border-red-500 shadow-xl flex items-center gap-3">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="font-mono font-bold uppercase">{error}</span>
                    </div>
                )}

                {/* Content Switcher */}
                <div key={currentViewIndex} className="flex-1 flex flex-col animate-enter overflow-hidden gap-4">

                    {/* View Description Header */}
                    {currentView && (
                        <div className="shrink-0 flex items-center justify-between px-6 py-4 industrial-panel">
                            <div className="flex items-center gap-4">
                                {currentView.type === 'waiting' ? (
                                    <>
                                        <div className="w-12 h-12 bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Fila de Espera</h2>
                                            <p className="text-sm text-zinc-500 font-mono uppercase tracking-wider">Monitoramento em Tempo Real</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Atendimentos Ativos</h2>
                                            <p className="text-sm text-zinc-500 font-mono uppercase tracking-wider">Equipe em Operação</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Page Indicator */}
                            {((currentView.type === 'waiting' && waitingPages.length > 1) ||
                                (currentView.type === 'active' && activePages.length > 1)) && (
                                    <div className="flex items-center gap-3 bg-zinc-900 px-4 py-2 border border-zinc-800">
                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Página</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-mono font-bold text-white">
                                                {currentView.pageIndex + 1}
                                            </span>
                                            <span className="text-zinc-600">/</span>
                                            <span className="text-lg font-mono font-bold text-zinc-600">
                                                {currentView.type === 'waiting' ? waitingPages.length : activePages.length}
                                            </span>
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}

                    {currentView && currentView.type === 'waiting' && (
                        <div className="flex-1 industrial-panel overflow-hidden p-1">
                            <WaitingTable
                                columns={currentView.columns}
                                slaLimit={config.slaLimit}
                            />
                        </div>
                    )}

                    {currentView && currentView.type === 'active' && (
                        <div className="flex-1 industrial-panel overflow-hidden p-1">
                            <ActiveTeamDashboard
                                columns={currentView.columns}
                                attendants={attendants}
                            />
                        </div>
                    )}

                </div>
            </main>

            {/* Pause Indicator */}
            {isPaused && (
                <div className="absolute bottom-8 right-8 bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-xl">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    Rotação Pausada
                </div>
            )}

            <ConfigModal
                isOpen={isConfigOpen}
                onSave={onSaveConfig}
                initialConfig={config}
                departmentMap={departmentMap}
            />
        </div>
    );
};

export default TvDashboard;
