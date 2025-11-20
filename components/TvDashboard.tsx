import React, { useState, useEffect, useMemo } from 'react';
import { AppConfig, SuriContact, SuriAttendant } from '../types';
import ConfigModal from './ConfigModal';
import WaitingTable from './WaitingTable';
import ActiveTeamDashboard from './ActiveTeamDashboard';
import { parseISO, subSeconds, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatSmartDuration, getBusinessMinutes, generateDashboardPages, DashboardColumn } from '../utils';

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

    // Generate pages
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
        <div className="min-h-screen text-white font-sans flex flex-col relative overflow-hidden selection:bg-indigo-500 selection:text-white">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <header className="h-24 shrink-0 glass-header px-8 flex items-center justify-between z-20 relative shadow-2xl">
                {/* Progress Bar */}
                {!isPaused && !isConfigOpen && (
                    <div className="absolute bottom-0 left-0 h-0.5 bg-indigo-500/50 w-full">
                        <div
                            key={progressKey}
                            className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 animate-progress"
                            style={{ animationDuration: `${VIEW_DURATION}ms` }}
                        />
                    </div>
                )}

                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md">
                            SURI
                        </h1>
                        <div className="flex items-center gap-3 text-gray-400 text-sm font-medium mt-0.5">
                            <span className="uppercase tracking-wider text-xs font-bold">Queue Dashboard</span>
                            <span className="w-1 h-1 rounded-full bg-gray-600" />
                            <span>{format(currentTime, "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-600" />
                            <span className="font-mono text-gray-300">{format(currentTime, 'HH:mm')}</span>
                        </div>
                    </div>
                </div>

                {/* Global Stats */}
                <div className="flex items-center gap-8">
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-0.5">Em Espera</span>
                        <span className="text-4xl font-black text-white leading-none drop-shadow-lg">{metrics.totalWaiting}</span>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-0.5">Ativos</span>
                        <span className="text-4xl font-black text-white leading-none drop-shadow-lg">{metrics.activeContacts.length}</span>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-0.5">T. Médio</span>
                        <span className="text-4xl font-black text-white leading-none drop-shadow-lg">{formatSmartDuration(subSeconds(new Date(), metrics.avgWaitTimeSeconds))}</span>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-orange-300 uppercase tracking-wider mb-0.5">Max Espera</span>
                        <span className={`text-4xl font-black leading-none drop-shadow-lg ${metrics.longestWaitTimeSeconds > 600 ? 'text-orange-400' : 'text-white'}`}>
                            {formatSmartDuration(subSeconds(new Date(), metrics.longestWaitTimeSeconds))}
                        </span>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-0.5">SLA Crítico</span>
                        <span className={`text-4xl font-black leading-none drop-shadow-lg ${metrics.slaBreachedCount > 0 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
                            {metrics.slaBreachedCount}
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => setIsConfigOpen(true)}
                    className="p-1.5 text-white/20 hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
            </header>

            {/* Main Content Area */}
            <main
                className="flex-1 p-2 flex flex-col gap-2 overflow-hidden relative"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {error && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-500/90 text-white px-6 py-3 rounded-full shadow-xl backdrop-blur-md flex items-center gap-3 animate-bounce">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="font-bold">{error}</span>
                    </div>
                )}

                {/* Content Switcher */}
                <div key={currentViewIndex} className="flex-1 flex flex-col animate-enter overflow-hidden gap-3">

                    {/* View Description Header */}
                    {currentView && (
                        <div className="shrink-0 flex items-center justify-between px-6 py-3 glass-panel rounded-xl border border-white/10">
                            <div className="flex items-center gap-4">
                                {currentView.type === 'waiting' ? (
                                    <>
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-white tracking-tight">Fila de Espera</h2>
                                            <p className="text-sm text-gray-400 mt-0.5">Clientes aguardando atendimento por departamento</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-white tracking-tight">Atendimentos Ativos</h2>
                                            <p className="text-sm text-gray-400 mt-0.5">Clientes sendo atendidos no momento por departamento</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Page Indicator */}
                            {((currentView.type === 'waiting' && waitingPages.length > 1) ||
                                (currentView.type === 'active' && activePages.length > 1)) && (
                                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Página</span>
                                        <span className="text-lg font-black text-white">
                                            {currentView.pageIndex + 1}
                                        </span>
                                        <span className="text-gray-500">/</span>
                                        <span className="text-lg font-bold text-gray-400">
                                            {currentView.type === 'waiting' ? waitingPages.length : activePages.length}
                                        </span>
                                    </div>
                                )}
                        </div>
                    )}

                    {currentView && currentView.type === 'waiting' && (
                        <div className="flex-1 glass-panel rounded-2xl overflow-hidden p-1">
                            <WaitingTable
                                columns={currentView.columns}
                                slaLimit={config.slaLimit}
                            />
                        </div>
                    )}

                    {currentView && currentView.type === 'active' && (
                        <div className="flex-1 glass-panel rounded-2xl overflow-hidden p-1">
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
                <div className="absolute bottom-8 right-8 bg-black/50 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
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
