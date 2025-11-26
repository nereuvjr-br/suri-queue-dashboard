import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppConfig, SuriContact, SuriAttendant } from '../types';
import { useAuth } from '../contexts/AuthContext';

import WaitingTable from './WaitingTable';
import ActiveTeamDashboard from './ActiveTeamDashboard';
import AttendantStatusDashboard from './AttendantStatusDashboard';
import DepartmentStatusDashboard from './DepartmentStatusDashboard';
import ExternalIframeView from './ExternalIframeView';
import UserGuide from './UserGuide';
import ConfigModal from './ConfigModal';
import { parseISO, subSeconds, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatSmartDuration, getBusinessMinutes, generateDashboardPages, DashboardColumn, sortActiveContactsByDuration, formatDurationFromSeconds, getBusinessDurationInSeconds } from '../utils';
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

const VIEW_DURATION = Number(import.meta.env.VITE_VIEW_DURATION) || 15000; // 15 seconds per view

type DashboardView =
    | { type: 'waiting'; pageIndex: number; columns: DashboardColumn[] }
    | { type: 'active'; pageIndex: number; columns: DashboardColumn[] }
    | { type: 'attendants'; pageIndex: number; columns: [] }
    | { type: 'departments'; pageIndex: number; columns: [] }
    | { type: 'external'; pageIndex: number; columns: []; url: string };

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
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentViewIndex, setCurrentViewIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [progressKey, setProgressKey] = useState(0);
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    const { portalStatus, apiStatus, userApiStatus } = useSystemStatus();

    const waitingPages = useMemo(() =>
        generateDashboardPages(waitingContacts, departmentMap),
        [waitingContacts, departmentMap]
    );

    const activePages = useMemo(() =>
        generateDashboardPages(sortActiveContactsByDuration(activeContacts), departmentMap),
        [activeContacts, departmentMap]
    );

    // Parse external URLs from environment
    const externalUrls = useMemo(() => {
        const urlsString = import.meta.env.VITE_EXTERNAL_URLS || '';
        return urlsString
            .split(',')
            .map((url: string) => url.trim())
            .filter((url: string) => url.length > 0);
    }, []);

    // Flatten into a list of views
    const views: DashboardView[] = useMemo(() => {
        const v: DashboardView[] = [];
        waitingPages.forEach((page, index) => {
            v.push({ type: 'waiting', pageIndex: index, columns: page });
        });
        activePages.forEach((page, index) => {
            v.push({ type: 'active', pageIndex: index, columns: page });
        });
        // Add Attendants View if there are active contacts
        if (activeContacts.length > 0) {
            v.push({ type: 'attendants', pageIndex: 0, columns: [] });
            v.push({ type: 'departments', pageIndex: 0, columns: [] });
        }
        // Add external iframe views
        externalUrls.forEach((url, index) => {
            v.push({ type: 'external', pageIndex: index, columns: [], url });
        });
        return v;
    }, [waitingPages, activePages, activeContacts.length, externalUrls]);

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
            // Use dateAnswer if available (start of attendance), otherwise fallback to lastActivity
            const startTime = c.agent?.dateAnswer ? parseISO(c.agent.dateAnswer) : parseISO(c.lastActivity);
            const duration = getBusinessDurationInSeconds(startTime, now);
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
    }, [waitingContacts, activeContacts, config.slaLimit, currentTime]);

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

    const handleNextView = () => {
        setCurrentViewIndex(current => (current + 1) % views.length);
        setProgressKey(k => k + 1);
    };

    const togglePause = () => {
        setIsPaused(prev => !prev);
    };

    return (
        <div className="h-screen bg-zinc-950 text-zinc-200 font-sans flex flex-col relative overflow-hidden selection:bg-blue-500 selection:text-white scanline">

            {/* Header */}
            <header className="h-16 shrink-0 industrial-header px-6 flex items-center justify-between z-20 relative">
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

                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center border border-zinc-700 shadow-inner">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter text-white uppercase industrial-gradient-text">
                            Koerner
                        </h1>
                        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                            <span>Queue Management System</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span>v1.0.1</span>
                        </div>
                    </div>
                </div>

                {/* Clock & Date */}
                <div className="flex items-center gap-4 bg-zinc-900/50 px-4 py-1.5 rounded border border-zinc-800">
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{format(currentTime, "EEEE, d 'de' MMMM", { locale: ptBR })}</div>
                        <div className="text-xl font-mono font-bold text-white leading-none tracking-tight">{format(currentTime, 'HH:mm:ss')}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Controls */}
                    <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded border border-zinc-800 mr-2">
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
                            onClick={togglePause}
                            className={`p-2 transition-colors rounded ${isPaused ? 'text-amber-500 hover:bg-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                            title={isPaused ? "Retomar Rotação" : "Pausar Rotação"}
                        >
                            {isPaused ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                        </button>
                        <button
                            onClick={handleNextView}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors rounded"
                            title="Próxima Tela"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                        <button
                            onClick={logout}
                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-800 transition-colors rounded"
                            title="Sair do Sistema"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                        <button
                            onClick={() => navigate('/pc')}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors rounded"
                            title="Ir para Dashboard PC"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </button>
                    </div>


                </div>
            </header>

            {/* Status Strip */}
            <div className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center px-6 gap-6 overflow-x-auto custom-scrollbar">
                <div className="flex items-center gap-6 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${portalStatus === 'online' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${portalStatus === 'online' ? 'text-emerald-500' : 'text-red-500'}`}>Suri Portal</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${apiStatus === 'online' ? 'text-emerald-500' : 'text-red-500'}`}>Suri API</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${userApiStatus === 'online' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${userApiStatus === 'online' ? 'text-emerald-500' : 'text-red-500'}`}>User API</span>
                    </div>
                </div>
                <div className="w-px h-8 bg-zinc-800 shrink-0" />

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

            {/* Main Content Area */}
            <main
                className={`flex-1 flex flex-col overflow-hidden relative ${currentView?.type === 'external' ? '' : 'p-3 gap-3'}`}
            >
                {error && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 text-white px-6 py-3 border border-red-500 shadow-xl flex items-center gap-3">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="font-mono font-bold uppercase">{error}</span>
                    </div>
                )}

                {/* Content Switcher */}
                <div key={currentViewIndex} className={`flex-1 flex flex-col animate-enter overflow-hidden ${currentView?.type === 'external' ? '' : 'gap-4'}`}>

                    {/* View Description Header - Skip for external views */}
                    {currentView && currentView.type !== 'external' && (
                        <div className="shrink-0 flex items-center justify-between px-4 py-2 industrial-panel">
                            <div className="flex items-center gap-4">
                                {currentView.type === 'waiting' ? (
                                    <>
                                        <div className="w-10 h-10 bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Fila de Espera</h2>
                                            <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Monitoramento em Tempo Real</p>
                                        </div>
                                    </>
                                ) : currentView.type === 'active' ? (
                                    <>
                                        <div className="w-10 h-10 bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Atendimentos Ativos</h2>
                                            <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Equipe em Operação</p>
                                        </div>
                                    </>
                                ) : currentView.type === 'attendants' ? (
                                    <>
                                        <div className="w-10 h-10 bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Status dos Atendentes</h2>
                                            <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Visão Geral da Equipe</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-10 h-10 bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Status por Departamento</h2>
                                            <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Visão Geral da Operação</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Page Indicator */}
                            {((currentView.type === 'waiting' && waitingPages.length > 1) ||
                                (currentView.type === 'active' && activePages.length > 1)) && (
                                    <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 border border-zinc-800">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Página</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-mono font-bold text-white">
                                                {currentView.pageIndex + 1}
                                            </span>
                                            <span className="text-zinc-600">/</span>
                                            <span className="text-base font-mono font-bold text-zinc-600">
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

                    {currentView && currentView.type === 'attendants' && (
                        <div className="flex-1 industrial-panel overflow-hidden p-1">
                            <AttendantStatusDashboard
                                attendants={attendants}
                                activeContacts={activeContacts}
                                currentTime={currentTime}
                            />
                        </div>
                    )}

                    {currentView && currentView.type === 'departments' && (
                        <div className="flex-1 industrial-panel overflow-hidden p-1">
                            <DepartmentStatusDashboard
                                activeContacts={activeContacts}
                                departmentMap={departmentMap}
                                attendants={attendants}
                                currentTime={currentTime}
                            />
                        </div>
                    )}

                    {currentView && currentView.type === 'external' && (
                        <div className="flex-1 overflow-hidden relative">
                            <ExternalIframeView url={currentView.url} />
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


            {/* User Guide Modal */}
            <UserGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

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

export default TvDashboard;
