import React, { useMemo } from 'react';
import { SuriContact, SuriAttendant } from '../types';
import { parseISO, subSeconds } from 'date-fns';
import { formatSmartDuration } from '../utils';

interface DepartmentStatusDashboardProps {
    activeContacts: SuriContact[];
    departmentMap: Record<string, string>;
    attendants: SuriAttendant[];
}

const ALERT_LIMIT_MINUTES = Number(import.meta.env.VITE_AVG_TIME_ALERT_LIMIT) || 30;

const DepartmentStatusDashboard: React.FC<DepartmentStatusDashboardProps> = ({ activeContacts, departmentMap, attendants }) => {

    const agentNameMap = useMemo(() => {
        return attendants.reduce((acc, curr) => {
            acc[curr.id] = curr.name;
            return acc;
        }, {} as Record<string, string>);
    }, [attendants]);

    const departmentStats = useMemo(() => {
        const stats = new Map<string, { count: number, totalDuration: number, longestDuration: number, longestAgentName: string, agents: Set<string> }>();
        const now = new Date();

        activeContacts.forEach(contact => {
            // Try to get department from agent first, then fallback to contact fields
            const deptId = contact.agent?.departmentId || contact.departmentId || contact.defaultDepartmentId || 'unknown';
            const current = stats.get(deptId) || { count: 0, totalDuration: 0, longestDuration: 0, longestAgentName: '', agents: new Set<string>() };

            const duration = Math.max(0, (now.getTime() - parseISO(contact.lastActivity).getTime()) / 1000);

            const agentId = contact.agent?.platformUserId || '';
            const agentName = agentNameMap[agentId] || 'Desconhecido';

            if (agentId) {
                current.agents.add(agentId);
            }

            if (duration > current.longestDuration) {
                current.longestDuration = duration;
                current.longestAgentName = agentName;
            }

            stats.set(deptId, {
                count: current.count + 1,
                totalDuration: current.totalDuration + duration,
                longestDuration: current.longestDuration,
                longestAgentName: current.longestAgentName,
                agents: current.agents
            });
        });

        return Array.from(stats.entries()).map(([deptId, stat]) => ({
            id: deptId,
            name: departmentMap[deptId] || (deptId === 'unknown' ? 'Sem Departamento' : 'Desconhecido'),
            activeCount: stat.count,
            avgDuration: stat.count > 0 ? stat.totalDuration / stat.count : 0,
            longestDuration: stat.longestDuration,
            longestAgentName: stat.longestAgentName,
            agentCount: stat.agents.size
        })).sort((a, b) => {
            const limitSeconds = ALERT_LIMIT_MINUTES * 60;
            const aCritical = a.avgDuration > limitSeconds;
            const bCritical = b.avgDuration > limitSeconds;

            if (aCritical && !bCritical) return -1;
            if (!aCritical && bCritical) return 1;

            return b.avgDuration - a.avgDuration;
        });
    }, [activeContacts, departmentMap, agentNameMap]);

    return (
        <div className="h-full overflow-hidden p-2 flex flex-col">
            <div className="grid grid-cols-4 gap-2 content-start">
                {departmentStats.map((dept) => (
                    <div key={dept.id} className="industrial-panel p-2 flex items-center gap-2 relative overflow-hidden group">
                        {/* Alert Background Pulse */}
                        {dept.avgDuration > ALERT_LIMIT_MINUTES * 60 ? (
                            <div className="absolute inset-0 bg-red-500/20 animate-pulse z-0" />
                        ) : dept.activeCount >= 5 ? (
                            <div className="absolute inset-0 bg-purple-500/5 animate-pulse z-0" />
                        ) : null}

                        {/* Icon Placeholder or Initials */}
                        <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-xl font-bold text-zinc-500 shadow-lg">
                                {dept.name.substring(0, 2).toUpperCase()}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 z-10 flex flex-col h-full justify-between py-1">
                            <div>
                                <h3 className="text-base font-bold text-white truncate leading-tight" title={dept.name}>
                                    {dept.name}
                                </h3>
                            </div>

                            <div className="grid grid-cols-4 gap-2 mt-2 bg-zinc-950/30 p-2 rounded border border-zinc-800/50">
                                <div className="flex flex-col items-center">
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Ativos</span>
                                    <span className="text-lg font-mono font-bold text-white leading-none">
                                        {dept.activeCount}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center border-l border-zinc-800">
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Agentes</span>
                                    <span className="text-lg font-mono font-bold text-blue-500 leading-none">
                                        {dept.agentCount}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center border-l border-zinc-800">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${dept.avgDuration > ALERT_LIMIT_MINUTES * 60 ? 'text-red-500' : 'text-zinc-500'}`}>Médio</span>
                                    <span className={`text-sm font-mono font-bold leading-none ${dept.avgDuration > ALERT_LIMIT_MINUTES * 60 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                                        {formatSmartDuration(subSeconds(new Date(), dept.avgDuration))}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center border-l border-zinc-800 relative group/tooltip">
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Maior</span>
                                    <span className="text-sm font-mono font-bold text-amber-500 leading-none">
                                        {formatSmartDuration(subSeconds(new Date(), dept.longestDuration))}
                                    </span>
                                    {/* Tooltip for Longest Agent Name */}
                                    <div className="absolute bottom-full mb-2 right-0 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded border border-zinc-700 whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 pointer-events-none">
                                        {dept.longestAgentName}
                                    </div>
                                    {/* Inline Name for TV visibility */}
                                    <span className="text-[8px] text-zinc-600 truncate max-w-[60px] mt-0.5">
                                        {dept.longestAgentName.split(' ')[0]}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {departmentStats.length === 0 && (
                    <div className="col-span-4 h-64 flex flex-col items-center justify-center text-zinc-600 gap-4 border-2 border-dashed border-zinc-800 rounded-lg">
                        <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="text-sm font-bold uppercase tracking-widest">Nenhum departamento com chamados ativos</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DepartmentStatusDashboard;
