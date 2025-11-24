import React from 'react';

interface ExternalIframeViewProps {
    url: string;
    title?: string;
}

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
