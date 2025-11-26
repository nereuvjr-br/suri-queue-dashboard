import React, { useState, useEffect } from 'react';
import { SuriContact, SuriAttendant } from '../types';
import { parseISO, format, differenceInSeconds, intervalToDuration } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PhoneDisplay from './PhoneDisplay';
import { getBusinessMinutes } from '../utils';

/**
 * @interface ContactDetailsModalProps
 * Propriedades para o componente ContactDetailsModal.
 */
interface ContactDetailsModalProps {
    /** O objeto de contato a ser exibido. Se nulo, o modal não é renderizado. */
    contact: SuriContact | null;
    /** Função para fechar o modal. */
    onClose: () => void;
    /** Mapa de IDs de departamento para nomes, para exibição. */
    departmentMap?: Record<string, string>;
    /** Lista de atendentes para encontrar o nome do agente. */
    attendants?: SuriAttendant[];
    /** O limite de SLA em minutos para destacar o tempo de espera. */
    slaLimit?: number;
}

/**
 * @component ContactDetailsModal
 * Um modal que exibe informações detalhadas sobre um contato específico,
 * incluindo tempos de espera, dados de atendimento e variáveis personalizadas.
 *
 * @param {ContactDetailsModalProps} props - As propriedades do componente.
 * @returns O modal de detalhes do contato renderizado, ou `null` se não houver contato.
 */
