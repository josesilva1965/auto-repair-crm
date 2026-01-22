// Mock AI Parts Service
// simulating an external API like standard, rockauto, or autozone

export interface PartLookupResult {
    part_number: string;
    name: string;
    estimated_price: number;
    supplier: string;
    in_stock_at_supplier: boolean;
    category: string;
    compatible_models?: string[]; // New: list of compatible models (e.g. "Toyota Camry", "Honda Civic")
}

const MOCK_PARTS_DB: Record<string, PartLookupResult[]> = {
    // Keyed by loose search terms
    'oil filter': [
        { part_number: 'OF-101', name: 'Premium Oil Filter', category: 'Filters', estimated_price: 12.50, supplier: 'AutoParts Pro', in_stock_at_supplier: true, compatible_models: ['Toyota Camry', 'Toyota Corolla', 'Lexus ES'] },
        { part_number: 'OF-102', name: 'Standard Oil Filter', category: 'Filters', estimated_price: 8.99, supplier: 'Budget Parts', in_stock_at_supplier: true }, // Universal-ish
        { part_number: 'OF-BMW', name: 'Euro-Spec Oil Filter', category: 'Filters', estimated_price: 18.00, supplier: 'EuroParts', in_stock_at_supplier: true, compatible_models: ['BMW 3 Series', 'BMW X5'] },
    ],
    'brake pad': [
        { part_number: 'BP-200', name: 'Ceramic Brake Pads (Front)', category: 'Brakes', estimated_price: 45.00, supplier: 'AutoParts Pro', in_stock_at_supplier: true, compatible_models: ['Toyota Camry', 'Honda Accord'] },
        { part_number: 'BP-201', name: 'Semi-Metallic Brake Pads', category: 'Brakes', estimated_price: 32.50, supplier: 'Brakes R Us', in_stock_at_supplier: true },
        { part_number: 'BP-TRUCK', name: 'Heavy Duty Brake Pads', category: 'Brakes', estimated_price: 65.00, supplier: 'TruckStuff', in_stock_at_supplier: true, compatible_models: ['Ford F-150', 'Chevrolet Silverado'] },
    ],
    'alternator': [
        { part_number: 'ALT-500', name: 'High Output Alternator', category: 'Electrical', estimated_price: 180.00, supplier: 'Electric World', in_stock_at_supplier: false },
        { part_number: 'ALT-CIVIC', name: 'OEM Replacement Alternator', category: 'Electrical', estimated_price: 140.00, supplier: 'Electric World', in_stock_at_supplier: true, compatible_models: ['Honda Civic'] },
    ],
    'spark plug': [
        { part_number: 'SP-303', name: 'Iridium Spark Plug', category: 'Ignition', estimated_price: 14.99, supplier: 'Sparky Inc', in_stock_at_supplier: true },
    ]
};

export const partsService = {
    /**
     * Simulates an AI lookup for car parts with vehicle compatibility filtering
     */
    async searchParts(query: string, vehicleInfo?: string): Promise<PartLookupResult[]> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const lowerQuery = query.toLowerCase();
        let results: PartLookupResult[] = [];

        // 1. Search in Mock DB
        for (const [key, parts] of Object.entries(MOCK_PARTS_DB)) {
            if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
                results = [...results, ...parts];
            }
        }

        // 2. Filter by vehicle info if provided
        if (vehicleInfo) {
            const lowerVehicle = vehicleInfo.toLowerCase();
            results = results.filter(part => {
                // If it has specifc models, check compatibility
                if (part.compatible_models) {
                    return part.compatible_models.some(model => lowerVehicle.includes(model.toLowerCase()));
                }
                // If no specific models listed, assume universal/fit-all for this mock
                return true;
            });
        }

        // 3. Fallback / Augment with "Generative" result if list is short
        if (results.length < 2) {
            results.push({
                part_number: `GEN-${Math.floor(Math.random() * 1000)}`,
                name: vehicleInfo ? `Generic ${query} (fits ${vehicleInfo})` : `Generic ${query} (AI Match)`,
                category: 'General',
                estimated_price: Math.floor(Math.random() * 50) + 10,
                supplier: 'Global Parts Network',
                in_stock_at_supplier: Math.random() > 0.2
            });
        }

        return results;
    }
};
