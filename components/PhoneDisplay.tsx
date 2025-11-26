import React from 'react';
import { parsePhoneNumber } from 'libphonenumber-js';

/**
 * @interface PhoneDisplayProps
 * Propriedades para o componente PhoneDisplay.
 */
interface PhoneDisplayProps {
    /** O número de telefone a ser formatado e exibido. */
    phone: string;
    /** Classes CSS adicionais para estilizar o contêiner do componente. */
    className?: string;
}

/**
 * Converte um código de país de duas letras (ex: 'BR') em um emoji de bandeira.
 * @param {string} countryCode - O código do país (ISO 3166-1 alpha-2).
 * @returns {string} O emoji da bandeira correspondente.
 */
const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

/**
 * @component PhoneDisplay
 * Um componente para exibir um número de telefone formatado de forma inteligente.
 * Ele tenta analisar o número, formatá-lo para exibição internacional (com formatação
 * especial para o Brasil) e exibe a bandeira do país correspondente.
 *
 * @param {PhoneDisplayProps} props - As propriedades do componente.
 * @returns Um elemento `div` com a bandeira e o número formatado, ou `null` se o telefone for inválido.
 */
const PhoneDisplay: React.FC<PhoneDisplayProps> = ({ phone, className = '' }) => {
    if (!phone) return null;

    let formatted = phone;
    let flag = '🌐'; // Emoji de globo como padrão

    try {
        let phoneNumber;

        // Limpa caracteres que não são dígitos ou '+'
        const cleaned = phone.replace(/[^\d+]/g, '');

        // Heurística: Força a formatação para números do Brasil que parecem corretos mas não têm o '+'
        if (!phone.startsWith('+') && cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
            try {
                phoneNumber = parsePhoneNumber(`+${cleaned}`);
            } catch { /* Ignora o erro para tentar o próximo método */ }
        }

        // Fallback para a análise padrão
        if (!phoneNumber) {
            try {
                // Tenta como internacional primeiro se tiver '+'
                if (phone.startsWith('+')) {
                    phoneNumber = parsePhoneNumber(phone);
                } else {
                    // Assume 'BR' como padrão se não tiver '+'
                    phoneNumber = parsePhoneNumber(phone, 'BR');
                }
            } catch { /* Ignora o erro, mantém o número original */ }
        }

        if (phoneNumber && phoneNumber.isValid()) {
            if (phoneNumber.country === 'BR') {
                // Formatação personalizada para o Brasil: +55 (DD)99999-9999
                const national = phoneNumber.format('NATIONAL'); // (DD) 99999-9999
                const compactNational = national.replace(') ', ')');
                formatted = `+${phoneNumber.countryCallingCode} ${compactNational}`;
            } else {
                formatted = phoneNumber.formatInternational();
            }

            if (phoneNumber.country) {
                flag = getFlagEmoji(phoneNumber.country);
            }
        }
    } catch (error) {
        // Mantém o original se a análise falhar
    }

    return (
        <div className={`flex items-center gap-1.5 ${className}`} title={phone}>
            <span className="text-base leading-none filter grayscale-[0.2] select-none">{flag}</span>
            <span className="font-mono tracking-tight truncate">{formatted}</span>
        </div>
    );
};

export default PhoneDisplay;
