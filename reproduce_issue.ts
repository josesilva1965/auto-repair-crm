
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://iygufdkbticpalescryr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5Z3VmZGtidGljcGFsZXNjcnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzEyNjAsImV4cCI6MjA4MDM0NzI2MH0.J45-nDuu6YUE-XsK6pz1t1wtgqPWAgkUg22GReNi3rw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function reproduce() {
    console.log('Fetching data...');

    // Fetch technicians
    const { data: technicians, error: techError } = await supabase.from('technicians').select('*');
    if (techError) {
        console.error('Error fetching technicians:', techError);
        return;
    }
    console.log(`Fetched ${technicians.length} technicians.`);

    // Fetch work orders
    const { data: workOrders, error: orderError } = await supabase.from('work_orders').select('*');
    if (orderError) {
        console.error('Error fetching work orders:', orderError);
        return;
    }
    console.log(`Fetched ${workOrders.length} work orders.`);

    // Fetch work order items
    const { data: workOrderItems, error: itemsError } = await supabase.from('work_order_items').select('*');
    if (itemsError) {
        console.error('Error fetching work order items:', itemsError);
        return;
    }
    console.log(`Fetched ${workOrderItems.length} work order items.`);

    if (workOrders.length > 0) {
        console.log('Sample Work Orders:', JSON.stringify(workOrders.slice(0, 3), null, 2));
    } else {
        console.log('No work orders found.');
    }

    // Calculate metrics for each technician
    technicians.forEach((tech: any) => {
        console.log(`\nTechnician: ${tech.name} (${tech.id})`);

        const techOrders = workOrders.filter((o: any) => o.technician_id === tech.id && o.status === 'completed');
        console.log(`  Completed Orders: ${techOrders.length}`);

        const techOrderIds = techOrders.map((o: any) => o.id);

        const revenue = techOrders.reduce((sum: number, o: any) => {
            const cost = o.actual_cost || o.estimated_cost || 0;
            // console.log(`    Order ${o.id}: Cost = ${cost} (Actual: ${o.actual_cost}, Estimated: ${o.estimated_cost})`);
            return sum + cost;
        }, 0);

        const hours = workOrderItems
            .filter((i: any) => techOrderIds.includes(i.work_order_id) && i.item_type === 'labor')
            .reduce((sum: number, i: any) => {
                // console.log(`    Item ${i.id} (Order ${i.work_order_id}): Quantity = ${i.quantity}`);
                return sum + (i.quantity || 0);
            }, 0);

        console.log(`  Calculated Revenue: ${revenue}`);
        console.log(`  Calculated Hours: ${hours}`);
    });
}

reproduce().catch(console.error);
