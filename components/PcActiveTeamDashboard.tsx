import React, { useMemo } from 'react';
import { SuriAttendant } from '../types';
import { parseISO } from 'date-fns';
import { formatSmartDuration, DashboardColumn } from '../utils';
import PhoneDisplay from './PhoneDisplay';

// Component for displaying active team dashboard
interface PcActiveTeamDashboardProps {
    columns: DashboardColumn[];
    attendants: SuriAttendant[];
}

const PcActiveTeamDashboard: React.FC<PcActiveTeamDashboardProps> = ({ columns, attendants }) => {

    // Map attendants by ID for quick lookup
    const attendantMap = useMemo(() => {
        const map: Record<string, SuriAttendant> = {};
        attendants.forEach(a => {
            map[a.platformUserId] = a;
        });
        return map;
    }, [attendants]);

    return (
        <div className="h-full overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {columns.map((column) => (
                    <div key={column.id} className="flex flex-col gap-2 bg-zinc-900/50 rounded-sm p-2 border border-zinc-800 h-[600px] shadow-inner overflow-hidden">
                        {/* Column Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-800 shrink-0">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-1 h-3 bg-emerald-500 shrink-0" />
                                <h3 className="font-bold text-xs text-zinc-300 uppercase tracking-wider truncate" title={column.title}>{column.title}</h3>
                            </div>
                            <span className="bg-zinc-800 text-zinc-400 text-xs font-mono font-bold px-2 py-0.5 border border-zinc-700">
                                {column.contacts.length.toString().padStart(2, '0')}
                            </span>
                        </div>

                        {/* Cards Container */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col gap-2 pr-1 pt-1">
                            {column.isEmpty ? (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-700 gap-3 pb-10">
                                    <div className="w-12 h-12 border border-zinc-800 flex items-center justify-center bg-zinc-900">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 2 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest">Sem Atendimentos</span>
                                </div>
                            ) : (
                                column.contacts.map((contact) => {
                                    const startTime = parseISO(contact.lastActivity);

                                    // Find Agent using platformUserId from contact.agent
                                    const agentId = contact.agent?.platformUserId;
                                    const agent = agentId ? attendants.find(a => a.id === agentId) : undefined;
                                    const agentName = agent?.name || 'Desconhecido';
                                    const agentInitial = agentName.charAt(0).toUpperCase();

                                    return (
                                        <div key={contact.id} className="relative p-2 border-l-2 border-l-emerald-500 border-y border-r border-zinc-800 bg-zinc-900 transition-all hover:bg-zinc-800 shrink-0 group">

                                            <div className="flex flex-col gap-2">
                                                {/* Header: Client Info */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-sm font-bold text-zinc-200 truncate leading-tight tracking-tight" title={contact.name}>
                                                            {contact.name}
                                                        </h4>
                                                        <div className="mt-0.5">
                                                            <PhoneDisplay phone={contact.phone} className="text-[10px] font-mono text-zinc-500" />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end shrink-0 bg-zinc-950 px-2 py-1 border border-zinc-800">
                                                        <span className="text-[8px] uppercase tracking-wider font-bold text-zinc-600 mb-0.5">Duração</span>
                                                        <span className="text-sm font-mono font-bold text-emerald-500 leading-none">
                                                            {formatSmartDuration(startTime)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Footer: Agent Info */}
                                                <div className="flex items-center gap-2.5 pt-2 border-t border-zinc-800/50 mt-1">
                                                    {agent?.profilePicture?.url ? (
                                                        <img src={agent.profilePicture.url} alt="" className="w-6 h-6 object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                                                    ) : (
                                                        <div className="w-6 h-6 bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 border border-zinc-700">
                                                            {agentInitial}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        <div className="text-[8px] text-zinc-600 uppercase tracking-wider font-bold leading-none mb-0.5">Atendente</div>
                                                        <div className="text-[10px] font-medium text-zinc-400 truncate leading-none" title={agentName}>
                                                            {agentName}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PcActiveTeamDashboard;
