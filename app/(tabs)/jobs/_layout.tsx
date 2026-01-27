import { Stack } from 'expo-router';

export default function JobsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: 'Work Orders' }} />
            <Stack.Screen name="[id]" options={{ title: 'Job Details' }} />
        </Stack>
    );
}
