import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import { User } from 'lucide-react-native';

export default function MessagesList() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        fetchConversations();
    }, [user]);

    const fetchConversations = async () => {
        if (!user) return;
        // Get unique customers who have messaged or been messaged
        // For MVP, simplistic query: get all messages, group by customer
        // Ideal: 'conversations' table or distinct query

        const { data } = await supabase
            .from('messages')
            .select('*, customer:customers(name, id)')
            .order('created_at', { ascending: false });

        if (data) {
            // Group by customer
            const uniqueCustomers = new Map();
            data.forEach((msg: any) => {
                if (!uniqueCustomers.has(msg.customer_id)) {
                    uniqueCustomers.set(msg.customer_id, msg);
                }
            });
            setConversations(Array.from(uniqueCustomers.values()));
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            className="flex-row items-center p-4 bg-white border-b border-slate-100"
            onPress={() => router.push(`/(tabs)/messages/${item.customer_id}`)}
        >
            <View className="w-12 h-12 bg-slate-200 rounded-full items-center justify-center">
                <User size={24} color="#64748b" />
            </View>
            <View className="flex-1 ml-4">
                <View className="flex-row justify-between">
                    <Text className="font-bold text-slate-900 text-lg">{item.customer?.name || 'Unknown'}</Text>
                    <Text className="text-slate-400 text-xs">
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
                <Text className="text-slate-500 text-sm numberOfLines={1} mt-1">
                    {item.direction === 'outbound' ? 'You: ' : ''}{item.content}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-5 py-4 border-b border-slate-100">
                <Text className="text-2xl font-bold text-slate-900">Messages</Text>
            </View>
            <FlatList
                data={conversations}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                ListEmptyComponent={
                    <View className="items-center mt-10 p-5">
                        <Text className="text-slate-400 text-center">No messages yet. Start a conversation from a Job.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
