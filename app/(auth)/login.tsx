import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            Alert.alert('Error', error.message);
        }
        setLoading(false);
    }

    return (
        <SafeAreaView className="flex-1 bg-white justify-center px-8">
            <View className="items-center mb-10">
                <View className="w-20 h-20 bg-blue-600 rounded-2xl items-center justify-center mb-4">
                    <Text className="text-white text-3xl font-bold">A</Text>
                </View>
                <Text className="text-3xl font-bold text-slate-900">Auto CRM</Text>
                <Text className="text-slate-500 mt-2">Technician & Admin Portal</Text>
            </View>

            <View className="space-y-4">
                <View>
                    <Text className="text-slate-700 font-medium mb-1.5 ml-1">Email</Text>
                    <TextInput
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900"
                        placeholder="technician@example.com"
                        placeholderTextColor="#94a3b8"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                    />
                </View>

                <View>
                    <Text className="text-slate-700 font-medium mb-1.5 ml-1">Password</Text>
                    <TextInput
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900"
                        placeholder="••••••••"
                        placeholderTextColor="#94a3b8"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    onPress={signInWithEmail}
                    disabled={loading}
                    className={`w-full bg-blue-600 rounded-xl py-4 mt-4 items-center ${loading ? 'opacity-70' : ''}`}
                >
                    <Text className="text-white font-bold text-lg">
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View className="mt-8 items-center">
                <Text className="text-slate-400 text-sm">v1.0.0 • Mobile Edition</Text>
            </View>
        </SafeAreaView>
    );
}
