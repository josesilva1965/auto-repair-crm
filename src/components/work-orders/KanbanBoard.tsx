// @ts-nocheck
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../contexts/SettingsContext';
import { supabase, type WorkOrder, type Estimate, type Customer, type Vehicle, type Technician } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Check, Clock, AlertCircle, DollarSign, Trash2, MoreHorizontal, MessageSquare, User, Calendar, Wrench } from 'lucide-react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useDraggable, useDroppable, useSensor, useSensors, PointerSensor, defaultDropAnimationSideEffects, DropAnimation } from '@dnd-kit/core';
import { useNavigate } from 'react-router-dom';
import { PricingEngine } from '../../lib/pricingEngine';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

interface KanbanBoardProps {
    orders: WorkOrder[];
    customers: Customer[];
    vehicles: Vehicle[];
    technicians: Technician[];
    onEdit: (o: WorkOrder) => void;
    getTechName: (id: string | null) => string;
    onStatusChange: (id: string, status: string) => void;
    estimates: Estimate[];
    onArchive: (id: string) => void;
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: { opacity: '0.5' },
        },
    }),
};

export function KanbanBoard({ orders, customers, vehicles, technicians, onEdit, getTechName, onStatusChange, estimates, onArchive }: KanbanBoardProps) {
    const { t } = useTranslation();
    const columns = [
        { status: 'pending', titleKey: 'new_requests', color: 'bg-blue-500', borderColor: 'border-l-blue-500', countColor: 'bg-blue-100 text-blue-600' },
        { status: 'testing', titleKey: 'testing', color: 'bg-pink-500', borderColor: 'border-l-pink-500', countColor: 'bg-pink-100 text-pink-600' },
        { status: 'in-progress', titleKey: 'in_progress', color: 'bg-orange-500', borderColor: 'border-l-orange-500', countColor: 'bg-orange-100 text-orange-600' },
        { status: 'waiting_parts', titleKey: 'awaiting_parts', color: 'bg-purple-500', borderColor: 'border-l-purple-500', countColor: 'bg-purple-100 text-purple-600' },
        { status: 'completed', titleKey: 'ready_for_pickup', color: 'bg-emerald-500', borderColor: 'border-l-emerald-500', countColor: 'bg-emerald-100 text-emerald-600' },
        { status: 'finished', titleKey: 'finished', color: 'bg-cyan-500', borderColor: 'border-l-cyan-500', countColor: 'bg-cyan-100 text-cyan-600' },
    ];

    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeBorderColor, setActiveBorderColor] = useState<string>('');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
        const order = orders.find(o => o.id === event.active.id);
        if (order) {
            const col = columns.find(c => c.status === order.status);
            if (col) setActiveBorderColor(col.borderColor);
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            onStatusChange(active.id as string, over.id as string);
        }
        setActiveId(null);
        setActiveBorderColor('');
    }

    const getEstimate = (orderId: string) => estimates.find(e => e.work_order_id === orderId);
    const activeOrder = activeId ? orders.find(o => o.id === activeId) : null;
    const getCustomer = (id: string) => customers.find(c => c.id === id);
    const getVehicle = (id: string) => vehicles.find(v => v.id === id);
    const getTechnician = (id: string | null) => technicians.find(t => t.id === id);

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-3 overflow-x-auto pb-4 h-[calc(100vh-12rem)] px-4">
                {columns.map((col) => (
                    <KanbanColumn
                        key={col.status}
                        status={col.status}
                        title={t(col.titleKey)}
                        dotColor={col.color}
                        countBadgeClass={col.countColor}
                        count={orders.filter(o => o.status === col.status).length}
                    >
                        <div className="space-y-2">
                            {orders.filter((o) => o.status === col.status).map((order) => (
                                <DraggableCard
                                    key={order.id}
                                    order={order}
                                    customer={getCustomer(order.customer_id)}
                                    vehicle={getVehicle(order.vehicle_id)}
                                    technician={getTechnician(order.technician_id)}
                                    onEdit={onEdit}
                                    estimate={getEstimate(order.id)}
                                    onArchive={onArchive}
                                    isOverlay={false}
                                    borderColor={col.borderColor}
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
                            customer={getCustomer(activeOrder.customer_id)}
                            vehicle={getVehicle(activeOrder.vehicle_id)}
                            technician={getTechnician(activeOrder.technician_id)}
                            onEdit={onEdit}
                            estimate={getEstimate(activeOrder.id)}
                            onArchive={onArchive}
                            isOverlay={true}
                            borderColor={activeBorderColor || 'border-l-blue-500'}
                        />
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}

function KanbanColumn({ status, title, dotColor, count, countBadgeClass, children }: any) {
    const { setNodeRef } = useDroppable({ id: status });

    return (
        <div ref={setNodeRef} className="flex-shrink-0 w-[260px] flex flex-col h-full rounded-lg">
            <div className="flex items-center gap-2 mb-2 px-1">
                <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                <h3 className="font-bold text-neutral-900 text-sm">{title}</h3>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", countBadgeClass)}>{count}</span>
                <button className="ml-auto text-neutral-400 hover:text-neutral-600">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 pb-1 scrollbar-hide">
                {children}
            </div>
        </div>
    );
}

function DraggableCard({ order, customer, vehicle, technician, onEdit, estimate, onArchive, isOverlay, borderColor }:
    { order: WorkOrder; customer?: Customer; vehicle?: Vehicle; technician?: Technician; onEdit: (o: WorkOrder) => void; estimate?: Estimate; onArchive: (id: string) => void; isOverlay: boolean; borderColor: string }) {
    const { t } = useTranslation();
    const { currency } = useSettings();
    const navigate = useNavigate();

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: order.id });

    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

    if (isDragging && !isOverlay) {
        return <div ref={setNodeRef} className="opacity-0 h-28 bg-neutral-100 rounded-xl border border-dashed border-neutral-300" />;
    }

    const isUrgent = order.priority === 'urgent';
    const progress = order.status === 'pending' ? 0 :
        order.status === 'in-progress' ? 65 :
            order.status === 'testing' ? 85 :
                order.status === 'waiting_parts' ? 45 :
                    order.status === 'finished' ? 100 : 100;

    return (
        <div
            ref={isOverlay ? undefined : setNodeRef}
            style={isOverlay ? undefined : style}
            {...(isOverlay ? {} : listeners)}
            {...(isOverlay ? {} : attributes)}
            onClick={() => onEdit(order)}
            className={cn(
                "bg-white p-3 rounded-xl border-y border-r border-neutral-100 shadow-sm transition-all group border-l-[4px]", // reduced border width
                borderColor,
                !isOverlay ? "hover:shadow-md cursor-grab active:cursor-grabbing hover:translate-y-[-2px]" : "cursor-grabbing shadow-xl ring-2 ring-primary ring-offset-2 rotate-2 scale-105"
            )}
        >
            <div className="flex items-center justify-between mb-2 text-[10px]">
                <span className="text-neutral-400 font-medium tracking-wide">REQ-{order.id.substring(0, 4)}</span>
                {isUrgent && (
                    <span className="bg-red-50 text-red-600 font-bold px-1.5 py-0.5 rounded text-[9px] tracking-wider uppercase">
                        {t('updated_urgent') || 'URGENT'}
                    </span>
                )}
            </div>

            <div className="mb-3">
                <h4 className="font-bold text-neutral-900 text-sm mb-0.5 truncate">{vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}</h4>
                <div className="flex items-center text-xs text-neutral-500 gap-1">
                    <User className="w-3 h-3" />
                    <span className="truncate max-w-[80px]">{customer?.name || 'Unknown'}</span>
                    <span className="text-neutral-300">•</span>
                    <span className="truncate flex-1">{order.description ? (order.description.length > 15 ? order.description.substring(0, 15) + '...' : order.description) : t('diagnostic')}</span>
                </div>
            </div>

            {/* Status Specific Content */}
            {order.status === 'in-progress' && (
                <div className="mb-3">
                    <div className="flex justify-between text-[10px] font-medium mb-1">
                        <span className="text-blue-600">{t('in_progress') || 'In Progress'}</span>
                        <span className="text-blue-600">{progress}%</span>
                    </div>
                    <div className="h-1 w-full bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            {order.status === 'testing' && (
                <div className="mb-3">
                    <div className="flex justify-between text-[10px] font-medium mb-1">
                        <span className="text-pink-600">{t('testing') || 'Testing'}</span>
                        <span className="text-pink-600">85%</span>
                    </div>
                    <div className="h-1 w-full bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500 rounded-full" style={{ width: '85%' }} />
                    </div>
                </div>
            )}

            {order.status === 'waiting_parts' && (
                <div className="mb-3 px-2 py-1 bg-purple-50 text-purple-700 text-[10px] font-medium rounded flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span className="truncate">{t('waiting_for_parts') || 'Waiting parts'}</span>
                </div>
            )}

            {order.status === 'finished' && (
                <div className="mb-3">
                    <div className="flex justify-between text-[10px] font-medium mb-1">
                        <span className="text-cyan-600">{t('finished') || 'Finished'}</span>
                        <span className="text-cyan-600">100%</span>
                    </div>
                    <div className="h-1 w-full bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: '100%' }} />
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-neutral-50 mt-1">
                <div className="flex items-center gap-2">
                    {technician ? (
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center text-[9px] font-bold text-neutral-600 overflow-hidden">
                                {technician.avatar_url ? <img src={technician.avatar_url} alt={technician.name} /> : technician.name.substring(0, 2)}
                            </div>
                            <span className="text-[10px] font-medium text-neutral-600 truncate max-w-[60px]">{technician.name.split(' ')[0]}</span>
                        </div>
                    ) : (
                        <button className="flex items-center gap-1 text-[10px] font-medium text-neutral-400 hover:text-primary transition-colors">
                            <div className="w-5 h-5 rounded-full border border-dashed border-neutral-300 flex items-center justify-center">
                                <User className="w-2.5 h-2.5" />
                            </div>
                            {t('assign')}
                        </button>
                    )}
                </div>

                <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded" title={t('notify_customer')}>
                        <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                        className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded"
                        onClick={(e) => { e.stopPropagation(); onEdit(order); }}
                    >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {order.status === 'completed' && (
                <Button className="w-full mt-2 h-7 text-[10px] bg-blue-600 hover:bg-blue-700" onClick={(e) => { e.stopPropagation(); navigate(`/billing?workOrderId=${order.id}`); }}>
                    {t('notify_invoice') || 'Notify & Invoice'}
                </Button>
            )}
        </div>
    );
}
