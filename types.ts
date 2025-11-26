
/**
 * Tipos de Resposta da API
 */

/**
 * Representa a foto de perfil de um usuário no Suri.
 */
export interface SuriProfilePicture {
  /** O nome do arquivo da imagem. */
  name: string | null;
  /** A URL da imagem de perfil. */
  url: string | null;
}

/**
 * Descreve um atendente do Suri.
 */
export interface SuriAttendant {
  /** O identificador único do atendente. */
  id: string;
  /** O nome do atendente. */
  name: string;
  /** O email do atendente. */
  email: string;
  /** O status do atendente: 0 = Offline, 1 = Online, 2 = Ocupado/Ausente. */
  status: number;
  /** A foto de perfil do atendente. */
  profilePicture?: SuriProfilePicture;
}

/**
 * Representa o agente associado a um contato.
 */
export interface SuriAgent {
  /** O status do agente. */
  status: number;
  /** O ID do departamento ao qual o agente pertence. */
  departmentId: string | null;
  /** A data em que o atendimento foi solicitado. */
  dateRequest?: string;
  /** A data em que o atendimento foi respondido. */
  dateAnswer?: string;
  /** O ID do usuário da plataforma. */
  platformUserId?: string;
}

/**
 * Descreve uma sessão de atendimento no Suri.
 */
export interface SuriSession {
  /** O identificador único da sessão. */
  id: string;
  /** A data de início da sessão. */
  start: string;
  /** A data de término da sessão. */
  end: string;
  /** Indica se a sessão foi respondida. */
  answered: boolean;
}

/**
 * Representa um departamento no Suri.
 */
export interface SuriDepartment {
  /** O identificador único do departamento. */
  id: string;
  /** O nome do departamento (pode vir como 'Name' maiúsculo). */
  Name?: string;
  /** O nome do departamento (pode vir como 'name' minúsculo). */
  name?: string;
}

/**
 * Descreve um contato no Suri.
 */
export interface SuriContact {
  /** O identificador único do contato. */
  id: string;
  /** O nome do contato. */
  name: string;
  /** O número de telefone do contato. */
  phone: string;
  /** O email do contato. */
  email: string | null;
  /** A foto de perfil do contato. */
  profilePicture: SuriProfilePicture;
  /** A data de criação do contato. */
  dateCreate: string;
  /** A data da última atividade do contato (formato ISO). */
  lastActivity: string;
  /** O ID do canal de comunicação. */
  channelId: string;
  /** O tipo do canal de comunicação. */
  channelType: number;

  /** O ID do departamento (fila) ao qual o contato está associado. */
  departmentId?: string;
  /** O ID do departamento padrão do contato. */
  defaultDepartmentId: string | null;
  /** O agente associado ao contato. */
  agent?: SuriAgent;

  /** Variáveis personalizadas associadas ao contato. */
  variables?: Record<string, string>;
  /** Permite outras propriedades dinâmicas. */
  [key: string]: any;
}

/**
 * Define a estrutura padrão para respostas da API do Suri.
 * @template T - O tipo de dado esperado no campo 'data'.
 */
export interface SuriApiResponse<T> {
  /** Indica se a requisição foi bem-sucedida. */
  success: boolean;
  /** Os dados retornados pela API. */
  data: T;
  /** A mensagem de erro, caso a requisição falhe. */
  error: string | null;
}

/**
 * Tipos de Estado da Aplicação
 */

/**
 * Define as configurações da aplicação.
 */
export interface AppConfig {
  /** O intervalo de atualização dos dados, em segundos. */
  refreshInterval: number;
  /** O limite de SLA (Service Level Agreement) em minutos. */
  slaLimit: number;
}

/**
 * Representa as métricas do dashboard.
 */
export interface DashboardMetrics {
  /** O número total de contatos em espera. */
  totalWaiting: number;
  /** O tempo médio de espera em segundos. */
  avgWaitTimeSeconds: number;
  /** O tempo de espera mais longo em segundos. */
  longestWaitTimeSeconds: number;
}
