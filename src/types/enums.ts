export enum WorkOrderStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    WAITING_PARTS = 'waiting_parts',
    TESTING = 'testing',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    SCHEDULED = 'scheduled'
}

export enum InspectionStatus {
    GOOD = 'green',
    MONITOR = 'yellow',
    ACTION_REQUIRED = 'red',
}

export enum Priority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}

export enum KPITrendColor {
    GREEN = 'green',
    RED = 'red',
    NEUTRAL = 'gray',
    BLUE = 'blue',
    YELLOW = 'yellow',
}
