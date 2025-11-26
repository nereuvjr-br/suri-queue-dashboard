import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * @interface AuthContextType
 * Define o formato do objeto de contexto de autenticação.
 */
interface AuthContextType {
  /** Indica se o usuário está autenticado. */
  isAuthenticated: boolean;
  /**
   * Função para tentar autenticar o usuário.
   * @param password - A senha fornecida pelo usuário.
   * @returns `true` se a autenticação for bem-sucedida, `false` caso contrário.
   */
  login: (password: string) => boolean;
  /** Função para deslogar o usuário. */
  logout: () => void;
}

/**
 * @const AuthContext
 * O contexto do React para gerenciar o estado de autenticação.
 * Ele fornece o estado `isAuthenticated` e as funções `login` e `logout` para os componentes filhos.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'suri_dashboard_auth';
const CORRECT_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'suri2024';

/**
 * @component AuthProvider
 * O provedor de contexto que envolve a aplicação e gerencia o estado de autenticação.
 *
 * @param {object} props - As propriedades do componente.
 * @param {React.ReactNode} props.children - Os componentes filhos que terão acesso a este contexto.
 * @returns Um provedor de contexto que disponibiliza o estado de autenticação e as funções relacionadas.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const login = (password: string): boolean => {
    if (password.trim() === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEY, 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * @function useAuth
 * Hook personalizado para acessar o contexto de autenticação.
 * Este hook deve ser usado dentro de um componente que seja filho do `AuthProvider`.
 *
 * @throws Lança um erro se for usado fora de um `AuthProvider`.
 * @returns O objeto de contexto de autenticação, contendo `isAuthenticated`, `login` e `logout`.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
