/**
 * AppNavigator – Navigatie-structuur van de app.
 *
 * Tabbladen:
 * 1. Dashboard (hoofdscherm, actieve rit, recente ritten)
 * 2. Ritten (volledig overzicht met filters)
 * 3. Auto's (profielbeheer)
 * 4. Instellingen (configuratie + export)
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';

import { DashboardScreen } from '../screens/DashboardScreen';
import { TripHistoryScreen } from '../screens/TripHistoryScreen';
import { TripDetailScreen } from '../screens/TripDetailScreen';
import { CarProfilesScreen } from '../screens/CarProfilesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// Stack navigator voor Dashboard + Trip Detail
const DashboardStack = createStackNavigator();

const DashboardStackNavigator: React.FC = () => (
  <DashboardStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#1a3a5c' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '600' },
    }}
  >
    <DashboardStack.Screen
      name="DashboardMain"
      component={DashboardScreen}
      options={{ headerShown: false }}
    />
    <DashboardStack.Screen
      name="TripDetail"
      component={TripDetailScreen}
      options={{ title: 'Ritdetails' }}
    />
  </DashboardStack.Navigator>
);

// Stack navigator voor Ritten + Trip Detail
const TripsStack = createStackNavigator();

const TripsStackNavigator: React.FC = () => (
  <TripsStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#1a3a5c' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '600' },
    }}
  >
    <TripsStack.Screen
      name="TripHistoryMain"
      component={TripHistoryScreen}
      options={{ title: 'Alle ritten' }}
    />
    <TripsStack.Screen
      name="TripDetail"
      component={TripDetailScreen}
      options={{ title: 'Ritdetails' }}
    />
  </TripsStack.Navigator>
);

// Tabblad-navigator
const Tab = createBottomTabNavigator();

/** Simpel tekst-icoon (vervang later door vector icons) */
const TabIcon: React.FC<{ label: string; focused: boolean }> = ({
  label,
  focused,
}) => (
  <Text
    style={{
      fontSize: 20,
      color: focused ? '#1a3a5c' : '#999',
    }}
  >
    {label}
  </Text>
);

export const AppNavigator: React.FC = () => (
  <NavigationContainer>
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1a3a5c',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0',
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStackNavigator}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="🏠" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="TripHistory"
        component={TripsStackNavigator}
        options={{
          tabBarLabel: 'Ritten',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="📋" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="CarProfiles"
        component={CarProfilesScreen}
        options={{
          tabBarLabel: "Auto's",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="🚗" focused={focused} />
          ),
          headerShown: true,
          headerTitle: "Auto's",
          headerStyle: { backgroundColor: '#1a3a5c' },
          headerTintColor: '#fff',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Instellingen',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="⚙️" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  </NavigationContainer>
);
