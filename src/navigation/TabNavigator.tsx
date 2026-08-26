import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import {
  HomeScreen,
  TransactionsScreen,
  ChartsScreen,
  AccountsScreen,
  SettingsScreen,
} from '../screens';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/useTheme';
import { t } from '../locales/i18n';
import { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator: React.FC = () => {
  const theme = useTheme();
  // Nos suscribimos al idioma para que las etiquetas (resueltas por `t()`
  // más abajo) se recalculen y re-rendericen al cambiar el idioma.
  const language = useStore((state) => state.settings.language);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Transactions':
              iconName = focused ? 'receipt' : 'receipt-outline';
              break;
            case 'Charts':
              iconName = focused ? 'pie-chart' : 'pie-chart-outline';
              break;
            case 'Accounts':
              iconName = focused ? 'wallet' : 'wallet-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          paddingTop: 8,
          paddingBottom: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        key={`home-${language}`}
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: t('nav.home') }}
      />
      <Tab.Screen
        key={`transactions-${language}`}
        name="Transactions"
        component={TransactionsScreen}
        options={{ tabBarLabel: t('nav.transactions') }}
      />
      <Tab.Screen
        key={`charts-${language}`}
        name="Charts"
        component={ChartsScreen}
        options={{ tabBarLabel: t('nav.charts') }}
      />
      <Tab.Screen
        key={`accounts-${language}`}
        name="Accounts"
        component={AccountsScreen}
        options={{ tabBarLabel: t('nav.accounts') }}
      />
      <Tab.Screen
        key={`settings-${language}`}
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: t('nav.settings') }}
      />
    </Tab.Navigator>
  );
};
