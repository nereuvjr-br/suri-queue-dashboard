import { SuriApiResponse, SuriContact, SuriDepartment, SuriAttendant } from '../types';

// Helper to clean URL
const getCleanUrl = (baseUrl: string) => baseUrl.replace(/\/$/, "");

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
      console.warn(`Department fetch failed: ${response.status}`);
      return [];
    }

    const json: SuriApiResponse<SuriDepartment[]> = await response.json();

    if (!json.success) {
      console.warn("API returned success: false for departments", json.error);
      return [];
    }

    return json.data || [];
  } catch (error) {
    console.error("Error fetching departments:", error);
    return [];
  }
};

export const fetchAttendants = async (
  baseUrl: string,
  token: string
): Promise<SuriAttendant[]> => {
  const endpoint = `${getCleanUrl(baseUrl)}/api/attendants`;
  // Note: Some versions might use /api/agents. Adjust if necessary.

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`Attendants fetch failed: ${response.status}`);
      return [];
    }

    const json: SuriApiResponse<SuriAttendant[]> = await response.json();

    if (!json.success) {
      // Fallback: if api/attendants fails, return empty so app doesn't crash
      console.warn("API returned success: false for attendants", json.error);
      return [];
    }

    return json.data || [];
  } catch (error) {
    console.error("Error fetching attendants:", error);
    return [];
  }
};

// Queue 1 = Waiting/Pending Human
export const fetchWaitingContacts = async (
  baseUrl: string,
  token: string
): Promise<SuriContact[]> => {

  const endpoint = `${getCleanUrl(baseUrl)}/api/contacts/list`;

  const payload = {
    queue: 1, // Filter for "Waiting" queue
    limit: 100, // Maximize retrieval for the dashboard
    orderBy: "lastActivity",
    orderType: "asc", // Ascending to see who has been waiting the longest at the top
    sessionType: 0 // 0 usually means Receptive (customer initiated)
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
      throw new Error(`API Request failed: ${response.status} ${response.statusText}`);
    }

    const json: SuriApiResponse<{ items: SuriContact[] }> = await response.json();

    if (!json.success) {
      throw new Error(json.error || "Unknown API error");
    }

    return json.data?.items || [];
  } catch (error) {
    console.error("Error fetching Suri contacts:", error);
    throw error;
  }
};

// Queue 2 = In Attendance (Human)
export const fetchActiveContacts = async (
  baseUrl: string,
  token: string
): Promise<SuriContact[]> => {

  const endpoint = `${getCleanUrl(baseUrl)}/api/contacts/list`;

  // We fetch both active and receptive sessions in queue 2
  const payload = {
    queue: 2, // Filter for "In Attendance" queue
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
      throw new Error(`API Request failed: ${response.status} ${response.statusText}`);
    }

    const json: SuriApiResponse<{ items: SuriContact[] }> = await response.json();

    if (!json.success) {
      throw new Error(json.error || "Unknown API error");
    }

    return json.data?.items || [];
  } catch (error) {
    console.error("Error fetching active contacts:", error);
    return [];
  }
};