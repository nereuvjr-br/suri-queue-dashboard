import React, { useMemo } from 'react';
import { SuriAttendant } from '../types';
import { parseISO } from 'date-fns';
import { formatSmartDuration, DashboardColumn } from '../utils';
import PhoneDisplay from './PhoneDisplay';

// Component for displaying active team dashboard
interface ActiveTeamDashboardProps {
  columns: DashboardColumn[];
  attendants: SuriAttendant[];
}

const ActiveTeamDashboard: React.FC<ActiveTeamDashboardProps> = ({ columns, attendants }) => {

  // Map attendants by ID for quick lookup
  const attendantMap = useMemo(() => {
    const map: Record<string, SuriAttendant> = {};
    attendants.forEach(a => {
      map[a.platformUserId] = a;
    });
    return map;
  }, [attendants]);

  // Removed "Silêncio Total" full screen message to allow showing empty columns
  // if (contacts.length === 0) { ... }

  return (
    <div className="h-full overflow-hidden p-4 flex flex-col">
      <div className="grid grid-cols-5 gap-4 h-full">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col gap-3 bg-white/5 rounded-2xl p-4 border border-white/10 h-full shadow-xl overflow-hidden">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-1 h-6 bg-emerald-500 rounded-full shrink-0" />
                <h3 className="font-bold text-lg text-white truncate tracking-tight" title={column.title}>{column.title}</h3>
              </div>
              <span className="bg-white/5 text-white/60 text-sm font-medium px-3 py-1 rounded-lg border border-white/5">
                {column.contacts.length}
              </span>
            </div>

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col gap-2 pr-1 pt-1">
              {column.isEmpty ? (
                <div className="h-full flex flex-col items-center justify-center text-white/10 gap-3 pb-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 2 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium uppercase tracking-wider">Sem Atendimentos</span>
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
                    <div key={contact.id} className="relative p-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md transition-all hover:bg-white/10 hover:translate-y-[-2px] shrink-0 shadow-lg group">

                      <div className="flex flex-col gap-2.5">
                        {/* Header: Client Info */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-base font-bold text-white truncate leading-tight tracking-tight" title={contact.name}>
                              {contact.name}
                            </h4>
                            <div className="mt-0.5">
                              <PhoneDisplay phone={contact.phone} className="text-xs text-gray-400" />
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 bg-black/20 px-2.5 py-1.5 rounded-lg border border-white/5">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-0.5">Duração</span>
                            <span className="text-base font-mono font-bold text-emerald-400 leading-none">
                              {formatSmartDuration(startTime)}
                            </span>
                          </div>
                        </div>

                        {/* Footer: Agent Info */}
                        <div className="flex items-center gap-2.5 pt-2 border-t border-white/5">
                          {agent?.profilePicture?.url ? (
                            <img src={agent.profilePicture.url} alt="" className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/10" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 ring-1 ring-white/10">
                              {agentInitial}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Atendente</div>
                            <div className="text-xs font-medium text-gray-200 truncate" title={agentName}>
                              {agentName}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Continuation Indicator */}
              {!column.isEmpty && column.hasMore && (
                <div className="mt-1 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-emerald-300">Atendimentos continuam</p>
                    <p className="text-[10px] text-emerald-400/70 mt-0.5">Veja a próxima coluna</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveTeamDashboard;