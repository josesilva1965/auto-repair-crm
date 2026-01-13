import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './supabase';

export interface DocumentData {
    id: string;
    type: 'estimate' | 'invoice';
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    vehicleInfo: string;
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    createdAt: string;
    notes?: string;
    shopName?: string;
}

/**
 * Generate a PDF for an estimate or invoice
 */
export function generateDocumentPDF(data: DocumentData): jsPDF {
    const doc = new jsPDF();
    const shopName = data.shopName || 'Auto Repair Shop';

    // Header
    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235); // Blue
    doc.text(shopName, 20, 25);

    // Document Type
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(data.type.toUpperCase(), 150, 25);

    // Document ID
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`#${data.id.slice(0, 8)}`, 150, 32);
    doc.text(`Date: ${new Date(data.createdAt).toLocaleDateString()}`, 150, 38);

    // Customer Info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Bill To:', 20, 50);
    doc.setFontSize(11);
    doc.text(data.customerName, 20, 58);
    if (data.customerEmail) {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(data.customerEmail, 20, 64);
    }
    if (data.customerPhone) {
        doc.text(data.customerPhone, 20, 70);
    }

    // Vehicle Info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Vehicle:', 100, 50);
    doc.setFontSize(11);
    doc.text(data.vehicleInfo, 100, 58);

    // Items Table
    const tableData = data.items.map(item => [
        item.description,
        item.quantity.toString(),
        `£${item.unitPrice.toFixed(2)}`,
        `£${item.total.toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: 85,
        head: [['Description', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
        columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 25, halign: 'right' },
            3: { cellWidth: 25, halign: 'right' }
        }
    });

    // Totals
    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    const totalsY = finalY + 15;

    doc.setFontSize(11);
    doc.text('Subtotal:', 130, totalsY);
    doc.text(`£${data.subtotal.toFixed(2)}`, 175, totalsY, { align: 'right' });

    doc.text(`Tax (${data.taxRate}%):`, 130, totalsY + 8);
    doc.text(`£${data.taxAmount.toFixed(2)}`, 175, totalsY + 8, { align: 'right' });

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Total:', 130, totalsY + 20);
    doc.text(`£${data.total.toFixed(2)}`, 175, totalsY + 20, { align: 'right' });

    // Notes
    if (data.notes) {
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Notes:', 20, totalsY + 35);
        doc.text(data.notes, 20, totalsY + 42, { maxWidth: 170 });
    }

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });

    return doc;
}

/**
 * Generate PDF and upload to Supabase Storage
 * Returns the public URL for the PDF
 */
export async function generateAndUploadPDF(data: DocumentData): Promise<string | null> {
    try {
        const doc = generateDocumentPDF(data);
        const pdfBlob = doc.output('blob');

        // Create filename
        const filename = `${data.type}_${data.id.slice(0, 8)}_${Date.now()}.pdf`;
        const filepath = `documents/${filename}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filepath, pdfBlob, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (uploadError) {
            console.error('Error uploading PDF:', uploadError);
            return null;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from('documents')
            .getPublicUrl(filepath);

        return publicUrlData.publicUrl;
    } catch (error) {
        console.error('Error generating PDF:', error);
        return null;
    }
}
