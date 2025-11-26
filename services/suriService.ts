import { SuriApiResponse, SuriContact, SuriDepartment, SuriAttendant } from '../types';

/**
 * Remove a barra final de uma URL, se houver.
 * @param baseUrl - A URL base a ser limpa.
 * @returns A URL sem a barra final.
 */
const getCleanUrl = (baseUrl: string) => baseUrl.replace(/\/$/, "");

/**
 * Busca a lista de departamentos da API do Suri.
 * @param baseUrl - A URL base da API do Suri.
 * @param token - O token de autorização para a API.
 * @returns Uma promessa que resolve para uma lista de departamentos.
 */
export const fetchDepartments = async (
  baseUrl: string,
  token: string
): Promise<SuriDepartment[]> => {
  const endpoint = `${getCleanUrl(baseUrl)}/api/departments`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`A busca por departamentos falhou: ${response.status}`);
      return [];
    }

    const json: SuriApiResponse<SuriDepartment[]> = await response.json();

    if (!json.success) {
      console.warn("A API retornou sucesso: falso para departamentos", json.error);
      return [];
    }

    return json.data || [];
  } catch (error) {
    console.error("Erro ao buscar departamentos:", error);
    return [];
  }
};

/**
 * Busca a lista de atendentes da API do Suri.
 * @param baseUrl - A URL base da API do Suri.
 * @param token - O token de autorização para a API.
 * @returns Uma promessa que resolve para uma lista de atendentes.
 */
export const fetchAttendants = async (
  baseUrl: string,
  token: string
): Promise<SuriAttendant[]> => {
  const endpoint = `${getCleanUrl(baseUrl)}/api/attendants`;
  // Nota: Algumas versões podem usar /api/agents. Ajuste se necessário.

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`A busca por atendentes falhou: ${response.status}`);
      return [];
    }

    const json: SuriApiResponse<SuriAttendant[]> = await response.json();

    if (!json.success) {
      // Fallback: se api/attendants falhar, retorna vazio para não quebrar o app
      console.warn("A API retornou sucesso: falso para atendentes", json.error);
      return [];
    }

    return json.data || [];
  } catch (error) {
    console.error("Erro ao buscar atendentes:", error);
    return [];
  }
};

/**
 * Busca a lista de contatos em espera (fila 1) da API do Suri.
 * @param baseUrl - A URL base da API do Suri.
 * @param token - O token de autorização para a API.
 * @returns Uma promessa que resolve para uma lista de contatos em espera.
 * @throws Lança um erro se a requisição à API falhar.
 */
// Fila 1 = Esperando/Pendente Humano
export const fetchWaitingContacts = async (
  baseUrl: string,
  token: string
): Promise<SuriContact[]> => {

  const endpoint = `${getCleanUrl(baseUrl)}/api/contacts/list`;

  const payload = {
    queue: 1, // Filtro para a fila "Esperando"
    limit: 100, // Maximiza a busca para o dashboard
    orderBy: "lastActivity",
    orderType: "asc", // Ascendente para ver quem está esperando há mais tempo no topo
    sessionType: 0 // 0 geralmente significa Receptivo (iniciado pelo cliente)
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`A requisição à API falhou: ${response.status} ${response.statusText}`);
    }

    const json: SuriApiResponse<{ items: SuriContact[] }> = await response.json();

    if (!json.success) {
      throw new Error(json.error || "Erro desconhecido na API");
    }

    return json.data?.items || [];
  } catch (error) {
    console.error("Erro ao buscar contatos do Suri:", error);
    throw error;
  }
};

/**
 * Busca a lista de contatos em atendimento (fila 2) da API do Suri.
 * @param baseUrl - A URL base da API do Suri.
 * @param token - O token de autorização para a API.
 * @returns Uma promessa que resolve para uma lista de contatos ativos.
 */
// Fila 2 = Em Atendimento (Humano)
export const fetchActiveContacts = async (
  baseUrl: string,
  token: string
): Promise<SuriContact[]> => {

  const endpoint = `${getCleanUrl(baseUrl)}/api/contacts/list`;

  // Buscamos tanto sessões ativas quanto receptivas na fila 2
  const payload = {
    queue: 2, // Filtro para a fila "Em Atendimento"
    limit: 100,
    orderBy: "lastActivity",
    orderType: "desc"
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`A requisição à API falhou: ${response.status} ${response.statusText}`);
    }

    const json: SuriApiResponse<{ items: SuriContact[] }> = await response.json();

    if (!json.success) {
      throw new Error(json.error || "Erro desconhecido na API");
    }

    return json.data?.items || [];
  } catch (error) {
    console.error("Erro ao buscar contatos ativos:", error);
    return [];
  }
};
