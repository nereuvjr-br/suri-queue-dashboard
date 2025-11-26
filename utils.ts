import { differenceInMinutes, differenceInHours, differenceInDays, differenceInMonths, addDays, startOfDay, endOfDay, isSameDay, isWeekend, parseISO, subSeconds } from 'date-fns';
import { SuriContact } from './types';

const BUSINESS_START_HOUR = Number(import.meta.env.VITE_BUSINESS_START_HOUR) || 8;
const BUSINESS_END_HOUR = Number(import.meta.env.VITE_BUSINESS_END_HOUR) || 16;

export const getBusinessMinutes = (start: Date | string, end: Date | string): number => {
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;

    if (startDate >= endDate) return 0;

    let totalMinutes = 0;
    let current = new Date(startDate);

    while (current < endDate) {
        if (!isWeekend(current)) {
            const businessStart = new Date(current);
            businessStart.setHours(BUSINESS_START_HOUR, 0, 0, 0);

            const businessEnd = new Date(current);
            businessEnd.setHours(BUSINESS_END_HOUR, 0, 0, 0);

            const nextMidnight = startOfDay(addDays(current, 1));
            const intervalEnd = endDate < nextMidnight ? endDate : nextMidnight;

            const overlapStart = current > businessStart ? current : businessStart;
            const overlapEnd = intervalEnd < businessEnd ? intervalEnd : businessEnd;

            if (overlapStart < overlapEnd) {
                totalMinutes += (overlapEnd.getTime() - overlapStart.getTime()) / 60000;
            }
        }

        current = startOfDay(addDays(current, 1));
    }

    return Math.floor(totalMinutes);
};

export const formatSmartDuration = (dateInput: string | Date): string => {
    const now = new Date();
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    const minutes = getBusinessMinutes(date, now);
    const hours = Math.floor(minutes / 60);

    if (minutes < 60) {
        return `${minutes}m`;
    } else if (hours < 24) {
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    } else {
        const displayDays = Math.floor(hours / 8);
        const remainingHours = hours % 8;
        return `${displayDays}d ${remainingHours}h`;
    }
};

export interface SlaStatus {
    isOverdue: boolean;
    minutesOverdue: number;
    minutesRemaining: number;
    formattedTime: string;
    percentage: number; // 0 to 100 (or more if overdue)
}

export const getSlaStatus = (contact: SuriContact, slaLimit: number): SlaStatus => {
    const now = new Date();
    const waitTime = parseISO(contact.lastActivity);
    const minutesWaiting = getBusinessMinutes(waitTime, now);

    const isOverdue = minutesWaiting >= slaLimit;
    const minutesOverdue = isOverdue ? minutesWaiting - slaLimit : 0;
    const minutesRemaining = isOverdue ? 0 : slaLimit - minutesWaiting;

    let formattedTime = '';
    if (isOverdue) {
        formattedTime = `-${minutesOverdue}m`;
    } else {
        formattedTime = `${minutesRemaining}m`;
    }

    const percentage = Math.min(100, Math.max(0, (minutesWaiting / slaLimit) * 100));

    return {
        isOverdue,
        minutesOverdue,
        minutesRemaining,
        formattedTime,
        percentage
    };
};

