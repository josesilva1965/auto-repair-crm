import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ChatScreen() {
    const { id: customerId } = useLocalSearchParams();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [customerName, setCustomerName] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const router = useRouter();

    useEffect(() => {
        fetchMessages();
        fetchCustomer();

        // Real-time subscription
        const channel = supabase
            .channel('public:messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `customer_id=eq.${customerId}` }, (payload) => {
                setMessages(prev => [...prev, payload.new]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [customerId]);

    const fetchCustomer = async () => {
        const { data } = await supabase.from('customers').select('name').eq('id', customerId).single();
        if (data) setCustomerName(data.name);
    }

    const fetchMessages = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: true }); // Oldest first for chat

        if (data) setMessages(data);
    };

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const { error } = await supabase.from('messages').insert({
            customer_id: customerId,
            content: inputText,
            direction: 'outbound',
            read: false
        });

        if (!error) {
            setInputText('');
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const isOutbound = item.direction === 'outbound';
        return (
            <View className={`mb-3 flex-row ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                <View className={`max-w-[80%] p-3 rounded-2xl ${isOutbound ? 'bg-blue-600 rounded-tr-none' : 'bg-slate-200 rounded-tl-none'
                    }`}>
                    <Text className={isOutbound ? 'text-white' : 'text-slate-900'}>
                        {item.content}
                    </Text>
                    <Text className={`text-[10px] mt-1 ${isOutbound ? 'text-blue-200' : 'text-slate-500'}`}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="flex-row items-center p-4 border-b border-slate-100 bg-white">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <View>
                    <Text className="font-bold text-lg text-slate-900">{customerName || 'Chat'}</Text>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                <View className="flex-row items-center p-3 border-t border-slate-100 bg-white">
                    <TextInput
                        className="flex-1 bg-slate-100 rounded-full px-4 py-2 mr-2 text-slate-900 min-h-[40px]"
                        placeholder="Type a message..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        onPress={sendMessage}
                        className="bg-blue-600 w-10 h-10 rounded-full items-center justify-center"
                    >
                        <Send size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
