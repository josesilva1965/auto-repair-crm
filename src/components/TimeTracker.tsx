import { useState, useEffect } from 'react';
import { supabase, type TimeLog } from '../lib/supabase';
import { Button, Input } from './Modal';
import { Play, Square, Clock, Plus, Trash2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TimeTrackerProps {
    workOrderId: string;
}

export function TimeTracker({ workOrderId }: TimeTrackerProps) {
    const { t } = useTranslation();
    const [logs, setLogs] = useState<TimeLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeLog, setActiveLog] = useState<TimeLog | null>(null);

    // Manual entry state
    const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
    const [manualDuration, setManualDuration] = useState('');
    const [manualDescription, setManualDescription] = useState('');

    // Live timer for display
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        loadLogs();

        // Subscribe to changes
        const channel = supabase
            .channel(`time_logs:${workOrderId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'time_logs',
                filter: `work_order_id=eq.${workOrderId}`
            }, () => {
                loadLogs();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [workOrderId]);

    // Timer effect
    useEffect(() => {
        let interval: any;
        if (activeLog && !activeLog.end_time) {
            const startTime = new Date(activeLog.start_time).getTime();

            interval = setInterval(() => {
                const now = new Date().getTime();
                setElapsedSeconds(Math.floor((now - startTime) / 1000));
            }, 1000);
        } else {
            setElapsedSeconds(0);
        }
        return () => clearInterval(interval);
    }, [activeLog]);

    async function loadLogs() {
        setLoading(true);
        const { data, error } = await supabase
            .from('time_logs')
            .select('*')
            .eq('work_order_id', workOrderId)
            .order('created_at', { ascending: false });

        if (data) {
            setLogs(data);
            // Check for active log (no end time)
            const running = data.find(l => !l.end_time);
            setActiveLog(running || null);
        }
        setLoading(false);
    }

    async function startTimer() {
        // Check if one is already running locally (though DB check is better)
        if (activeLog) return;

        const { error } = await supabase.from('time_logs').insert({
            work_order_id: workOrderId,
            start_time: new Date().toISOString(),
            description: t('work_in_progress')
        });

        if (error) console.error('Error starting timer:', error);
        // Realtime subscription will update state
    }

    async function stopTimer() {
        if (!activeLog) return;

        const endTime = new Date();
        const startTime = new Date(activeLog.start_time);
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

        const { error } = await supabase.from('time_logs').update({
            end_time: endTime.toISOString(),
            duration_minutes: durationMinutes
        }).eq('id', activeLog.id);

        if (error) console.error('Error stopping timer:', error);
    }

    async function addManualEntry() {
        if (!manualDuration) return;

        // Construct start/end times based on date and duration
        // For manual entry, we just store it as a completed block
        const date = new Date(manualDate);
        const startTime = date.toISOString();
        const endTime = new Date(date.getTime() + (parseInt(manualDuration) * 60000)).toISOString();

        const { error } = await supabase.from('time_logs').insert({
            work_order_id: workOrderId,
            start_time: startTime,
            end_time: endTime,
            duration_minutes: parseInt(manualDuration),
            description: manualDescription || t('manual_entry')
        });

        if (error) {
            console.error('Error adding log:', error);
        } else {
            setManualDuration('');
            setManualDescription('');
        }
    }

    async function deleteLog(id: string) {
        if (!confirm(t('confirm_delete') || 'Are you sure?')) return;
        await supabase.from('time_logs').delete().eq('id', id);
    }

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const totalMinutes = logs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    return (
        <div className="space-y-6">
            {/* Active Timer Section */}
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-xl p-6 flex flex-col items-center justify-center space-y-4">
                <div className="text-4xl font-mono font-bold text-primary-600 dark:text-primary-400">
                    {activeLog ? formatDuration(elapsedSeconds) : '00:00:00'}
                </div>
                <div className="flex gap-4">
                    {!activeLog ? (
                        <Button onClick={startTimer} className="w-40 justify-center">
                            <Play className="w-4 h-4 mr-2 fill-current" />
                            {t('start_timer')}
                        </Button>
                    ) : (
                        <Button onClick={stopTimer} variant="danger" className="w-40 justify-center">
                            <Square className="w-4 h-4 mr-2 fill-current" />
                            {t('stop_timer')}
                        </Button>
                    )}
                </div>
                {activeLog && <p className="text-sm text-primary-600 animate-pulse">{t('tracking_active')}</p>}
            </div>

            {/* Manual Entry Section */}
            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {t('add_manual_time')}
                </h4>
                <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                        <Input
                            label={t('date')}
                            type="date"
                            value={manualDate}
                            onChange={e => setManualDate(e.target.value)}
                        />
                    </div>
                    <div className="col-span-3">
                        <Input
                            label={t('duration_mins')}
                            type="number"
                            min="1"
                            value={manualDuration}
                            onChange={e => setManualDuration(e.target.value)}
                            placeholder="e.g. 30"
                        />
                    </div>
                    <div className="col-span-4">
                        <Input
                            label={t('description')}
                            value={manualDescription}
                            onChange={e => setManualDescription(e.target.value)}
                            placeholder={t('describe_work')}
                        />
                    </div>
                    <div className="col-span-1">
                        <Button onClick={addManualEntry} disabled={!manualDuration} className="w-full justify-center px-0 h-[42px]">
                            <Plus className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Log History */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-lg">{t('time_logs')}</h4>
                    <div className="text-sm font-medium bg-neutral-100 px-3 py-1 rounded-full">
                        {t('total')}: {totalHours} {t('hours')}
                    </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-50 dark:bg-neutral-800 text-neutral-500 font-medium">
                            <tr>
                                <th className="p-3">{t('date')}</th>
                                <th className="p-3">{t('description')}</th>
                                <th className="p-3 text-right">{t('duration')}</th>
                                <th className="p-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-neutral-400 italic">
                                        {t('no_logs')}
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="bg-white dark:bg-neutral-900">
                                        <td className="p-3">
                                            {new Date(log.start_time).toLocaleDateString()}
                                            <div className="text-xs text-neutral-400">
                                                {new Date(log.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            {log.description || <span className="text-neutral-400 italic">No description</span>}
                                            {!log.end_time && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded animate-pulse">Running</span>}
                                        </td>
                                        <td className="p-3 text-right font-mono">
                                            {log.duration_minutes ? `${log.duration_minutes}m` : '-'}
                                        </td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={() => deleteLog(log.id)}
                                                className="text-neutral-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