const ContactDetailsModal: React.FC<ContactDetailsModalProps> = ({ contact, onClose, departmentMap, attendants, slaLimit = 15 }) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        if (!contact) return;
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, [contact]);

    if (!contact) return null;

    /**
     * Obtém o nome de um departamento a partir de seu ID.
     * @param {string | null | undefined} id - O ID do departamento.
     * @returns O nome do departamento ou o ID se não for encontrado.
     */
    const getDepartmentName = (id?: string | null) => {
        if (!id) return 'Nenhum';
        if (departmentMap) {
            const lowerId = id.toLowerCase().trim();
            const foundKey = Object.keys(departmentMap).find(k => k.toLowerCase().trim() === lowerId);
            if (foundKey) return departmentMap[foundKey];
        }
        return id;
    };

    /**
     * Obtém o nome de um agente a partir de seu ID.
     * @param {string | undefined} id - O ID do agente.
     * @returns O nome do agente ou o ID se não for encontrado.
     */
    const getAgentName = (id?: string) => {
        if (!id) return 'Desconhecido';
        if (attendants) {
            const agent = attendants.find(a => a.id === id);
            if (agent) return agent.name;
        }
        return id;
    };

    /**
     * Formata uma chave (de camelCase/snake_case para Title Case).
     * @param {string} key - A chave a ser formatada.
     * @returns A chave formatada.
     */
    const formatKey = (key: string) => {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .replace(/^\w/, c => c.toUpperCase())
            .trim();
    };

    /**
     * Formata um valor para exibição.
     * @param {any} value - O valor a ser formatado.
     * @returns O valor formatado como string.
     */
    const formatValue = (value: any) => {
        if (value === true) return 'Sim';
        if (value === false) return 'Não';
        if (value === null || value === undefined) return '-';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    };

    /**
     * Cria uma string de duração detalhada (anos, meses, dias, horas, etc.).
     * @param {Date} start - A data de início.
     * @param {Date} end - A data de fim.
     * @returns A string de duração formatada.
     */
    const getDetailedDurationString = (start: Date, end: Date) => {
        if (start > end) return '0s';

        const duration = intervalToDuration({ start, end });
        const parts = [];

        if (duration.years) parts.push(`${duration.years} ano${duration.years > 1 ? 's' : ''}`);
        if (duration.months) parts.push(`${duration.months} ${duration.months > 1 ? 'meses' : 'mês'}`);
        if (duration.days) parts.push(`${duration.days} dia${duration.days > 1 ? 's' : ''}`);
        if (duration.hours) parts.push(`${duration.hours}h`);
        if (duration.minutes) parts.push(`${duration.minutes}m`);
        if (duration.seconds) parts.push(`${duration.seconds}s`);

        if (parts.length === 0) return '0s';
        return parts.join(' ');
    };

    /**
     * Formata uma duração em minutos para o formato "Xh Ym".
     * @param {number} minutes - O total de minutos.
     * @returns A duração formatada.
     */
    const formatBusinessDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = Math.floor(minutes % 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };


    const waitingStartDate = contact.agent?.dateRequest ? parseISO(contact.agent.dateRequest) : (contact.dateCreate ? parseISO(contact.dateCreate) : now);
    const waitingEndDate = contact.agent?.dateAnswer ? parseISO(contact.agent.dateAnswer) : now;
    const waitingTimeBusinessMinutes = getBusinessMinutes(waitingStartDate, waitingEndDate);
    const waitingTimeDetailed = getDetailedDurationString(waitingStartDate, waitingEndDate);

    const serviceStartDate = contact.agent?.dateAnswer ? parseISO(contact.agent.dateAnswer) : null;
    const serviceTimeBusinessMinutes = serviceStartDate ? getBusinessMinutes(serviceStartDate, now) : 0;
    const serviceTimeDetailed = serviceStartDate ? getDetailedDurationString(serviceStartDate, now) : '-';

    const effectiveDepartmentId = contact.departmentId || contact.agent?.departmentId;
    const isSlaBreached = waitingTimeBusinessMinutes >= slaLimit;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-zinc-900 w-full max-w-2xl rounded-xl border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabeçalho */}
                <div className="p-6 border-b border-zinc-800 flex items-start justify-between bg-zinc-950/50">
                    <div className="flex items-center gap-4">
                        {contact.profilePicture?.url ? (
                            <img src={contact.profilePicture.url} alt="" className="w-16 h-16 rounded-lg object-cover border border-zinc-700" />
                        ) : (
                            <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-500 border border-zinc-700">
                                {contact.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">{contact.name}</h2>
                            <PhoneDisplay phone={contact.phone} className="text-zinc-400 font-mono text-sm" />
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Conteúdo */}
                <div className="p-6 h-[60vh] overflow-y-auto custom-scrollbar space-y-8">

                    {/* Grid de Informações Primárias */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 pb-2">Informações Básicas</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoItem label="Canal" value={getChannelName(contact.channelType)} />
                                <InfoItem label="Criado em" value={formatDate(contact.dateCreate)} />
                                <InfoItem label="Última Atividade" value={formatDate(contact.lastActivity)} />
                                <InfoItem label="Email" value={contact.email || '-'} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 pb-2">Status & Fila</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoItem label="Departamento Atual" value={getDepartmentName(effectiveDepartmentId)} />
                                <InfoItem label="Departamento Padrão" value={getDepartmentName(contact.defaultDepartmentId)} />

                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Tempo de Espera (Útil)</label>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-lg font-bold font-mono ${isSlaBreached ? 'text-red-500' : 'text-amber-500'}`}>
                                            {formatBusinessDuration(waitingTimeBusinessMinutes)}
                                        </span>
                                        {isSlaBreached ? (
                                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold uppercase rounded border border-red-500/30">
                                                SLA Estourado
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded border border-emerald-500/30">
                                                Dentro do SLA
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                        Tempo corrido: {waitingTimeDetailed}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Informações do Agente */}
                    {contact.agent && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 pb-2">Atendimento Atual</h3>
                            <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoItem label="Atendente" value={getAgentName(contact.agent.platformUserId)} />
                                <InfoItem label="Início do Atendimento" value={formatDate(contact.agent.dateAnswer)} />
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Tempo em Atendimento (Útil)</label>
                                    <div className="text-lg font-bold font-mono text-emerald-500">
                                        {formatBusinessDuration(serviceTimeBusinessMinutes)}
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                        Tempo corrido: {serviceTimeDetailed}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Variáveis & Campos Personalizados */}
                    {(contact.variables || contact.customFields) && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 pb-2">Dados Adicionais</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Object.entries(contact.variables || {}).map(([key, value]) => (
                                    <div key={key} className="bg-zinc-950 p-3 rounded border border-zinc-800 flex flex-col">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase truncate" title={formatKey(key)}>{formatKey(key)}</span>
                                        <span className="text-sm text-zinc-300 font-mono truncate" title={String(value)}>{formatValue(value)}</span>
                                    </div>
                                ))}
                                {Object.entries(contact.customFields || {}).map(([key, value]) => (
                                    <div key={key} className="bg-zinc-950 p-3 rounded border border-zinc-800 flex flex-col">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase truncate" title={formatKey(key)}>{formatKey(key)}</span>
                                        <span className="text-sm text-zinc-300 font-mono truncate" title={String(value)}>{formatValue(value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Rodapé */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-950/30 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold text-sm transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * @component InfoItem
 * Um componente auxiliar para exibir um item de informação com rótulo e valor.
 */
const InfoItem: React.FC<{ label: string; value: React.ReactNode; subValue?: string; mono?: boolean }> = ({ label, value, subValue, mono }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{label}</label>
        <div className={`text-sm text-zinc-300 ${mono ? 'font-mono' : ''} break-words`}>
            {value || '-'}
            {subValue && <span className="block text-xs text-zinc-500 mt-0.5">{subValue}</span>}
        </div>
    </div>
);

/**
 * Retorna o nome do canal com base no tipo.
 * @param {number} type - O tipo de canal.
 * @returns O nome do canal.
 */
const getChannelName = (type: number) => {
    switch (type) {
        case 0: return 'WhatsApp';
        case 1: return 'Facebook';
        case 2: return 'Instagram';
        case 3: return 'Webchat';
        default: return 'Outro';
    }
};

/**
 * Formata uma string de data para um formato legível.
 * @param {string | undefined} dateString - A string de data ISO.
 * @returns A data formatada ou '-'.
 */
const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        return format(parseISO(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
        return dateString;
    }
};

export default ContactDetailsModal;
