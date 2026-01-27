import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Car, User, Phone, MapPin, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react-native';

export default function JobDetails() {
    const { id } = useLocalSearchParams();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchJobDetails();
    }, [id]);

    const fetchJobDetails = async () => {
        const { data, error } = await supabase
            .from('work_orders')
            .select(`
        *,
        vehicle:vehicles(*),
        customer:customers(*)
      `)
            .eq('id', id)
            .single();

        if (error) Alert.alert('Error', 'Could not load job details');
        else setJob(data);
        setLoading(false);
    };

    const updateStatus = async (newStatus: string) => {
        setUpdating(true);
        const { error } = await supabase
            .from('work_orders')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            Alert.alert('Error', 'Failed to update status');
        } else {
            setJob({ ...job, status: newStatus });
            Alert.alert('Success', `Job marked as ${newStatus.replace('_', ' ')}`);
        }
        setUpdating(false);
    };

    if (loading) return <ActivityIndicator size="large" className="mt-10" color="#2563eb" />;
    if (!job) return <View className="flex-1 items-center justify-center"><Text>Job not found</Text></View>;

    return (
        <ScrollView className="flex-1 bg-slate-50">
            {/* Status Header */}
            <View className="bg-white p-5 border-b border-slate-200">
                <Text className="text-2xl font-bold text-slate-900 mb-2">
                    {job.vehicle.make} {job.vehicle.model}
                </Text>
                <View className="flex-row items-center justify-between">
                    <View className={`px-3 py-1 rounded-full ${job.status === 'completed' ? 'bg-green-100' :
                            job.status === 'in_progress' ? 'bg-blue-100' : 'bg-amber-100'
                        }`}>
                        <Text className={`font-bold text-xs ${job.status === 'completed' ? 'text-green-700' :
                                job.status === 'in_progress' ? 'text-blue-700' : 'text-amber-700'
                            }`}>
                            {job.status.toUpperCase().replace('_', ' ')}
                        </Text>
                    </View>
                    <Text className="text-slate-500 font-medium">#{job.id.slice(0, 8)}</Text>
                </View>
            </View>

            <View className="p-5 space-y-5">

                {/* Actions */}
                <View className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <Text className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Actions</Text>
                    <View className="flex-row gap-3">
                        {job.status === 'pending' && (
                            <TouchableOpacity
                                onPress={() => updateStatus('in_progress')}
                                disabled={updating}
                                className="flex-1 bg-blue-600 py-3 rounded-lg items-center"
                            >
                                <Text className="text-white font-bold">Start Job</Text>
                            </TouchableOpacity>
                        )}
                        {job.status === 'in_progress' && (
                            <TouchableOpacity
                                onPress={() => updateStatus('completed')}
                                disabled={updating}
                                className="flex-1 bg-green-600 py-3 rounded-lg items-center"
                            >
                                <Text className="text-white font-bold">Complete Job</Text>
                            </TouchableOpacity>
                        )}
                        {job.status === 'completed' && (
                            <View className="flex-1 bg-slate-100 py-3 rounded-lg items-center">
                                <Text className="text-slate-500 font-bold">Job Completed</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Vehicle Info */}
                <View className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <View className="flex-row items-center mb-3">
                        <Car size={20} color="#2563eb" />
                        <Text className="font-bold text-lg text-slate-900 ml-2">Vehicle Details</Text>
                    </View>
                    <View className="space-y-2">
                        <Text className="text-slate-600"><Text className="font-medium text-slate-900">VIN:</Text> {job.vehicle.vin || 'N/A'}</Text>
                        <Text className="text-slate-600"><Text className="font-medium text-slate-900">Plate:</Text> {job.vehicle.license_plate}</Text>
                        <Text className="text-slate-600"><Text className="font-medium text-slate-900">Mileage:</Text> {job.vehicle.mileage} mi</Text>
                        <Text className="text-slate-600"><Text className="font-medium text-slate-900">Color:</Text> {job.vehicle.color || 'N/A'}</Text>
                    </View>
                </View>

                {/* Customer Info */}
                <View className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <View className="flex-row items-center mb-3">
                        <User size={20} color="#2563eb" />
                        <Text className="font-bold text-lg text-slate-900 ml-2">Customer</Text>
                    </View>
                    <Text className="text-lg font-medium text-slate-900 mb-1">{job.customer.name}</Text>

                    <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${job.customer.phone}`)}
                        className="flex-row items-center mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100"
                    >
                        <Phone size={16} color="#0f172a" />
                        <Text className="ml-2 font-medium text-slate-900">{job.customer.phone || 'No phone'}</Text>
                    </TouchableOpacity>

                    <View className="flex-row items-center mt-3">
                        <MapPin size={16} color="#64748b" />
                        <Text className="ml-2 text-slate-500 flex-1">{job.customer.address || 'No address'}</Text>
                    </View>
                </View>

                {/* Service Description */}
                <View className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-10">
                    <Text className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Service Request</Text>
                    <Text className="text-slate-700 leading-6">
                        {job.description || 'No description provided.'}
                    </Text>
                </View>

            </View>
        </ScrollView>
    );
}
