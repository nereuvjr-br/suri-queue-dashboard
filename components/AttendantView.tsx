import React, { useState, useMemo, useEffect } from 'react';
import { SuriContact, SuriAttendant } from '../types';
import { getDepartmentName, formatSmartDuration } from '../utils';
import { parseISO } from 'date-fns';
import PhoneDisplay from './PhoneDisplay';

interface AttendantViewProps {
    waitingContacts: SuriContact[];
    activeContacts: SuriContact[];
    attendants: SuriAttendant[];
    departmentMap: Record<string, string>;
}

const CHAT_BASE_URL = "https://portal.chatbotmaker.io/#/chatbot/cb36342344/messaging/";

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

    // --- Filters State ---
    const [activeTab, setActiveTab] = useState<'waiting' | 'active'>('waiting');
    const [selectedDepartment, setSelectedDepartment] = useState<string>(profile.dept || 'all');
    const [selectedAgent, setSelectedAgent] = useState<string>(profile.agentId || 'all');
    const [searchQuery, setSearchQuery] = useState('');

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
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('suri_attendant_profile');
        setHasSelectedProfile(false);
        setProfile({ dept: '', agentId: '' });
        setSelectedDepartment('all');
        setSelectedAgent('all');
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

    // Filter Logic
    const filteredContacts = useMemo(() => {
        const source = activeTab === 'waiting' ? waitingContacts : activeContacts;

        return source.filter(contact => {
            // Filter by Department
            if (selectedDepartment !== 'all') {
                const deptName = getDepartmentName(contact, departmentMap);
                if (deptName !== selectedDepartment) return false;
            }

            // Filter by Agent
            if (selectedAgent !== 'all') {
                const agentId = contact.agent?.platformUserId || contact.attendantId;

                // In 'active', we usually want to see only OUR chats if we selected an agent.
                // In 'waiting', we might want to see the whole queue for the department.
                if (activeTab === 'active') {
                    if (agentId !== selectedAgent) return false;
                }
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
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans text-white relative overflow-hidden">
                {/* Ambient Background */}
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />

                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 max-w-md w-full shadow-2xl relative z-10">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight mb-2">Bem-vindo</h1>
                        <p className="text-slate-400 text-lg">Configure seu acesso ao painel</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Departamento</label>
                            <div className="relative group">
                                <select
                                    value={profile.dept}
                                    onChange={(e) => setProfile(p => ({ ...p, dept: e.target.value }))}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer hover:bg-slate-900/70"
                                >
                                    <option value="">Selecione seu departamento...</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Atendente</label>
                            <div className="relative group">
                                <select
                                    value={profile.agentId}
                                    onChange={(e) => setProfile(p => ({ ...p, agentId: e.target.value }))}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer hover:bg-slate-900/70"
                                >
                                    <option value="">Selecione seu nome...</option>
                                    {attendants
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(agent => (
                                            <option key={agent.id} value={agent.id}>{agent.name}</option>
                                        ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleLogin}
                            disabled={!profile.dept || !profile.agentId}
                            className={`
                w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 mt-4
                ${profile.dept && profile.agentId
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transform hover:-translate-y-0.5'
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
        <div className="min-h-screen bg-[#0f172a] text-slate-200 flex font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
            {/* Sidebar */}
            <aside className="w-80 bg-slate-900/80 border-r border-white/5 flex flex-col p-6 gap-8 backdrop-blur-xl z-20 shadow-2xl">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-white leading-none">SURI</h1>
                        <p className="text-xs text-slate-400 font-medium mt-1">Attendant Console</p>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Search */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Filtros Rápidos</label>
                        <div className="relative group">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar cliente..."
                                className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-slate-950 transition-all placeholder:text-slate-600"
                            />
                            <svg className="w-5 h-5 text-slate-500 absolute left-3.5 top-3 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Profile Info Card */}
                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5 space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Departamento</label>
                            <div className="flex items-center gap-2 text-slate-200 font-medium">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                                {selectedDepartment}
                            </div>
                        </div>

                        <div className="w-full h-px bg-white/5" />

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Atendente</label>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white border border-white/10">
                                    {attendants.find(a => a.id === selectedAgent)?.name.charAt(0)}
                                </div>
                                <span className="text-slate-200 font-medium truncate">
                                    {attendants.find(a => a.id === selectedAgent)?.name}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-auto">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all border border-transparent hover:border-rose-500/20"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Encerrar Sessão
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px]" />
                </div>

                {/* Header / Tabs */}
                <header className="h-24 flex items-center px-10 justify-between z-10">
                    <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <button
                            onClick={() => setActiveTab('waiting')}
                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'waiting'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Fila de Espera
                            <span className={`ml-1 px-2 py-0.5 rounded-md text-xs ${activeTab === 'waiting' ? 'bg-white/20' : 'bg-slate-800'}`}>
                                {waitingContacts.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'active'
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            Em Atendimento
                            <span className={`ml-1 px-2 py-0.5 rounded-md text-xs ${activeTab === 'active' ? 'bg-white/20' : 'bg-slate-800'}`}>
                                {activeContacts.length}
                            </span>
                        </button>
                    </div>

                    <div className="text-sm font-medium text-slate-400 bg-slate-900/50 px-4 py-2 rounded-full border border-white/5">
                        Mostrando <strong className="text-white">{filteredContacts.length}</strong> contatos
                    </div>
                </header>

                {/* Content List */}
                <div className="flex-1 overflow-y-auto px-10 pb-10 z-10 custom-scrollbar">
                    {/* Quick Action for Queue */}
                    {activeTab === 'waiting' && filteredContacts.length > 0 && (
                        <div className="mb-10 relative overflow-hidden rounded-3xl group">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-90 transition-opacity group-hover:opacity-100" />
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

                            <div className="relative p-8 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider border border-white/10">Sua Vez</span>
                                            <span className="text-indigo-100 text-sm font-medium">Aguardando há {formatSmartDuration(parseISO(filteredContacts[0].lastActivity))}</span>
                                        </div>
                                        <h3 className="text-3xl font-black text-white tracking-tight">{filteredContacts[0].name}</h3>
                                    </div>
                                </div>

                                <a
                                    href={`${CHAT_BASE_URL}${filteredContacts[0].id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-black text-lg shadow-2xl hover:bg-indigo-50 transition-all transform hover:scale-105 flex items-center gap-3 group/btn"
                                >
                                    <span>Atender Agora</span>
                                    <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    )}

                    {filteredContacts.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-6">
                            <div className="w-24 h-24 rounded-3xl bg-slate-900/50 border border-white/5 flex items-center justify-center shadow-inner">
                                <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold text-slate-400">Tudo limpo por aqui</p>
                                <p className="text-sm text-slate-600 mt-1">Nenhum contato encontrado com os filtros atuais.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredContacts.map((contact, index) => {
                                const startTime = parseISO(contact.lastActivity);
                                const deptName = getDepartmentName(contact, departmentMap);
                                const isNext = index === 0 && activeTab === 'waiting';

                                // Find Agent
                                const agentId = contact.agent?.platformUserId;
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
                </div>
            </main>
        </div>
    );
};

export default AttendantView;
