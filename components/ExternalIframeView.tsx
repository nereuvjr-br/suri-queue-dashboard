import React from 'react';

/**
 * @interface ExternalIframeViewProps
 * Propriedades para o componente ExternalIframeView.
 */
interface ExternalIframeViewProps {
    /** A URL do conteúdo a ser carregado no iframe. */
    url: string;
    /** O título do iframe, importante para acessibilidade. Se não for fornecido, a URL será usada. */
    title?: string;
}

/**
 * @component ExternalIframeView
 * Um componente simples que renderiza um iframe para exibir conteúdo externo.
 * Ele ocupa todo o espaço do seu contêiner pai e inclui atributos de segurança
 * como `sandbox` para restringir as permissões do conteúdo incorporado.
 *
 * @param {ExternalIframeViewProps} props - As propriedades do componente.
 * @returns Um elemento iframe configurado para exibir a URL fornecida.
 */
const ExternalIframeView: React.FC<ExternalIframeViewProps> = ({ url, title }) => {
    return (
        <iframe
            src={url}
            title={title || url}
            className="absolute inset-0 w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            loading="lazy"
        />
    );
};

export default ExternalIframeView;
