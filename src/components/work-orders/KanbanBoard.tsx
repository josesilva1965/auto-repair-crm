import { useTranslation } from 'react-i18next';
import { useSettings } from '../../contexts/SettingsContext';
import { supabase, type WorkOrder, type Estimate } from '../../lib/supabase'; // Adjust import path
import { Button } from '../Modal'; // Adjust import path if needed, or use bridge
import { Check, Clock, AlertCircle, DollarSign, Trash2 } from 'lucide-react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useDraggable, useDroppable, useSensor, useSensors, PointerSensor, defaultDropAnimationSideEffects, DropAnimation } from '@dnd-kit/core';
import { useNavigate } from 'react-router-dom';
import { PricingEngine } from '../../lib/pricingEngine';
import { useState } from 'react';
import { createPortal } from 'react-dom';

const STATUS_OPTIONS_COLORS: Record<string, string> = {
    pending: 'bg-amber-500',
    testing: 'bg-purple-500',
    'in-progress': 'bg-blue-600',
    completed: 'bg-emerald-500',
    cancelled: 'bg-red-500',
};

interface KanbanBoardProps {
    orders: WorkOrder[];
    onEdit: (o: WorkOrder) => void;
    getTechName: (id: string | null) => string;
    onStatusChange: (id: string, status: string) => void;
    estimates: Estimate[];
    onArchive: (id: string) => void;
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

export function KanbanBoard({ orders, onEdit, getTechName, onStatusChange, estimates, onArchive }: KanbanBoardProps) {
    const { t } = useTranslation();
    const columns = [
        { status: 'pending', titleKey: 'pending', color: 'bg-amber-500' },
        { status: 'testing', titleKey: 'testing', color: 'bg-purple-500' },
        { status: 'in-progress', titleKey: 'in_progress', color: 'bg-blue-600' },
        { status: 'completed', titleKey: 'completed', color: 'bg-emerald-500' },
        { status: 'cancelled', titleKey: 'cancelled', color: 'bg-red-500' },
    ];

    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            onStatusChange(active.id as string, over.id as string);
        }
        setActiveId(null);
    }

    const getEstimate = (orderId: string) => estimates.find(e => e.work_order_id === orderId);
    const activeOrder = activeId ? orders.find(o => o.id === activeId) : null;

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-12rem)]">
                {columns.map((col) => (
                    <KanbanColumn
                        key={col.status}
                        status={col.status}
                        title={t(col.titleKey)}
                        color={col.color}
                        count={orders.filter(o => o.status === col.status).length}
                    >
                        <div className="space-y-3">
                            {orders.filter((o) => o.status === col.status).map((order) => (
                                <DraggableCard
                                    key={order.id}
                                    order={order}
                                    onEdit={onEdit}
                                    getTechName={getTechName}
                                    estimate={getEstimate(order.id)}
                                    onArchive={onArchive}
                                    isOverlay={false}
                                />
                            ))}
                        </div>
                    </KanbanColumn>
                ))}
            </div>

            {createPortal(
                <DragOverlay dropAnimation={dropAnimation}>
                    {activeOrder ? (
                        <DraggableCard
                            order={activeOrder}
                            onEdit={onEdit}
                            getTechName={getTechName}
                            estimate={getEstimate(activeOrder.id)}
                            onArchive={onArchive}
                            isOverlay={true}
                        />
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}

function KanbanColumn({ status, title, color, count, children }: any) {
    const { setNodeRef } = useDroppable({
        id: status,
    });

    return (
        <div ref={setNodeRef} className="flex-shrink-0 w-80 flex flex-col h-full bg-neutral-50/50 rounded-xl p-2">
            <div className="flex items-center gap-2 mb-3 px-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <h3 className="font-semibold text-neutral-900">{title}</h3>
                <span className="text-sm text-neutral-500">({count})</span>
            </div>
            <div className="flex-1 overflow-y-auto px-2">
                {children}
            </div>
        </div>
    );
}

function DraggableCard({ order, onEdit, getTechName, estimate, onArchive, isOverlay }: { order: WorkOrder; onEdit: (o: WorkOrder) => void; getTechName: (id: string | null) => string; estimate?: Estimate; onArchive: (id: string) => void; isOverlay: boolean }) {
    const { t } = useTranslation();
    const { currency } = useSettings();
    const navigate = useNavigate();
    const pricingEngine = new PricingEngine();

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: order.id,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    // If it's the original item being dragged, hide it effectively so only overlay shows
    if (isDragging && !isOverlay) {
        return <div ref={setNodeRef} className="opacity-0 h-32 bg-neutral-100 rounded-lg border border-dashed border-neutral-300" />;
    }

    async function handleCreateInvoice(e: React.MouseEvent) {
        e.stopPropagation();

        const { data: existing } = await supabase
            .from('invoices')
            .select('id')
            .eq('work_order_id', order.id)
            .single();

        if (existing) {
            navigate('/billing');
            return;
        }

        const { subtotal, taxAmount, total } = pricingEngine.calculateInvoice(
            order.actual_cost || order.estimated_cost || 0
        );

        const { data: newInvoice, error } = await supabase.from('invoices').insert([{
            invoice_number: `INV-${Date.now()}`,
            work_order_id: order.id,
            customer_id: order.customer_id,
            subtotal,
            tax: taxAmount,
            discount: 0,
            total,
            status: 'pending',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }]).select().single();

        if (!error && newInvoice) {
            await supabase.from('work_orders').update({ status: 'archived' }).eq('id', order.id);
            navigate(`/billing?invoiceId=${newInvoice.id}`);
        }
    }

    function getEstimateBadge() {
        if (order.status === 'approved' || order.status === 'in-progress') {
            return (
                <div className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    <Check className="w-3 h-3" />
                    <span>{t('approved')}</span>
                </div>
            );
        }

        if (!estimate) return null;

        switch (estimate.status) {
            case 'sent':
                return (
                    <div className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                        <Clock className="w-3 h-3" />
                        <span>{t('awaiting_approval')}</span>
                    </div>
                );
            case 'approved':
                return (
                    <div className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                        <Check className="w-3 h-3" />
                        <span>{t('approved')}</span>
                    </div>
                );
            case 'rejected':
                return (
                    <div className="flex items-center gap-1 text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        <span>{t('rejected')}</span>
                    </div>
                );
            default:
                return null;
        }
    }

    return (
        <div
            ref={isOverlay ? undefined : setNodeRef}
            style={isOverlay ? undefined : style}
            {...(isOverlay ? {} : listeners)}
            {...(isOverlay ? {} : attributes)}
            onClick={() => onEdit(order)}
            className={`bg-white p-4 rounded-lg border border-neutral-200 shadow-card hover:shadow-md transition-all touch-none ${!isOverlay ? 'cursor-grab active:cursor-grabbing' : 'cursor-grabbing shadow-xl ring-2 ring-primary-500 ring-offset-2 rotate-2'}`}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-neutral-900">#{order.id.substring(0, 8)}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${order.priority === 'urgent' ? 'bg-red-100 text-red-700' : order.priority === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'}`}>
                    {t(order.priority)}
                </span>
            </div>
            <p className="text-sm text-neutral-600 line-clamp-2 mb-3">{order.description || t('no_description')}</p>
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                <span>{getTechName(order.technician_id)}</span>
                <span>{currency}{(order.actual_cost || order.estimated_cost || 0).toFixed(0)}</span>
            </div>

            {getEstimateBadge() && (
                <div className="mb-2">
                    {getEstimateBadge()}
                </div>
            )}

            {(order.status === 'completed' || order.status === 'cancelled') && (
                <div className="flex gap-2">
                    {order.status === 'completed' && (
                        <Button
                            size="sm"
                            className="w-full mt-2 bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={handleCreateInvoice}
                        >
                            <DollarSign className="w-3 h-3 mr-1" />
                            {t('create_invoice')}
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="secondary"
                        className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                            e.stopPropagation();
                            onArchive(order.id);
                        }}
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            )}
        </div>
    );
}
