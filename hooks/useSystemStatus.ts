import { useState, useEffect } from 'react';

type Status = 'online' | 'offline' | 'checking';

export const useSystemStatus = () => {
    const [portalStatus, setPortalStatus] = useState<Status>('checking');
    const [apiStatus, setApiStatus] = useState<Status>('checking');

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
            const pStatus = await checkUrl('https://portal.chatbotmaker.io/');
            setPortalStatus(pStatus);

            const aStatus = await checkUrl('https://portal.chatbotmaker.io/api/');
            setApiStatus(aStatus);
        };

        checkAll();
        const interval = setInterval(checkAll, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, []);

    return { portalStatus, apiStatus };
};
