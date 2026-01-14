import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { inspectionService } from '../lib/inspectionService';
import { Inspection, InspectionItem } from '../lib/supabase';
import { CheckCircle, AlertTriangle, XCircle, ChevronDown, Check, X, Phone, Share2, Loader, Camera } from 'lucide-react';

export function PublicInspection() {
    const { token } = useParams<{ token: string }>();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [inspection, setInspection] = useState<any>(null); // Inspection & nested objects
    const [decisions, setDecisions] = useState<Record<string, 'approved' | 'declined'>>({});
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (token) loadData();
    }, [token]);

    async function loadData() {
        try {
            const data = await inspectionService.getPublicInspection(token!);
            setInspection(data);
            // Pre-populate decisions if they exist
            const initialDecisions: Record<string, any> = {};
            data.inspection_items?.forEach((item: any) => { // Type assertion/any for simplicity in inspection object
                if (item.customer_decision) initialDecisions[item.id] = item.customer_decision;
            });
            setDecisions(initialDecisions);
        } catch (error) {
            console.error('Error loading inspection:', error);
        }
        setLoading(false);
    }

    async function handleSubmit() {
        // Loop through pending decisions (items that are red/yellow and decision changed)
        // For MVP, just update all decisions in state
        setLoading(true);
        try {
            const updates = Object.entries(decisions).map(([id, decision]) =>
                inspectionService.updateCustomerDecision(id, decision)
            );
            await Promise.all(updates);
            setSubmitted(true);
        } catch (err) {
            console.error(err);
            alert('Error submitting decisions');
        }
        setLoading(false);
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader className="animate-spin text-primary-600" /></div>;
    if (!inspection) return <div className="p-8 text-center bg-gray-50 h-screen flex flex-col items-center justify-center text-gray-500">
        <AlertTriangle className="w-12 h-12 mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">{t('expired_link') || 'Link Invalid or Expired'}</h3>
    </div>;

    const items: InspectionItem[] = inspection.inspection_items || [];
    const groupedItems = items.reduce((acc, item) => {
        const cat = item.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, InspectionItem[]>);

    const vehicle = inspection.work_orders?.vehicle;
    const customer = inspection.work_orders?.customer;

    // Calculate Summary
    const redCount = items.filter(i => i.status === 'red').length;
    const yellowCount = items.filter(i => i.status === 'yellow').length;
    const greenCount = items.filter(i => i.status === 'green').length;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">{t('public_report_title') || 'Vehicle Health Report'}</h1>
                        {vehicle && <p className="text-sm text-gray-500">{vehicle.year} {vehicle.make} {vehicle.model}</p>}
                    </div>
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900">{customer?.name}</p>
                        <p className="text-xs text-gray-500">WO #{inspection ? inspection.work_order_id.substring(0, 8) : ''}</p>
                    </div>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="max-w-3xl mx-auto px-4 py-6">
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-emerald-500 text-center">
                        <div className="text-2xl font-bold text-emerald-600 mb-1">{greenCount}</div>
                        <div className="text-xs uppercase tracking-wide text-gray-500">{t('ok')}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-amber-500 text-center">
                        <div className="text-2xl font-bold text-amber-600 mb-1">{yellowCount}</div>
                        <div className="text-xs uppercase tracking-wide text-gray-500">{t('monitor')}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500 text-center">
                        <div className="text-2xl font-bold text-red-600 mb-1">{redCount}</div>
                        <div className="text-xs uppercase tracking-wide text-gray-500">{t('action_required')}</div>
                    </div>
                </div>

                <div className="space-y-8">
                    {Object.entries(groupedItems).map(([category, categoryItems]) => {
                        return (
                            <div key={category} className="space-y-3">
                                <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                                    {t(category) || category}
                                    <span className="text-xs font-normal text-gray-500 px-2 py-0.5 bg-gray-100 rounded-full">{categoryItems.length}</span>
                                </h3>
                                <div className="space-y-4">
                                    {categoryItems.map((item: any) => (
                                        <div key={item.id} className={`bg-white rounded-xl shadow-sm overflow-hidden border ${item.status === 'red' ? 'border-red-200' : item.status === 'yellow' ? 'border-amber-200' : 'border-gray-100'}`}>
                                            <div className="p-4 flex gap-4">
                                                <div className="flex-shrink-0 pt-1">
                                                    {item.status === 'green' && <CheckCircle className="w-6 h-6 text-emerald-500" />}
                                                    {item.status === 'yellow' && <AlertTriangle className="w-6 h-6 text-amber-500" />}
                                                    {item.status === 'red' && <XCircle className="w-6 h-6 text-red-500" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-semibold text-gray-900">{t(item.label) || item.label}</h4>
                                                        {item.estimated_cost && (
                                                            <span className="text-sm font-medium text-gray-600">${item.estimated_cost}</span>
                                                        )}
                                                    </div>

                                                    {(item.notes || item.recommendation) && (
                                                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 mb-3 space-y-1">
                                                            {item.notes && <p><span className="font-medium text-gray-900">{t('notes_observations') || "Observation"}:</span> {item.notes}</p>}
                                                            {item.recommendation && <p><span className="font-medium text-gray-900">{t('recommendation') || "Recommendation"}:</span> {item.recommendation}</p>}
                                                        </div>
                                                    )}

                                                    {item.inspection_photos && item.inspection_photos.length > 0 && (
                                                        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                                                            {item.inspection_photos.map((photo: any) => (
                                                                <img key={photo.id} src={photo.url} className="h-24 w-auto rounded-lg object-cover border border-gray-200" alt="Inspection" />
                                                            ))}
                                                        </div>
                                                    )}

                                                    {(item.status === 'yellow' || item.status === 'red') && !submitted && (
                                                        <div className="flex gap-3 pt-2 border-t border-gray-100 mt-2">
                                                            <button
                                                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${decisions[item.id] === 'approved' ? 'bg-green-600 text-white shadow-md' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                                                onClick={() => setDecisions(prev => ({ ...prev, [item.id]: 'approved' }))}
                                                            >
                                                                <Check className="w-4 h-4" /> {t('approve_repair') || 'Approve'}
                                                            </button>
                                                            <button
                                                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${decisions[item.id] === 'declined' ? 'bg-red-600 text-white shadow-md' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                                                onClick={() => setDecisions(prev => ({ ...prev, [item.id]: 'declined' }))}
                                                            >
                                                                <X className="w-4 h-4" /> {t('decline_repair') || 'Decline'}
                                                            </button>
                                                        </div>
                                                    )}

                                                    {submitted && (item.status === 'yellow' || item.status === 'red') && decisions[item.id] && (
                                                        <div className={`mt-2 text-sm font-medium ${decisions[item.id] === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                                                            {decisions[item.id] === 'approved' ? (t('approved_for_repair') || 'Approved for repair') : (t('repair_declined') || 'Repair declined')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer Actions */}
            {!submitted && (redCount > 0 || yellowCount > 0) && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg z-20">
                    <div className="max-w-3xl mx-auto flex gap-4">
                        <button className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                            <Phone className="w-4 h-4" /> {t('call_shop') || 'Call Shop'}
                        </button>
                        <button
                            className="flex-[2] bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 shadow-lg"
                            onClick={handleSubmit}
                        >
                            {t('submit_decisions') || 'Submit Decisions'}
                        </button>
                    </div>
                </div>
            )}

            {submitted && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-green-50 border-t border-green-200 z-20 text-center">
                    <p className="text-green-800 font-medium flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" /> {t('thank_you_desc') || 'Thank you! Your response has been sent to the shop.'}
                    </p>
                </div>
            )}
        </div>
    );
}
