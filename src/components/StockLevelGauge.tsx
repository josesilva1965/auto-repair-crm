export function StockLevelGauge({ current, min, max = 100 }: { current: number; min: number; max?: number }) {
    // Determine color based on stock level relative to min threshold
    let color = 'bg-emerald-500';
    let width = '100%';

    if (current === 0) {
        color = 'bg-red-500';
        width = '0%';
    } else if (current <= min) {
        color = 'bg-red-500';
        // Scale slightly for visibility even if low
        width = `${Math.max(5, (current / max) * 100)}%`;
    } else if (current <= min * 1.5) {
        color = 'bg-amber-500';
        width = `${Math.min(100, (current / max) * 100)}%`;
    } else {
        width = `${Math.min(100, (current / max) * 100)}%`;
    }

    // Cap max at a reasonable visual limit if stock is huge
    const visualMax = Math.max(current, max, min * 3);
    const percent = Math.min(100, (current / visualMax) * 100);

    return (
        <div className="w-full">
            <div className="flex justify-between text-xs mb-1">
                <span className={`${current <= min ? 'text-red-600 font-bold' : 'text-neutral-500'}`}>
                    {current} instock
                </span>
                <span className="text-neutral-400">Min: {min}</span>
            </div>
            <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}
