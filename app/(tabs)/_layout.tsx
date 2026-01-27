import { Tabs } from 'expo-router';
import { Home, Calendar, ClipboardList, MessageSquare } from 'lucide-react-native';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#2563eb',
            tabBarInactiveTintColor: '#94a3b8',
            tabBarStyle: {
                borderTopColor: '#e2e8f0',
                backgroundColor: '#ffffff',
                height: 60,
                paddingBottom: 8,
                paddingTop: 8,
            },
            headerShown: false
        }}>
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
