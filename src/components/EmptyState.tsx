import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
    iconClassName?: string;
}

export function EmptyState({
    title,
    description,
    icon: Icon,
    action,
    className,
    iconClassName
}: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center p-8 text-center h-full min-h-[300px]", className)}>
            {Icon && (
                <div className={cn("bg-muted/30 p-4 rounded-full mb-4", iconClassName)}>
                    <Icon className="w-8 h-8 text-muted-foreground/50" />
                </div>
            )}
            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
            {action && (
                <Button onClick={action.onClick} variant="default">
                    {action.label}
                </Button>
            )}
        </div>
    );
}
