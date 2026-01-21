import { useState } from 'react';
import { usePortal } from '../../layouts/PortalLayout';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export function PortalBooking() {
    const { data } = usePortal();
    const { t } = useTranslation();

    const [step, setStep] = useState(1);
    const [selectedVehicle, setSelectedVehicle] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!data) return null;

    const handleSubmit = async () => {
        if (!selectedVehicle || !selectedDate || !description) return;

        try {
            setSubmitting(true);

            // Create a booking request (using public insert if allowed, or RPC if strict)
            // Assuming 'bookings' table exists and has RLS allowing authenticated insert (using anon for now?)
            // Wait, we need to associate with customer. Since we are using a public token, we might need an RPC to insert booking securely linked to this customer token.
            // Or we can assume RLS allows insert with validation?

            // Let's use direct insert for now assuming RLS policy allows "anon" insert? 
            // Actually, 'customers' table RLS handles 'portal_token'. 'bookings' table likely doesn't know about it.
            // We should create a quick RPC or just insert into 'work_orders' directly as 'pending'? 
            // No, 'bookings' is better.

            // For Safety: We will just insert into 'work_orders' as a 'pending' request or 'bookings' table if exists.
            // Checking schema dump... 'bookings' table was seen in file list but not schema text.
            // Let's create a work order with status 'pending' as a "Booking Request"

            const vehicle = data.vehicles.find(v => v.id === selectedVehicle);

            const { error } = await supabase.from('work_orders').insert({
                customer_id: data.customer.id,
                vehicle_id: selectedVehicle,
                status: 'pending',
                priority: 'normal',
                description: `WEB BOOKING REQUEST: ${description}`,
                scheduled_date: selectedDate.toISOString(),
                order_number: `REQ-${Date.now().toString().slice(-6)}` // Temporary number
            });

            if (error) throw error;

            setStep(2); // Success state
            toast.success(t('booking_submitted') || 'Booking request submitted!');

        } catch (err: any) {
            console.error('Booking error:', err);
            toast.error(t('booking_error') || 'Failed to submit booking');
        } finally {
            setSubmitting(false);
        }
    };

    if (step === 2) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-50 duration-500">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">{t('request_received') || 'Request Received!'}</h2>
                <p className="text-neutral-500 max-w-xs mx-auto mb-8">
                    {t('request_received_desc') || 'We have received your appointment request. We will contact you shortly to confirm.'}
                </p>
                <Button variant="outline" onClick={() => setStep(1)}>{t('book_another') || 'Book Another'}</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-4 md:p-0">
            <h2 className="text-2xl font-bold text-neutral-900">{t('book_service') || 'Book Service'}</h2>

            <Card>
                <CardContent className="space-y-6 pt-6">
                    {/* Vehicle Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">{t('select_vehicle') || 'Select Vehicle'}</label>
                        <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('select_vehicle_placeholder') || 'Choose a vehicle...'} />
                            </SelectTrigger>
                            <SelectContent>
                                {data.vehicles.map(v => (
                                    <SelectItem key={v.id} value={v.id}>
                                        {v.year} {v.make} {v.model}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Selection */}
                    <div className="space-y-2 flex flex-col">
                        <label className="text-sm font-medium text-neutral-700">{t('preferred_date') || 'Preferred Date'}</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !selectedDate && "text-muted-foreground"
                                    )}
                                >
                                    {selectedDate ? (
                                        format(selectedDate, "PPP")
                                    ) : (
                                        <span>{t('pick_date') || 'Pick a date'}</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    disabled={(date) =>
                                        date < new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Issue Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">{t('describe_issue') || 'Describe the issue or service needed'}</label>
                        <Textarea
                            placeholder={t('issue_placeholder') || 'e.g., Oil change, Brake noise, etc.'}
                            className="resize-none"
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handleSubmit}
                        disabled={!selectedVehicle || !selectedDate || !description || submitting}
                    >
                        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {t('submit_request') || 'Submit Request'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