export const formatDurationFromSeconds = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(minutes / 60);

    if (minutes < 60) {
        return `${minutes}m`;
    } else if (hours < 24) {
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    } else {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days}d ${remainingHours}h`;
    }
};

export const getBusinessDurationInSeconds = (start: Date | string, end: Date | string): number => {
    return getBusinessMinutes(start, end) * 60;
};

export const getAttendanceDuration = (contact: SuriContact): string => {
    const now = new Date();
    // Use dateAnswer if available (start of attendance), otherwise fallback to lastActivity
    const startDate = contact.agent?.dateAnswer
        ? parseISO(contact.agent.dateAnswer)
        : parseISO(contact.lastActivity);

    const seconds = getBusinessDurationInSeconds(startDate, now);
    return formatDurationFromSeconds(seconds);
};

export const getDepartmentName = (contact: SuriContact, map: Record<string, string>): string => {
    // Try specific department first, then agent's department, then default
    const id = contact.departmentId || contact.agent?.departmentId || contact.defaultDepartmentId;

    if (!id) return 'Geral';

    // Try to find in map (case insensitive)
    const mapped = map[id.trim().toLowerCase()];
    if (mapped) return mapped;

    return id;
};

export function getAllDepartments(
    waitingContacts: SuriContact[],
    activeContacts: SuriContact[],
    departmentMap: Record<string, string>
): string[] {
    const deptIds = new Set<string>();

    Object.keys(departmentMap).forEach(id => deptIds.add(id));

    waitingContacts.forEach(c => {
        if (c.departmentId) deptIds.add(c.departmentId);
    });
    activeContacts.forEach(c => {
        if (c.departmentId) deptIds.add(c.departmentId);
    });

    const excludedDepartments = ['Koerner Express', 'Sem Escolha de Setor'];

    return Array.from(deptIds)
        .map(id => departmentMap[id] || id)
        .filter(name => !excludedDepartments.includes(name))
        .sort();
}

export interface DashboardColumn {
    id: string;
    title: string;
    contacts: SuriContact[];
    isEmpty?: boolean;
    startPosition?: number; // Starting queue position for this column
    hasMore?: boolean; // Indicates if the queue continues in the next column
}

export const sortActiveContactsByDuration = (contacts: SuriContact[]): SuriContact[] => {
    return [...contacts].sort((a, b) => {
        const startA = a.agent?.dateAnswer ? parseISO(a.agent.dateAnswer).getTime() : parseISO(a.lastActivity).getTime();
        const startB = b.agent?.dateAnswer ? parseISO(b.agent.dateAnswer).getTime() : parseISO(b.lastActivity).getTime();
        return startA - startB; // Ascending start time = Descending duration (Longest first)
    });
};

export function generateDashboardPages(
    contacts: SuriContact[],
    departmentMap: Record<string, string>,
    itemsPerColumn = 5,
    columnsPerPage = 5
): DashboardColumn[][] {
    // Get unique department names from contacts only
    const deptNamesSet = new Set<string>();
    contacts.forEach(c => {
        const deptName = getDepartmentName(c, departmentMap);
        deptNamesSet.add(deptName);
    });

    const excludedDepartments = ['Koerner Express', 'Sem Escolha de Setor'];

    // Create array of departments with their contact counts
    const deptWithCounts = Array.from(deptNamesSet)
        .filter(name => !excludedDepartments.includes(name))
        .map(deptName => {
            const count = contacts.filter(c => {
                const cName = getDepartmentName(c, departmentMap);
                return cName === deptName;
            }).length;
            return { name: deptName, count };
        })
        // Sort by count descending (highest queue first), then alphabetically
        .sort((a, b) => {
            if (b.count !== a.count) {
                return b.count - a.count; // Descending by count
            }
            return a.name.localeCompare(b.name); // Alphabetically if counts are equal
        });

    const allDepts = deptWithCounts.map(d => d.name);

    let allColumns: DashboardColumn[] = [];

    allDepts.forEach(deptName => {
        // Filter contacts by department name using getDepartmentName
        const deptContacts = contacts.filter(c => {
            const cName = getDepartmentName(c, departmentMap);
            return cName === deptName;
        });

        if (deptContacts.length === 0) {
            return;
        }

        // Split into chunks
        for (let i = 0; i < deptContacts.length; i += itemsPerColumn) {
            const chunk = deptContacts.slice(i, i + itemsPerColumn);
            const partNum = Math.floor(i / itemsPerColumn) + 1;
            const totalParts = Math.ceil(deptContacts.length / itemsPerColumn);
            const hasMore = i + itemsPerColumn < deptContacts.length;

            let title = deptName;
            if (totalParts > 1) {
                title = `${deptName} (${partNum}/${totalParts})`;
            }

            allColumns.push({
                id: `${deptName}-${partNum}`,
                title: title,
                contacts: chunk,
                isEmpty: false,
                startPosition: i + 1,
                hasMore: hasMore
            });
        }
    });

    // Paginate columns into pages of 5 columns each
    const pages: DashboardColumn[][] = [];
    for (let i = 0; i < allColumns.length; i += columnsPerPage) {
        pages.push(allColumns.slice(i, i + columnsPerPage));
    }

    if (pages.length === 0) return [[]];
    return pages;
}
