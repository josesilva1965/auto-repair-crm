import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM

export default function Scheduler() {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [jobs, setJobs] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        fetchJobs();
    }, [selectedDate, user]);

    const fetchJobs = async () => {
        if (!user) return;
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const { data } = await supabase
            .from('work_orders')
            .select('*, vehicle:vehicles(make, model)')
            .eq('technician_id', user.id)
            .gte('scheduled_date', startOfDay.toISOString())
            .lte('scheduled_date', endOfDay.toISOString())
            .order('scheduled_date', { ascending: true });

        setJobs(data || []);
    };

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const getJobForHour = (hour: number) => {
        return jobs.find(job => {
            const jobDate = new Date(job.scheduled_date);
            return jobDate.getHours() === hour;
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Date Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-100">
                <TouchableOpacity onPress={() => changeDate(-1)} className="p-2">
                    <ChevronLeft size={24} color="#64748b" />
                </TouchableOpacity>
                <View className="items-center">
                    <Text className="text-lg font-bold text-slate-900">
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                    </Text>
                    <Text className="text-slate-500 text-sm">
                        {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => changeDate(1)} className="p-2">
                    <ChevronRight size={24} color="#64748b" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1">
                {HOURS.map(hour => {
                    const job = getJobForHour(hour);
                    return (
                        <View key={hour} className="flex-row border-b border-slate-50 h-24">
                            {/* Time Column */}
                            <View className="w-16 items-center pt-3 border-r border-slate-50">
                                <Text className="text-slate-400 font-medium text-xs">
                                    {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
                                </Text>
                            </View>

                            {/* Content Column */}
                            <View className="flex-1 p-2">
                                {job ? (
                                    <TouchableOpacity
                                        className={`flex-1 rounded-lg p-3 justify-center ${job.status === 'completed' ? 'bg-green-50 border-green-100' :
                                                job.status === 'in_progress' ? 'bg-blue-50 border-blue-100' :
                                                    'bg-amber-50 border-amber-100'
                                            } border`}
                                        onPress={() => router.push(`/(tabs)/jobs/${job.id}`)}
                                    >
                                        <Text className="font-bold text-slate-800 numberOfLines={1}">
                                            {job.vehicle.make} {job.vehicle.model}
                                        </Text>
                                        <Text className="text-slate-500 text-xs mt-1 numberOfLines={1}">
                                            {job.description || 'Service check'}
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    // Empty Slot
                                    <View className="flex-1 justify-center pl-2">
                                        <Text className="text-slate-200 text-xs italic">Available</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}
