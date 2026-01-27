import "../global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../lib/auth";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const InitialLayout = () => {
    const { session, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === "(auth)";

        if (!session && !inAuthGroup) {
            router.replace("/(auth)/login");
        } else if (session && inAuthGroup) {
            router.replace("/(tabs)/dashboard");
        }
    }, [session, isLoading, segments]);

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return <Slot />;
};

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <InitialLayout />
            </AuthProvider>
        </SafeAreaProvider>
    );
}
