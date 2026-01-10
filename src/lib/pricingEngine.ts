export interface PricingConfig {
    defaultTaxRate: number; // e.g., 0.08 for 8%
    laborRate: number; // Standard hourly labor rate
    partsMarkup: number; // e.g., 0.20 for 20% markup
}

export type DiscountType = 'percentage' | 'fixed';

export interface Discount {
    type: DiscountType;
    value: number;
    reason?: string;
}

export class PricingEngine {
    private config: PricingConfig;

    constructor(config?: Partial<PricingConfig>) {
        this.config = {
            defaultTaxRate: 0.08,
            laborRate: 85.00,
            partsMarkup: 0.20,
            ...config
        };
    }

    /**
     * Calculates the final invoice details based on subtotal and optional adjustments
     */
    calculateInvoice(
        subtotal: number,
        discount?: Discount,
        taxRateOverride?: number
    ) {
        let discountAmount = 0;

        if (discount) {
            if (discount.type === 'percentage') {
                discountAmount = subtotal * (discount.value / 100);
            } else {
                discountAmount = discount.value;
            }
        }

        // Ensure discount doesn't exceed subtotal
        discountAmount = Math.min(discountAmount, subtotal);

        const taxableAmount = subtotal - discountAmount;
        const taxRate = taxRateOverride !== undefined ? taxRateOverride : this.config.defaultTaxRate;
        const taxAmount = taxableAmount * taxRate;
        const total = taxableAmount + taxAmount;

        return {
            subtotal,
            discountAmount,
            taxableAmount,
            taxAmount,
            taxRate,
            total
        };
    }

    /**
     * Helper to format currency
     */
    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
}
