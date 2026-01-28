import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallAppBanner() {
    const { t } = useTranslation();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

    useEffect(() => {
        // Check if already installed as PWA
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        if (isStandalone) return;

        // Check if iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(iOS);

        // Check if user dismissed the banner before
        const dismissed = localStorage.getItem('pwa-banner-dismissed');
        if (dismissed) return;

        // Listen for the beforeinstallprompt event (Chrome, Edge, etc.)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Show iOS instructions if on iOS and not in standalone mode
        if (iOS && !isStandalone) {
            setShowBanner(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIOSInstructions(true);
            return;
        }

        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowBanner(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        setShowIOSInstructions(false);
        localStorage.setItem('pwa-banner-dismissed', 'true');
    };

    if (!showBanner) return null;

    return (
        <>
            {/* Install Banner */}
            <div className="fixed bottom-4 left-4 right-4 z-50 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl shadow-lg p-4 flex items-center gap-4 animate-slide-up">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm">{t('install_app')}</h3>
                    <p className="text-white/80 text-xs truncate">{t('install_app_desc')}</p>
                </div>
                <button
                    onClick={handleInstallClick}
                    className="flex-shrink-0 bg-white text-primary-600 px-4 py-2 rounded-xl font-medium text-sm hover:bg-white/90 transition-colors flex items-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    {t('install')}
                </button>
                <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 text-white/60 hover:text-white p-1"
                    aria-label={t('close')}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* iOS Instructions Modal */}
            {showIOSInstructions && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-end justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-foreground">{t('install_on_ios')}</h3>
                            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <ol className="space-y-4 text-sm text-muted-foreground">
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-medium">1</span>
                                <span>{t('ios_step_1')}</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-medium">2</span>
                                <span>{t('ios_step_2')}</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-medium">3</span>
                                <span>{t('ios_step_3')}</span>
                            </li>
                        </ol>
                        <button
                            onClick={handleDismiss}
                            className="w-full mt-6 bg-primary-500 text-white py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors"
                        >
                            {t('got_it')}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
