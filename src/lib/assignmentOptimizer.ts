import type { Technician, WorkOrder } from './supabase';

type ScoredTechnician = Technician & {
    score: number;
    matchReason: string;
};

export function maximizeTechAssignment(
    technicians: Technician[],
    currentOrder: Partial<WorkOrder>,
    allOrders: WorkOrder[]
): ScoredTechnician[] {
    // Filter only 'available' or 'busy' technicians (exclude off-duty)
    const availableTechs = technicians.filter(t => t.status !== 'off-duty');

    return availableTechs.map(tech => {
        let score = 0;
        const reasons: string[] = [];

        // 1. Specialization Match (High weight)
        // Simple keyword matching for now
        const orderDescription = (currentOrder.description || '').toLowerCase();
        const techSpecialization = (tech.specialization || '').toLowerCase();

        if (techSpecialization && orderDescription.includes(techSpecialization)) {
            score += 50;
            reasons.push(`Specialization match: ${tech.specialization}`);
        }

        // 2. Workload Balancing (Medium weight)
        const activeJobs = allOrders.filter(o =>
            o.technician_id === tech.id &&
            o.status !== 'completed' &&
            o.status !== 'cancelled'
        ).length;

        if (activeJobs === 0) {
            score += 30;
            reasons.push('Currently free');
        } else if (activeJobs < 3) {
            score += 10;
            reasons.push('Light workload');
        } else {
            score -= 20;
            reasons.push('Heavy workload');
        }

        // 3. Status Status (Medium weight)
        if (tech.status === 'available') {
            score += 20;
        }

        return {
            ...tech,
            score,
            matchReason: reasons.join(', ') || 'General availability'
        };
    }).sort((a, b) => b.score - a.score);
}
