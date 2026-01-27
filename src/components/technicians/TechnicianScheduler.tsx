// @ts-nocheck
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable, useSensor, useSensors, MouseSensor, TouchSensor, DragStartEvent } from '@dnd-kit/core';
import { Technician, WorkOrder } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Search, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface TechnicianSchedulerProps {
    technicians: Technician[];
    workOrders: WorkOrder[];
    onUpdate: () => void;
}

const DAYS = [0, 1, 2, 3, 4]; // Monday (0 offset from startOfWeek) to Friday (4)

export function TechnicianScheduler({ technicians, workOrders, onUpdate }: TechnicianSchedulerProps) {
    const { t } = useTranslation();
    const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })); // Starts on Monday
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 10 } })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        setSelectedJobId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        // Dropped on "Backlog" / Unscheduled
        if (over.id === 'unscheduled') {
            const { error } = await supabase
                .from('work_orders')
                .update({ technician_id: null, scheduled_date: null })
                .eq('id', active.id);
            if (!error) {
                toast.success('Job moved to backlog');
                onUpdate();
            }
            return;
        }

        // Dropped on Grid: format "techId|dayIndex"
        const [techId, dayIndexStr] = (over.id as string).split('|');
        const dayIndex = parseInt(dayIndexStr);

        if (!techId || isNaN(dayIndex)) return;

        // Calculate new date
        // weekStart is Monday 00:00. Add dayIndex days.
        const targetDate = addDays(weekStart, dayIndex);
        // Default to 9 AM for the drop
        targetDate.setHours(9, 0, 0, 0);

        const { error } = await supabase
            .from('work_orders')
            .update({
                technician_id: techId,
                scheduled_date: targetDate.toISOString()
            })
            .eq('id', active.id);

        if (error) {
            console.error(error);
            toast.error('Failed to reschedule');
        } else {
            toast.success('Job scheduled');
            onUpdate();
        }
    };

    const activeOrder = useMemo(() => workOrders.find(o => o.id === activeId), [workOrders, activeId]);
    const selectedJob = useMemo(() => workOrders.find(o => o.id === selectedJobId), [workOrders, selectedJobId]);

    // Format header dates
    const weekDates = useMemo(() => DAYS.map(d => addDays(weekStart, d)), [weekStart]);

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-slate-50">
            {/* Top Bar for Scheduler Context */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-200">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-slate-800">{t('calendar_scheduler')}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Search" className="pl-9 w-64 bg-slate-50 border-slate-200" />
                    </div>
                    <Button variant="outline" className="gap-2">
                        <CalendarIcon className="w-4 h-4" /> {t('drag_drop')}
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                        + Calendar
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden p-6 gap-6">

                {/* Main Scheduler Card */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-neutral-200 flex flex-col overflow-hidden">

                    {/* Calendar Header Controls */}
                    <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setWeekStart(d => addDays(d, -7))}>
                                <ChevronLeft className="w-5 h-5 text-slate-500" />
                            </Button>
                            <span className="font-semibold text-slate-700 w-48 text-center">{format(weekStart, 'MMM d')} - {format(addDays(weekStart, 4), 'MMM d, yyyy')}</span>
                            <Button variant="ghost" size="icon" onClick={() => setWeekStart(d => addDays(d, 7))}>
                                <ChevronRight className="w-5 h-5 text-slate-500" />
                            </Button>
                        </div>
                    </div>

                    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div className="flex-1 overflow-auto">
                            <div className="min-w-[800px] h-full flex flex-col">
                                {/* Values Header */}
                                <div className="flex border-b border-neutral-100">
                                    <div className="w-48 p-4 font-semibold text-slate-700 border-r border-neutral-100">{t('technician')}</div>
                                    {weekDates.map(date => (
                                        <div key={date.toString()} className="flex-1 p-4 font-semibold text-slate-700 border-r border-neutral-100 last:border-0">
                                            {format(date, 'EEE')} <span className="text-slate-400 font-normal ml-1">{format(date, 'd')}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Rows */}
                                <div className="flex-1">
                                    {technicians.map(tech => (
                                        <div key={tech.id} className="flex border-b border-neutral-50 h-32">
                                            {/* Tech Info */}
                                            <div className="w-48 p-4 border-r border-neutral-100 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                                    <span className="font-bold text-slate-600">{tech.name.substring(0, 2).toUpperCase()}</span>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-sm">{tech.name}</div>
                                                    <div className="text-xs text-slate-500">{t('technician')}</div>
                                                </div>
                                            </div>

                                            {/* Days */}
                                            {DAYS.map((dayIndex, i) => {
                                                const currentDate = weekDates[i];
                                                // Find jobs for this tech on this day
                                                const dayJobs = workOrders.filter(o =>
                                                    o.technician_id === tech.id &&
                                                    o.scheduled_date &&
                                                    isSameDay(parseISO(o.scheduled_date), currentDate) &&
                                                    activeId !== o.id
                                                );

                                                const slotId = `${tech.id}|${dayIndex}`;

                                                return (
                                                    <DaySlot
                                                        key={slotId}
                                                        id={slotId}
                                                        jobs={dayJobs}
                                                        onJobClick={setSelectedJobId}
                                                        selectedJobId={selectedJobId}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DragOverlay>
                            {activeOrder && (
                                <JobCard order={activeOrder} isDragging />
                            )}
                        </DragOverlay>
                    </DndContext>
                </div>

                {/* Right Sidebar - Job Details */}
                <div className="w-80 bg-white rounded-2xl shadow-sm border border-neutral-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-neutral-100 font-bold text-slate-800">
                        {t('active_job_details')}
                    </div>
                    {selectedJob ? (
                        <div className="p-6 flex-1 overflow-y-auto">
                            <div className="mb-6">
                                <div className="text-sm text-slate-400 font-medium mb-1">{t('repair')}</div>
                                {/* Fallback to Description or generic title since 'title' doesn't exist */}
                                <div className="text-xl font-bold text-slate-900 mb-1">{selectedJob.description ? selectedJob.description.substring(0, 20) : t('service_job')}</div>
                                <div className="text-sm text-slate-600 mb-4">REQ-{selectedJob.id.substring(0, 4)} - {format(new Date(selectedJob.scheduled_date || new Date()), 'h:mm a')}</div>

                                <div className="text-sm text-slate-400 font-medium mb-1">{t('content')}</div>
                                <div className="text-sm text-slate-600">{selectedJob.description || t('no_description_provided')}</div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-neutral-100">
                                <div className="text-sm text-slate-400 font-medium mb-2">{t('job_details')}</div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">{t('status')}</span>
                                    <span className="font-semibold text-slate-900 capitalize">{selectedJob.status}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">{t('priority')}</span>
                                    <span className="font-semibold text-slate-900 capitalize">{selectedJob.priority}</span>
                                </div>
                                <div className="flex justify-between text-sm pt-2">
                                    <span className="text-slate-600">{t('estimated_cost')}</span>
                                    <span className="font-bold text-slate-900">${selectedJob.estimated_cost?.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>

                            <div className="flex justify-between text-sm pt-4 mt-4 border-t border-neutral-100 font-bold">
                                <span className="text-slate-800">{t('total')}</span>
                                <span className="text-slate-900">${selectedJob.actual_cost?.toFixed(2) || selectedJob.estimated_cost?.toFixed(2) || '0.00'}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-sm flex-1 flex items-center justify-center">
                            {t('select_job_details')}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

function DaySlot({ id, jobs, onJobClick, selectedJobId }: { id: string, jobs: WorkOrder[], onJobClick: (id: string) => void, selectedJobId: string | null }) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div ref={setNodeRef} className={cn(
            "flex-1 border-r border-neutral-100 last:border-0 p-2 space-y-2 transition-colors overflow-y-auto",
            isOver ? "bg-blue-50/60 ring-inset ring-2 ring-blue-200" : ""
        )}>
            {jobs.map(job => (
                <JobCard
                    key={job.id}
                    order={job}
                    onClick={() => onJobClick(job.id)}
                    isSelected={selectedJobId === job.id}
                />
            ))}
        </div>
    );
}

function JobCard({ order, isDragging, onClick, isSelected }: { order: WorkOrder, isDragging?: boolean, onClick?: () => void, isSelected?: boolean }) {
    const { t } = useTranslation();
    const { attributes, listeners, setNodeRef } = useDraggable({ id: order.id });

    // Determine color based on status or random for demo visual variety matching the screenshot
    // Maps: 'scheduled' -> Blue, 'in-progress' -> Orange, 'completed' -> Green
    let colorClass = "bg-blue-500 text-white border-blue-600"; // Default to Blue (Scheduled)

    if (['pending', 'scheduled', 'confirmed'].includes(order.status)) {
        colorClass = "bg-blue-500 text-white border-blue-600";
    }
    if (['in-progress', 'diagnosing', 'testing', 'repairing', 'waiting_parts'].includes(order.status)) {
        colorClass = "bg-orange-400 text-white border-orange-500";
    }
    if (['completed', 'billed', 'closed', 'archived'].includes(order.status)) {
        colorClass = "bg-emerald-500 text-white border-emerald-600";
    }

    if (order.priority === 'urgent') colorClass = "bg-red-500 text-white border-red-600";

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            className={cn(
                "rounded-lg p-3 text-sm cursor-pointer shadow-sm border transition-all hover:shadow-md relative group pl-6",
                colorClass,
                isDragging ? "rotate-2 scale-105 opacity-90 shadow-xl z-50 cursor-grabbing" : "",
                isSelected ? "ring-2 ring-offset-2 ring-neutral-900" : ""
            )}
            style={{ minHeight: '80px' }}
        >
            {/* Drag Handle */}
            <div
                {...listeners}
                {...attributes}
                className="absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none bg-white/20 rounded-l-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical className="w-3 h-3 opacity-60" />
            </div>
            <div className="font-medium text-xs opacity-90 mb-0.5">
                {order.status === 'pending' ? t('scheduled') :
                    order.status === 'in-progress' ? t('in_progress') :
                        order.status === 'completed' ? t('completed') : t('scheduled')}
            </div>
            <div className="font-bold text-sm leading-tight mb-1">
                {order.description ? order.description.substring(0, 30) : `Job #${order.id.substring(0, 4)}`}
            </div>
            <div className="text-xs opacity-80 font-medium">
                {order.scheduled_date ? format(parseISO(order.scheduled_date), 'h:mm a') : '9:00 AM'}
            </div>
        </div>
    );
}
