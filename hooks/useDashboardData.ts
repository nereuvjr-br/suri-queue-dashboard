import { useState, useEffect, useCallback } from 'react';
import { AppConfig, SuriContact, SuriAttendant } from '../types';
import { fetchWaitingContacts, fetchActiveContacts, fetchDepartments, fetchAttendants } from '../services/suriService';

const API_URL = import.meta.env.VITE_API_URL || '';
const API_KEY = import.meta.env.VITE_API_KEY || '';

const DEFAULT_CONFIG: AppConfig = {
    refreshInterval: Number(import.meta.env.VITE_REFRESH_INTERVAL) || 15,
    slaLimit: Number(import.meta.env.VITE_SLA_LIMIT) || 15
};

const DEPARTMENT_NAMES: Record<string, string> = {
    'cb36400427': 'Agile',
    'cb36479536': 'Ata Notarial',
    'cb36342354': 'Balcão',
    'cb36400390': 'E-Notariado',
    'cb36393615': 'Escritura',
    'cb36475544': 'Koerner Express',
    'cb36342353': 'Procuração',
    'cb36342352': 'Protesto',
    'cb36536157': 'Sem Escolha de Setor'
};

export const useDashboardData = () => {
    const [config, setConfig] = useState<AppConfig>(() => {
        const saved = localStorage.getItem('suri_config');
        return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    });

    const [isConfigOpen, setIsConfigOpen] = useState(() => {
        if (API_URL && API_KEY) return false;
        return true;
    });

    const [waitingContacts, setWaitingContacts] = useState<SuriContact[]>([]);
    const [activeContacts, setActiveContacts] = useState<SuriContact[]>([]);
    const [attendants, setAttendants] = useState<SuriAttendant[]>([]);
    const [departmentMap, setDepartmentMap] = useState<Record<string, string>>(DEPARTMENT_NAMES);
    const [error, setError] = useState<string | null>(null);

    const loadDepartments = useCallback(async () => {
        if (!API_URL || !API_KEY) return;
        try {
            const depts = await fetchDepartments(API_URL, API_KEY);

            const newMap: Record<string, string> = { ...DEPARTMENT_NAMES };
            depts.forEach(d => {
                const id = d.id.trim().toLowerCase();
                const name = d.Name || (d as any).name;
                if (id && name) {
                    newMap[id] = name;
                }
            });
            setDepartmentMap(newMap);
        } catch (e) {
            console.warn("Could not auto-load departments, using hardcoded map", e);
            setDepartmentMap(DEPARTMENT_NAMES);
        }
    }, []);

    const fetchData = useCallback(async () => {
        if (!API_URL || !API_KEY) return;
        setError(null);
        try {
            if (Object.keys(departmentMap).length === 0) {
                loadDepartments();
            }

            const [waiting, active, agents] = await Promise.all([
                fetchWaitingContacts(API_URL, API_KEY),
                fetchActiveContacts(API_URL, API_KEY),
                fetchAttendants(API_URL, API_KEY)
            ]);
            setWaitingContacts(waiting);
            setActiveContacts(active);
            setAttendants(agents);
        } catch (err: any) {
            setError(err.message || "Failed to fetch data");
        }
    }, [departmentMap, loadDepartments]);

    useEffect(() => {
        loadDepartments();
        fetchData();
    }, [loadDepartments, fetchData]);

    useEffect(() => {
        const interval = setInterval(fetchData, config.refreshInterval * 1000);
        return () => clearInterval(interval);
    }, [fetchData, config.refreshInterval]);

    const handleSaveConfig = (newConfig: AppConfig) => {
        setConfig(newConfig);
        localStorage.setItem('suri_config', JSON.stringify(newConfig));
        setIsConfigOpen(false);
        setTimeout(() => {
            loadDepartments();
            fetchData();
        }, 100);
    };

    return {
        config,
        isConfigOpen,
        setIsConfigOpen,
        waitingContacts,
        activeContacts,
        attendants,
        departmentMap,
        error,
        handleSaveConfig
    };
};
