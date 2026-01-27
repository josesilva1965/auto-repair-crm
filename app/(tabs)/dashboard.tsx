import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Briefcase, CheckCircle, Clock, Calendar } from 'lucide-react-native';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ assigned: 0, completed: 0 });
    const [nextJob, setNextJob] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = useCallback(async () => {
        if (!user) return;
        try {
            // Assigned Jobs (Active)
            const { count: assignedCount } = await supabase
                .from('work_orders')
                .select('*', { count: 'exact', head: true })
                .eq('technician_id', user.id)
                .neq('status', 'completed')
                .neq('status', 'cancelled');

            // Completed Jobs
            const { count: completedCount } = await supabase
                .from('work_orders')
                .select('*', { count: 'exact', head: true })
                .eq('technician_id', user.id)
                .eq('status', 'completed');

            // Next Job
            const { data: nextJobData } = await supabase
                .from('work_orders')
                .select(`
            *,
            vehicle:vehicles(make, model, license_plate)
        `)
                .eq('technician_id', user.id)
                .neq('status', 'completed')
                .neq('status', 'cancelled')
                .order('scheduled_date', { ascending: true })
                .limit(1)
                .single();

            setStats({
                assigned: assignedCount || 0,
                completed: completedCount || 0
            });
            setNextJob(nextJobData);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, [user]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchStats();
        setRefreshing(false);
    }, [fetchStats]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <ScrollView
                contentContainerStyle={{ padding: 24 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View className="mb-8">
                    <Text className="text-2xl font-bold text-slate-900">Dashboard</Text>
                    <Text className="text-slate-500 mt-1">
                        Welcome back, {user?.email?.split('@')[0]}
                    </Text>
                </View>

                <View className="flex-row gap-4 mb-8">
                    <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <View className="bg-blue-100 w-10 h-10 rounded-full items-center justify-center mb-3">
                            <Briefcase size={20} color="#2563eb" />
                        </View>
                        <Text className="text-2xl font-bold text-slate-900">{stats.assigned}</Text>
                        <Text className="text-slate-500 text-xs font-medium">Active Jobs</Text>
                    </View>

                    <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <View className="bg-emerald-100 w-10 h-10 rounded-full items-center justify-center mb-3">
                            <CheckCircle size={20} color="#10b981" />
                        </View>
                        <Text className="text-2xl font-bold text-slate-900">{stats.completed}</Text>
                        <Text className="text-slate-500 text-xs font-medium">Completed</Text>
                    </View>
                </View>

                <Text className="text-lg font-bold text-slate-900 mb-4">Up Next</Text>

                {nextJob ? (
                    <TouchableOpacity className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <View className="flex-row justify-between items-start mb-3">
                            <Text className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold overflow-hidden">
                                {nextJob.status.toUpperCase()}
                            </Text>
                            <View className="flex-row items-center">
                                <Clock size={14} color="#64748b" />
                                <Text className="text-slate-500 text-xs ml-1">
                                    {new Date(nextJob.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </View>
                        <Text className="text-lg font-bold text-slate-900 mb-1">
                            {nextJob.vehicle?.make} {nextJob.vehicle?.model}
                        </Text>
                        <Text className="text-slate-500 text-sm mb-4">
                            {nextJob.description || 'Service check'}
                        </Text>
                        <View className="flex-row items-center pt-4 border-t border-slate-50">
                            <Calendar size={16} color="#94a3b8" />
                            <Text className="text-slate-400 text-xs ml-2">
                                {new Date(nextJob.scheduled_date).toDateString()}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 items-center">
                        <Text className="text-slate-400">No upcoming jobs scheduled.</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
