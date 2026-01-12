export interface CarMake {
    name: string;
    logo?: string; // Simple Icons slug
    models: string[];
}

// Popular car makes in the UK with their common models
export const carMakes: CarMake[] = [
    {
        name: 'Audi',
        logo: 'audi',
        models: ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'e-tron']
    },
    {
        name: 'BMW',
        logo: 'bmw',
        models: ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'i3', 'i4', 'iX']
    },
    {
        name: 'Ford',
        logo: 'ford',
        models: ['Fiesta', 'Focus', 'Mondeo', 'Kuga', 'Puma', 'EcoSport', 'Edge', 'Mustang', 'Ranger', 'Transit']
    },
    {
        name: 'Mercedes-Benz',
        logo: 'mercedes',
        models: ['A-Class', 'B-Class', 'C-Class', 'E-Class', 'S-Class', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class', 'EQA', 'EQC', 'EQS']
    },
    {
        name: 'Volkswagen',
        logo: 'volkswagen',
        models: ['Polo', 'Golf', 'Passat', 'Tiguan', 'T-Roc', 'Touareg', 'Arteon', 'ID.3', 'ID.4', 'Up!']
    },
    {
        name: 'Vauxhall',
        logo: 'vauxhall',
        models: ['Corsa', 'Astra', 'Insignia', 'Mokka', 'Crossland', 'Grandland', 'Combo', 'Vivaro']
    },
    {
        name: 'Toyota',
        logo: 'toyota',
        models: ['Aygo', 'Yaris', 'Corolla', 'Camry', 'Prius', 'RAV4', 'C-HR', 'Highlander', 'Land Cruiser', 'Hilux']
    },
    {
        name: 'Honda',
        logo: 'honda',
        models: ['Jazz', 'Civic', 'Accord', 'CR-V', 'HR-V', 'e:Ny1']
    },
    {
        name: 'Nissan',
        logo: 'nissan',
        models: ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Leaf', 'Ariya', 'GT-R']
    },
    {
        name: 'Peugeot',
        logo: 'peugeot',
        models: ['108', '208', '308', '508', '2008', '3008', '5008', 'e-208', 'e-2008']
    },
    {
        name: 'Renault',
        logo: 'renault',
        models: ['Clio', 'Captur', 'Megane', 'Kadjar', 'Koleos', 'Zoe', 'Arkana']
    },
    {
        name: 'Citroën',
        logo: 'citroen',
        models: ['C1', 'C3', 'C4', 'C5', 'Berlingo', 'C3 Aircross', 'C5 Aircross', 'ë-C4']
    },
    {
        name: 'Kia',
        logo: 'kia',
        models: ['Picanto', 'Rio', 'Ceed', 'Stonic', 'Niro', 'Sportage', 'Sorento', 'EV6']
    },
    {
        name: 'Hyundai',
        logo: 'hyundai',
        models: ['i10', 'i20', 'i30', 'Kona', 'Tucson', 'Santa Fe', 'Ioniq', 'Ioniq 5']
    },
    {
        name: 'Mazda',
        logo: 'mazda',
        models: ['Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-5', 'CX-30', 'MX-5']
    },
    {
        name: 'Volvo',
        logo: 'volvo',
        models: ['V40', 'V60', 'V90', 'S60', 'S90', 'XC40', 'XC60', 'XC90', 'C40']
    },
    {
        name: 'Land Rover',
        logo: 'landrover',
        models: ['Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Sport', 'Range Rover Evoque', 'Range Rover Velar']
    },
    {
        name: 'Jaguar',
        logo: 'jaguar',
        models: ['XE', 'XF', 'XJ', 'F-Type', 'E-Pace', 'F-Pace', 'I-Pace']
    },
    {
        name: 'MINI',
        logo: 'mini',
        models: ['Cooper', 'Clubman', 'Countryman', 'Electric']
    },
    {
        name: 'Skoda',
        logo: 'skoda',
        models: ['Fabia', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq', 'Enyaq']
    },
    {
        name: 'SEAT',
        logo: 'seat',
        models: ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco']
    },
    {
        name: 'Fiat',
        logo: 'fiat',
        models: ['500', 'Panda', 'Tipo', '500X', '500L', '500e']
    },
    {
        name: 'Alfa Romeo',
        logo: 'alfaromeo',
        models: ['Giulietta', 'Giulia', 'Stelvio', 'Tonale']
    },
    {
        name: 'Tesla',
        logo: 'tesla',
        models: ['Model 3', 'Model S', 'Model X', 'Model Y']
    },
    {
        name: 'Porsche',
        logo: 'porsche',
        models: ['911', 'Taycan', 'Panamera', 'Macan', 'Cayenne']
    }
];

// Helper function to get logo URL from local assets
export function getCarLogoUrl(logoSlug: string | undefined): string | null {
    if (!logoSlug) return null;
    // Check if we have a local logo for this make
    const localLogos = ['audi', 'bmw', 'mercedes', 'ford', 'volkswagen', 'toyota'];
    if (localLogos.includes(logoSlug.toLowerCase())) {
        return `/logos/${logoSlug.toLowerCase()}.png`;
    }
    // Fallback to Simple Icons CDN for other makes
    return `https://cdn.simpleicons.org/${logoSlug}`;
}

// Get models for a specific make
export function getModelsForMake(makeName: string): string[] {
    const make = carMakes.find(m => m.name.toLowerCase() === makeName.toLowerCase());
    return make?.models || [];
}
