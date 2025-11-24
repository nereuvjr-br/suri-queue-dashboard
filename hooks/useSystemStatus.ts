import { useState, useEffect } from 'react';

type Status = 'online' | 'offline' | 'checking';

export const useSystemStatus = () => {
    const [portalStatus, setPortalStatus] = useState<Status>('checking');
    const [apiStatus, setApiStatus] = useState<Status>('checking');
    const [userApiStatus, setUserApiStatus] = useState<Status>('checking');

    const checkUrl = async (url: string): Promise<Status> => {
        try {
            // Using no-cors mode allows us to check connectivity even if CORS headers aren't present.
            // We won't see the status code, but success means the server is reachable.
            await fetch(url, { mode: 'no-cors', cache: 'no-store', method: 'HEAD' });
            return 'online';
        } catch (e) {
            console.warn(`Status check failed for ${url}`, e);
            return 'offline';
        }
    };

    useEffect(() => {
        const checkAll = async () => {
            const portalUrl = import.meta.env.VITE_PORTAL_URL || 'https://portal.chatbotmaker.io/';
            const portalApiUrl = import.meta.env.VITE_PORTAL_API_URL || 'https://portal.chatbotmaker.io/api/';
            const userApiUrl = import.meta.env.VITE_API_URL || '';

            const pStatus = await checkUrl(portalUrl);
            setPortalStatus(pStatus);

            const aStatus = await checkUrl(portalApiUrl);
            setApiStatus(aStatus);

            if (userApiUrl) {
                const uStatus = await checkUrl(userApiUrl);
                setUserApiStatus(uStatus);
            } else {
                setUserApiStatus('offline');
            }
        };

        checkAll();
        const intervalTime = Number(import.meta.env.VITE_STATUS_CHECK_INTERVAL) || 30000;
        const interval = setInterval(checkAll, intervalTime);
        return () => clearInterval(interval);
    }, []);

    return { portalStatus, apiStatus, userApiStatus };
};
