import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Select, Input } from './Modal';
import { inspectionService } from '../lib/inspectionService';
import { CheckCircle, AlertTriangle, XCircle, Camera, Share2, Loader } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Inspection, InspectionItem } from '../lib/supabase';

interface InspectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrderId: string;
}

export function InspectionModal({ isOpen, onClose, workOrderId }: InspectionModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [uploading, setUploading] = useState<string | null>(null);

    // Queries
    const { data: templates } = useQuery({
        queryKey: ['inspection-templates'],
        queryFn: inspectionService.getTemplates,
        enabled: isOpen,
    });

    const { data: inspection, isLoading: isLoadingInspection } = useQuery<InspectionWithItems | null>({
        queryKey: ['inspection', workOrderId],
        queryFn: async () => {
            const data = await inspectionService.getInspection(workOrderId);
            if (!data && templates && templates.length > 0 && !selectedTemplate) {
                setSelectedTemplate(templates[0].id);
            }
            // Supabase returns generic data, assertion might be needed if service doesn't return generic
            return data as InspectionWithItems;
        },
        enabled: isOpen && !!workOrderId,
    });

    // Derived state from query data
    const items = inspection?.inspection_items || [];

    // Extended type for Inspection with relations
    type InspectionWithItems = Inspection & { inspection_items: InspectionItem[] };

    // Mutations
    const startInspectionMutation = useMutation({
        mutationFn: async () => {
            if (!selectedTemplate) throw new Error("No template selected");
            return await inspectionService.startInspection(workOrderId, selectedTemplate);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection', workOrderId] });
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ itemId, status }: { itemId: string; status: 'green' | 'yellow' | 'red' }) => {
            return await inspectionService.updateItemStatus(itemId, status);
        },
        onMutate: async ({ itemId, status }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['inspection', workOrderId] });

            // Snapshot previous value
            const previousInspection = queryClient.getQueryData<InspectionWithItems | null>(['inspection', workOrderId]);

            // Optimistic Update
            if (previousInspection && previousInspection.inspection_items) {
                queryClient.setQueryData(['inspection', workOrderId], {
                    ...previousInspection,
                    inspection_items: previousInspection.inspection_items.map(i =>
                        i.id === itemId ? { ...i, status } : i
                    )
                });
            }

            return { previousInspection };
        },
        onError: (_err, _newTodo, context) => {
            if (context?.previousInspection) {
                queryClient.setQueryData(['inspection', workOrderId], context.previousInspection);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection', workOrderId] });
        }
    });

    const updateNoteMutation = useMutation({
        mutationFn: async ({ itemId, notes }: { itemId: string; notes: string }) => {
            return await inspectionService.updateItemNotes(itemId, notes);
        },
        onSuccess: () => {
            // Invalidate but don't blocking wait, assumes user might type more
            queryClient.invalidateQueries({ queryKey: ['inspection', workOrderId] });
        }
    });

    const uploadPhotoMutation = useMutation({
        mutationFn: async ({ itemId, file }: { itemId: string; file: File }) => {
            setUploading(itemId);
            await inspectionService.uploadPhoto(itemId, file);
            setUploading(null);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection', workOrderId] });
        }
    });

    const completeInspectionMutation = useMutation({
        mutationFn: async (id: string) => {
            return await inspectionService.completeInspection(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection', workOrderId] });
        }
    });

    const seedDefaultsMutation = useMutation({
        mutationFn: inspectionService.seedDefaults,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection-templates'] });
        }
    });

    // Handlers
    const handleStart = () => startInspectionMutation.mutate();

    const handleStatusUpdate = (itemId: string, status: 'green' | 'yellow' | 'red') => {
        updateStatusMutation.mutate({ itemId, status });
    };

    const handleNoteUpdate = (itemId: string, notes: string) => {
        // In real app, debounce this
        updateNoteMutation.mutate({ itemId, notes });
    };

    const handlePhotoUpload = (itemId: string, file: File) => {
        uploadPhotoMutation.mutate({ itemId, file });
    };

    const handleComplete = () => {
        if (!inspection) return;
        if (confirm(t('confirm_complete_inspection') || 'Complete inspection and generate report?')) {
            completeInspectionMutation.mutate(inspection.id);
        }
    };

    const groupedItems = items.reduce((acc, item) => {
        const cat = item.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, InspectionItem[]>);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('vehicle_inspection') || 'Vehicle Inspection'} size="xl">
            {isLoadingInspection ? (
                <div className="flex justify-center p-10"><Loader className="animate-spin" /></div>
            ) : !inspection ? (
                <div className="space-y-6 py-6">
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-medium">{t('start_new_inspection') || 'Start New Inspection'}</h3>
                        <p className="text-neutral-500">{t('select_template_desc') || 'Select a template to begin a structured vehicle check.'}</p>
                    </div>
                    <div className="max-w-md mx-auto space-y-4">
                        {!templates || templates.length === 0 ? (
                            <div className="text-center p-6 bg-yellow-50 rounded-xl border border-yellow-100">
                                <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                                <p className="text-sm text-yellow-700 mb-4">{t('no_templates_found') || 'No inspection templates found. Create a default template to get started.'}</p>
                                <Button
                                    className="w-full"
                                    variant="secondary"
                                    onClick={() => seedDefaultsMutation.mutate()}
                                    disabled={seedDefaultsMutation.isPending}
                                >
                                    {seedDefaultsMutation.isPending ? <Loader className="animate-spin w-4 h-4 mr-2" /> : null}
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
                                <Button
                                    className="w-full"
                                    onClick={handleStart}
                                    disabled={startInspectionMutation.isPending}
                                >
                                    {startInspectionMutation.isPending ? <Loader className="animate-spin w-4 h-4 mr-2" /> : null}
                                    {t('start_new_inspection') || 'Start Inspection'}
                                </Button>
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
                            <Button onClick={handleComplete} disabled={completeInspectionMutation.isPending}>
                                {completeInspectionMutation.isPending ? <Loader className="animate-spin w-4 h-4 mr-2" /> : null}
                                {t('complete_and_share') || 'Complete & Share'}
                            </Button>
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
                                                    defaultValue={item.notes || ''} // Changed to defaultValue for simpler non-controlled input during debounce
                                                    onBlur={e => handleNoteUpdate(item.id, e.target.value)}
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
