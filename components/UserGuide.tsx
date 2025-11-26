import React, { useState } from 'react';

/**
 * @interface UserGuideProps
 * Propriedades para o componente UserGuide.
 */
interface UserGuideProps {
    /** Controla se o modal do guia está aberto ou fechado. */
    isOpen: boolean;
    /** Função a ser chamada quando o modal for fechado. */
    onClose: () => void;
}

type TabId = 'general' | 'tv' | 'pc' | 'attendant' | 'faq';

/**
 * @component UserGuide
 * Um componente de modal que exibe um guia do usuário completo,
 * dividido em abas para fácil navegação. Ele fornece uma visão geral do sistema,
 * detalhes sobre cada dashboard e uma seção de FAQ.
 *
 * @param {UserGuideProps} props - As propriedades do componente.
 * @returns O modal do guia do usuário renderizado, ou `null` se `isOpen` for falso.
 */
const UserGuide: React.FC<UserGuideProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<TabId>('general');

    if (!isOpen) return null;

    const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
        {
            id: 'general',
            label: 'Visão Geral',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        },
        {
            id: 'tv',
            label: 'TV Dashboard',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        },
        {
            id: 'pc',
            label: 'PC Dashboard',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        },
        {
            id: 'attendant',
            label: 'Attendant Console',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        },
        {
            id: 'faq',
            label: 'FAQ & Suporte',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                className="bg-zinc-950 w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl border border-zinc-800 flex overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Sidebar */}
                <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
                    <div className="p-6 border-b border-zinc-800">
                        <h2 className="text-xl font-black text-white tracking-tight">GUIA DO USUÁRIO</h2>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">SURI Queue Dashboard</p>
                    </div>
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                    <div className="p-4 border-t border-zinc-800">
                        <button
                            onClick={onClose}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-colors"
                        >
                            Fechar Guia
                        </button>
                    </div>
                </div>

                {/* Área de Conteúdo */}
                <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative">
                    <div className="h-16 border-b border-zinc-800 flex items-center px-8 bg-zinc-900/50 backdrop-blur">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            {tabs.find(t => t.id === activeTab)?.icon}
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                        <div className="max-w-4xl mx-auto space-y-8 text-zinc-300">
                            {/* ... O conteúdo de cada aba renderiza aqui ... */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserGuide;
