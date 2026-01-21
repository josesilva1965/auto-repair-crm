import { supabase } from './supabase';

/**
 * Exports all critical database tables to a JSON object
 */
export async function exportDatabase() {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `crm_backup_${timestamp}.json`;

        // fetch all data in parallel
        const [
            { data: customers },
            { data: vehicles },
            { data: technicians },
            { data: inventory },
            { data: workOrders },
            { data: invoices },
            { data: estimates },
            { data: serviceHistory },
            { data: purchaseOrders },
            { data: settings }
        ] = await Promise.all([
            supabase.from('customers').select('*'),
            supabase.from('vehicles').select('*'),
            supabase.from('technicians').select('*'),
            supabase.from('inventory_parts').select('*'),
            supabase.from('work_orders').select('*'),
            supabase.from('invoices').select('*'),
            supabase.from('estimates').select('*'),
            supabase.from('service_history').select('*'),
            supabase.from('purchase_orders').select('*'),
            supabase.from('settings').select('*').limit(1).single() // assuming single settings row might exist or need query
        ]);

        // Also fetch related items that might be too large for a single select if joined, 
        // but for simple backup we can just dump the tables.
        const { data: workOrderItems } = await supabase.from('work_order_items').select('*');
        const { data: inspectionItems } = await supabase.from('inspection_items').select('*');
        const { data: inspectionPhotos } = await supabase.from('inspection_photos').select('*');
        const { data: inspections } = await supabase.from('inspections').select('*');
        const { data: timeLogs } = await supabase.from('time_logs').select('*');

        const backupData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: {
                customers: customers || [],
                vehicles: vehicles || [],
                technicians: technicians || [],
                inventory_parts: inventory || [],
                work_orders: workOrders || [],
                work_order_items: workOrderItems || [],
                invoices: invoices || [],
                estimates: estimates || [],
                service_history: serviceHistory || [],
                purchase_orders: purchaseOrders || [],
                inspections: inspections || [],
                inspection_items: inspectionItems || [],
                inspection_photos: inspectionPhotos || [],
                time_logs: timeLogs || [],
                settings: settings || {}
            }
        };

        // Create download link
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return { success: true, count: Object.keys(backupData.data).length };
    } catch (error) {
        console.error('Export failed:', error);
        return { success: false, error };
    }
}

/**
 * Deletes all transaction data (Invoices, Work Orders, Estimates, etc)
 * Preserves Customers, Vehicles, Technicians, Inventory, and Settings.
 */
export async function resetTransactions() {
    try {
        // Delete in order to respect potential foreign key constraints (if not using cascade)
        // Deleting children first is safer.

        // 1. Notifications & Messages 
        // (Assuming these are transient)
        await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 2. Billing & Finance
        await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('estimates').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('purchase_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 3. Service History
        await supabase.from('service_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 4. Work Order Details
        await supabase.from('work_order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('time_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 5. Inspections
        // Photos first usually
        await supabase.from('inspection_photos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('inspection_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('inspections').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 6. Service Reminders (Often linked to work history)
        // Decide if we want to keep them? Probably not if they are generated from service history.
        await supabase.from('service_reminders').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 7. Work Orders (The parent)
        const { error } = await supabase.from('work_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Reset failed:', error);
        return { success: false, error };
    }
}
