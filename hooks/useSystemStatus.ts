import { useState, useEffect } from 'react';

/**
 * O tipo de status para os sistemas monitorados.
 * 'online': O sistema está acessível.
 * 'offline': O sistema não está acessível.
 * 'checking': A verificação está em andamento.
 */
type Status = 'online' | 'offline' | 'checking';

/**
 * Hook personalizado para monitorar o status de diferentes sistemas.
 *
 * Este hook verifica a conectividade com:
 * - O portal principal.
 * - A API do portal.
 * - A API do usuário (configurada no ambiente).
 *
 * Ele realiza uma verificação inicial e, em seguida, periodicamente,
 * atualizando o status de cada sistema.
 *
 * @returns Um objeto com o status de cada sistema monitorado.
 */
export const useSystemStatus = () => {
    const [portalStatus, setPortalStatus] = useState<Status>('checking');
    const [apiStatus, setApiStatus] = useState<Status>('checking');
    const [userApiStatus, setUserApiStatus] = useState<Status>('checking');

    /**
     * Verifica a conectividade com uma URL específica.
     * @param url - A URL a ser verificada.
     * @returns O status da URL ('online' ou 'offline').
     */
    const checkUrl = async (url: string): Promise<Status> => {
        try {
            // O modo 'no-cors' nos permite verificar a conectividade mesmo sem cabeçalhos CORS.
            // Não veremos o código de status, mas o sucesso significa que o servidor está acessível.
            await fetch(url, { mode: 'no-cors', cache: 'no-store', method: 'HEAD' });
            return 'online';
        } catch (e) {
            console.warn(`A verificação de status falhou para ${url}`, e);
            return 'offline';
        }
    };

    useEffect(() => {
        /**
         * Executa a verificação de status para todas as URLs configuradas.
         */
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

    return {
        /** O status do portal principal ('online', 'offline', 'checking'). */
        portalStatus,
        /** O status da API do portal ('online', 'offline', 'checking'). */
        apiStatus,
        /** O status da API do usuário ('online', 'offline', 'checking'). */
        userApiStatus
    };
};
