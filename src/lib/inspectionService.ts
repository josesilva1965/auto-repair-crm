import { supabase, Inspection, InspectionItem, InspectionTemplate, TemplateItem } from './supabase';
import { InspectionStatus } from '../types/enums';

interface UpdateItemRecommendationData {
    recommendation: string;
    estimated_cost?: number;
}

export const inspectionService = {
    async getTemplates() {
        const { data, error } = await supabase
            .from('inspection_templates')
            .select('*')
            .order('name');
        if (error) throw error;
        return data as InspectionTemplate[];
    },

    async getInspection(workOrderId: string) {
        const { data, error } = await supabase
            .from('inspections')
            .select(`
        *,
        inspection_items (
          *,
          inspection_photos (*)
        )
      `)
            .eq('work_order_id', workOrderId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Ignore not found
        return data;
    },

    async startInspection(workOrderId: string, templateId: string) {
        // 1. Create Inspection
        const { data: inspection, error: inspError } = await supabase
            .from('inspections')
            .insert({ work_order_id: workOrderId, template_id: templateId, status: 'in_progress' })
            .select()
            .single();

        if (inspError) throw inspError;

        // 2. Fetch Template Items
        const { data: items, error: itemsError } = await supabase
            .from('template_items')
            .select('*')
            .eq('template_id', templateId)
            .order('display_order');

        if (itemsError) throw itemsError;

        // 3. Create Inspection Items
        const inspectionItems = items.map(item => ({
            inspection_id: inspection.id,
            template_item_id: item.id,
            label: item.label,
            category: item.category,
            status: null
        }));

        const { error: insertError } = await supabase
            .from('inspection_items')
            .insert(inspectionItems);

        if (insertError) throw insertError;

        return inspection;
    },

    async updateItemStatus(itemId: string, status: InspectionStatus) {
        const { error } = await supabase
            .from('inspection_items')
            .update({ status })
            .eq('id', itemId);
        if (error) throw error;
    },

    async updateItemNotes(itemId: string, notes: string) {
        const { error } = await supabase
            .from('inspection_items')
            .update({ notes })
            .eq('id', itemId);
        if (error) throw error;
    },

    async updateItemRecommendation(itemId: string, recommendation: string, cost?: number) {
        const updateData: UpdateItemRecommendationData = { recommendation };
        if (cost !== undefined) updateData.estimated_cost = cost;

        const { error } = await supabase
            .from('inspection_items')
            .update(updateData)
            .eq('id', itemId);
        if (error) throw error;
    },

    async uploadPhoto(itemId: string, file: File) {
        const fileName = `${itemId}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
            .from('work-order-files') // Reusing existing bucket for simplicity
            .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('work-order-files')
            .getPublicUrl(fileName);

        const { error: dbError } = await supabase
            .from('inspection_photos')
            .insert({
                inspection_item_id: itemId,
                url: publicUrl,
                caption: file.name
            });

        if (dbError) throw dbError;
    },

    async completeInspection(inspectionId: string) {
        const { error } = await supabase
            .from('inspections')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', inspectionId);
        if (error) throw error;
    },

    async ensurePublicToken(inspectionId: string) {
        const { data } = await supabase.from('inspections').select('token').eq('id', inspectionId).single();
        if (data?.token) return data.token;

        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const { error } = await supabase.from('inspections').update({ token }).eq('id', inspectionId);

        if (error) throw error;
        return token;
    },

    async getPublicInspection(token: string) {
        // 1. Get Inspection base
        const { data: inspection, error } = await supabase
            .from('inspections')
            .select(`
            *,
            inspection_items (
                *,
                inspection_photos (*)
            )
        `)
            .eq('token', token)
            .single();

        if (error) throw error;
        if (!inspection) return null;

        // 2. Manual fetch of relations to avoid embedding syntax errors
        const { data: workOrder } = await supabase
            .from('work_orders')
            .select('*')
            .eq('id', inspection.work_order_id)
            .single();

        let enrichedWorkOrder = workOrder;

        if (workOrder) {
            const { data: vehicle } = await supabase.from('vehicles').select('*').eq('id', workOrder.vehicle_id).single();
            const { data: customer } = await supabase.from('customers').select('*').eq('id', workOrder.customer_id).single();

            enrichedWorkOrder = {
                ...workOrder,
                vehicles: vehicle,
                customers: customer
            };
        }

        return {
            ...inspection,
            work_orders: enrichedWorkOrder
        };
    },

    async updateCustomerDecision(itemId: string, decision: 'approved' | 'declined') {
        const { error } = await supabase
            .from('inspection_items')
            .update({ customer_decision: decision })
            .eq('id', itemId);

        if (error) throw error;
    },

    async createEstimateFromInspection(inspectionId: string) {
        // 1. Get Inspection & Approved Items
        const { data: inspection } = await supabase
            .from('inspections')
            .select(`*, inspection_items(*)`)
            .eq('id', inspectionId)
            .single();

        if (!inspection) throw new Error('Inspection not found');

        const approvedItems = inspection.inspection_items.filter((i: InspectionItem) => i.customer_decision === 'approved');

        if (approvedItems.length === 0) throw new Error('No approved items to estimate');

        // 2. Fetch WO to get customer_id
        const { data: wo, error: woError } = await supabase.from('work_orders').select('customer_id').eq('id', inspection.work_order_id).single();
        if (woError) throw woError;

        // 3. Create Estimate Header
        const { data: estimate, error: estError } = await supabase
            .from('estimates')
            .insert({
                work_order_id: inspection.work_order_id,
                customer_id: wo.customer_id,
                status: 'draft',
                estimate_number: `EST-${Date.now()}`
            })
            .select()
            .single();

        if (estError) throw estError;

        // 4. Create Work Order Items (which populate the estimate effectively)
        const workOrderItems = approvedItems.map((item: InspectionItem) => ({
            work_order_id: inspection.work_order_id,
            description: `Repair: ${item.label} ${item.recommendation ? `(${item.recommendation})` : ''}`,
            quantity: 1,
            unit_price: item.estimated_cost || 0,
            total_price: item.estimated_cost || 0,
            item_type: 'labor' // Defaulting to labor or other, tech can change
        }));

        const { error: itemsError } = await supabase
            .from('work_order_items')
            .insert(workOrderItems);

        if (itemsError) throw itemsError;

        return estimate;
    },

    async seedDefaults() {
        // Check if exists
        const { data: existing } = await supabase.from('inspection_templates').select('id').limit(1);
        if (existing && existing.length > 0) return;

        // 1. Create Template
        const { data: tmpl, error } = await supabase
            .from('inspection_templates')
            .insert({
                name: 'Standard Inspection',
                description: 'Comprehensive multi-point inspection'
            })
            .select()
            .single();

        if (error || !tmpl) throw error || new Error('Failed to create template');

        // 2. Create Items
        const items = [
            { template_id: tmpl.id, category: 'Under Hood', label: 'Engine Oil', display_order: 1 },
            { template_id: tmpl.id, category: 'Under Hood', label: 'Coolant / Antifreeze', display_order: 2 },
            { template_id: tmpl.id, category: 'Under Hood', label: 'Transmission Fluid', display_order: 3 },
            { template_id: tmpl.id, category: 'Under Hood', label: 'Brake Fluid', display_order: 4 },
            { template_id: tmpl.id, category: 'Under Hood', label: 'Power Steering Fluid', display_order: 5 },
            { template_id: tmpl.id, category: 'Under Hood', label: 'Battery Health', display_order: 6 },
            { template_id: tmpl.id, category: 'Under Hood', label: 'Belts & Hoses', display_order: 7 },

            { template_id: tmpl.id, category: 'Under Vehicle', label: 'Exhaust System', display_order: 8 },
            { template_id: tmpl.id, category: 'Under Vehicle', label: 'Suspension', display_order: 9 },
            { template_id: tmpl.id, category: 'Under Vehicle', label: 'Fluid Leaks', display_order: 10 },

            { template_id: tmpl.id, category: 'Brakes & Tires', label: 'Brakes (Front)', display_order: 11 },
            { template_id: tmpl.id, category: 'Brakes & Tires', label: 'Brakes (Rear)', display_order: 12 },
            { template_id: tmpl.id, category: 'Brakes & Tires', label: 'Tire Condition', display_order: 13 },
            { template_id: tmpl.id, category: 'Brakes & Tires', label: 'Tire Pressure', display_order: 14 },

            { template_id: tmpl.id, category: 'Exterior/Interior', label: 'Wipers & Washers', display_order: 15 },
            { template_id: tmpl.id, category: 'Exterior/Interior', label: 'Lights (Headlights/Tail/Brake)', display_order: 16 },
            { template_id: tmpl.id, category: 'Exterior/Interior', label: 'Horn', display_order: 17 },
            { template_id: tmpl.id, category: 'Exterior/Interior', label: 'Dashboard Warning Lights', display_order: 18 },
        ];

        const { error: itemsError } = await supabase.from('template_items').insert(items);
        if (itemsError) throw itemsError;

        return tmpl;
    }
};
