import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation JSON files
import enGB from './locales/en-GB.json';
import ptPT from './locales/pt-PT.json';
import frFR from './locales/fr-FR.json';
import esES from './locales/es-ES.json';
import deDE from './locales/de-DE.json';

/**
 * Internationalization Configuration
 * 
 * Translations are stored in separate JSON files in the locales/ folder:
 * - en-GB.json (English - United Kingdom)
 * - pt-PT.json (Portuguese - Portugal)
 * - fr-FR.json (French - France)
 * - es-ES.json (Spanish - Spain)
 * - de-DE.json (German - Germany)
 * 
 * To add new translations:
 * 1. Add the key to the appropriate language JSON file
 * 2. Add to ALL language files to maintain consistency
 */

const resources = {
    'en-GB': { translation: enGB },
    'pt-PT': { translation: ptPT },
    'fr-FR': { translation: frFR },
    'es-ES': { translation: esES },
    'de-DE': { translation: deDE },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en-GB',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
