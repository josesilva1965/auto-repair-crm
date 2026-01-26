import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { inspectionService } from '../lib/inspectionService';
import { InspectionItem } from '../lib/supabase';
import {
    CheckCircle,
    AlertTriangle,
    XCircle,
    Check,
    X,
    Phone,
    Share2,
    Loader,
    Printer,
    User,
    Wrench,
    Info,
    Calendar,
    Gauge,
    FileText,
    Car
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { format } from 'date-fns';
import { cn } from '../lib/utils'; // Keep app's tailwind setup

export function PublicInspection() {
    const { token } = useParams<{ token: string }>();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [inspection, setInspection] = useState<any>(null);
    const [decisions, setDecisions] = useState<Record<string, 'approved' | 'declined'>>({});
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (token) loadData();
    }, [token]);

    async function loadData() {
        try {
            const data = await inspectionService.getPublicInspection(token!);
            setInspection(data);
            const initialDecisions: Record<string, any> = {};
            data.inspection_items?.forEach((item: any) => {
                if (item.customer_decision) initialDecisions[item.id] = item.customer_decision;
            });
            setDecisions(initialDecisions);
        } catch (error) {
            console.error('Error loading inspection:', error);
        }
        setLoading(false);
    }

    async function handleSubmit() {
        setLoading(true);
        try {
            const updates = Object.entries(decisions).map(([id, decision]) =>
                inspectionService.updateCustomerDecision(id, decision)
            );
            await Promise.all(updates);
            setSubmitted(true);
            toast.success('Decisions submitted successfully');
        } catch (err) {
            console.error(err);
            toast.error('Error submitting decisions');
        }
        setLoading(false);
    }

    // Helper to bulk approve
    const handleApproveAll = () => {
        const newDecisions = { ...decisions };
        const items: InspectionItem[] = inspection.inspection_items || [];
        items.forEach(item => {
            if (item.status === 'red' || item.status === 'yellow') {
                newDecisions[item.id] = 'approved';
            }
        });
        setDecisions(newDecisions);
        toast.success(t('all_approved_feedback') || 'All recommended repairs approved');
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><Loader className="w-10 h-10 animate-spin text-primary" /></div>;

    if (!inspection) return <div className="p-8 text-center bg-gray-50 h-screen flex flex-col items-center justify-center text-gray-500">
        <AlertTriangle className="w-16 h-16 mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">{t('inspection_link_error') || 'Inspection Link Invalid or Expired'}</h3>
    </div>;

    const items: InspectionItem[] = inspection.inspection_items || [];
    const groupedItems = items.reduce((acc, item) => {
        const cat = item.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, InspectionItem[]>);

    const vehicle = Array.isArray(inspection.work_orders?.vehicles) ? inspection.work_orders?.vehicles[0] : inspection.work_orders?.vehicles;
    const customer = Array.isArray(inspection.work_orders?.customers) ? inspection.work_orders?.customers[0] : inspection.work_orders?.customers;

    const redCount = items.filter(i => i.status === 'red').length;
    const yellowCount = items.filter(i => i.status === 'yellow').length;
    const greenCount = items.filter(i => i.status === 'green').length;

    // Calculate total layout
    const recommendedItems = items.filter(i => (i.status === 'red' || i.status === 'yellow'));
    const subtotal = recommendedItems.reduce((sum, item) => sum + (decisions[item.id] === 'approved' ? (item.estimated_cost || 0) : 0), 0);
    // Simple tax calc
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    return (
        <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 pb-20 md:pb-8">
            {/* Top Navigation Bar */}
            <header className="bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-sm">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Car className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-bold text-lg hidden sm:inline-block tracking-tight text-neutral-900">AutoRepair CRM</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => window.print()}>
                            <Printer className="w-4 h-4 mr-2" />
                            {t('print_pdf') || 'Print PDF'}
                        </Button>
                        <Button size="sm" className="hidden sm:flex">
                            <Share2 className="w-4 h-4 mr-2" />
                            {t('send_to_customer') || 'Send to Customer'}
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {/* Title Section */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">{t('inspection_report_title') || 'Digital Vehicle Inspection Report'}</h1>
                        <div className="flex gap-2 text-sm text-neutral-500">
                            <Button variant="outline" size="sm" onClick={() => window.print()} className="md:hidden">
                                <Printer className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {format(new Date(inspection.created_at), 'MMMM d, yyyy')}</span>
                        <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> Inspection ID: #{inspection.id.substring(0, 6)}</span>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN - Main Report */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Vehicle Card (Hero) */}
                        <Card className="overflow-hidden border-neutral-200">
                            <div className="flex flex-col md:flex-row">
                                <div className="bg-neutral-100 md:w-1/3 min-h-[200px] flex items-center justify-center relative">
                                    {/* Placeholder Car Image */}
                                    <Car className="w-24 h-24 text-neutral-300" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col justify-center">
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                                        {vehicle?.year} {vehicle?.make} {vehicle?.model} {vehicle?.submodel}
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
                                        <div>
                                            <span className="block text-neutral-500 text-xs uppercase font-semibold mb-0.5">{t('customer') || 'Customer'}</span>
                                            <div className="font-medium flex items-center gap-2">
                                                <User className="w-3.5 h-3.5 text-neutral-400" />
                                                {customer?.name}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="block text-neutral-500 text-xs uppercase font-semibold mb-0.5">{t('vin') || 'VIN'}</span>
                                            <div className="font-medium font-mono text-neutral-700">{vehicle?.vin || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <span className="block text-neutral-500 text-xs uppercase font-semibold mb-0.5">{t('odometer') || 'Odometer'}</span>
                                            <div className="font-medium flex items-center gap-2">
                                                <Gauge className="w-3.5 h-3.5 text-neutral-400" />
                                                {vehicle?.mileage ? `${vehicle.mileage.toLocaleString()} mi` : 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Service Advisor (Mocked or from data if available) */}
                                    <div className="mt-6 pt-6 border-t border-neutral-100">
                                        <span className="block text-neutral-500 text-xs uppercase font-semibold mb-1">{t('service_advisor') || 'Service Advisor'}</span>
                                        <div className="flex items-center gap-2 font-medium text-primary">
                                            <User className="w-4 h-4" />
                                            <span>Mike Sullivan</span> {/* Hardcoded for style match as per request/image, usually dynamic */}
                                            <a href="tel:5551234567" className="ml-auto text-xs font-semibold flex items-center gap-1 hover:underline">
                                                <Phone className="w-3 h-3" /> Contact
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Status Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className={cn("border-t-4 shadow-sm", redCount > 0 ? "border-t-red-500" : "border-t-neutral-200")}>
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{t('urgent_issues') || 'Urgent Issues'}</div>
                                        {redCount > 0 && <AlertTriangle className="w-5 h-5 text-red-500" />}
                                    </div>
                                    <div className="text-4xl font-bold text-neutral-900 mb-1">{redCount}</div>
                                    <div className="text-sm text-red-600 font-medium">
                                        {t('immediate_attention') || 'Immediate attention required'}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className={cn("border-t-4 shadow-sm", yellowCount > 0 ? "border-t-amber-500" : "border-t-neutral-200")}>
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{t('caution_items') || 'Caution Items'}</div>
                                        {yellowCount > 0 && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                                    </div>
                                    <div className="text-4xl font-bold text-neutral-900 mb-1">{yellowCount}</div>
                                    <div className="text-sm text-amber-600 font-medium">
                                        {t('future_repair') || 'Future repair recommended'}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className={cn("border-t-4 shadow-sm border-t-emerald-500")}>
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{t('systems_ok') || 'Systems OK'}</div>
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div className="text-4xl font-bold text-neutral-900 mb-1">{greenCount}</div>
                                    <div className="text-sm text-emerald-600 font-medium">
                                        {t('operating_as_intended') || 'Operating as intended'}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Grouped Inspection Items */}
                        <div className="space-y-6">
                            {Object.entries(groupedItems).map(([category, items]) => {
                                const categoryItems = items as InspectionItem[];
                                const catRed = categoryItems.some(i => i.status === 'red');

                                return (
                                    <div key={category} className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
                                        <div className="bg-neutral-50/50 px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                                            <h3 className="font-bold text-lg text-neutral-900 uppercase tracking-wide flex items-center gap-2">
                                                <span className={cn("w-1.5 h-6 rounded-full mr-2", catRed ? "bg-red-500" : "bg-primary")}></span>
                                                {t(category) || category}
                                            </h3>
                                            {catRed && <span className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full uppercase">{t('action_required') || 'Action Required'}</span>}
                                        </div>

                                        <div className="divide-y divide-neutral-100">
                                            {categoryItems.map((item) => (
                                                <div key={item.id} className="p-6 hover:bg-neutral-50/50 transition-colors">
                                                    <div className="flex gap-4">
                                                        {/* Status Icon */}
                                                        <div className="mt-1 flex-shrink-0">
                                                            {item.status === 'green' && <div className="p-1 bg-emerald-100 rounded-full"><Check className="w-5 h-5 text-emerald-600" /></div>}
                                                            {item.status === 'yellow' && <div className="p-1 bg-amber-100 rounded-full"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>}
                                                            {item.status === 'red' && <div className="p-1 bg-red-100 rounded-full"><X className="w-5 h-5 text-red-600" /></div>}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <h4 className="font-bold text-neutral-900 text-base">{t(item.label) || item.label}</h4>

                                                                <span className={cn(
                                                                    "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md",
                                                                    item.status === 'green' ? "bg-emerald-50 text-emerald-700" :
                                                                        item.status === 'yellow' ? "bg-amber-50 text-amber-700" :
                                                                            item.status === 'red' ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-500"
                                                                )}>
                                                                    {item.status === 'green' ? t('passed') : item.status === 'yellow' ? t('monitor') : item.status === 'red' ? t('urgent') : t('not_inspected')}
                                                                </span>
                                                            </div>

                                                            {/* Recommendations / Notes */}
                                                            {(item.notes || item.recommendation) ? (
                                                                <div className="mt-2 text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                                                                    {item.recommendation && (
                                                                        <div className="mb-1">
                                                                            <span className="font-semibold text-neutral-900">{t('recommendation') || 'Recommendation'}: </span>
                                                                            {item.recommendation}
                                                                        </div>
                                                                    )}
                                                                    {item.notes && (
                                                                        <div>
                                                                            <span className="font-semibold text-neutral-900">{t('notes') || 'Notes'}: </span>
                                                                            {item.notes}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="mt-1 text-sm text-neutral-400 font-light italic">
                                                                    {item.status === 'green' ? (t('no_issues_detected') || 'Full, clean, no leaks detected') : ''}
                                                                </div>
                                                            )}

                                                            {/* Photos Gallery Inline */}
                                                            {item.inspection_photos && item.inspection_photos.length > 0 && (
                                                                <div className="mt-4">
                                                                    <div className="text-xs font-semibold text-neutral-500 uppercase mb-2 flex items-center gap-1">
                                                                        <Camera className="w-3 h-3" /> {t('visual_evidence') || 'Visual Evidence'}
                                                                    </div>
                                                                    <div className="flex gap-3 overflow-x-auto pb-2">
                                                                        {item.inspection_photos.map((photo: any) => (
                                                                            <div key={photo.id} className="relative group">
                                                                                <img src={photo.url} className="h-24 w-auto rounded-lg object-cover border border-neutral-200 shadow-sm transition-transform hover:scale-105 cursor-pointer" alt="Evidence" />
                                                                            </div>
                                                                        ))}
                                                                    </div>
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

                    {/* RIGHT COLUMN - Sidebar Actions */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Technician Card */}
                        <Card className="border-neutral-200 shadow-sm">
                            <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-3">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-primary" />
                                    {t('technician_observations') || 'Technician Observations'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-neutral-900 text-sm">Lead Tech: Steve Richards</h4>
                                        <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                                            {t('technician_note_placeholder') || 'Vehicle overall is in good mechanical shape. The serpentine belt is the only immediate safety concern. Noticed minor coolant weeping near the upper hose, should be monitored during next oil change. Tires are at 6/32" tread and look healthy for another 10k miles.'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recommended Actions / Estimate Cart */}
                        <Card className="border-neutral-200 shadow-md sticky top-24 overflow-hidden border-t-4 border-t-primary">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl font-bold">{t('recommended_actions') || 'Recommended Actions'}</CardTitle>
                                <CardDescription>{t('approve_repairs_desc') || 'Select repairs to approve'}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {recommendedItems.length > 0 ? (
                                    <div className="space-y-4">
                                        {recommendedItems.map(item => (
                                            <div key={item.id} className="flex flex-col gap-2 pb-3 border-b border-neutral-100 last:border-0">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded mr-2", item.status === 'red' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>
                                                            {item.status === 'red' ? 'Urgent' : 'Caution'}
                                                        </span>
                                                        <span className="font-medium text-sm text-neutral-900">{item.label}</span>
                                                    </div>
                                                    <span className="font-bold text-neutral-900">${item.estimated_cost?.toFixed(2) || '0.00'}</span>
                                                </div>
                                                {item.recommendation && <p className="text-xs text-neutral-500 pl-2 border-l-2 border-neutral-200">{item.recommendation}</p>}

                                                <div className="flex justify-end pt-1">
                                                    <button
                                                        onClick={() => setDecisions(prev => ({ ...prev, [item.id]: decisions[item.id] === 'approved' ? 'declined' : 'approved' }))}
                                                        className={cn("text-xs font-bold px-3 py-1 rounded-full border transition-colors",
                                                            decisions[item.id] === 'approved'
                                                                ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                                                                : "bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50"
                                                        )}
                                                    >
                                                        {decisions[item.id] === 'approved' ? 'APPROVED' : 'DECLINE / PENDING'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="pt-4 space-y-2 bg-neutral-50 -mx-6 px-6 py-4 mt-2">
                                            <div className="flex justify-between text-sm text-neutral-600">
                                                <span>Subtotal</span>
                                                <span>${subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-neutral-600">
                                                <span>Taxes & Fees (Est.)</span>
                                                <span>${tax.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-xl font-bold text-primary pt-2 border-t border-neutral-200 mt-2">
                                                <span>TOTAL</span>
                                                <span>${total.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        {!submitted ? (
                                            <div className="space-y-3 pt-2">
                                                <Button className="w-full text-base font-bold h-12 shadow-lg shadow-primary/20" size="lg" onClick={handleApproveAll}>
                                                    <CheckCircle className="w-5 h-5 mr-2" />
                                                    {t('approve_all_repairs') || 'APPROVE ALL REPAIRS'}
                                                </Button>
                                                <p className="text-[10px] text-center text-neutral-400 leading-tight">
                                                    Approving online saves 10% on labor for this visit. Work will begin immediately.
                                                </p>

                                                <div className="pt-2">
                                                    <Button variant="outline" className="w-full" onClick={handleSubmit} disabled={loading}>
                                                        {t('submit_my_choices') || 'Submit My Choices'}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100">
                                                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                                <h4 className="font-bold text-green-800">Response Submitted</h4>
                                                <p className="text-sm text-green-600">Thank you for your response.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-neutral-500">
                                        <CheckCircle className="w-12 h-12 text-emerald-100 mx-auto mb-3" />
                                        <p className="font-medium">No actions recommended.</p>
                                        <p className="text-sm">Your vehicle is in good shape!</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Disclaimer Box */}
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                            <p className="text-[10px] text-amber-800 italic leading-relaxed">
                                Disclaimer: This inspection is a visual point-in-time assessment. Some components may require further disassembly for a complete diagnosis. Please consult with your advisor for detailed questions.
                            </p>
                        </div>

                    </div>
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="py-8 text-center text-sm text-neutral-400 border-t border-neutral-100 mt-8">
                <p>&copy; {new Date().getFullYear()} GarageFlow CRM - Helping shops build trust since 2018</p>
                <div className="flex justify-center gap-4 mt-2">
                    <a href="#" className="hover:text-neutral-600">Privacy Policy</a>
                    <a href="#" className="hover:text-neutral-600">Terms of Service</a>
                    <a href="#" className="hover:text-neutral-600">Help Center</a>
                </div>
            </footer>
        </div>
    );
}
