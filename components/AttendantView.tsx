import React, { useState, useMemo, useEffect } from 'react';
import { SuriContact, SuriAttendant } from '../types';
import { getDepartmentName, formatSmartDuration } from '../utils';
import { parseISO, subSeconds } from 'date-fns';
import PhoneDisplay from './PhoneDisplay';

interface AttendantViewProps {
    waitingContacts: SuriContact[];
    activeContacts: SuriContact[];
    attendants: SuriAttendant[];
    departmentMap: Record<string, string>;
}

const CHAT_BASE_URL = "https://portal.chatbotmaker.io/#/chatbot/cb36342344/messaging/";
const ALERT_THRESHOLD_MINUTES = 30; // Alert if time > 30m

const AttendantView: React.FC<AttendantViewProps> = ({
    waitingContacts,
    activeContacts,
    attendants,
    departmentMap
}) => {
    // --- Login / Profile Selection State ---
    const [hasSelectedProfile, setHasSelectedProfile] = useState(() => {
        return !!localStorage.getItem('suri_attendant_profile');
    });

    const [profile, setProfile] = useState<{ dept: string; agentId: string }>(() => {
        const saved = localStorage.getItem('suri_attendant_profile');
        return saved ? JSON.parse(saved) : { dept: '', agentId: '' };
    });

    // --- Navigation State ---
    const [activeTab, setActiveTab] = useState<'dashboard' | 'waiting' | 'active'>('dashboard');

    // --- Filters State ---
    const [selectedDepartment, setSelectedDepartment] = useState<string>(profile.dept || 'all');
    const [selectedAgent, setSelectedAgent] = useState<string>(profile.agentId || 'all');
    const [searchQuery, setSearchQuery] = useState('');

    // --- Timer for Live Updates ---
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30000); // Update every 30s
        return () => clearInterval(timer);
    }, []);

    // Update filters when profile changes (login)
    useEffect(() => {
        if (hasSelectedProfile) {
            setSelectedDepartment(profile.dept);
            setSelectedAgent(profile.agentId);
        }
    }, [hasSelectedProfile, profile]);

    const handleLogin = () => {
        if (profile.dept && profile.agentId) {
            localStorage.setItem('suri_attendant_profile', JSON.stringify(profile));
            setHasSelectedProfile(true);
            setActiveTab('dashboard');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('suri_attendant_profile');
        setHasSelectedProfile(false);
        setProfile({ dept: '', agentId: '' });
        setSelectedDepartment('all');
        setSelectedAgent('all');
        setActiveTab('dashboard');
    };

    // Get unique departments from data
    const departments = useMemo(() => {
        const depts = new Set<string>();
        const allContacts = [...waitingContacts, ...activeContacts];
        allContacts.forEach(c => {
            const name = getDepartmentName(c, departmentMap);
            depts.add(name);
        });
        return Array.from(depts).sort();
    }, [waitingContacts, activeContacts, departmentMap]);

    // --- Derived Data for Dashboard ---
    const myAgent = attendants.find(a => a.id === profile.agentId);

    const myActiveChats = useMemo(() => {
        return activeContacts.filter(c => {
            const agentId = c.agent?.platformUserId || c.attendantId;
            return agentId === profile.agentId;
        });
    }, [activeContacts, profile.agentId]);

    const deptWaitingChats = useMemo(() => {
        return waitingContacts.filter(c => {
            const deptName = getDepartmentName(c, departmentMap);
            return deptName === profile.dept;
        });
    }, [waitingContacts, profile.dept, departmentMap]);

    // --- Metrics Calculation ---
    const timeMetrics = useMemo(() => {
        if (myActiveChats.length === 0) {
            return { avg: 0, max: 0, avgStr: '-', maxStr: '-', isHigh: false };
        }

        let totalSeconds = 0;
        let maxSeconds = 0;

        myActiveChats.forEach(c => {
            // Use dateAnswer (start of attendance) or fallback to lastActivity
            const startDate = c.agent?.dateAnswer ? parseISO(c.agent.dateAnswer) : parseISO(c.lastActivity);
            const seconds = Math.max(0, (now.getTime() - startDate.getTime()) / 1000);

            totalSeconds += seconds;
            if (seconds > maxSeconds) maxSeconds = seconds;
        });

        const avgSeconds = totalSeconds / myActiveChats.length;
        const isHigh = maxSeconds > (ALERT_THRESHOLD_MINUTES * 60);

        return {
            avg: avgSeconds,
            max: maxSeconds,
            avgStr: formatSmartDuration(subSeconds(now, avgSeconds)),
            maxStr: formatSmartDuration(subSeconds(now, maxSeconds)),
            isHigh
        };
    }, [myActiveChats, now]);

    // Filter Logic for Lists
    const filteredContacts = useMemo(() => {
        const source = activeTab === 'waiting' ? waitingContacts : activeContacts;

        return source.filter(contact => {
            // Filter by Department
            if (activeTab === 'waiting' && selectedDepartment !== 'all') {
                const deptName = getDepartmentName(contact, departmentMap);
                if (deptName !== selectedDepartment) return false;
            }

            // Filter by Agent (only relevant for Active tab usually)
            if (activeTab === 'active' && selectedAgent !== 'all') {
                const agentId = contact.agent?.platformUserId || contact.attendantId;
                if (agentId !== selectedAgent) return false;
            }

            // Filter by Search
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    contact.name.toLowerCase().includes(query) ||
                    contact.phone.includes(query)
                );
            }

            return true;
        });
    }, [activeTab, waitingContacts, activeContacts, selectedDepartment, selectedAgent, searchQuery, departmentMap]);

    // --- Login Screen ---
    if (!hasSelectedProfile) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px]" />

                <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-12 max-w-md w-full shadow-2xl relative z-10">
                    <div className="text-center mb-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-500/20 transform rotate-3">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight mb-3">SURI Console</h1>
                        <p className="text-slate-400 text-lg font-medium">Identifique-se para continuar</p>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest ml-1">Departamento</label>
                            <div className="relative group">
                                <select
                                    value={profile.dept}
                                    onChange={(e) => setProfile(p => ({ ...p, dept: e.target.value }))}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer hover:bg-slate-900/80 font-medium"
                                >
                                    <option value="">Selecione seu departamento...</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest ml-1">Atendente</label>
                            <div className="relative group">
                                <select
                                    value={profile.agentId}
                                    onChange={(e) => setProfile(p => ({ ...p, agentId: e.target.value }))}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer hover:bg-slate-900/80 font-medium"
                                >
                                    <option value="">Selecione seu nome...</option>
                                    {attendants
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(agent => (
                                            <option key={agent.id} value={agent.id}>{agent.name}</option>
                                        ))}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleLogin}
                            disabled={!profile.dept || !profile.agentId}
                            className={`
                                w-full py-5 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 mt-6
                                ${profile.dept && profile.agentId
                                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transform hover:-translate-y-1'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }
                            `}
                        >
                            <span>Acessar Painel</span>
                            {profile.dept && profile.agentId && (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#020617] text-slate-200 flex font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900/50 border-r border-white/5 flex flex-col backdrop-blur-xl z-20 relative">
                <div className="p-6 pb-8 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight text-white leading-none">SURI</h1>
                            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Attendant</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 mt-2">Menu Principal</div>

                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'dashboard'
                                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        Meu Dashboard
                    </button>

                    <button
                        onClick={() => setActiveTab('waiting')}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'waiting'
                                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <div className="flex-1 text-left">Fila de Espera</div>
                        {waitingContacts.length > 0 && (
                            <span className="bg-slate-800 text-slate-300 text-xs py-0.5 px-2 rounded-md border border-white/5">{waitingContacts.length}</span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('active')}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'active'
                                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        <div className="flex-1 text-left">Em Atendimento</div>
                        {activeContacts.length > 0 && (
                            <span className="bg-slate-800 text-slate-300 text-xs py-0.5 px-2 rounded-md border border-white/5">{activeContacts.length}</span>
                        )}
                    </button>

                    <div className="my-6 border-t border-white/5" />

                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Filtros</div>

                    <div className="px-3 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-medium">Buscar</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Nome ou telefone..."
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        {activeTab !== 'dashboard' && (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-slate-400 font-medium">Departamento</label>
                                    <select
                                        value={selectedDepartment}
                                        onChange={(e) => setSelectedDepartment(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="all">Todos</option>
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-slate-400 font-medium">Agente</label>
                                    <select
                                        value={selectedAgent}
                                        onChange={(e) => setSelectedAgent(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="all">Todos</option>
                                        {attendants.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                </nav>

                <div className="p-4 border-t border-white/5 bg-slate-900/30">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white border-2 border-slate-800 shadow-lg">
                            {myAgent?.name.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">{myAgent?.name}</div>
                            <div className="text-xs text-slate-400 truncate">{profile.dept}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all border border-transparent hover:border-rose-500/20"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#020617] relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px]" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
                </div>

                {/* Header */}
                <header className="h-20 shrink-0 px-8 flex items-center justify-between z-10 border-b border-white/5 bg-slate-900/20 backdrop-blur-sm">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">
                            {activeTab === 'dashboard' && 'Visão Geral'}
                            {activeTab === 'waiting' && 'Fila de Espera'}
                            {activeTab === 'active' && 'Em Atendimento'}
                        </h2>
                        <p className="text-sm text-slate-400 font-medium">
                            {activeTab === 'dashboard' && `Bem-vindo de volta, ${myAgent?.name.split(' ')[0]}`}
                            {activeTab === 'waiting' && 'Gerencie os contatos aguardando atendimento'}
                            {activeTab === 'active' && 'Monitore os atendimentos em andamento'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-slate-800/50 rounded-lg border border-white/5 text-xs font-medium text-slate-400">
                            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 z-10">

                    {/* DASHBOARD VIEW */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <svg className="w-24 h-24 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-1">Meus Atendimentos</div>
                                        <div className="text-4xl font-black text-white mb-2">{myActiveChats.length}</div>
                                        <div className="text-xs text-slate-400">Conversas ativas no momento</div>
                                    </div>
                                </div>

                                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-blue-500/30 transition-all">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <svg className="w-24 h-24 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-1">Fila do Departamento</div>
                                        <div className="text-4xl font-black text-white mb-2">{deptWaitingChats.length}</div>
                                        <div className="text-xs text-slate-400">Aguardando em {profile.dept}</div>
                                    </div>
                                </div>

                                <div className={`
                                    bg-slate-900/40 border rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group transition-all
                                    ${timeMetrics.isHigh
                                        ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse-border'
                                        : 'border-white/5 hover:border-emerald-500/30'
                                    }
                                `}>
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <svg className={`w-24 h-24 ${timeMetrics.isHigh ? 'text-red-500' : 'text-emerald-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div className="relative z-10">
                                        <div className={`text-sm font-bold uppercase tracking-wider mb-3 ${timeMetrics.isHigh ? 'text-red-400' : 'text-emerald-400'}`}>
                                            Tempos de Atendimento
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Médio</div>
                                                <div className="text-2xl font-black text-white">{timeMetrics.avgStr}</div>
                                            </div>
                                            <div className="w-px h-8 bg-white/10"></div>
                                            <div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Maior</div>
                                                <div className={`text-2xl font-black ${timeMetrics.isHigh ? 'text-red-400' : 'text-white'}`}>
                                                    {timeMetrics.maxStr}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* My Active Chats Section */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white">Meus Atendimentos Ativos</h3>
                                    <button onClick={() => setActiveTab('active')} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Ver todos</button>
                                </div>

                                {myActiveChats.length === 0 ? (
                                    <div className="bg-slate-900/20 border border-white/5 rounded-2xl p-8 text-center">
                                        <p className="text-slate-500 font-medium">Você não tem atendimentos ativos no momento.</p>
                                        <button onClick={() => setActiveTab('waiting')} className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-all">
                                            Ir para Fila
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {myActiveChats.map(contact => (
                                            <div key={contact.id} className="bg-slate-900/40 border border-white/5 rounded-xl p-4 hover:border-indigo-500/30 transition-all group">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        {contact.profilePicture?.url ? (
                                                            <img src={contact.profilePicture.url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                                                {contact.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <h4 className="font-bold text-white truncate text-sm">{contact.name}</h4>
                                                            <PhoneDisplay phone={contact.phone} className="text-[10px] text-slate-500 font-mono" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                                    <span className="text-[10px] text-slate-500 font-medium">
                                                        {formatSmartDuration(contact.agent?.dateAnswer ? parseISO(contact.agent.dateAnswer) : parseISO(contact.lastActivity))}
                                                    </span>
                                                    <a
                                                        href={`${CHAT_BASE_URL}${contact.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-3 py-1.5 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                                                    >
                                                        Abrir Chat
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* LIST VIEWS (WAITING & ACTIVE) */}
                    {activeTab !== 'dashboard' && (
                        <>
                            {filteredContacts.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-6 min-h-[400px]">
                                    <div className="w-20 h-20 rounded-3xl bg-slate-900/50 border border-white/5 flex items-center justify-center shadow-inner">
                                        <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-slate-400">Nenhum contato encontrado</p>
                                        <p className="text-sm text-slate-600 mt-1">Tente ajustar os filtros ou aguarde novos contatos.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {filteredContacts.map((contact, index) => {
                                        const startTime = parseISO(contact.lastActivity);
                                        const deptName = getDepartmentName(contact, departmentMap);
                                        const isNext = activeTab === 'waiting' && index === 0;

                                        // Find Agent
                                        const agentId = contact.agent?.platformUserId || contact.attendantId;
                                        const agent = agentId ? attendants.find(a => a.id === agentId) : undefined;

                                        return (
                                            <div
                                                key={contact.id}
                                                className={`
                                                    relative bg-slate-900/40 border backdrop-blur-sm rounded-2xl p-5 transition-all duration-300 flex flex-col gap-4 group hover:shadow-2xl hover:shadow-black/50
                                                    ${isNext
                                                        ? 'border-indigo-500/50 ring-1 ring-indigo-500/30 z-10'
                                                        : 'border-white/5 hover:border-white/10 hover:-translate-y-1'
                                                    }
                                                `}
                                            >
                                                {isNext && (
                                                    <div className="absolute -top-3 -right-3 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider border border-indigo-400">
                                                        Próximo
                                                    </div>
                                                )}

                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${isNext ? 'bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-slate-600'}`}></span>
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{deptName}</span>
                                                        </div>
                                                        <h3 className="font-bold text-slate-100 truncate text-lg leading-tight" title={contact.name}>{contact.name}</h3>
                                                        <PhoneDisplay phone={contact.phone} className="text-xs text-slate-500 mt-1 font-mono" />
                                                    </div>
                                                    <div className="shrink-0">
                                                        {contact.profilePicture?.url ? (
                                                            <img src={contact.profilePicture.url} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-white/5 group-hover:ring-white/10 transition-all" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-400 ring-2 ring-white/5 group-hover:ring-white/10 transition-all">
                                                                {contact.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-white/5 flex items-end justify-between mt-auto gap-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tempo</span>
                                                        <span className={`font-mono font-bold text-lg ${activeTab === 'waiting' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                                                            {formatSmartDuration(startTime)}
                                                        </span>
                                                    </div>

                                                    {activeTab === 'active' ? (
                                                        <div className="flex flex-col items-end text-right gap-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[8px] text-white">
                                                                    {agent?.name?.charAt(0) || '?'}
                                                                </div>
                                                                <span className="text-xs font-medium text-slate-300 truncate max-w-[100px]">
                                                                    {agent?.name || '...'}
                                                                </span>
                                                            </div>
                                                            <a
                                                                href={`${CHAT_BASE_URL}${contact.id}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-emerald-500/20 hover:border-emerald-500"
                                                            >
                                                                Chat
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <a
                                                            href={`${CHAT_BASE_URL}${contact.id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`
                                                                px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2
                                                                ${isNext
                                                                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
                                                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/5'
                                                                }
                                                            `}
                                                        >
                                                            Atender
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                            </svg>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AttendantView;
