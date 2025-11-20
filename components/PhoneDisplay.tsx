import React from 'react';
import { parsePhoneNumber } from 'libphonenumber-js';

interface PhoneDisplayProps {
    phone: string;
    className?: string;
}

const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

const PhoneDisplay: React.FC<PhoneDisplayProps> = ({ phone, className = '' }) => {
    if (!phone) return null;

    let formatted = phone;
    let flag = '🌐';

    try {
        let phoneNumber;

        // Clean non-digits/plus
        const cleaned = phone.replace(/[^\d+]/g, '');

        // Heuristic: If it looks like a BR number with DDI 55 but no +, force it
        // BR numbers: 55 + 2 digit DDD + 8 or 9 digit number = 12 or 13 digits
        if (!phone.startsWith('+') && cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
            try {
                phoneNumber = parsePhoneNumber(`+${cleaned}`);
            } catch { }
        }

        // Fallback to standard parsing
        if (!phoneNumber) {
            try {
                // Try as international first if it has +
                if (phone.startsWith('+')) {
                    phoneNumber = parsePhoneNumber(phone);
                } else {
                    // Default to BR if no +
                    phoneNumber = parsePhoneNumber(phone, 'BR');
                }
            } catch { }
        }

        if (phoneNumber && phoneNumber.isValid()) {
            if (phoneNumber.country === 'BR') {
                // Custom formatting for Brazil: +55 (99)99999-9999
                const national = phoneNumber.format('NATIONAL'); // (99) 99999-9999
                // Remove space after closing parenthesis
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
        // Keep original if parsing fails
    }

    return (
        <div className={`flex items-center gap-1.5 ${className}`} title={phone}>
            <span className="text-base leading-none filter grayscale-[0.2] select-none">{flag}</span>
            <span className="font-mono tracking-tight truncate">{formatted}</span>
        </div>
    );
};

export default PhoneDisplay;
