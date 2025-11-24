import React, { useMemo } from 'react';
import { SuriContact } from '../types';
import { parseISO, subSeconds } from 'date-fns';
import { formatSmartDuration } from '../utils';

interface DepartmentStatusDashboardProps {
    activeContacts: SuriContact[];
    departmentMap: Record<string, string>;
}

const DepartmentStatusDashboard: React.FC<DepartmentStatusDashboardProps> = ({ activeContacts, departmentMap }) => {

    const departmentStats = useMemo(() => {
        const stats = new Map<string, { count: number, totalDuration: number }>();
        const now = new Date();

        activeContacts.forEach(contact => {
            // Try to get department from agent first, then fallback to contact fields
            const deptId = contact.agent?.departmentId || contact.departmentId || contact.defaultDepartmentId || 'unknown';
            const current = stats.get(deptId) || { count: 0, totalDuration: 0 };

            const duration = Math.max(0, (now.getTime() - parseISO(contact.lastActivity).getTime()) / 1000);

            stats.set(deptId, {
                count: current.count + 1,
                totalDuration: current.totalDuration + duration
            });
        });

        return Array.from(stats.entries()).map(([deptId, stat]) => ({
            id: deptId,
            name: departmentMap[deptId] || (deptId === 'unknown' ? 'Sem Departamento' : 'Desconhecido'),
            activeCount: stat.count,
            avgDuration: stat.totalDuration / stat.count
        })).sort((a, b) => b.avgDuration - a.avgDuration); // Sort by average duration (highest first)
    }, [activeContacts, departmentMap]);

    return (
        <div className="h-full overflow-hidden p-2 flex flex-col">
            <div className="grid grid-cols-4 gap-2 content-start">
                {departmentStats.map((dept) => (
                    <div key={dept.id} className="industrial-panel p-2 flex items-center gap-2 relative overflow-hidden group">
                        {/* Background Pulse for high activity */}
                        {dept.activeCount >= 5 && (
                            <div className="absolute inset-0 bg-purple-500/5 animate-pulse" />
                        )}

                        {/* Icon Placeholder or Initials */}
                        <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-xl font-bold text-zinc-500 shadow-lg">
                                {dept.name.substring(0, 2).toUpperCase()}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 z-10">
                            <h3 className="text-base font-bold text-white truncate leading-tight" title={dept.name}>
                                {dept.name}
                            </h3>
                            <div className="flex flex-col gap-1 mt-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Ativos</span>
                                    <span className="text-lg font-mono font-bold text-purple-500 leading-none">
                                        {dept.activeCount}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-t border-zinc-800 pt-1">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">T. Médio</span>
                                    <span className="text-xs font-mono font-bold text-emerald-500 leading-none">
                                        {formatSmartDuration(subSeconds(new Date(), dept.avgDuration))}
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
