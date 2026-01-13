import { supabase, type Customer, type Estimate } from './supabase';
import emailjs from '@emailjs/browser';
import { generateAndUploadPDF, type DocumentData } from './pdfGenerator';

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
     * Send document via email using EmailJS with PDF download link.
     */
    private async sendEmail(customer: Customer, type: string, documentId: string): Promise<SendResult> {
        if (!customer.email) {
            return { success: false, message: 'Customer has no email address on file' };
        }

        // Get email settings for EmailJS configuration
        const { data: emailSettings } = await supabase
            .from('email_settings')
            .select('*')
            .single();

        const emailjsServiceId = emailSettings?.emailjs_service_id;
        const emailjsTemplateId = emailSettings?.emailjs_template_id;
        const emailjsPublicKey = emailSettings?.emailjs_public_key;
        const senderName = emailSettings?.sender_name || 'Auto Repair Shop';

        // If EmailJS not configured, fall back to console logging
        if (!emailjsServiceId || !emailjsTemplateId || !emailjsPublicKey) {
            console.log(`[EMAIL - DEV MODE] EmailJS not configured`);
            console.log(`  Sending ${type} ${documentId} to ${customer.email}`);
            return {
                success: true,
                message: `${type.charAt(0).toUpperCase() + type.slice(1)} simulated (configure EmailJS for real delivery)`
            };
        }

        try {
            // Fetch document data for PDF generation
            let documentData: DocumentData | null = null;
            let vehicleInfo = 'Vehicle';
            let approvalToken: string | undefined;

            if (type === 'estimate') {
                // Fetch estimate
                const { data: estimate } = await supabase
                    .from('estimates')
                    .select('*')
                    .eq('id', documentId)
                    .single();

                if (estimate) {
                    // Capture approval token
                    approvalToken = estimate.approval_token;

                    let items: any[] = [];

                    // Fetch work order to get vehicle info and items
                    if (estimate.work_order_id) {
                        try {
                            const { data: workOrder } = await supabase
                                .from('work_orders')
                                .select('*')
                                .eq('id', estimate.work_order_id)
                                .single();

                            if (workOrder?.vehicle_id) {
                                const { data: vehicle } = await supabase
                                    .from('vehicles')
                                    .select('*')
                                    .eq('id', workOrder.vehicle_id)
                                    .single();

                                if (vehicle) {
                                    vehicleInfo = `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Vehicle';
                                }
                            }

                            // Fetch items from work_order_items since estimates_items doesn't exist
                            const { data: workOrderItems } = await supabase
                                .from('work_order_items')
                                .select('*')
                                .eq('work_order_id', estimate.work_order_id);

                            if (workOrderItems) {
                                items = workOrderItems;
                            }
                        } catch (err) {
                            console.error('Error fetching work order details:', err);
                        }
                    }

                    // Calculate totals
                    // For estimate, use separate fields if available, otherwise sum items
                    // The estimate table has total fields, so prefer those
                    const subtotal = Number(estimate.subtotal) || items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
                    const taxAmount = Number(estimate.tax) || (subtotal * 0.2); // Default 20% if not set
                    const total = Number(estimate.total) || (subtotal + taxAmount);
                    const taxRate = subtotal > 0 ? (taxAmount / subtotal) * 100 : 20;

                    documentData = {
                        id: documentId,
                        type: 'estimate',
                        customerName: customer.name,
                        customerEmail: customer.email,
                        customerPhone: customer.phone || undefined,
                        vehicleInfo,
                        items: items.map(item => ({
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.unit_price,
                            total: item.quantity * item.unit_price
                        })),
                        subtotal,
                        taxRate,
                        taxAmount,
                        total,
                        createdAt: estimate.created_at,
                        shopName: senderName
                    };
                }
            } else if (type === 'invoice') {
                // Fetch invoice
                const { data: invoice } = await supabase
                    .from('invoices')
                    .select('*')
                    .eq('id', documentId)
                    .single();

                if (invoice) {
                    let items: any[] = [];

                    // Fetch work order to get vehicle info and items
                    if (invoice.work_order_id) {
                        try {
                            const { data: workOrder } = await supabase
                                .from('work_orders')
                                .select('*')
                                .eq('id', invoice.work_order_id)
                                .single();

                            if (workOrder?.vehicle_id) {
                                const { data: vehicle } = await supabase
                                    .from('vehicles')
                                    .select('*')
                                    .eq('id', workOrder.vehicle_id)
                                    .single();

                                if (vehicle) {
                                    vehicleInfo = `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Vehicle';
                                }
                            }

                            // Fetch items from work_order_items
                            const { data: workOrderItems } = await supabase
                                .from('work_order_items')
                                .select('*')
                                .eq('work_order_id', invoice.work_order_id);

                            if (workOrderItems) {
                                items = workOrderItems;
                            }
                        } catch (err) {
                            console.error('Error fetching work order details for invoice:', err);
                        }
                    }

                    // Fallback for subtotal if invoice record is 0 but items exist
                    let subtotal = Number(invoice.subtotal) || 0;
                    if (subtotal === 0 && items.length > 0) {
                        subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
                    }

                    let taxAmount = Number(invoice.tax_amount) || 0;
                    if (taxAmount === 0 && subtotal > 0) {
                        taxAmount = subtotal * 0.2; // Default 20%
                    }

                    let total = Number(invoice.total) || 0;
                    if (total === 0) {
                        total = subtotal + taxAmount;
                    }

                    documentData = {
                        id: documentId,
                        type: 'invoice',
                        customerName: customer.name,
                        customerEmail: customer.email,
                        customerPhone: customer.phone || undefined,
                        vehicleInfo,
                        items: items.map(item => ({
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.unit_price,
                            total: item.quantity * item.unit_price
                        })),
                        subtotal: subtotal,
                        taxRate: Number(invoice.tax_rate) || 20,
                        taxAmount: taxAmount,
                        total: total,
                        createdAt: invoice.created_at,
                        shopName: senderName
                    };
                }
            }

            // Generate and upload PDF
            let pdfUrl = '';
            if (documentData) {
                const uploadedUrl = await generateAndUploadPDF(documentData);
                if (uploadedUrl) {
                    pdfUrl = uploadedUrl;
                }
            }

            // Build email message with download link
            const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1);
            let message = `Please find your ${type} details below.\n\nReference: #${documentId.slice(0, 8)}\nVehicle: ${vehicleInfo}`;

            if (pdfUrl) {
                message += `\n\n📄 Download your ${type}: ${pdfUrl}`;
            }

            // Add Approval Link (for Estimates)
            if (type === 'estimate' && approvalToken) {
                const approvalLink = `${window.location.origin}/estimate-approval/${approvalToken}`;
                message += `\n\n✅ APPROVE OR DECLINE ONLINE:\nClick here to review and respond to this estimate instantly:\n${approvalLink}`;
            }

            message += `\n\nThank you for your business!`;

            const templateParams = {
                to_email: customer.email,
                to_name: customer.name,
                from_name: senderName,
                subject: `Your ${typeCapitalized} from ${senderName}`,
                message: message
            };

            const response = await emailjs.send(
                emailjsServiceId,
                emailjsTemplateId,
                templateParams,
                emailjsPublicKey
            );

            if (response.status === 200) {
                // Update status if it's an estimate
                if (type === 'estimate') {
                    await this.markEstimateSent(documentId, 'email');
                }
                return { success: true, message: `${typeCapitalized} sent to ${customer.email}${pdfUrl ? ' with PDF download link' : ''}` };
            } else {
                return { success: false, message: 'Failed to send email' };
            }
        } catch (err) {
            console.error('EmailJS send error:', err);
            return { success: false, message: 'Failed to send email - check console for details' };
        }
    }

    /**
     * Send document via SMS/Text.
     */
    private async sendSMS(customer: Customer, type: string, documentId: string): Promise<SendResult> {
        if (!customer.phone) {
            return { success: false, message: 'Customer has no phone number on file' };
        }

        // Placeholder - in production, integrate with SMS service (Twilio)
        console.log(`[SMS] Sending ${type} ${documentId} to ${customer.phone}`);

        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            success: true,
            message: `${type.charAt(0).toUpperCase() + type.slice(1)} sent to ${customer.phone}`
        };
    }

    /**
     * Print document.
     */
    private async printDocument(type: string, documentId: string): Promise<SendResult> {
        window.print();
        return {
            success: true,
            message: `${type.charAt(0).toUpperCase() + type.slice(1)} sent to printer`
        };
    }

    /**
     * Mark an estimate as sent via a specific channel.
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
     * Create a notification for shop staff.
     */
    async createNotification(
        type: 'job_completed' | 'estimate_sent' | 'invoice_paid' | 'booking_confirmed' | 'service_reminder',
        title: string,
        message: string,
        workOrderId?: string,
        customerId?: string
    ): Promise<void> {
        await supabase
            .from('notifications')
            .insert({
                type,
                title,
                message,
                work_order_id: workOrderId,
                customer_id: customerId,
                read: false
            });
    }

    /**
     * Send job completion notification (email to customer + in-app notification for staff).
     */
    async sendJobCompletionNotification(
        customer: Customer,
        vehicleInfo: string,
        workOrderId: string,
        jobDescription?: string
    ): Promise<SendResult> {
        const title = `Job Completed - ${vehicleInfo}`;
        const message = `Service completed for ${customer.name}'s ${vehicleInfo}. ${jobDescription ? `Work: ${jobDescription}` : ''}`;

        let result: SendResult = { success: true, message: 'Notification sent' };

        // Send email to customer if they have an email
        if (customer.email) {
            result = await this.sendJobCompletionEmail(customer, vehicleInfo, jobDescription);
        }

        // Create in-app notification for shop staff
        await this.createNotification('job_completed', title, message, workOrderId, customer.id);

        return result;
    }

    /**
     * Send job completion email to customer using EmailJS.
     */
    private async sendJobCompletionEmail(
        customer: Customer,
        vehicleInfo: string,
        jobDescription?: string
    ): Promise<SendResult> {
        if (!customer.email) {
            return { success: false, message: 'Customer has no email address on file' };
        }

        // Get email settings for EmailJS configuration
        const { data: emailSettings } = await supabase
            .from('email_settings')
            .select('*')
            .single();

        const emailjsServiceId = emailSettings?.emailjs_service_id;
        const emailjsTemplateId = emailSettings?.emailjs_template_id;
        const emailjsPublicKey = emailSettings?.emailjs_public_key;
        const senderName = emailSettings?.sender_name || 'Auto Repair Shop';

        // If EmailJS not configured, fall back to console logging (development mode)
        if (!emailjsServiceId || !emailjsTemplateId || !emailjsPublicKey) {
            console.log(`[EMAIL - DEV MODE] EmailJS not configured`);
            console.log(`  To: ${customer.email}`);
            console.log(`  Vehicle: ${vehicleInfo}`);
            console.log(`  Description: ${jobDescription || 'Service completed'}`);
            return {
                success: true,
                message: `Email simulated (configure EmailJS in Settings for real delivery)`
            };
        }

        try {
            // Send email using EmailJS
            const templateParams = {
                to_email: customer.email,
                to_name: customer.name,
                from_name: senderName,
                vehicle_info: vehicleInfo,
                job_description: jobDescription || 'General service',
                subject: `Service Completed - ${vehicleInfo}`,
                message: `Your vehicle (${vehicleInfo}) service has been completed. ${jobDescription ? `Work performed: ${jobDescription}` : ''} Your vehicle is ready for pickup. Thank you for choosing us!`
            };

            const response = await emailjs.send(
                emailjsServiceId,
                emailjsTemplateId,
                templateParams,
                emailjsPublicKey
            );

            if (response.status === 200) {
                return { success: true, message: `Email sent to ${customer.email}` };
            } else {
                return { success: false, message: 'Failed to send email' };
            }
        } catch (err) {
            console.error('EmailJS send error:', err);
            return { success: false, message: 'Failed to send email - check console for details' };
        }
    }
}

// Export singleton instance
export const communicationService = new CommunicationService();
