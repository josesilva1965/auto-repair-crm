import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Check, X, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EstimateDetails {
    id: string;
    estimate_number: string;
    subtotal: number;
    tax: number;
    total: number;
    status: string;
    customer_name: string;
    vehicle_info: string;
    expecting_response: boolean;
    created_at: string;
    items: Array<{
        description: string;
        quantity: number;
        unit_price: number;
        total: number;
    }>;
}

export function ApproveEstimate() {
    const { t } = useTranslation();
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [estimate, setEstimate] = useState<EstimateDetails | null>(null);
    const [actionStatus, setActionStatus] = useState<'idle' | 'approving' | 'rejecting' | 'success' | 'error'>('idle');
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);

    useEffect(() => {
        if (token) {
            loadEstimate(token);
        } else {
            setError('Invalid approval link.');
            setLoading(false);
        }
    }, [token]);

    async function loadEstimate(token: string) {
        try {
            const { data, error } = await supabase.rpc('get_estimate_by_token', { p_token: token });

            if (error) throw error;

            if (!data) {
                setError(t('expired_link'));
            } else {
                setEstimate(data);
            }
        } catch (err) {
            console.error('Error loading estimate:', err);
            setError(t('load_error'));
        } finally {
            setLoading(false);
        }
    }

    async function handleResponse(action: 'approve' | 'reject') {
        if (!token) return;

        if (action === 'reject' && !showRejectInput) {
            setShowRejectInput(true);
            return;
        }

        setActionStatus(action === 'approve' ? 'approving' : 'rejecting');

        try {
            const { data, error } = await supabase.rpc('respond_to_estimate', {
                p_token: token,
                p_action: action,
                p_reason: action === 'reject' ? rejectReason : null
            });

            if (error) throw error;

            if (data.success) {
                setActionStatus('success');
                // Update local state to reflect change
                if (estimate) {
                    setEstimate({ ...estimate, status: action === 'approve' ? 'approved' : 'rejected', expecting_response: false });
                }
            } else {
                setError(data.message || 'Failed to update estimate.');
                setActionStatus('error');
            }
        } catch (err) {
            console.error('Error responding to estimate:', err);
            setError('An error occurred. Please try again.');
            setActionStatus('error');
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!estimate) return null;

    if (actionStatus === 'success') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('thank_you')}</h2>
                    <p className="text-gray-600">
                        {t('approval_message', { vehicle: estimate.vehicle_info, status: estimate.status === 'approved' ? t('approved') : t('rejected') })}
                    </p>
                    <p className="text-gray-500 mt-4 text-sm">{t('close_window')}</p>
                </div>
            </div>
        );
    }

    const isSent = estimate.status === 'sent';

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900">{t('approval_page_title')}</h1>
                    <p className="mt-2 text-lg text-gray-600">
                        {t('approval_subtitle')}
                    </p>
                </div>

                {/* Estimate Card */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    {/* Status Banner (if not 'sent') */}
                    {!isSent && (
                        <div className={`px-6 py-3 border-b ${estimate.status === 'approved' ? 'bg-green-50 border-green-200' :
                            estimate.status === 'rejected' ? 'bg-red-50 border-red-200' :
                                'bg-gray-50 border-gray-200'
                            }`}>
                            <div className="flex items-center">
                                {estimate.status === 'approved' ? <Check className="h-5 w-5 text-green-500 mr-2" /> :
                                    estimate.status === 'rejected' ? <X className="h-5 w-5 text-red-500 mr-2" /> :
                                        <AlertCircle className="h-5 w-5 text-gray-500 mr-2" />}
                                <span className={`font-medium ${estimate.status === 'approved' ? 'text-green-800' :
                                    estimate.status === 'rejected' ? 'text-red-800' :
                                        'text-gray-800'
                                    }`}>
                                    {t('status')}: {t(estimate.status)}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="px-6 py-6 border-b border-gray-200 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">{t('customer')}</h3>
                                <p className="mt-1 text-lg font-semibold text-gray-900">{estimate.customer_name}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">{t('vehicle')}</h3>
                                <p className="mt-1 text-lg font-semibold text-gray-900">{estimate.vehicle_info}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                #{estimate.estimate_number || estimate.id.slice(0, 8)}
                            </span>
                            <span className="text-sm text-gray-500">
                                {new Date(estimate.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="border-t border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('description')}
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('quantity')}
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('unit_cost')}
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('total')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {estimate.items && estimate.items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                            {item.unit_price.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                            {item.total.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">{t('subtotal')}</td>
                                    <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">{estimate.subtotal.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">{t('tax')}</td>
                                    <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">{estimate.tax.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="px-6 py-3 text-right text-base font-bold text-gray-900">{t('total')}</td>
                                    <td className="px-6 py-3 text-right text-base font-bold text-blue-600">{estimate.total.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Actions */}
                    {isSent && (
                        <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('your_decision')}</h3>

                            {!showRejectInput ? (
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        onClick={() => handleResponse('approve')}
                                        disabled={actionStatus !== 'idle'}
                                        className="flex-1 flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                    >
                                        {actionStatus === 'approving' ? t('processing') : (
                                            <>
                                                <Check className="h-5 w-5 mr-2" />
                                                {t('approve_estimate')}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleResponse('reject')}
                                        disabled={actionStatus !== 'idle'}
                                        className="flex-1 flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                    >
                                        <X className="h-5 w-5 mr-2" />
                                        {t('decline')}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                                        {t('decline_reason')}
                                    </label>
                                    <textarea
                                        id="reason"
                                        rows={3}
                                        className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder={t('decline_placeholder')}
                                    />
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleResponse('reject')}
                                            disabled={actionStatus !== 'idle'}
                                            className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            {actionStatus === 'rejecting' ? t('processing') : t('confirm_decline')}
                                        </button>
                                        <button
                                            onClick={() => setShowRejectInput(false)}
                                            className="flex-1 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            {t('cancel')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
