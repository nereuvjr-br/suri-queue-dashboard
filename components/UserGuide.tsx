import React, { useState } from 'react';

interface UserGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabId = 'general' | 'tv' | 'pc' | 'attendant' | 'faq';

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

                {/* Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative">
                    {/* Header for Mobile/Context */}
                    <div className="h-16 border-b border-zinc-800 flex items-center px-8 bg-zinc-900/50 backdrop-blur">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            {tabs.find(t => t.id === activeTab)?.icon}
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                        <div className="max-w-4xl mx-auto space-y-8 text-zinc-300">

                            {/* GENERAL TAB */}
                            {activeTab === 'general' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <section className="space-y-4">
                                        <h1 className="text-3xl font-black text-white tracking-tight">Bem-vindo ao SURI Queue</h1>
                                        <p className="text-lg leading-relaxed text-zinc-400">
                                            O SURI Queue Dashboard é a central de comando para a gestão de filas de atendimento.
                                            Ele conecta sua operação de atendimento (WhatsApp, Webchat, etc.) a painéis visuais em tempo real,
                                            garantindo que nenhum cliente fique esperando além do necessário.
                                        </p>
                                    </section>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 transition-colors group">
                                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                                                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-2">TV Dashboard</h3>
                                            <p className="text-sm text-zinc-500">Para grandes telas. Roda sozinho e mostra tudo que a equipe precisa saber.</p>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition-colors group">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                                                <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-2">PC Dashboard</h3>
                                            <p className="text-sm text-zinc-500">Para gestores. Permite filtrar, buscar e analisar dados sem esperar a rotação.</p>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 transition-colors group">
                                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                                                <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-2">Attendant Console</h3>
                                            <p className="text-sm text-zinc-500">Para a equipe. Cada um vê sua própria fila e seus atendimentos.</p>
                                        </div>
                                    </div>

                                    <section className="space-y-4 pt-8 border-t border-zinc-800">
                                        <h2 className="text-2xl font-bold text-white">Segurança e Acesso</h2>
                                        <ul className="space-y-3">
                                            <li className="flex gap-3">
                                                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-xs font-bold">1</div>
                                                <p>O sistema é protegido por uma <strong>senha global</strong> definida pela organização.</p>
                                            </li>
                                            <li className="flex gap-3">
                                                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-xs font-bold">2</div>
                                                <p>O login mantém a sessão ativa no dispositivo.</p>
                                            </li>
                                            <li className="flex gap-3">
                                                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-xs font-bold">3</div>
                                                <p>Para sair, utilize sempre o botão de <strong>Logout</strong> (ícone de porta) no cabeçalho.</p>
                                            </li>
                                        </ul>
                                    </section>
                                </div>
                            )}

                            {/* TV DASHBOARD TAB */}
                            {activeTab === 'tv' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <section className="space-y-4">
                                        <h1 className="text-3xl font-black text-white tracking-tight">TV Dashboard</h1>
                                        <p className="text-lg text-zinc-400">
                                            O modo TV é o "coração" da operação visual. Ele foi desenhado para ser colocado em uma TV na parede e esquecido lá,
                                            trabalhando sozinho para manter todos informados.
                                        </p>
                                    </section>

                                    <section className="space-y-4">
                                        <h2 className="text-xl font-bold text-white">Controles e Configuração</h2>
                                        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                                            <p className="mb-4 text-zinc-400">
                                                No cabeçalho da TV, você encontra botões de controle:
                                            </p>
                                            <ul className="space-y-3 text-sm text-zinc-300">
                                                <li className="flex gap-2">
                                                    <strong className="text-white">Configurações (Ícone de Engrenagem):</strong>
                                                    <span>Abre o painel para ajustar o Intervalo de Atualização, Limite de Alerta SLA e visualizar variáveis .env.</span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <strong className="text-white">Pausar/Retomar:</strong>
                                                    <span>Interrompe a rotação automática das telas.</span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <strong className="text-white">Próxima Tela:</strong>
                                                    <span>Avança manualmente para a próxima visualização.</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h2 className="text-xl font-bold text-white">Ciclo de Rotação</h2>
                                        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                                            <p className="mb-4 text-zinc-400">
                                                O sistema muda de tela a cada <strong>15 segundos</strong> (padrão). Uma barra de progresso azul no topo da tela mostra quando a próxima mudança ocorrerá.
                                            </p>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                                                    <span className="text-blue-500 font-bold">1. Fila de Espera</span>
                                                    <span className="text-zinc-500 text-sm">Lista quem está esperando. Se houver muitos, divide em várias páginas.</span>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                                                    <span className="text-emerald-500 font-bold">2. Atendimentos Ativos</span>
                                                    <span className="text-zinc-500 text-sm">Mostra quem está sendo atendido agora e por qual agente.</span>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                                                    <span className="text-amber-500 font-bold">3. Status da Equipe</span>
                                                    <span className="text-zinc-500 text-sm">Resumo de quantos chats cada atendente tem.</span>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                                                    <span className="text-purple-500 font-bold">4. Departamentos</span>
                                                    <span className="text-zinc-500 text-sm">Visão macro de carga por setor.</span>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h2 className="text-xl font-bold text-white">Entendendo as Métricas (Rodapé)</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Em Espera</div>
                                                <p className="text-sm text-zinc-300">Número total de pessoas aguardando em todas as filas.</p>
                                            </div>
                                            <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">T. Médio Esp.</div>
                                                <p className="text-sm text-zinc-300">Tempo médio que as pessoas estão aguardando hoje.</p>
                                            </div>
                                            <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Max Espera</div>
                                                <p className="text-sm text-zinc-300">O tempo da pessoa que está esperando há mais tempo. <span className="text-amber-500">Fica amarelo se passar de 10 min.</span></p>
                                            </div>
                                            <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">SLA Crítico</div>
                                                <p className="text-sm text-zinc-300">Contador de quantas pessoas estouraram o tempo limite configurado. <span className="text-red-500">Pisca em vermelho se &gt; 0.</span></p>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* PC DASHBOARD TAB */}
                            {activeTab === 'pc' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <section className="space-y-4">
                                        <h1 className="text-3xl font-black text-white tracking-tight">PC Dashboard</h1>
                                        <p className="text-lg text-zinc-400">
                                            O modo PC é para quem precisa de controle. Diferente da TV, aqui você decide o que ver.
                                        </p>
                                    </section>

                                    <section className="space-y-4">
                                        <h2 className="text-xl font-bold text-white">Navegação e Controle</h2>
                                        <ul className="space-y-4">
                                            <li className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                                                <strong className="text-white block mb-1">Sem Paginação</strong>
                                                <p className="text-sm text-zinc-400">
                                                    Na TV, se houver 20 pessoas na fila, ela mostra 10 de cada vez.
                                                    No PC, mostra uma lista única com barra de rolagem para você ver tudo de uma vez.
                                                </p>
                                            </li>
                                            <li className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                                                <strong className="text-white block mb-1">Abas de Navegação</strong>
                                                <p className="text-sm text-zinc-400">
                                                    Use os botões no topo (Fila, Atendimentos, Equipe) para alternar instantaneamente entre as visões.
                                                </p>
                                            </li>
                                        </ul>
                                    </section>
                                </div>
                            )}

                            {/* ATTENDANT CONSOLE TAB */}
                            {activeTab === 'attendant' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <section className="space-y-4">
                                        <h1 className="text-3xl font-black text-white tracking-tight">Attendant Console</h1>
                                        <p className="text-lg text-zinc-400">
                                            Sua área de trabalho pessoal. Aqui você foca apenas no que importa para você: seus clientes e sua fila.
                                        </p>
                                    </section>

                                    <section className="space-y-6">
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-3">1. Identificação</h2>
                                            <p className="text-zinc-400 mb-2">
                                                Ao acessar pela primeira vez, você verá uma tela de login moderna:
                                            </p>
                                            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-sm text-zinc-300">
                                                Selecione seu <strong>Departamento</strong> ➝ Selecione seu <strong>Nome</strong> ➝ Clique em <strong>Acessar Painel</strong>.
                                            </div>
                                        </div>

                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-3">2. Menu Principal (Barra Lateral)</h2>
                                            <ul className="space-y-2 text-sm text-zinc-300 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                                                <li><strong className="text-indigo-400">Meu Dashboard:</strong> Visão geral com suas métricas pessoais.</li>
                                                <li><strong className="text-indigo-400">Fila de Espera:</strong> Lista de clientes aguardando atendimento.</li>
                                                <li><strong className="text-indigo-400">Em Atendimento:</strong> Lista de conversas que você está conduzindo agora.</li>
                                                <li><strong className="text-indigo-400">Filtros:</strong> Busque por nome/telefone ou filtre por departamento/agente.</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-3">3. Meu Dashboard</h2>
                                            <p className="text-zinc-400 mb-2">
                                                A tela inicial mostra cartões com informações vitais:
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                                                    <strong className="text-indigo-400 block mb-1">Meus Atendimentos</strong>
                                                    <span className="text-sm text-zinc-400">Quantas conversas você tem abertas agora.</span>
                                                </div>
                                                <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                                                    <strong className="text-blue-400 block mb-1">Fila do Departamento</strong>
                                                    <span className="text-sm text-zinc-400">Quantas pessoas estão esperando especificamente pelo seu setor.</span>
                                                </div>
                                                <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                                                    <strong className="text-emerald-400 block mb-1">Tempos de Atendimento</strong>
                                                    <span className="text-sm text-zinc-400">Seu tempo médio e máximo. Borda vermelha se excessivo.</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-3">4. Atendendo Clientes</h2>
                                            <p className="text-zinc-400 mb-2">
                                                Vá para a aba <strong>Fila de Espera</strong>:
                                            </p>
                                            <ul className="space-y-2 text-sm text-zinc-300">
                                                <li>• O cliente no topo da lista (marcado como "Próximo") é a prioridade.</li>
                                                <li>• O cartão mostra o tempo de espera e se o SLA estourou.</li>
                                                <li>• Clique no botão <strong>Atender</strong> para abrir o chat diretamente no Chatbot Maker.</li>
                                            </ul>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* FAQ TAB */}
                            {activeTab === 'faq' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <section className="space-y-4">
                                        <h1 className="text-3xl font-black text-white tracking-tight">FAQ & Suporte</h1>
                                        <p className="text-lg text-zinc-400">
                                            Respostas para as dúvidas mais comuns.
                                        </p>
                                    </section>

                                    <div className="space-y-4">
                                        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                                            <h3 className="text-lg font-bold text-white mb-2">Os dados parecem desatualizados. O que fazer?</h3>
                                            <p className="text-zinc-400">
                                                Olhe para o rodapé da TV Dashboard. Existem 3 luzes de status (Portal, API, User).
                                                Se alguma estiver <span className="text-red-500 font-bold">Vermelha</span>, significa que a conexão caiu.
                                                Verifique sua internet. Se estiverem verdes, tente recarregar a página (F5).
                                            </p>
                                        </div>

                                        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                                            <h3 className="text-lg font-bold text-white mb-2">Vejo códigos (ex: cb36...) em vez de nomes de departamentos.</h3>
                                            <p className="text-zinc-400">
                                                Isso acontece quando o sistema não consegue baixar a lista de departamentos da API.
                                                Geralmente, um simples recarregamento da página (F5) resolve isso.
                                            </p>
                                        </div>

                                        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                                            <h3 className="text-lg font-bold text-white mb-2">Como troco de usuário no Attendant Console?</h3>
                                            <p className="text-zinc-400">
                                                No menu lateral esquerdo, lá embaixo, existe um botão <strong>Sair</strong>.
                                                Ao clicar nele, você desconecta seu usuário atual e volta para a tela de seleção de perfil.
                                            </p>
                                        </div>

                                        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                                            <h3 className="text-lg font-bold text-white mb-2">Como altero o tempo de SLA?</h3>
                                            <p className="text-zinc-400">
                                                No modo TV Dashboard, clique no ícone de engrenagem no topo. Ajuste o valor em "Limite de Alerta SLA" e clique em Salvar. Isso afetará os indicadores de "SLA Crítico" imediatamente.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserGuide;
