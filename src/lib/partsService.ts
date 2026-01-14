// Mock AI Parts Service
// simulating an external API like standard, rockauto, or autozone

export interface PartLookupResult {
    part_number: string;
    name: string;
    estimated_price: number;
    supplier: string;
    in_stock_at_supplier: boolean;
    category: string;
}

const MOCK_PARTS_DB: Record<string, PartLookupResult[]> = {
    // Keyed by loose search terms
    'oil filter': [
        { part_number: 'OF-101', name: 'Premium Oil Filter', category: 'Filters', estimated_price: 12.50, supplier: 'AutoParts Pro', in_stock_at_supplier: true },
        { part_number: 'OF-102', name: 'Standard Oil Filter', category: 'Filters', estimated_price: 8.99, supplier: 'Budget Parts', in_stock_at_supplier: true },
    ],
    'brake pad': [
        { part_number: 'BP-200', name: 'Ceramic Brake Pads (Front)', category: 'Brakes', estimated_price: 45.00, supplier: 'AutoParts Pro', in_stock_at_supplier: true },
        { part_number: 'BP-201', name: 'Semi-Metallic Brake Pads', category: 'Brakes', estimated_price: 32.50, supplier: 'Brakes R Us', in_stock_at_supplier: true },
    ],
    'alternator': [
        { part_number: 'ALT-500', name: 'High Output Alternator', category: 'Electrical', estimated_price: 180.00, supplier: 'Electric World', in_stock_at_supplier: false },
    ],
    'spark plug': [
        { part_number: 'SP-303', name: 'Iridium Spark Plug', category: 'Ignition', estimated_price: 14.99, supplier: 'Sparky Inc', in_stock_at_supplier: true },
    ]
};

export const partsService = {
    /**
     * Simulates an AI lookup for car parts
     */
    async searchParts(query: string, vehicleInfo?: string): Promise<PartLookupResult[]> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const lowerQuery = query.toLowerCase();

        // Check for "magic" keywords in our mock DB
        for (const [key, parts] of Object.entries(MOCK_PARTS_DB)) {
            if (lowerQuery.includes(key)) {
                return parts;
            }
        }

        // Default "Generative" response if no specific match
        return [
            {
                part_number: `GEN-${Math.floor(Math.random() * 1000)}`,
                name: vehicleInfo ? `Generic ${query} (fits ${vehicleInfo})` : `Generic ${query} (AI Match)`,
                category: 'General',
                estimated_price: Math.floor(Math.random() * 50) + 10,
                supplier: 'Global Parts Network',
                in_stock_at_supplier: Math.random() > 0.2 // 80% chance in stock
            }
        ];
    }
};
