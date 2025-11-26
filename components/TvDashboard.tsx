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
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatSmartDuration, getBusinessMinutes, generateDashboardPages, DashboardColumn, sortActiveContactsByDuration, formatDurationFromSeconds, getBusinessDurationInSeconds } from '../utils';
import { useSystemStatus } from '../hooks/useSystemStatus';

/**
 * @interface TvDashboardProps
 * Propriedades para o componente TvDashboard.
 */
interface TvDashboardProps {
    /** A configuração atual da aplicação. */
    config: AppConfig;
    /** Controla a visibilidade do modal de configuração. */
    isConfigOpen: boolean;
    /** Função para alterar a visibilidade do modal de configuração. */
    setIsConfigOpen: (isOpen: boolean) => void;
    /** Lista de contatos aguardando na fila. */
    waitingContacts: SuriContact[];
    /** Lista de contatos em atendimento. */
    activeContacts: SuriContact[];
    /** Lista de todos os atendentes. */
    attendants: SuriAttendant[];
    /** Mapa de IDs de departamento para nomes. */
    departmentMap: Record<string, string>;
    /** Mensagem de erro a ser exibida, se houver. */
    error: string | null;
    /** Função para salvar as configurações. */
    onSaveConfig: (config: AppConfig) => void;
}

const VIEW_DURATION = Number(import.meta.env.VITE_VIEW_DURATION) || 15000;

/**
 * @typedef DashboardView
 * Define os possíveis tipos de visualização no dashboard rotativo.
 */
type DashboardView =
    | { type: 'waiting'; pageIndex: number; columns: DashboardColumn[] }
    | { type: 'active'; pageIndex: number; columns: DashboardColumn[] }
    | { type: 'attendants'; pageIndex: number; columns: [] }
    | { type: 'departments'; pageIndex: number; columns: [] }
    | { type: 'external'; pageIndex: number; columns: []; url: string };

