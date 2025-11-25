import React from 'react';
import { parseISO, format } from 'date-fns';
import { formatSmartDuration, getBusinessMinutes, DashboardColumn } from '../utils';
import PhoneDisplay from './PhoneDisplay';

interface PcWaitingTableProps {
    columns: DashboardColumn[];
    slaLimit?: number;
}

const PcWaitingTable: React.FC<PcWaitingTableProps> = ({ columns, slaLimit = 15 }) => {
    return (
        <div className="h-full overflow-y-auto p-4 custom-scrollbar">
            {/* Responsive Grid: Adjusts columns based on screen width */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {columns.map((column) => (
                    <div key={column.id} className="flex flex-col gap-2 bg-zinc-900/50 rounded-sm p-2 border border-zinc-800 h-[600px] shadow-inner overflow-hidden">
                        {/* Column Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-800 shrink-0">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-1 h-3 bg-blue-500 shrink-0" />
                                <h3 className="font-bold text-xs text-zinc-300 uppercase tracking-wider truncate" title={column.title}>{column.title}</h3>
                            </div>
                            <span className="bg-zinc-800 text-zinc-400 text-xs font-mono font-bold px-2 py-0.5 border border-zinc-700">
                                {column.contacts.length.toString().padStart(2, '0')}
                            </span>
                        </div>

                        {/* Cards Container */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-1 pt-1">
                            {column.isEmpty ? (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-700 gap-3 pb-10">
                                    <div className="w-12 h-12 border border-zinc-800 flex items-center justify-center bg-zinc-900">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest">Sem Fila</span>
                                </div>
                            ) : (
                                <>
                                    {column.contacts.map((contact, index) => {
                                        const waitTime = parseISO(contact.lastActivity);
                                        const now = new Date();
                                        const diffInMinutes = getBusinessMinutes(waitTime, now);
                                        const isSlaBreached = diffInMinutes >= slaLimit;
                                        const entryTime = format(waitTime, 'HH:mm');
                                        const position = (column.startPosition || 1) + index;

                                        return (
                                            <div
                                                key={contact.id}
                                                className={`relative p-2 border-l-2 transition-all hover:bg-zinc-800 shrink-0 group ${isSlaBreached
                                                    ? 'bg-red-900/10 border-l-red-500 border-y border-r border-zinc-800'
                                                    : 'bg-zinc-900 border-l-zinc-600 border-y border-r border-zinc-800'
                                                    }`}
                                            >
                                                {/* Position Badge */}
                                                <div className="absolute top-2 right-2 text-[10px] font-mono font-bold text-zinc-600">
                                                    #{position.toString().padStart(2, '0')}
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    {/* Header: Avatar & Name */}
                                                    <div className="flex items-center gap-3 pr-6">
                                                        {contact.profilePicture?.url ? (
                                                            <img src={contact.profilePicture.url} alt="" className="w-8 h-8 object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                                                        ) : (
                                                            <div className={`w-8 h-8 flex items-center justify-center text-xs font-bold border ${isSlaBreached ? 'bg-red-900/20 border-red-900 text-red-500' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                                                                }`}>
                                                                {contact.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}

                                                        <div className="min-w-0 flex-1">
                                                            <h4 className="text-sm font-bold text-zinc-200 truncate leading-tight tracking-tight" title={contact.name}>
                                                                {contact.name}
                                                            </h4>
                                                            <div className="mt-0.5 flex items-center gap-2">
                                                                <PhoneDisplay phone={contact.phone} className="text-[10px] font-mono text-zinc-500" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Footer: Time & SLA */}
                                                    <div className="flex items-end justify-between pt-2 border-t border-zinc-800/50 mt-1">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-600">Entrada</span>
                                                            <span className="text-xs font-mono text-zinc-400">{entryTime}</span>
                                                        </div>

                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-600 mb-0.5">Espera</span>
                                                            <div className={`text-base font-mono font-bold leading-none tracking-tight ${isSlaBreached ? 'text-red-500 animate-pulse' : 'text-zinc-300'
                                                                }`}>
                                                                {formatSmartDuration(waitTime)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PcWaitingTable;
