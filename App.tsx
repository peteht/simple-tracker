import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import AddTrackerScreen from './src/screens/AddTrackerScreen';
import TrackerDetailScreen from './src/screens/TrackerDetailScreen';
import CompareScreen from './src/screens/CompareScreen';
import EditTrackerScreen from './src/screens/EditTrackerScreen';
import { colors } from './src/theme';

export type RootStackParamList = {
  Home: undefined;
  AddTracker: undefined;
  TrackerDetail: { trackerId: string };
  EditTracker: { trackerId: string };
  Compare: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontWeight: '600', color: colors.textPrimary },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AddTracker" component={AddTrackerScreen} options={{ title: 'New Tracker' }} />
        <Stack.Screen
          name="TrackerDetail"
          component={TrackerDetailScreen}
          options={{ title: '' }}
        />
        <Stack.Screen name="EditTracker" component={EditTrackerScreen} options={{ title: 'Edit Tracker' }} />
        <Stack.Screen name="Compare" component={CompareScreen} options={{ title: 'Compare' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
