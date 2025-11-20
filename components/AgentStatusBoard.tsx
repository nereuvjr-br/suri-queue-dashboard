import React, { useMemo } from 'react';
import { SuriAttendant, SuriContact } from '../types';

interface AgentStatusBoardProps {
  attendants: SuriAttendant[];
  activeContacts: SuriContact[];
}

const AgentStatusBoard: React.FC<AgentStatusBoardProps> = ({ attendants, activeContacts }) => {

  // Filter and sort agents
  const validAgents = useMemo(() => {
    if (!Array.isArray(attendants)) return [];

    return [...attendants]
      .filter(a => {
        // Remove invalid entries
        if (!a || typeof a !== 'object') return false;
        // Remove incomplete registrations (id or name is null)
        if (!a.id || !a.name) return false;
        // Remove "Atendente" placeholder names
        if (a.name.trim() === 'Atendente') return false;
        return true;
      })
      .sort((a, b) => {
        // Sort: Online (1) > Busy (2) > Offline (0)
        const score = (status: number) => {
          if (status === 1) return 3; // Online - highest priority
          if (status === 2) return 2; // Busy
          return 1; // Offline
        };
        return score(b.status || 0) - score(a.status || 0);
      });
  }, [attendants]);

  // Calculate statistics
  const stats = useMemo(() => {
    const online = validAgents.filter(a => a.status === 1).length;
    const busy = validAgents.filter(a => a.status === 2).length;
    const offline = validAgents.filter(a => a.status === 0 || !a.status).length;

    return { online, busy, offline, total: validAgents.length };
  }, [validAgents]);

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]';
      case 2: return 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]';
      default: return 'border-gray-700/50 bg-gray-800/30 opacity-50';
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1: return 'Online';
      case 2: return 'Ocupado';
      default: return 'Offline';
    }
  };

  const getStatusDot = (status: number) => {
    switch (status) {
      case 1: return 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-pulse';
      case 2: return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]';
      default: return 'bg-gray-500';
    }
  };

  if (validAgents.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-6">
        <div className="bg-gray-500/10 p-8 rounded-full ring-1 ring-gray-500/30">
          <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-3xl font-bold text-white">Nenhum Agente</h3>
          <p className="text-lg text-gray-500 mt-2">Aguardando cadastros completos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 p-6">

      {/* Statistics Header */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-white/10 flex flex-col items-center">
          <div className="text-4xl font-bold text-white">{stats.total}</div>
          <div className="text-xs uppercase tracking-wider text-gray-400 mt-1">Total</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col items-center">
          <div className="text-4xl font-bold text-emerald-400">{stats.online}</div>
          <div className="text-xs uppercase tracking-wider text-emerald-300 mt-1">Online</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col items-center">
          <div className="text-4xl font-bold text-amber-400">{stats.busy}</div>
          <div className="text-xs uppercase tracking-wider text-amber-300 mt-1">Ocupados</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-gray-700/30 bg-gray-800/20 flex flex-col items-center">
          <div className="text-4xl font-bold text-gray-400">{stats.offline}</div>
          <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">Offline</div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {validAgents.map((agent, index) => {
            const name = agent.name || "Sem Nome";
            const initial = name.charAt(0).toUpperCase();
            const status = agent.status || 0;
            const key = agent.id || `agent-${index}`;

            return (
              <div
                key={key}
                className={`glass-card p-5 rounded-2xl border flex flex-col items-center gap-3 transition-all hover:scale-105 ${getStatusColor(status)}`}
              >
                <div className="relative">
                  {agent.profilePicture?.url ? (
                    <img
                      src={agent.profilePicture.url}
                      alt=""
                      className="w-20 h-20 rounded-full object-cover ring-2 ring-white/20"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-2xl font-bold text-white ring-2 ring-white/20 shadow-lg">
                      {initial}
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-slate-900 ${getStatusDot(status)}`} />
                </div>

                <div className="text-center w-full">
                  <h3 className="text-white font-bold truncate text-lg leading-tight">
                    {name}
                  </h3>
                  {agent.email && (
                    <p className="text-xs text-gray-400 truncate mt-1">
                      {agent.email}
                    </p>
                  )}
                  <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block ${status === 1
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : status === 2
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-gray-700/30 text-gray-400'
                    }`}>
                    {getStatusLabel(status)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AgentStatusBoard;