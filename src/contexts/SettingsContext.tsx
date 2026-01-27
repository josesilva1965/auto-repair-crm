import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

export interface BusinessHour {
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    enabled: boolean;
}

export interface EmailSettings {
    id: string;
    sender_name: string;
    sender_email: string;
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_password: string;
    use_tls: boolean;
    resend_api_key: string;
    emailjs_service_id: string;
    emailjs_template_id: string;
    emailjs_public_key: string;
    shop_name?: string;
    public_url?: string;
    logo_url?: string;
    primary_color?: string;
}

const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
    id: '00000000-0000-0000-0000-000000000001',
    sender_name: 'Auto Repair Shop',
    sender_email: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    use_tls: true,
    resend_api_key: '',
    emailjs_service_id: '',
    emailjs_template_id: '',
    emailjs_public_key: '',
    shop_name: 'AutoShop CRM',
    public_url: '',
    logo_url: '',
    primary_color: '#3b82f6', // Default blue-500
};

interface SettingsContextType {
    language: string;
    setLanguage: (lang: string) => void;
    currency: string;
    setCurrency: (currency: string) => void;
    taxRate: number;
    setTaxRate: (rate: number) => void;
    businessHours: BusinessHour[];
    setBusinessHours: (hours: BusinessHour[]) => void;
    loadBusinessHours: () => Promise<void>;
    saveBusinessHours: (hours: BusinessHour[]) => Promise<boolean>;
    emailSettings: EmailSettings;
    setEmailSettings: (settings: EmailSettings) => void;
    loadEmailSettings: () => Promise<void>;
    saveEmailSettings: (settings: EmailSettings) => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

interface SettingsProviderProps {
    children: React.ReactNode;
}

const LANGUAGE_DEFAULTS: Record<string, { currency: string; taxRate: number }> = {
    'en-GB': { currency: '£', taxRate: 0.20 },
    'pt-PT': { currency: '€', taxRate: 0.23 },
    'fr-FR': { currency: '€', taxRate: 0.20 },
    'es-ES': { currency: '€', taxRate: 0.21 },
    'de-DE': { currency: '€', taxRate: 0.19 },
};

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
    const { i18n } = useTranslation();

    // Initialize from i18n's current language or default to en-GB
    const [language, setLanguageState] = useState(i18n.language || 'en-GB');

    const defaults = LANGUAGE_DEFAULTS[language] || LANGUAGE_DEFAULTS['en-GB'];
    const [currency, setCurrency] = useState(defaults.currency);
    const [taxRate, setTaxRate] = useState(defaults.taxRate);
    const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
    const [emailSettings, setEmailSettings] = useState<EmailSettings>(DEFAULT_EMAIL_SETTINGS);

    // Load business hours from database
    const loadBusinessHours = async () => {
        const { data, error } = await supabase
            .from('business_hours')
            .select('*')
            .order('day_of_week', { ascending: true });

        if (error) {
            console.error('Error loading business hours:', error);
        } else if (data) {
            setBusinessHours(data);
        }
    };

    // Save business hours to database
    const saveBusinessHours = async (hours: BusinessHour[]): Promise<boolean> => {
        try {
            // Update each row
            for (const hour of hours) {
                const { error } = await supabase
                    .from('business_hours')
                    .update({
                        start_time: hour.start_time,
                        end_time: hour.end_time,
                        enabled: hour.enabled,
                        updated_at: new Date().toISOString()
                    })
                    .eq('day_of_week', hour.day_of_week);

                if (error) {
                    console.error('Error saving business hours:', error);
                    return false;
                }
            }
            // Reload to get fresh data
            await loadBusinessHours();
            return true;
        } catch (err) {
            console.error('Error in saveBusinessHours:', err);
            return false;
        }
    };

    // Load email settings from database
    const loadEmailSettings = async () => {
        const { data, error } = await supabase
            .from('email_settings')
            .select('*')
            .single();

        if (error) {
            console.error('Error loading email settings:', error);
        } else if (data) {
            setEmailSettings(data);
        }
    };

    // Save email settings to database
    const saveEmailSettings = async (settings: EmailSettings): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('email_settings')
                .upsert({
                    id: settings.id,
                    sender_name: settings.sender_name,
                    sender_email: settings.sender_email,
                    smtp_host: settings.smtp_host,
                    smtp_port: settings.smtp_port,
                    smtp_user: settings.smtp_user,
                    smtp_password: settings.smtp_password,
                    use_tls: settings.use_tls,
                    resend_api_key: settings.resend_api_key,
                    emailjs_service_id: settings.emailjs_service_id,
                    emailjs_template_id: settings.emailjs_template_id,
                    emailjs_public_key: settings.emailjs_public_key,
                    shop_name: settings.shop_name,
                    public_url: settings.public_url,
                    logo_url: settings.logo_url,
                    primary_color: settings.primary_color,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.error('Error saving email settings:', error);
                return false;
            }

            await loadEmailSettings();
            return true;
        } catch (err) {
            console.error('Error in saveEmailSettings:', err);
            return false;
        }
    };

    // Load settings on mount
    useEffect(() => {
        loadBusinessHours();
        loadEmailSettings();
    }, []);

    // Sync state when i18n language changes externally (e.g. detection)
    useEffect(() => {
        const handleLanguageChanged = (lang: string) => {
            setLanguageState(lang);
            const newDefaults = LANGUAGE_DEFAULTS[lang];
            if (newDefaults) {
                setCurrency(newDefaults.currency);
                setTaxRate(newDefaults.taxRate);
            }
        };

        i18n.on('languageChanged', handleLanguageChanged);
        return () => {
            i18n.off('languageChanged', handleLanguageChanged);
        };
    }, [i18n]);

    const setLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
        setLanguageState(lang);
        // Defaults update via the useEffect above listening to 'languageChanged'
    };

    const value = {
        language,
        setLanguage,
        currency,
        setCurrency,
        taxRate,
        setTaxRate,
        businessHours,
        setBusinessHours,
        loadBusinessHours,
        saveBusinessHours,
        emailSettings,
        setEmailSettings,
        loadEmailSettings,
        saveEmailSettings,
    };

    // Helper to convert Hex to HSL for Tailwind
    const hexToHsl = (hex: string) => {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return null;
        let r = parseInt(result[1], 16);
        let g = parseInt(result[2], 16);
        let b = parseInt(result[3], 16);
        r /= 255; g /= 255; b /= 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) {
            h = s = 0;
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            if (h) h /= 6;
        }
        if (h) h = Math.round(h * 360);
        s = Math.round(s * 100);
        l = Math.round(l * 100);
        return `${h} ${s}% ${l}%`;
    };

    // Apply Brand Color
    useEffect(() => {
        if (emailSettings.primary_color) {
            const hsl = hexToHsl(emailSettings.primary_color);
            if (hsl) {
                document.documentElement.style.setProperty('--primary', hsl);
                // Also update ring/border slightly if needed, but primary is most important
                document.documentElement.style.setProperty('--ring', hsl);
            }
        }
    }, [emailSettings.primary_color]);

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

