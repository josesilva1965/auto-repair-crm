import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings, BusinessHour, EmailSettings } from '../contexts/SettingsContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, Loader2, Mail, Globe, ShieldAlert, Save, Download, Trash2, CheckCircle, AlertTriangle, Wrench, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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
    const [mobileAppUrl, setMobileAppUrl] = useState('https://auto-repair-crm-three.vercel.app/');
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

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            setSavingEmail(true); // Reuse saving state to show activity
            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath);

            handleEmailChange('logo_url', publicUrl);
            toast.success('Logo uploaded successfully');
        } catch (error) {
            console.error('Error uploading logo:', error);
            toast.error('Failed to upload logo');
        } finally {
            setSavingEmail(false);
        }
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
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('settings')}</h1>
                <p className="text-muted-foreground mt-1">Manage your application preferences and configurations.</p>
            </div>

            <div className="grid gap-8">
                {/* Mobile App Download Section */}
                <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Smartphone className="w-5 h-5 text-blue-600" />
                            </div>
                            <CardTitle className="text-blue-900">{t('mobile_app') || 'Mobile App'}</CardTitle>
                        </div>
                        <CardDescription className="ml-12 text-blue-700">
                            {t('mobile_app_desc') || 'Download the technician mobile app to manage jobs on the go.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-center gap-8 ml-12">
                            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                                <QRCodeSVG value={mobileAppUrl} size={120} />
                            </div>
                            <div className="space-y-3 w-full max-w-sm">
                                <h4 className="font-semibold text-blue-900 text-lg">Scan to Download</h4>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-blue-800 uppercase tracking-wide">App Download Link</label>
                                    <Input
                                        value={mobileAppUrl}
                                        onChange={(e) => setMobileAppUrl(e.target.value)}
                                        className="bg-white border-blue-200 text-blue-900 h-9"
                                        placeholder="https://expo.dev/artifacts/..."
                                    />
                                    <p className="text-[10px] text-blue-600/80">
                                        Paste the URL of your APK or Install Page here. The QR code will update automatically.
                                    </p>
                                </div>
                                <Button className="mt-1 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto" size="sm" onClick={() => window.open(mobileAppUrl, '_blank')}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download App
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Shop Details Section */}
                <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Wrench className="w-5 h-5 text-primary" />
                            </div>
                            <CardTitle>{t('shop_details') || 'Shop Details'}</CardTitle>
                        </div>
                        <CardDescription className="ml-12">{t('shop_details_description') || 'Configure your shop identification.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">{t('shop_name') || 'Shop Name'}</label>
                                <Input
                                    type="text"
                                    value={localEmail.shop_name || ''}
                                    onChange={(e) => handleEmailChange('shop_name', e.target.value)}
                                    placeholder="AutoShop CRM"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Shop Logo</label>
                                <div className="flex items-center gap-4">
                                    {localEmail.logo_url && (
                                        <div className="h-12 w-12 rounded-lg border border-border p-1 bg-white">
                                            <img src={localEmail.logo_url} alt="Shop Logo" className="h-full w-full object-contain" />
                                        </div>
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Brand Color</label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={localEmail.primary_color || '#3b82f6'}
                                        onChange={(e) => handleEmailChange('primary_color', e.target.value)}
                                        className="w-12 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        type="text"
                                        value={localEmail.primary_color || ''}
                                        onChange={(e) => handleEmailChange('primary_color', e.target.value)}
                                        placeholder="#3b82f6"
                                        className="flex-1 font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 px-6 py-4 flex items-center gap-4">
                        <Button
                            onClick={handleSaveEmail}
                            disabled={savingEmail}
                            className="min-w-[100px]"
                        >
                            {savingEmail && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {savingEmail ? t('saving') : t('save_changes')}
                        </Button>
                        {emailSaveMessage && (
                            <span className={cn("text-sm font-medium flex items-center gap-2", emailSaveMessage === t('success') ? "text-emerald-600" : "text-destructive")}>
                                {emailSaveMessage === t('success') ? <CheckCircle className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                {emailSaveMessage}
                            </span>
                        )}
                    </CardFooter>
                </Card>

                {/* Language & Currency Section */}
                <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Globe className="w-5 h-5 text-primary" />
                            </div>
                            <CardTitle>{t('regional_settings') || 'Regional Settings'}</CardTitle>
                        </div>
                        <CardDescription className="ml-12">{t('language_currency_description') || 'Configure your language, currency, and tax rates.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor="language" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {t('language')}
                                </label>
                                <div className="relative">
                                    <select
                                        id="language"
                                        value={language}
                                        onChange={handleLanguageChange}
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                    >
                                        <option value="en-GB">English (UK)</option>
                                        <option value="pt-PT">Português (Portugal)</option>
                                        <option value="fr-FR">Français</option>
                                        <option value="es-ES">Español</option>
                                        <option value="de-DE">Deutsch</option>
                                    </select>
                                    <Globe className="absolute right-3 top-2.5 h-4 w-4 opacity-50 pointer-events-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">
                                        {t('currency')}
                                    </label>
                                    <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                                        {currency}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">
                                        {t('tax_rate')}
                                    </label>
                                    <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                                        {(taxRate * 100).toFixed(0)}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
                            <div className="flex gap-3">
                                <AlertTriangle className="h-5 w-5 text-primary" />
                                <div className="text-sm text-primary-foreground">
                                    <p className="font-medium">Note</p>
                                    <p className="text-primary/80 mt-1">{t('language_change_note')}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Email Configuration Section */}
                <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Mail className="w-5 h-5 text-primary" />
                            </div>
                            <CardTitle>{t('email_configuration') || 'Email Configuration'}</CardTitle>
                        </div>
                        <CardDescription className="ml-12">{t('email_config_description') || 'Configure email settings for customer notifications.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">{t('public_url') || 'Public URL'}</label>
                                <Input
                                    type="url"
                                    value={localEmail.public_url || ''}
                                    onChange={(e) => handleEmailChange('public_url', e.target.value)}
                                    placeholder="https://your-app-url.netlify.app"
                                />
                                <p className="text-[10px] text-muted-foreground">Required for correct links in emails</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">{t('sender_name') || 'Sender Name'}</label>
                                <Input
                                    type="text"
                                    value={localEmail.sender_name}
                                    onChange={(e) => handleEmailChange('sender_name', e.target.value)}
                                    placeholder="Auto Repair Shop"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">{t('sender_email') || 'Sender Email'}</label>
                                <Input
                                    type="email"
                                    value={localEmail.sender_email}
                                    onChange={(e) => handleEmailChange('sender_email', e.target.value)}
                                    placeholder="noreply@yourshop.com"
                                />
                            </div>
                        </div>

                        <Separator className="my-4" />

                        <div>
                            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                                {t('email_service') || 'Email Service'} <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">EmailJS</span>
                            </h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                Configure your EmailJS credentials below. Sign up at <a href="https://www.emailjs.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">emailjs.com</a>.
                            </p>

                            <div className="grid gap-4 md:grid-cols-1 max-w-xl">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Service ID</label>
                                    <Input
                                        value={localEmail.emailjs_service_id || ''}
                                        onChange={(e) => handleEmailChange('emailjs_service_id', e.target.value)}
                                        placeholder="service_xxxxxxx"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Template ID</label>
                                    <Input
                                        value={localEmail.emailjs_template_id || ''}
                                        onChange={(e) => handleEmailChange('emailjs_template_id', e.target.value)}
                                        placeholder="template_xxxxxxx"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Public Key</label>
                                    <Input
                                        type="password"
                                        value={localEmail.emailjs_public_key || ''}
                                        onChange={(e) => handleEmailChange('emailjs_public_key', e.target.value)}
                                        placeholder="sk_test_..."
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 px-6 py-4 flex items-center gap-4">
                        <Button
                            onClick={handleSaveEmail}
                            disabled={savingEmail}
                            className="min-w-[100px]"
                        >
                            {savingEmail && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {savingEmail ? t('saving') : t('save_changes')}
                        </Button>
                        {emailSaveMessage && (
                            <span className={cn("text-sm font-medium flex items-center gap-2", emailSaveMessage === t('success') ? "text-emerald-600" : "text-destructive")}>
                                {emailSaveMessage === t('success') ? <CheckCircle className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                {emailSaveMessage}
                            </span>
                        )}
                    </CardFooter>
                </Card>

                {/* Business Hours Section */}
                <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Clock className="w-5 h-5 text-primary" />
                            </div>
                            <CardTitle>{t('business_hours')}</CardTitle>
                        </div>
                        <CardDescription className="ml-12">{t('configure_hours')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {localHours.map((hour) => (
                            <div key={hour.day_of_week} className="flex items-center gap-4 p-3 rounded-lg border border-border/40 bg-background/50 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3 w-32">
                                    <input
                                        type="checkbox"
                                        id={`day-${hour.day_of_week}`}
                                        checked={hour.enabled}
                                        onChange={(e) => handleHourChange(hour.day_of_week, 'enabled', e.target.checked)}
                                        className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                                    />
                                    <label
                                        htmlFor={`day-${hour.day_of_week}`}
                                        className={cn("text-sm font-medium cursor-pointer", !hour.enabled && "text-muted-foreground")}
                                    >
                                        {dayNames[hour.day_of_week]}
                                    </label>
                                </div>

                                <div className="flex items-center gap-3 flex-1">
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={hour.start_time}
                                            onChange={(e) => handleHourChange(hour.day_of_week, 'start_time', e.target.value)}
                                            disabled={!hour.enabled}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                    <span className="text-muted-foreground">—</span>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={hour.end_time}
                                            onChange={(e) => handleHourChange(hour.day_of_week, 'end_time', e.target.value)}
                                            disabled={!hour.enabled}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter className="bg-muted/30 px-6 py-4 flex items-center gap-4">
                        <Button
                            onClick={handleSaveHours}
                            disabled={saving}
                            className="min-w-[100px]"
                        >
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {saving ? t('saving') : t('save_changes')}
                        </Button>
                        {saveMessage && (
                            <span className={cn("text-sm font-medium flex items-center gap-2", saveMessage === t('success') ? "text-emerald-600" : "text-destructive")}>
                                {saveMessage === t('success') ? <CheckCircle className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                {saveMessage}
                            </span>
                        )}
                    </CardFooter>
                </Card>

                {/* Data Management Section */}
                <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Save className="w-5 h-5 text-primary" />
                            </div>
                            <CardTitle>{t('data_management') || 'Data Management'}</CardTitle>
                        </div>
                        <CardDescription className="ml-12">{t('manage_data_desc') || 'Backup your data or perform dangerous operations.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Export / Backup */}
                        <div className="flex items-center justify-between p-4 bg-muted/30 border border-border/50 rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-background rounded-full border border-border text-primary">
                                    <Download className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">{t('backup_data') || 'Backup Data'}</h3>
                                    <p className="text-sm text-muted-foreground max-w-md">
                                        {t('backup_description') || 'Download a complete JSON backup of your database.'}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    const { exportDatabase } = await import('../lib/dataCleanup');
                                    if (confirm(t('confirm_export') || 'Download database backup?')) {
                                        const result = await exportDatabase();
                                        if (result.success) {
                                            toast.success(`${t('export_success') || 'Export successful!'} (${result.count} tables)`);
                                        } else {
                                            toast.error(t('export_error') || 'Export failed');
                                        }
                                    }
                                }}
                            >
                                {t('export_database') || 'Export'}
                            </Button>
                        </div>

                        {/* Danger Zone */}
                        <div className="border border-destructive/20 rounded-lg overflow-hidden">
                            <div className="bg-destructive/10 px-4 py-3 border-b border-destructive/20">
                                <h3 className="font-semibold text-destructive flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4" />
                                    {t('danger_zone') || 'Danger Zone'}
                                </h3>
                            </div>
                            <div className="p-4 bg-background">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-destructive/10 rounded-full text-destructive">
                                            <Trash2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-foreground">{t('reset_transactions') || 'Reset Transactions'}</h4>
                                            <p className="text-sm text-muted-foreground max-w-md mt-1">
                                                {t('reset_description') || 'Permanently delete all financial and work order history. This cannot be undone.'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        onClick={async () => {
                                            if (confirm(t('confirm_reset_1') || 'WARNING: This will permanently delete all transaction history. Are you sure?')) {
                                                if (confirm(t('confirm_reset_2') || 'Identify verification: Are you absolutely sure this is what you want to do?')) {
                                                    if (!confirm(t('confirm_reset_final') || 'Final Warning: This cannot be undone. Click OK to wipe all transaction data.')) return;

                                                    const { resetTransactions } = await import('../lib/dataCleanup');
                                                    const result = await resetTransactions();

                                                    if (result.success) {
                                                        toast.success(t('reset_success') || 'All transactions have been deleted.');
                                                        setTimeout(() => window.location.reload(), 2000);
                                                    } else {
                                                        console.error('Reset failed details:', result.error);
                                                        toast.error(`${t('reset_error') || 'Failed to reset data:'} ${result.error?.message || JSON.stringify(result.error)}`);
                                                    }
                                                }
                                            }
                                        }}
                                    >
                                        {t('delete_transactions') || 'Delete Transactions'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}
