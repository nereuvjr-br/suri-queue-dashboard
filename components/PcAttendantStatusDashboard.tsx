import React, { useMemo } from 'react';
import { SuriAttendant, SuriContact } from '../types';
import { parseISO } from 'date-fns';
import { formatDurationFromSeconds, getBusinessDurationInSeconds } from '../utils';

/**
 * @interface PcAttendantStatusDashboardProps
 * Propriedades para o componente PcAttendantStatusDashboard.
 */
interface PcAttendantStatusDashboardProps {
    /** A lista de todos os atendentes. */
    attendants: SuriAttendant[];
    /** A lista de contatos atualmente ativos. */
    activeContacts: SuriContact[];
    /** A data e hora atual, usada para cálculos de duração consistentes. */
    currentTime: Date;
}

const ALERT_LIMIT_MINUTES = Number(import.meta.env.VITE_AVG_TIME_ALERT_LIMIT) || 30;

/**
 * @component PcAttendantStatusDashboard
 * Um dashboard otimizado para PC que exibe o status e as métricas de desempenho dos atendentes
 * com atendimentos ativos, em um layout de grid responsivo.
 *
 * @param {PcAttendantStatusDashboardProps} props - As propriedades do componente.
 * @returns O dashboard de status dos atendentes para PC.
 */
const PcAttendantStatusDashboard: React.FC<PcAttendantStatusDashboardProps> = ({ attendants, activeContacts, currentTime }) => {

    const attendantStats = useMemo(() => {
        const stats = new Map<string, { count: number, totalDuration: number, longestDuration: number, longestContactName: string }>();
        const now = currentTime;

        activeContacts.forEach(contact => {
            const agentId = contact.agent?.platformUserId;
            if (agentId) {
                const current = stats.get(agentId) || { count: 0, totalDuration: 0, longestDuration: 0, longestContactName: '' };
                const startTime = contact.agent?.dateAnswer ? parseISO(contact.agent.dateAnswer) : parseISO(contact.lastActivity);
                const duration = getBusinessDurationInSeconds(startTime, now);

                if (duration > current.longestDuration) {
                    current.longestDuration = duration;
                    current.longestContactName = contact.name;
                }

                stats.set(agentId, {
                    count: current.count + 1,
                    totalDuration: current.totalDuration + duration,
                    longestDuration: current.longestDuration,
                    longestContactName: current.longestContactName
                });
            }
        });

        return attendants
            .filter(attendant => stats.has(attendant.id))
            .map(attendant => {
                const stat = stats.get(attendant.id)!;
                return {
                    ...attendant,
                    activeCount: stat.count,
                    avgDuration: stat.count > 0 ? stat.totalDuration / stat.count : 0,
                    longestDuration: stat.longestDuration,
                    longestContactName: stat.longestContactName
                };
            })
            .sort((a, b) => {
                const limitSeconds = ALERT_LIMIT_MINUTES * 60;
                const aCritical = a.avgDuration > limitSeconds;
                const bCritical = b.avgDuration > limitSeconds;

                if (aCritical && !bCritical) return -1;
                if (!aCritical && bCritical) return 1;

                return b.avgDuration - a.avgDuration;
            });
    }, [attendants, activeContacts, currentTime]);

    /**
     * Retorna a cor de fundo com base no status do atendente.
     * @param {number} status - O status do atendente (0, 1 ou 2).
     * @returns Uma string de classes CSS para a cor de fundo.
     */
    const getStatusColor = (status: number) => {
        switch (status) {
            case 1: return 'bg-emerald-500';
            case 2: return 'bg-amber-500';
            default: return 'bg-zinc-500';
        }
    };

    /**
     * Retorna o texto correspondente ao status do atendente.
     * @param {number} status - O status do atendente.
     * @returns O texto do status ('Online', 'Ocupado', 'Offline').
     */
    const getStatusText = (status: number) => {
        switch (status) {
            case 1: return 'Online';
            case 2: return 'Ocupado';
            default: return 'Offline';
        }
    };

    return (
        <div className="h-full overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 content-start">
                {attendantStats.map((attendant) => (
                    <div key={attendant.id} className="industrial-panel p-2 flex items-center gap-2 relative overflow-hidden group">
                        {attendant.avgDuration > ALERT_LIMIT_MINUTES * 60 ? (
                            <div className="absolute inset-0 bg-red-500/20 animate-pulse z-0" />
                        ) : attendant.activeCount >= 3 ? (
                            <div className="absolute inset-0 bg-blue-500/5 animate-pulse z-0" />
                        ) : null}

                        <div className="relative shrink-0">
                            {attendant.profilePicture?.url ? (
                                <img
                                    src={attendant.profilePicture.url}
                                    alt={attendant.name}
                                    className="w-12 h-12 rounded object-cover border-2 border-zinc-700 shadow-lg"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-lg font-bold text-zinc-500 shadow-lg">
                                    {attendant.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900 ${getStatusColor(attendant.status)}`} />
                        </div>

                        <div className="flex-1 min-w-0 z-10 flex flex-col h-full justify-between py-1">
                            <div>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-bold text-white truncate leading-tight" title={attendant.name}>
                                        {attendant.name}
                                    </h3>
                                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full text-zinc-950 ${getStatusColor(attendant.status)}`}>
                                        {getStatusText(attendant.status)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-2 bg-zinc-950/30 p-2 rounded border border-zinc-800/50">
                                <div className="flex flex-col items-center">
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Ativos</span>
                                    <span className="text-lg font-mono font-bold text-white leading-none">
                                        {attendant.activeCount}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center border-l border-zinc-800">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${attendant.avgDuration > ALERT_LIMIT_MINUTES * 60 ? 'text-red-500' : 'text-zinc-500'}`}>Médio</span>
                                    <span className={`text-sm font-mono font-bold leading-none ${attendant.avgDuration > ALERT_LIMIT_MINUTES * 60 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                                        {formatDurationFromSeconds(attendant.avgDuration)}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center border-l border-zinc-800 relative group/tooltip">
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Maior</span>
                                    <span className="text-sm font-mono font-bold text-amber-500 leading-none">
                                        {formatDurationFromSeconds(attendant.longestDuration)}
                                    </span>
                                    <div className="absolute bottom-full mb-2 right-0 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded border border-zinc-700 whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 pointer-events-none">
                                        {attendant.longestContactName}
                                    </div>
                                    <span className="text-[8px] text-zinc-600 truncate max-w-[60px] mt-0.5">
                                        {attendant.longestContactName.split(' ')[0]}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {attendantStats.length === 0 && (
                    <div className="col-span-full h-64 flex flex-col items-center justify-center text-zinc-600 gap-4 border-2 border-dashed border-zinc-800 rounded-lg">
                        <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-sm font-bold uppercase tracking-widest">Nenhum atendente com chamados ativos</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PcAttendantStatusDashboard;
