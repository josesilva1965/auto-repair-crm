// @ts-nocheck
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable, useSensor, useSensors, PointerSensor, DragStartEvent } from '@dnd-kit/core';
import { Technician, WorkOrder } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import { format, setHours, setMinutes, parseISO, isSameDay, addDays, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

interface TechnicianSchedulerProps {
    technicians: Technician[];
    workOrders: WorkOrder[];
    onUpdate: () => void;
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM

export function TechnicianScheduler({ technicians, workOrders, onUpdate }: TechnicianSchedulerProps) {
    const { t } = useTranslation();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    // Filter orders for the selected date
    const dailyOrders = useMemo(() => {
        return workOrders.filter(o => {
            if (!o.scheduled_date) return false;
            return isSameDay(parseISO(o.scheduled_date), selectedDate);
        });
    }, [workOrders, selectedDate]);

    // Unscheduled or other date orders (optional sidebar, focusing on main grid for now)

    // Unscheduled orders (or orders scheduled for other days that are active)
    const unscheduledOrders = useMemo(() => {
        return workOrders.filter(o => {
            // Include explicitly unscheduled
            if (!o.scheduled_date) return true;
            // Include active jobs scheduled for OTHER days (so we can move them here)
            // But exclude 'completed' or 'archived' on other days to reduce noise
            const isOtherDay = !isSameDay(parseISO(o.scheduled_date), selectedDate);
            const isActive = ['pending', 'in-progress', 'testing', 'waiting_parts'].includes(o.status);
            return isOtherDay && isActive;
        });
    }, [workOrders, selectedDate]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        // Check if dropped on grid vs back to unscheduled list
        if (over.id === 'unscheduled') {
            const { error } = await supabase
                .from('work_orders')
                .update({
                    technician_id: null,
                    scheduled_date: null
                })
                .eq('id', active.id);
            if (!error) {
                toast.success(t('unscheduled') || 'Job unscheduled');
                onUpdate();
            }
            return;
        }

        // active.id is work_order_id
        // over.id is format: "techId-hour"
        const [techId, hourStr] = (over.id as string).split('|');
        const hour = parseInt(hourStr);

        if (!techId || isNaN(hour)) return;

        // Create a new date object based on the currently selected day
        // We use setHours/setMinutes to set the specific slot time
        const baseDate = new Date(selectedDate);
        const newDate = setMinutes(setHours(baseDate, hour), 0);

        // Optimistic update could go here, but for safety we await
        const { error } = await supabase
            .from('work_orders')
            .update({
                technician_id: techId,
                // Use format to ensure backend receives a clear ISO string, 
                // typically Supabase handles ISO strings well, but we must ensure
                // we aren't accidentally sending a UTC time that shifts the day back.
                scheduled_date: newDate.toISOString()
            })
            .eq('id', active.id);

        if (error) {
            console.error(error);
            toast.error(t('failed_reschedule') || 'Failed to reschedule');
        } else {
            toast.success(t('rescheduled') || 'Job rescheduled');
            onUpdate();
        }
    };

    const activeOrder = useMemo(() => workOrders.find(o => o.id === activeId), [workOrders, activeId]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col h-[calc(100vh-14rem)]">
            {/* Header / Date Nav */}
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                <div className="flex items-center gap-4">
                    <h2 className="font-bold text-lg text-neutral-800 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        {format(selectedDate, 'MMMM d, yyyy')}
                    </h2>
                    <div className="flex items-center bg-white rounded-lg border border-neutral-200 p-0.5">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedDate(d => addDays(d, -1))}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedDate(new Date())}>
                            <span className="text-xs font-medium">Any</span> {/* Simplification for "Today" reset */}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedDate(d => addDays(d, 1))}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex gap-2 text-sm text-neutral-500">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div> {t('scheduled')}</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div> {t('completed')}</div>
                </div>
            </div>

            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex flex-1 overflow-hidden">
                    {/* Unscheduled Sidebar */}
                    <UnscheduledColumn orders={unscheduledOrders} />

                    {/* Main Scheduler Grid */}
                    <div className="flex-1 overflow-auto border-l border-neutral-200">
                        <div className="min-w-[800px]">
                            {/* Time Header */}
                            <div className="flex border-b border-neutral-100 sticky top-0 bg-white z-10">
                                <div className="w-48 flex-shrink-0 p-3 bg-neutral-50 border-r border-neutral-100 font-medium text-sm text-neutral-500">
                                    {t('technician')}
                                </div>
                                {HOURS.map(hour => (
                                    <div key={hour} className="flex-1 min-w-[100px] p-2 text-center text-xs font-medium text-neutral-400 border-r border-neutral-50 last:border-0">
                                        {hour}:00
                                    </div>
                                ))}
                            </div>

                            {/* Grid */}
                            <div className="divide-y divide-neutral-100">
                                {technicians.map(tech => (
                                    <div key={tech.id} className="flex group hover:bg-neutral-50/30 transition-colors">
                                        {/* Tech Info */}
                                        <div className="w-48 flex-shrink-0 p-3 border-r border-neutral-100 flex items-center gap-3 bg-white sticky left-0 z-10">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                {tech.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="font-medium text-sm truncate text-neutral-900">{tech.name}</div>
                                                <div className="text-xs text-neutral-500 truncate">{tech.specialization || 'Mechanic'}</div>
                                            </div>
                                        </div>

                                        {/* Hours Cells */}
                                        {HOURS.map(hour => {
                                            const slotId = `${tech.id}|${hour}`;
                                            // Find order starting in this hour (simple logic, assuming 1hr slots for MVP visualization)
                                            // A real robust one would handle duration overlapping multiple slots
                                            const slotOrder = dailyOrders.find(o =>
                                                o.technician_id === tech.id &&
                                                activeId !== o.id && // Don't show original while dragging
                                                parseISO(o.scheduled_date!).getHours() === hour
                                            );

                                            return (
                                                <TimeSlot
                                                    key={slotId}
                                                    id={slotId}
                                                    order={slotOrder}
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

                <DragOverlay>
                    {activeOrder ? (
                        <div className="w-[100px] h-12 bg-blue-600 text-white rounded-lg shadow-xl p-2 text-xs flex flex-col justify-center opacity-90 rotate-2 cursor-grabbing">
                            <div className="font-bold truncate">REQ-{activeOrder.id.substring(0, 4)}</div>
                            <div className="truncate opacity-80">{activeOrder.description || "Job"}</div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

function UnscheduledColumn({ orders }: { orders: WorkOrder[] }) {
    const { setNodeRef, isOver } = useDroppable({ id: 'unscheduled' });
    const { t } = useTranslation();

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "w-56 bg-neutral-50 flex flex-col h-full border-r border-neutral-200 transition-colors",
                isOver ? "bg-red-50" : ""
            )}
        >
            <div className="p-3 border-b border-neutral-200 font-medium text-sm text-neutral-600 flex justify-between items-center">
                {t('backlog') || 'Backlog'}
                <span className="bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded text-xs">{orders.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {orders.length === 0 ? (
                    <div className="text-center text-xs text-neutral-400 py-4 italic">{t('no_backlog') || 'No unscheduled jobs'}</div>
                ) : (
                    orders.map(order => (
                        <DraggableJob key={order.id} order={order} inSidebar />
                    ))
                )}
            </div>
        </div>
    );
}

function TimeSlot({ id, order }: { id: string, order?: WorkOrder }) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex-1 min-w-[100px] border-r border-neutral-50 last:border-0 min-h-[60px] p-1 relative transition-colors",
                isOver ? "bg-blue-50/50" : ""
            )}
        >
            {order && (
                <DraggableJob order={order} />
            )}
        </div>
    );
}

function DraggableJob({ order, inSidebar }: { order: WorkOrder, inSidebar?: boolean }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: order.id });
    const { t } = useTranslation();

    // Status colors
    const isCompleted = order.status === 'completed';
    const baseColor = isCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-neutral-700 border-neutral-200";

    if (isDragging) {
        return <div ref={setNodeRef} className={cn("rounded-md border-2 border-dashed border-neutral-300 bg-neutral-50/50", inSidebar ? "h-16" : "h-full w-full")} />
    }

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={cn(
                "rounded-md border text-xs p-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-all shadow-sm flex flex-col justify-center",
                baseColor,
                inSidebar ? "mb-2 h-auto" : "h-full w-full"
            )}
        >
            <div className="font-bold flex justify-between items-center">
                <span>REQ-{order.id.substring(0, 4)}</span>
                {order.priority === 'urgent' && <AlertCircle className="w-3 h-3 text-red-500" />}
            </div>
            <div className="truncate text-neutral-500 mt-0.5">{order.description || t('no_description')}</div>
        </div>
    );
}
