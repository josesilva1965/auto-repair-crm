import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DayPicker } from 'react-day-picker';
import { format, isToday } from 'date-fns';
import { Plus, Calendar as CalendarIcon, Clock, User, Car, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Modal, Button, Input, Select, Textarea } from '../components/Modal';
import { DataTable, StatusBadge } from '../components/DataTable';
import { useSettings } from '../contexts/SettingsContext';
import 'react-day-picker/dist/style.css';
import { toast } from 'sonner';

interface Booking {
    id: string;
    customer_id: string;
    vehicle_id: string;
    service_type: string;
    scheduled_time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    notes: string;
    customers: { name: string };
    vehicles: { make: string; model: string; license_plate: string };
}

interface Customer {
    id: string;
    name: string;
}

interface Vehicle {
    id: string;
    make: string;
    model: string;
    license_plate: string;
    customer_id: string;
}

export function Bookings() {
    const { t } = useTranslation();
    const { businessHours } = useSettings();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [technicianCount, setTechnicianCount] = useState(0);

    // Form State
    const [form, setForm] = useState({
        customer_id: '',
        vehicle_id: '',
        service_type: '',
        time: '09:00',
        notes: ''
    });

    useEffect(() => {
        loadBookings();
    }, [selectedDate]);

    useEffect(() => {
        loadTechnicianCount();
    }, []);

    useEffect(() => {
        if (isModalOpen) {
            loadCustomersAndVehicles();
        }
    }, [isModalOpen]);

    async function loadTechnicianCount() {
        const { count, error } = await supabase
            .from('technicians')
            .select('*', { count: 'exact', head: true })
            .neq('status', 'off-duty'); // Assuming 'off-duty' means not available for bookings

        if (error) {
            console.error('Error loading technician count:', error);
        } else {
            setTechnicianCount(count || 0);
        }
    }

    async function loadBookings() {
        if (!selectedDate) return;
        setLoading(true);

        // Get start and end of selected day in UTC
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('bookings')
            .select(`
        *,
        customers (name),
        vehicles (make, model, license_plate)
      `)
            .gte('scheduled_time', startOfDay.toISOString())
            .lte('scheduled_time', endOfDay.toISOString())
            .order('scheduled_time', { ascending: true });

        if (error) {
            console.error('Error loading bookings:', error);
        } else {
            setBookings(data || []);
        }
        setLoading(false);
    }

    async function loadCustomersAndVehicles() {
        const [custRes, vehRes] = await Promise.all([
            supabase.from('customers').select('id, name').order('name'),
            supabase.from('vehicles').select('id, make, model, license_plate, customer_id')
        ]);

        if (custRes.data) setCustomers(custRes.data);
        if (vehRes.data) setVehicles(vehRes.data);
    }

    async function handleSave() {
        if (!selectedDate || !form.customer_id || !form.vehicle_id || !form.service_type) return;

        // Combine date and time
        const [hours, minutes] = form.time.split(':');
        const scheduledTime = new Date(selectedDate);
        scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0);

        const { error } = await supabase.from('bookings').insert([{
            customer_id: form.customer_id,
            vehicle_id: form.vehicle_id,
            service_type: form.service_type,
            scheduled_time: scheduledTime.toISOString(),
            status: 'pending',
            notes: form.notes
        }]);

        if (error) {
            console.error('Error saving booking:', error);
            toast.error('Error saving booking');
        } else {
            setIsModalOpen(false);
            loadBookings();
            resetForm();
            toast.success('Booking saved successfully');
        }
    }

    function resetForm() {
        setForm({
            customer_id: '',
            vehicle_id: '',
            service_type: '',
            time: '09:00',
            notes: ''
        });
    }

    async function handleDeleteBooking(bookingId: string) {
        if (!confirm(t('confirm_delete') || 'Are you sure you want to delete this booking?')) return;

        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', bookingId);

        if (error) {
            console.error('Error deleting booking:', error);
            toast.error('Error deleting booking');
        } else {
            loadBookings();
            toast.success('Booking deleted');
        }
    }

    const availableVehicles = form.customer_id
        ? vehicles.filter(v => v.customer_id === form.customer_id)
        : [];

    // Generate time slots based on business hours
    const generateTimeSlots = () => {
        if (!selectedDate) return [];

        const dayOfWeek = selectedDate.getDay();

        // If business hours are configured, use them
        if (businessHours.length > 0) {
            const dayConfig = businessHours.find(h => h.day_of_week === dayOfWeek);

            // If day is disabled, return empty array
            if (!dayConfig || !dayConfig.enabled) return [];

            // Parse start and end times
            const [startHour, startMin] = dayConfig.start_time.split(':').map(Number);
            const [endHour, endMin] = dayConfig.end_time.split(':').map(Number);

            const slots: number[] = [];
            let currentHour = startHour;

            // Generate hourly slots from start to end
            while (currentHour < endHour) {
                slots.push(currentHour);
                currentHour++;
            }

            return slots;
        }

        // Fallback: Use default business hours (9 AM - 6 PM, Monday-Friday)
        // Sunday = 0, Saturday = 6
        if (dayOfWeek === 0 || dayOfWeek === 6) return [];

        // Default slots from 9 AM to 6 PM
        const slots: number[] = [];
        for (let hour = 9; hour < 18; hour++) {
            slots.push(hour);
        }

        return slots;
    };

    const timeSlots = generateTimeSlots();

    return (
        <div className="flex gap-6 h-[calc(100vh-8rem)]">
            {/* Calendar Sidebar */}
            <div className="w-80 flex-shrink-0">
                <div className="bg-card rounded-xl border border-border shadow-card p-4">
                    <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => setSelectedDate(date || new Date())}
                        className="margin-0"
                        required
                        fromDate={new Date()}
                    />
                </div>

                <div className="mt-4 bg-card rounded-xl border border-border shadow-card p-4">
                    <h3 className="font-semibold text-card-foreground mb-3">{t('stats')}</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t('total_bookings')}</span>
                            <span className="font-medium">{bookings.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t('pending')}</span>
                            <span className="font-medium text-amber-600">{bookings.filter(b => b.status === 'pending').length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t('confirmed')}</span>
                            <span className="font-medium text-emerald-600">{bookings.filter(b => b.status === 'confirmed').length}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-border mt-2">
                            <span className="text-muted-foreground">{t('available_technicians')}</span>
                            <span className="font-medium">{technicianCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-[32px] font-bold text-foreground">{t('bookings')}</h1>
                        <p className="text-muted-foreground">
                            {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : t('select_date')}
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {timeSlots.length === 0 ? (
                        <div className="flex items-center justify-center h-64 text-muted-foreground">
                            <p>{t('no_available_slots')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                            {timeSlots.map((hour) => {
                                const timeString = `${hour.toString().padStart(2, '0')}:00`;

                                // Filter past times if it's today
                                const isPast = selectedDate && isToday(selectedDate) && hour <= new Date().getHours();
                                if (isPast) return null;

                                const slotBookings = bookings.filter(b => {
                                    const bookingDate = new Date(b.scheduled_time);
                                    return bookingDate.getHours() === hour;
                                });

                                const slotsTaken = slotBookings.length;
                                const slotsRemaining = Math.max(0, technicianCount - slotsTaken);
                                const isFull = slotsRemaining === 0;

                                return (
                                    <div key={hour} className={`p-4 rounded-xl border ${isFull
                                        ? 'bg-card border-border shadow-sm'
                                        : 'bg-muted/30 border-dashed border-border'
                                        }`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Clock className="w-4 h-4" />
                                                <span className="font-medium">{timeString}</span>
                                            </div>
                                            {!isFull ? (
                                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                                    {slotsRemaining} {t('slots_available') || 'slots available'}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                                    {t('full') || 'Full'}
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            {/* List existing bookings */}
                                            {slotBookings.map(booking => (
                                                <div key={booking.id} className="bg-background rounded-lg p-3 border border-border shadow-sm">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <StatusBadge status={booking.status} />
                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            className="h-6 px-2 text-[10px]"
                                                            onClick={() => handleDeleteBooking(booking.id)}
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm text-foreground">
                                                            <User className="w-3 h-3 text-muted-foreground" />
                                                            <span className="font-medium truncate">{booking.customers?.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Car className="w-3 h-3 text-muted-foreground" />
                                                            <span className="truncate">{booking.vehicles?.make} {booking.vehicles?.model}</span>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground pl-5 truncate">
                                                            {booking.service_type}
                                                        </div>
                                                    </div>

                                                    {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            className="w-full text-xs mt-2 h-7"
                                                            onClick={async () => {
                                                                const { error: woError } = await supabase.from('work_orders').insert([{
                                                                    customer_id: booking.customer_id,
                                                                    vehicle_id: booking.vehicle_id,
                                                                    status: 'pending',
                                                                    priority: 'normal',
                                                                    description: booking.service_type + (booking.notes ? `\nNotes: ${booking.notes}` : ''),
                                                                    scheduled_date: booking.scheduled_time,
                                                                    estimated_cost: 0,
                                                                    actual_cost: 0
                                                                }]);

                                                                if (woError) {
                                                                    console.error('Error creating work order:', woError);
                                                                    toast.error('Error creating work order');
                                                                } else {
                                                                    await supabase.from('bookings')
                                                                        .update({ status: 'completed' })
                                                                        .eq('id', booking.id);
                                                                    loadBookings();
                                                                    toast.success('Work Order Created');
                                                                }
                                                            }}
                                                        >
                                                            {t('create_work_order')}
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Add Booking Button only if slots remaining */}
                                            {!isFull && (
                                                <Button
                                                    variant="secondary"
                                                    className="w-full text-xs h-8"
                                                    onClick={() => {
                                                        setForm(prev => ({ ...prev, time: timeString }));
                                                        setIsModalOpen(true);
                                                    }}
                                                    disabled={!selectedDate}
                                                >
                                                    <Plus className="w-3 h-3 mr-1 inline" />
                                                    {t('book_slot')}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={t('new_booking')}
            >
                <div className="space-y-4">
                    <Select
                        label={t('customer')}
                        value={form.customer_id}
                        onChange={(e) => setForm({ ...form, customer_id: e.target.value, vehicle_id: '' })}
                        options={[{ value: '', label: t('select_customer') }, ...customers.map(c => ({ value: c.id, label: c.name }))]}
                    />

                    <Select
                        label={t('vehicle')}
                        value={form.vehicle_id}
                        onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                        options={[{ value: '', label: t('select_vehicle') }, ...availableVehicles.map(v => ({ value: v.id, label: `${v.make} ${v.model} (${v.license_plate})` }))]}
                        disabled={!form.customer_id}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label={t('service_type')}
                            value={form.service_type}
                            onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                            placeholder="e.g. Oil Change"
                        />
                        <Input
                            type="time"
                            label={t('time')}
                            value={form.time}
                            onChange={(e) => setForm({ ...form, time: e.target.value })}
                        />
                    </div>

                    <Textarea
                        label={t('notes')}
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        rows={3}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                            {t('cancel')}
                        </Button>
                        <Button onClick={handleSave} disabled={!selectedDate || !form.customer_id || !form.vehicle_id || !form.service_type}>
                            {t('save_booking')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
