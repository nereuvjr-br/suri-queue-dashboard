import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * @interface ProtectedRouteProps
 * Propriedades para o componente ProtectedRoute.
 */
interface ProtectedRouteProps {
    /** Os componentes filhos que devem ser renderizados se o usuário estiver autenticado. */
    children: React.ReactNode;
}

/**
 * @component ProtectedRoute
 * Um componente de ordem superior que protege uma rota, permitindo o acesso apenas a usuários autenticados.
 * Se o usuário não estiver autenticado, ele é redirecionado para a página de login,
 * salvando a localização original para que possa ser redirecionado de volta após o login.
 *
 * @param {ProtectedRouteProps} props - As propriedades do componente.
 * @returns O componente filho se o usuário estiver autenticado, ou um componente de redirecionamento para a página de login.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redireciona para a página de login, passando a localização atual
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Renderiza os componentes filhos se autenticado
    return <>{children}</>;
};

export default ProtectedRoute;
