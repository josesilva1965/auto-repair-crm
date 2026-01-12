import { supabase, type Customer, type Estimate } from './supabase';

export interface SendOptions {
    type: 'estimate' | 'invoice';
    documentId: string;
    customerId: string;
    channel: 'email' | 'sms' | 'print';
}

export interface SendResult {
    success: boolean;
    message: string;
}

/**
 * Communication service for sending estimates and invoices to customers.
 * Currently uses placeholder implementations - connect to real services for production.
 */
export class CommunicationService {
    /**
     * Send a document (estimate or invoice) to a customer via the specified channel.
     */
    async sendDocument(options: SendOptions): Promise<SendResult> {
        const { type, documentId, customerId, channel } = options;

        // Get customer details
        const { data: customer } = await supabase
            .from('customers')
            .select('*')
            .eq('id', customerId)
            .single();

        if (!customer) {
            return { success: false, message: 'Customer not found' };
        }

        switch (channel) {
            case 'email':
                return this.sendEmail(customer, type, documentId);
            case 'sms':
                return this.sendSMS(customer, type, documentId);
            case 'print':
                return this.printDocument(type, documentId);
            default:
                return { success: false, message: 'Invalid channel' };
        }
    }

    /**
     * Send document via email.
     * TODO: Replace with real email service (SendGrid, Mailgun, AWS SES)
     */
    private async sendEmail(customer: Customer, type: string, documentId: string): Promise<SendResult> {
        if (!customer.email) {
            return { success: false, message: 'Customer has no email address on file' };
        }

        // Placeholder - in production, integrate with email service
        console.log(`[EMAIL] Sending ${type} ${documentId} to ${customer.email}`);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // For now, just show success - in production this would make an actual API call
        return {
            success: true,
            message: `${type.charAt(0).toUpperCase() + type.slice(1)} sent to ${customer.email}`
        };
    }

    /**
     * Send document via SMS/Text.
     * TODO: Replace with real SMS service (Twilio, Vonage)
     */
    private async sendSMS(customer: Customer, type: string, documentId: string): Promise<SendResult> {
        if (!customer.phone) {
            return { success: false, message: 'Customer has no phone number on file' };
        }

        // Placeholder - in production, integrate with SMS service
        console.log(`[SMS] Sending ${type} ${documentId} to ${customer.phone}`);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            success: true,
            message: `${type.charAt(0).toUpperCase() + type.slice(1)} sent to ${customer.phone}`
        };
    }

    /**
     * Print the document using browser's print functionality.
     */
    private async printDocument(type: string, documentId: string): Promise<SendResult> {
        // Trigger browser print dialog
        window.print();

        return {
            success: true,
            message: `Print dialog opened for ${type}`
        };
    }

    /**
     * Update estimate status after sending.
     */
    async markEstimateSent(estimateId: string, channel: 'email' | 'sms' | 'print'): Promise<void> {
        await supabase
            .from('estimates')
            .update({
                status: 'sent',
                sent_via: channel,
                sent_at: new Date().toISOString()
            })
            .eq('id', estimateId);
    }

    /**
     * Create a notification for estimate approval/rejection.
     */
    async createNotification(
        type: 'estimate_approved' | 'estimate_rejected' | 'invoice_paid' | 'estimate_sent',
        title: string,
        message: string,
        workOrderId?: string,
        customerId?: string
    ): Promise<void> {
        await supabase.from('notifications').insert([{
            type,
            title,
            message,
            work_order_id: workOrderId || null,
            customer_id: customerId || null,
            read: false
        }]);
    }
}

export const communicationService = new CommunicationService();
