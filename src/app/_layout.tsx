import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Text, View, StatusBar, LogBox } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import { setAuthToken } from '../config';

LogBox.ignoreLogs(['InteractionManager has been deprecated']);

function CustomDrawerContent(props: any) {
  const router = useRouter();

  const handleLogout = () => {
    setAuthToken('');
    router.replace('/');
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 10 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0F172A' }}>Sales Ledger</Text>
        </View>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      <TouchableOpacity 
        style={{ padding: 20, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9' }}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
        <Text style={{ marginLeft: 10, fontSize: 16, color: '#ef4444', fontWeight: '500' }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#18181A" />
      <Drawer 
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{ headerShown: false, drawerActiveTintColor: '#18181A' }}
      >
        <Drawer.Screen 
          name="index" 
          options={{ 
            drawerItemStyle: { display: 'none' },
            swipeEnabled: false 
          }} 
        />
        <Drawer.Screen 
          name="register" 
          options={{ 
            drawerItemStyle: { display: 'none' },
            swipeEnabled: false 
          }} 
        />
        <Drawer.Screen 
          name="(app)" 
          options={{ 
            drawerLabel: 'Home',
            title: 'Home',
            drawerIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />
          }} 
        />
        <Drawer.Screen 
          name="profile" 
          options={{ 
            drawerLabel: 'Profile',
            title: 'Profile',
            drawerIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />
          }} 
        />
      </Drawer>
    </>
  );
}
