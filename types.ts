
// API Response Types

export interface SuriProfilePicture {
  name: string | null;
  url: string | null;
}

export interface SuriAttendant {
  id: string;
  name: string;
  email: string;
  status: number; // 0 = Offline, 1 = Online, 2 = Busy/Away
  profilePicture?: SuriProfilePicture;
}

export interface SuriAgent {
  status: number;
  departmentId: string | null;
  dateRequest?: string;
  dateAnswer?: string;
  platformUserId?: string;
}

export interface SuriSession {
  id: string;
  start: string;
  end: string;
  answered: boolean;
}

export interface SuriDepartment {
  id: string;
  Name?: string; 
  name?: string; // API might return lowercase
}

export interface SuriContact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  profilePicture: SuriProfilePicture;
  dateCreate: string;
  lastActivity: string; // ISO Date
  channelId: string;
  channelType: number;
  
  // Department info
  departmentId?: string; // Queue ID
  defaultDepartmentId: string | null;
  agent?: SuriAgent;

  variables?: Record<string, string>;
}

export interface SuriApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

// Application State Types

export interface AppConfig {
  apiUrl: string;
  apiKey: string;
  refreshInterval: number; // in seconds
  slaLimit: number; // SLA limit in minutes
}

export interface DashboardMetrics {
  totalWaiting: number;
  avgWaitTimeSeconds: number;
  longestWaitTimeSeconds: number;
}
