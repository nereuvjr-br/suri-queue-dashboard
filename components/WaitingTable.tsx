import React from 'react';
import { parseISO, format } from 'date-fns';
import { formatSmartDuration, getBusinessMinutes, DashboardColumn } from '../utils';
import PhoneDisplay from './PhoneDisplay';

interface WaitingTableProps {
  columns: DashboardColumn[];
  slaLimit?: number;
}

const WaitingTable: React.FC<WaitingTableProps> = ({ columns, slaLimit = 15 }) => {
  return (
    <div className="h-full overflow-hidden p-4 flex flex-col">
      <div className="grid grid-cols-5 gap-4 h-full">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col gap-3 bg-white/5 rounded-2xl p-4 border border-white/10 h-full shadow-xl overflow-hidden">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-1 h-6 bg-indigo-500 rounded-full shrink-0" />
                <h3 className="font-bold text-lg text-white truncate tracking-tight" title={column.title}>{column.title}</h3>
              </div>
              <span className="bg-white/5 text-white/60 text-sm font-medium px-3 py-1 rounded-lg border border-white/5">
                {column.contacts.length}
              </span>
            </div>

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-1 pt-1">
              {column.isEmpty ? (
                <div className="h-full flex flex-col items-center justify-center text-white/10 gap-3 pb-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium uppercase tracking-wider">Sem Fila</span>
                </div>
              ) : (
                <>
                  {column.contacts.map((contact, index) => {
                    const waitTime = parseISO(contact.lastActivity);
                    const now = new Date();
                    const diffInMinutes = getBusinessMinutes(waitTime, now);
                    const isSlaBreached = diffInMinutes >= slaLimit;
                    const entryTime = format(waitTime, 'HH:mm');
                    // Use startPosition from column to continue numbering
                    const position = (column.startPosition || 1) + index;

                    return (
                      <div
                        key={contact.id}
                        className={`relative p-3 rounded-xl border backdrop-blur-md transition-all hover:translate-y-[-2px] shrink-0 ${isSlaBreached
                          ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_4px_20px_-5px_rgba(244,63,94,0.3)]'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 shadow-lg'
                          }`}
                      >
                        {/* Position Badge */}
                        <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-lg border border-white/10 ${position === 1 ? 'bg-amber-400 text-amber-950' :
                          position === 2 ? 'bg-gray-300 text-gray-900' :
                            position === 3 ? 'bg-orange-300 text-orange-900' :
                              'bg-gray-800 text-gray-400'
                          }`}>
                          {position}º
                        </div>

                        <div className="flex flex-col gap-2.5">
                          {/* Header: Avatar & Name */}
                          <div className="flex items-center gap-3">
                            {contact.profilePicture?.url ? (
                              <img src={contact.profilePicture.url} alt="" className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10 shadow-md" />
                            ) : (
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold ring-1 ring-white/10 shadow-md ${isSlaBreached ? 'bg-rose-500/20 text-rose-200' : 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-300'
                                }`}>
                                {contact.name.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <h4 className="text-base font-bold text-white truncate leading-tight tracking-tight" title={contact.name}>
                                {contact.name}
                              </h4>
                              <div className="mt-0.5 flex items-center gap-2">
                                <PhoneDisplay phone={contact.phone} className="text-xs text-gray-400" />
                              </div>
                            </div>
                          </div>

                          {/* Footer: Time & SLA */}
                          <div className="flex items-end justify-between pt-2 border-t border-white/5">
                            <div className="flex flex-col">
                              <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Entrada</span>
                              <span className="text-xs font-mono text-gray-300">{entryTime}</span>
                            </div>

                            <div className="flex flex-col items-end">
                              <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-0.5">Tempo de Espera</span>
                              <div className={`text-xl font-black tabular-nums leading-none tracking-tight ${isSlaBreached ? 'text-rose-400 animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'text-white'
                                }`}>
                                {formatSmartDuration(waitTime)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Continuation Indicator */}
                  {column.hasMore && (
                    <div className="mt-1 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-indigo-300">Fila continua</p>
                        <p className="text-[10px] text-indigo-400/70 mt-0.5">Veja a próxima coluna</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WaitingTable;