/**
 * @component TvDashboard
 * O componente principal do dashboard otimizado para exibição em TVs.
 * Ele gerencia uma rotação automática entre diferentes telas (fila, ativos, etc.),
 * exibe métricas em tempo real e permite a configuração e navegação.
 *
 * @param {TvDashboardProps} props - As propriedades para renderizar o dashboard.
 * @returns O componente de dashboard para TV.
 */
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

    const externalUrls = useMemo(() => {
        const urlsString = import.meta.env.VITE_EXTERNAL_URLS || '';
        return urlsString
            .split(',')
            .map((url: string) => url.trim())
            .filter((url: string) => url.length > 0);
    }, []);

    const views: DashboardView[] = useMemo(() => {
        const v: DashboardView[] = [];
        waitingPages.forEach((page, index) => {
            v.push({ type: 'waiting', pageIndex: index, columns: page });
        });
        activePages.forEach((page, index) => {
            v.push({ type: 'active', pageIndex: index, columns: page });
        });
        if (activeContacts.length > 0) {
            v.push({ type: 'attendants', pageIndex: 0, columns: [] });
            v.push({ type: 'departments', pageIndex: 0, columns: [] });
        }
        externalUrls.forEach((url, index) => {
            v.push({ type: 'external', pageIndex: index, columns: [], url });
        });
        return v;
    }, [waitingPages, activePages, activeContacts.length, externalUrls]);

    const metrics = useMemo(() => {
        const now = new Date();
        let totalWaitingSeconds = 0;
        let maxWaitingSeconds = 0;
        let slaBreachedCount = 0;
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

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (isPaused || isConfigOpen || views.length === 0) return;
        const timer = setInterval(() => {
            setCurrentViewIndex(current => (current + 1) % views.length);
            setProgressKey(k => k + 1);
        }, VIEW_DURATION);
        return () => clearInterval(timer);
    }, [isPaused, isConfigOpen, views.length]);

    const currentView = views[currentViewIndex % views.length] || views[0];

    /**
     * Avança para a próxima visualização no ciclo de rotação.
     */
    const handleNextView = () => {
        setCurrentViewIndex(current => (current + 1) % views.length);
        setProgressKey(k => k + 1);
    };

    /**
     * Pausa ou retoma a rotação automática de telas.
     */
    const togglePause = () => {
        setIsPaused(prev => !prev);
    };

    return (
        <div className="h-screen bg-zinc-950 text-zinc-200 font-sans flex flex-col relative overflow-hidden selection:bg-blue-500 selection:text-white scanline">
            {/* Header */}
            <header className="h-16 shrink-0 industrial-header px-6 flex items-center justify-between z-20 relative">
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
                <div className="flex items-center gap-4 bg-zinc-900/50 px-4 py-1.5 rounded border border-zinc-800">
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{format(currentTime, "EEEE, d 'de' MMMM", { locale: ptBR })}</div>
                        <div className="text-xl font-mono font-bold text-white leading-none tracking-tight">{format(currentTime, 'HH:mm:ss')}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded border border-zinc-800 mr-2">
                        <button onClick={() => setIsConfigOpen(true)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors rounded" title="Configurações">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                        <button onClick={() => setIsGuideOpen(true)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors rounded" title="Guia do Usuário">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                        <button onClick={togglePause} className={`p-2 transition-colors rounded ${isPaused ? 'text-amber-500 hover:bg-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`} title={isPaused ? "Retomar Rotação" : "Pausar Rotação"}>
                            {isPaused ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        </button>
                        <button onClick={handleNextView} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors rounded" title="Próxima Tela">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                        <button onClick={logout} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-800 transition-colors rounded" title="Sair do Sistema">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                        <button onClick={() => navigate('/pc')} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors rounded" title="Ir para Dashboard PC">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </button>
                    </div>
                </div>
            </header>
            {/* Main Content Area */}
            <main className={`flex-1 flex flex-col overflow-hidden relative ${currentView?.type === 'external' ? '' : 'p-3 gap-3'}`}>
                {currentView?.type === 'waiting' && (
                    <WaitingTable
                        columns={currentView.columns}
                        slaLimit={config.slaLimit || 15}
                    />
                )}

                {currentView?.type === 'active' && (
                    <ActiveTeamDashboard
                        columns={currentView.columns}
                        attendants={attendants}
                    />
                )}

                {currentView?.type === 'attendants' && (
                    <AttendantStatusDashboard
                        attendants={attendants}
                        activeContacts={activeContacts}
                        currentTime={currentTime}
                    />
                )}

                {currentView?.type === 'departments' && (
                    <DepartmentStatusDashboard
                        activeContacts={activeContacts}
                        departmentMap={departmentMap}
                        attendants={attendants}
                        currentTime={currentTime}
                    />
                )}

                {currentView?.type === 'external' && (
                    <ExternalIframeView url={currentView.url} />
                )}

                {/* Modals */}
                {isConfigOpen && (
                    <ConfigModal
                        config={config}
                        onSave={onSaveConfig}
                        onClose={() => setIsConfigOpen(false)}
                    />
                )}

                {isGuideOpen && (
                    <UserGuide
                        isOpen={isGuideOpen}
                        onClose={() => setIsGuideOpen(false)}
                    />
                )}
            </main>

            {/* Footer Metrics */}
            <footer className="h-20 shrink-0 bg-zinc-950 border-t border-zinc-800 grid grid-cols-6 divide-x divide-zinc-800 z-20 relative">
                <div className="flex flex-col items-center justify-center p-2 group hover:bg-zinc-900 transition-colors">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Em Espera</span>
                    <span className="text-3xl font-mono font-bold text-white tracking-tight">{metrics.totalWaiting}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 group hover:bg-zinc-900 transition-colors">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Ativos</span>
                    <span className="text-3xl font-mono font-bold text-blue-500 tracking-tight">{metrics.activeContacts.length}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 group hover:bg-zinc-900 transition-colors">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">T. Médio Esp.</span>
                    <span className="text-2xl font-mono font-bold text-zinc-300 tracking-tight">{formatDurationFromSeconds(metrics.avgWaitTimeSeconds)}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 group hover:bg-zinc-900 transition-colors">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Max Espera</span>
                    <span className={`text-2xl font-mono font-bold tracking-tight ${metrics.longestWaitTimeSeconds > (config.slaLimit || 15) * 60 ? 'text-red-500 animate-pulse' : 'text-zinc-300'}`}>
                        {formatDurationFromSeconds(metrics.longestWaitTimeSeconds)}
                    </span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 bg-zinc-900/30 group hover:bg-zinc-900 transition-colors">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">SLA Crítico</span>
                    <span className={`text-3xl font-mono font-bold tracking-tight ${metrics.slaBreachedCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {metrics.slaBreachedCount}
                    </span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 group hover:bg-zinc-900 transition-colors">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">T. Médio Ativo</span>
                    <span className="text-2xl font-mono font-bold text-emerald-500 tracking-tight">{formatDurationFromSeconds(metrics.avgActiveTimeSeconds)}</span>
                </div>
            </footer>
        </div>
    );
};

export default TvDashboard;
