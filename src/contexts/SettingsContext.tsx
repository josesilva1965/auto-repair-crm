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

    // Load business hours on mount
    useEffect(() => {
        loadBusinessHours();
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
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
