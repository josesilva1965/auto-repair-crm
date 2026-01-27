import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { Search, Filter, Car, Calendar, ChevronRight } from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';

const STATUS_FILTERS = ['All', 'pending', 'in_progress', 'completed'];

export default function WorkOrdersList() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const fetchOrders = async () => {
        if (!user) return;
        setLoading(true);
        let query = supabase
            .from('work_orders')
            .select(`
        *,
        vehicle:vehicles(make, model, license_plate),
        customer:customers(name, phone)
      `)
            .eq('technician_id', user.id)
            .order('scheduled_date', { ascending: true });

        if (activeFilter !== 'All') {
            query = query.eq('status', activeFilter);
        }

        const { data, error } = await query;
        if (error) console.error(error);
        else setOrders(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
    }, [activeFilter]);

    const filteredOrders = orders.filter(order =>
        order.vehicle?.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.vehicle?.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            className="bg-white rounded-xl p-4 mb-3 border border-slate-100 shadow-sm"
            onPress={() => router.push(`/(tabs)/jobs/${item.id}`)}
        >
            <View className="flex-row justify-between mb-2">
                <Text className="font-bold text-slate-900 text-lg">
                    {item.vehicle?.make} {item.vehicle?.model}
                </Text>
                <Text className={`text-xs font-bold px-2 py-1 rounded-full overflow-hidden ${item.status === 'completed' ? 'bg-green-100 text-green-700' :
                        item.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                    }`}>
                    {item.status.replace('_', ' ').toUpperCase()}
                </Text>
            </View>

            <View className="flex-row items-center mb-1">
                <Car size={14} color="#64748b" />
                <Text className="text-slate-500 text-sm ml-2">{item.vehicle?.license_plate}</Text>
            </View>

            <View className="flex-row items-center mb-3">
                <Calendar size={14} color="#64748b" />
                <Text className="text-slate-500 text-sm ml-2">
                    {item.scheduled_date ? new Date(item.scheduled_date).toDateString() : 'Unscheduled'}
                </Text>
            </View>

            <Text className="text-slate-400 text-xs line-clamp-1">
                {item.description || "No description provided"}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
            <View className="px-5 pt-4 pb-2">
                <Text className="text-2xl font-bold text-slate-900 mb-4">Work Orders</Text>

                {/* Search Bar */}
                <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3 py-3 mb-4">
                    <Search size={20} color="#94a3b8" />
                    <TextInput
                        className="flex-1 ml-2 text-slate-900"
                        placeholder="Search vehicle or customer..."
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Filters */}
                <View className="flex-row mb-4">
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={STATUS_FILTERS}
                        keyExtractor={item => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => setActiveFilter(item)}
                                className={`px-4 py-2 rounded-full mr-2 ${activeFilter === item ? 'bg-slate-900' : 'bg-white border border-slate-200'
                                    }`}
                            >
                                <Text className={`font-medium ${activeFilter === item ? 'text-white' : 'text-slate-600'
                                    }`}>
                                    {item.replace('_', ' ')}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#2563eb" className="mt-10" />
            ) : (
                <FlatList
                    data={filteredOrders}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View className="items-center mt-10">
                            <Text className="text-slate-400">No work orders found.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
