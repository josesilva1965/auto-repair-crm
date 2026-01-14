import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Select, Input } from './Modal';
import { inspectionService } from '../lib/inspectionService';
import { Inspection, InspectionTemplate, InspectionItem } from '../lib/supabase';
import { CheckCircle, AlertTriangle, XCircle, Camera, FileText, Share2, Loader } from 'lucide-react';

interface InspectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrderId: string;
}

export function InspectionModal({ isOpen, onClose, workOrderId }: InspectionModalProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
    const [inspection, setInspection] = useState<Inspection | null>(null);
    const [items, setItems] = useState<InspectionItem[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [uploading, setUploading] = useState<string | null>(null); // itemId

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, workOrderId]);

    async function loadData() {
        setLoading(true);
        // Reset state to avoid showing previous inspection data
        setInspection(null);
        setItems([]);

        try {
            const existing = await inspectionService.getInspection(workOrderId);
            if (existing) {
                setInspection(existing);
                setItems(existing.inspection_items || []);
            } else {
                const tmpls = await inspectionService.getTemplates();
                setTemplates(tmpls);
                if (tmpls.length > 0) setSelectedTemplate(tmpls[0].id);
            }
        } catch (error) {
            console.error('Error loading inspection:', error);
        }
        setLoading(false);
    }

    async function handleStart() {
        if (!selectedTemplate) return;
        setLoading(true);
        try {
            const newInsp = await inspectionService.startInspection(workOrderId, selectedTemplate);
            // Reload to get items joined
            const reloaded = await inspectionService.getInspection(workOrderId);
            if (reloaded) {
                setInspection(reloaded);
                setItems(reloaded.inspection_items || []);
            }
        } catch (error) {
            console.error('Error starting inspection:', error);
            alert('Failed to start inspection');
        }
        setLoading(false);
    }

    async function handleStatusUpdate(itemId: string, status: 'green' | 'yellow' | 'red') {
        // Optimistic update
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, status } : i));
        try {
            await inspectionService.updateItemStatus(itemId, status);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    }

    async function handleNoteUpdate(itemId: string, notes: string) {
        // Debouncing ideally, but simple update for now
        try {
            await inspectionService.updateItemNotes(itemId, notes);
            setItems(prev => prev.map(i => i.id === itemId ? { ...i, notes } : i));
        } catch (error) {
            console.error('Error updating notes:', error);
        }
    }

    async function handlePhotoUpload(itemId: string, file: File) {
        setUploading(itemId);
        try {
            await inspectionService.uploadPhoto(itemId, file);
            // Reload to refresh photos
            const reloaded = await inspectionService.getInspection(workOrderId);
            if (reloaded) setItems(reloaded.inspection_items || []);
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Failed to upload photo');
        }
        setUploading(null);
    }

    async function handleComplete() {
        if (!inspection) return;
        if (confirm(t('confirm_complete_inspection') || 'Complete inspection and generate report?')) {
            try {
                await inspectionService.completeInspection(inspection.id);
                setInspection(prev => prev ? { ...prev, status: 'completed' } : null);
            } catch (err) {
                console.error(err);
                alert('Error completing inspection');
            }
        }
    }

    const groupedItems = items.reduce((acc, item) => {
        const cat = item.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, InspectionItem[]>);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('vehicle_inspection') || 'Vehicle Inspection'} size="xl">
            {loading ? (
                <div className="flex justify-center p-10"><Loader className="animate-spin" /></div>
            ) : !inspection ? (
                <div className="space-y-6 py-6">
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-medium">{t('start_new_inspection') || 'Start New Inspection'}</h3>
                        <p className="text-neutral-500">{t('select_template_desc') || 'Select a template to begin a structured vehicle check.'}</p>
                    </div>
                    <div className="max-w-md mx-auto space-y-4">
                        {templates.length === 0 ? (
                            <div className="text-center p-6 bg-yellow-50 rounded-xl border border-yellow-100">
                                <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                                <p className="text-sm text-yellow-700 mb-4">{t('no_templates_found') || 'No inspection templates found. Create a default template to get started.'}</p>
                                <Button
                                    className="w-full"
                                    variant="secondary"
                                    onClick={async () => {
                                        setLoading(true);
                                        try {
                                            await inspectionService.seedDefaults();
                                            await loadData(); // Reload
                                        } catch (e) {
                                            console.error(e);
                                            alert('Error creating defaults');
                                        }
                                        setLoading(false);
                                    }}
                                >
                                    {t('create_defaults') || 'Create Default Templates'}
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Select
                                    label={t('template') || 'Template'}
                                    value={selectedTemplate}
                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                    options={templates.map(t => ({ value: t.id, label: t.name }))}
                                />
                                <Button className="w-full" onClick={handleStart}>{t('start_new_inspection') || 'Start Inspection'}</Button>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-neutral-50 p-4 rounded-lg">
                        <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500" /> {items.filter(i => i.status === 'green').length} {t('ok') || 'OK'}</div>
                            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500" /> {items.filter(i => i.status === 'yellow').length} {t('monitor') || 'Watch'}</div>
                            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500" /> {items.filter(i => i.status === 'red').length} {t('action_required') || 'Fail'}</div>
                        </div>
                        {inspection.status !== 'completed' ? (
                            <Button onClick={handleComplete}>{t('complete_and_share') || 'Complete & Share'}</Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => {
                                    const url = `${window.location.origin}/inspection/${inspection.token}`;
                                    navigator.clipboard.writeText(url);
                                    alert(t('link_copied') || 'Link copied to clipboard!');
                                }}>
                                    <Share2 className="w-4 h-4 mr-2" />
                                    {t('copy_link') || 'Copy Link'}
                                </Button>
                                <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-1" /> {t('completed') || 'Completed'}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2">
                        {Object.entries(groupedItems).map(([category, categoryItems]) => (
                            <div key={category} className="space-y-3">
                                <h4 className="font-semibold text-lg text-neutral-800 border-b pb-1">{t(category) || category}</h4>
                                {categoryItems.map(item => (
                                    <div key={item.id} className="bg-white border border-neutral-200 rounded-lg p-3 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <span className="font-medium">{t(item.label) || item.label}</span>
                                            <div className="flex gap-1">
                                                <button
                                                    className={`p-1.5 rounded-md transition-colors ${item.status === 'green' ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'}`}
                                                    onClick={() => handleStatusUpdate(item.id, 'green')}
                                                    title={t('ok') || "OK"}
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                                <button
                                                    className={`p-1.5 rounded-md transition-colors ${item.status === 'yellow' ? 'bg-amber-100 text-amber-600' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'}`}
                                                    onClick={() => handleStatusUpdate(item.id, 'yellow')}
                                                    title={t('monitor') || "Monitor"}
                                                >
                                                    <AlertTriangle className="w-5 h-5" />
                                                </button>
                                                <button
                                                    className={`p-1.5 rounded-md transition-colors ${item.status === 'red' ? 'bg-red-100 text-red-600' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'}`}
                                                    onClick={() => handleStatusUpdate(item.id, 'red')}
                                                    title={t('action_required') || "Action Required"}
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {(item.status === 'yellow' || item.status === 'red') && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                                <Input
                                                    placeholder={t('notes_observations') || "Notes / Observations..."}
                                                    value={item.notes || ''}
                                                    onChange={e => handleNoteUpdate(item.id, e.target.value)}
                                                    className="text-sm"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm text-neutral-600 transition-colors">
                                                        <Camera className="w-4 h-4" />
                                                        {uploading === item.id ? (t('uploading') || 'Uploading...') : (t('add_photo') || 'Add Photo')}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                if (e.target.files?.[0]) handlePhotoUpload(item.id, e.target.files[0]);
                                                            }}
                                                            disabled={uploading === item.id}
                                                        />
                                                    </label>
                                                    {/* Show photo count or thumbnails here if needed */}
                                                    {/* Assuming inspection_photos join, checking item.inspection_photos if available (needs complex join logic in fetch or explicit fetch) */}
                                                    {/* For MVP, trusting the upload works. Ideally display thumbnails. */}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Modal>
    );
}
