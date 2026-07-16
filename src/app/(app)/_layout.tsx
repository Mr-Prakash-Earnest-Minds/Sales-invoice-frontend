import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ 
      headerShown: true,
      tabBarActiveTintColor: '#0a4be5',
      headerStyle: { backgroundColor: '#0a4be5' },
      headerTintColor: '#fff',
    }}>
      <Tabs.Screen 
        name="dashboard" 
        options={{ 
          title: 'Dashboard',
          tabBarIcon: ({ color }: { color: string }) => <Ionicons name="stats-chart" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="invoices" 
        options={{ 
          title: 'Invoices',
          tabBarIcon: ({ color }: { color: string }) => <Ionicons name="document-text" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="customers" 
        options={{ 
          title: 'Customers',
          tabBarIcon: ({ color }: { color: string }) => <Ionicons name="people" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="products" 
        options={{ 
          title: 'Products',
          tabBarIcon: ({ color }) => <Ionicons name="cube" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="reports" 
        options={{ 
          title: 'Reports',
          tabBarIcon: ({ color }) => <Ionicons name="pie-chart" size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}
