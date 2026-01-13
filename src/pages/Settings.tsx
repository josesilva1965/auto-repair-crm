import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings, BusinessHour, EmailSettings } from '../contexts/SettingsContext';
import { Clock, Loader2, Mail } from 'lucide-react';

export function Settings() {
    const { t } = useTranslation();
    const {
        language,
        setLanguage,
        currency,
        taxRate,
        businessHours,
        saveBusinessHours,
        emailSettings,
        saveEmailSettings
    } = useSettings();

    const [localHours, setLocalHours] = useState<BusinessHour[]>([]);
    const [localEmail, setLocalEmail] = useState<EmailSettings>(emailSettings);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [savingEmail, setSavingEmail] = useState(false);
    const [emailSaveMessage, setEmailSaveMessage] = useState('');

    useEffect(() => {
        setLocalHours(businessHours);
    }, [businessHours]);

    useEffect(() => {
        setLocalEmail(emailSettings);
    }, [emailSettings]);

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value);
    };

    const handleHourChange = (dayOfWeek: number, field: 'start_time' | 'end_time' | 'enabled', value: string | boolean) => {
        setLocalHours(prev => prev.map(hour =>
            hour.day_of_week === dayOfWeek
                ? { ...hour, [field]: value }
                : hour
        ));
    };

    const handleSaveHours = async () => {
        setSaving(true);
        setSaveMessage('');
        const success = await saveBusinessHours(localHours);
        setSaving(false);
        setSaveMessage(success ? t('success') : t('error'));
        setTimeout(() => setSaveMessage(''), 3000);
    };

    const handleEmailChange = (field: keyof EmailSettings, value: string | number | boolean) => {
        setLocalEmail(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveEmail = async () => {
        setSavingEmail(true);
        setEmailSaveMessage('');
        const success = await saveEmailSettings(localEmail);
        setSavingEmail(false);
        setEmailSaveMessage(success ? t('success') : t('error'));
        setTimeout(() => setEmailSaveMessage(''), 3000);
    };

    const dayNames = [
        t('sunday'),
        t('monday'),
        t('tuesday'),
        t('wednesday'),
        t('thursday'),
        t('friday'),
        t('saturday')
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-[32px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {t('settings')}
                </h1>
            </div>

            {/* Language & Currency Section */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    {t('language')} & {t('currency')}
                </h2>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label htmlFor="language" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {t('language')}
                        </label>
                        <select
                            id="language"
                            value={language}
                            onChange={handleLanguageChange}
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
                        >
                            <option value="en-GB">English (UK)</option>
                            <option value="pt-PT">Português (Portugal)</option>
                            <option value="fr-FR">Français</option>
                            <option value="es-ES">Español</option>
                            <option value="de-DE">Deutsch</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {t('currency')}
                            </label>
                            <div className="flex h-10 w-full items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                                {currency}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {t('tax_rate')}
                            </label>
                            <div className="flex h-10 w-full items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                                {(taxRate * 100).toFixed(0)}%
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Changing the language will automatically update the default currency and tax rate.
                    </p>
                </div>
            </div>

            {/* Email Configuration Section */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center gap-2 mb-4">
                    <Mail className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {t('email_configuration') || 'Email Configuration'}
                    </h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    {t('email_config_description') || 'Configure email settings for customer notifications'}
                </p>

                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {t('sender_name') || 'Sender Name'}
                            </label>
                            <input
                                type="text"
                                value={localEmail.sender_name}
                                onChange={(e) => handleEmailChange('sender_name', e.target.value)}
                                placeholder="Auto Repair Shop"
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {t('sender_email') || 'Sender Email'}
                            </label>
                            <input
                                type="email"
                                value={localEmail.sender_email}
                                onChange={(e) => handleEmailChange('sender_email', e.target.value)}
                                placeholder="noreply@yourshop.com"
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50"
                            />
                        </div>
                    </div>

                    {/* EmailJS Configuration */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                            {t('email_service') || 'Email Service'} <span className="text-emerald-600 font-normal">(EmailJS - Free & Easy)</span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                            Sign up at <a href="https://www.emailjs.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">emailjs.com</a> (free tier: 200 emails/month)
                        </p>

                        <div className="grid gap-4 md:grid-cols-1">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Service ID
                                </label>
                                <input
                                    type="text"
                                    value={localEmail.emailjs_service_id || ''}
                                    onChange={(e) => handleEmailChange('emailjs_service_id', e.target.value)}
                                    placeholder="service_xxxxxxx"
                                    className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Template ID
                                </label>
                                <input
                                    type="text"
                                    value={localEmail.emailjs_template_id || ''}
                                    onChange={(e) => handleEmailChange('emailjs_template_id', e.target.value)}
                                    placeholder="template_xxxxxxx"
                                    className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Public Key
                                </label>
                                <input
                                    type="text"
                                    value={localEmail.emailjs_public_key || ''}
                                    onChange={(e) => handleEmailChange('emailjs_public_key', e.target.value)}
                                    placeholder="xxxxxxxxxxxx"
                                    className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                    <button
                        onClick={handleSaveEmail}
                        disabled={savingEmail}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {savingEmail && <Loader2 className="w-4 h-4 animate-spin" />}
                        {t('save')}
                    </button>
                    {emailSaveMessage && (
                        <span className={`text-sm font-medium ${emailSaveMessage === t('success') ? 'text-green-600' : 'text-red-600'}`}>
                            {emailSaveMessage}
                        </span>
                    )}
                </div>
            </div>

            {/* Business Hours Section */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {t('business_hours')}
                    </h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    {t('configure_hours')}
                </p>

                <div className="space-y-3">
                    {localHours.map((hour) => (
                        <div key={hour.day_of_week} className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 w-32">
                                <input
                                    type="checkbox"
                                    id={`day-${hour.day_of_week}`}
                                    checked={hour.enabled}
                                    onChange={(e) => handleHourChange(hour.day_of_week, 'enabled', e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                />
                                <label
                                    htmlFor={`day-${hour.day_of_week}`}
                                    className="text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer"
                                >
                                    {dayNames[hour.day_of_week]}
                                </label>
                            </div>

                            <div className="flex items-center gap-2 flex-1">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500 dark:text-slate-400">
                                        {t('start_time')}
                                    </label>
                                    <input
                                        type="time"
                                        value={hour.start_time}
                                        onChange={(e) => handleHourChange(hour.day_of_week, 'start_time', e.target.value)}
                                        disabled={!hour.enabled}
                                        className="flex h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50"
                                    />
                                </div>

                                <span className="text-slate-400 dark:text-slate-500">—</span>

                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500 dark:text-slate-400">
                                        {t('end_time')}
                                    </label>
                                    <input
                                        type="time"
                                        value={hour.end_time}
                                        onChange={(e) => handleHourChange(hour.day_of_week, 'end_time', e.target.value)}
                                        disabled={!hour.enabled}
                                        className="flex h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-3 mt-6">
                    <button
                        onClick={handleSaveHours}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {t('save')}
                    </button>
                    {saveMessage && (
                        <span className={`text-sm font-medium ${saveMessage === t('success') ? 'text-green-600' : 'text-red-600'}`}>
                            {saveMessage}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

