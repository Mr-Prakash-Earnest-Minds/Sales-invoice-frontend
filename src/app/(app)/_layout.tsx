import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform, Animated, TouchableOpacity, Dimensions } from 'react-native';
import React, { useEffect, useRef } from 'react';

const { width } = Dimensions.get('window');

function CustomTabBar({ state, descriptors, navigation }: any) {
  const tabWidth = width / state.routes.length;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      bounciness: 8,
      speed: 14
    }).start();
  }, [state.index]);

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: '#ffffff',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      elevation: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      height: Platform.OS === 'ios' ? 85 : 70,
      paddingBottom: Platform.OS === 'ios' ? 25 : 10,
      paddingTop: Platform.OS === 'ios' ? 10 : 5,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0
    }}>
      {/* Sliding Indicator Background */}
      <Animated.View style={{
        position: 'absolute',
        top: Platform.OS === 'ios' ? 10 : 5,
        left: 0,
        width: tabWidth,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ translateX: slideAnim }]
      }}>
        <View style={{
          width: 50,
          height: 50,
          backgroundColor: '#18181A',
          borderRadius: 16
        }} />
      </Animated.View>

      {/* Tab Icons */}
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Determine icon based on route name
        let iconName: any = 'grid-outline';
        let activeIconName: any = 'grid';
        if (route.name === 'dashboard') { iconName = 'grid-outline'; activeIconName = 'grid'; }
        else if (route.name === 'products') { iconName = 'cube-outline'; activeIconName = 'cube'; }
        else if (route.name === 'invoices') { iconName = 'document-text-outline'; activeIconName = 'document-text'; }
        else if (route.name === 'customers') { iconName = 'people-outline'; activeIconName = 'people'; }
        else if (route.name === 'reports') { iconName = 'pie-chart-outline'; activeIconName = 'pie-chart'; }

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 50, zIndex: 1 }}
            activeOpacity={1}
          >
            <Ionicons name={isFocused ? activeIconName : iconName} size={22} color={isFocused ? '#fff' : '#0F172A'} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function AppLayout() {
  return (
    <Tabs 
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ 
        headerShown: true,
        headerStyle: { backgroundColor: '#18181A' },
        headerTintColor: '#fff',
        headerTitleAlign: 'center',
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="products" options={{ title: 'Products' }} />
      <Tabs.Screen name="invoices" options={{ title: 'Invoices' }} />
      <Tabs.Screen name="customers" options={{ title: 'Customers' }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports' }} />
    </Tabs>
  );
}
