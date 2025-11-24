import React, { useMemo } from 'react';
import { SuriAttendant, SuriContact } from '../types';
import { parseISO, subSeconds } from 'date-fns';
import { formatSmartDuration } from '../utils';

interface AttendantStatusDashboardProps {
    attendants: SuriAttendant[];
    activeContacts: SuriContact[];
}

const AttendantStatusDashboard: React.FC<AttendantStatusDashboardProps> = ({ attendants, activeContacts }) => {

    const attendantStats = useMemo(() => {
        // Count active contacts and calculate duration per attendant
        const stats = new Map<string, { count: number, totalDuration: number }>();
        const now = new Date();

        activeContacts.forEach(contact => {
            const agentId = contact.agent?.platformUserId;
            if (agentId) {
                const current = stats.get(agentId) || { count: 0, totalDuration: 0 };
                // Using lastActivity as the reference for duration, consistent with other dashboards
                const duration = Math.max(0, (now.getTime() - parseISO(contact.lastActivity).getTime()) / 1000);

                stats.set(agentId, {
                    count: current.count + 1,
                    totalDuration: current.totalDuration + duration
                });
            }
        });

        // Filter attendants with active chats and map to display data
        return attendants
            .filter(attendant => stats.has(attendant.id))
            .map(attendant => {
                const stat = stats.get(attendant.id)!;
                return {
                    ...attendant,
                    activeCount: stat.count,
                    avgDuration: stat.totalDuration / stat.count
                };
            })
            .sort((a, b) => b.avgDuration - a.avgDuration); // Sort by average duration (highest first)
    }, [attendants, activeContacts]);

    return (
        <div className="h-full overflow-hidden p-2 flex flex-col">
            <div className="grid grid-cols-4 gap-2 content-start">
                {attendantStats.map((attendant) => (
                    <div key={attendant.id} className="industrial-panel p-2 flex items-center gap-2 relative overflow-hidden group">
                        {/* Background Pulse for high activity */}
                        {attendant.activeCount >= 3 && (
                            <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
                        )}

                        {/* Avatar */}
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
                            {/* Status Dot */}
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900 ${attendant.status === 1 ? 'bg-emerald-500' :
                                attendant.status === 2 ? 'bg-amber-500' : 'bg-zinc-500'
                                }`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 z-10">
                            <h3 className="text-base font-bold text-white truncate leading-tight" title={attendant.name}>
                                {attendant.name}
                            </h3>
                            <div className="flex flex-col gap-1 mt-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Atendimentos</span>
                                    <span className="text-lg font-mono font-bold text-blue-500 leading-none">
                                        {attendant.activeCount}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-t border-zinc-800 pt-1">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">T. Médio</span>
                                    <span className="text-xs font-mono font-bold text-emerald-500 leading-none">
                                        {formatSmartDuration(subSeconds(new Date(), attendant.avgDuration))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {attendantStats.length === 0 && (
                    <div className="col-span-4 h-64 flex flex-col items-center justify-center text-zinc-600 gap-4 border-2 border-dashed border-zinc-800 rounded-lg">
                        <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-sm font-bold uppercase tracking-widest">Nenhum atendente com chamados ativos</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendantStatusDashboard;
