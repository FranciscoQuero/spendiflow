import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { useStore } from './src/store/useStore';
import { setLocale, t } from './src/locales/i18n';
import { useThemeMode } from './src/theme/useTheme';
import { lightTheme } from './src/theme/colors';
import { getNavigationTheme } from './src/theme/navigationTheme';
import { configureNotificationHandler, syncDailyReminder } from './src/utils/reminders';

// Muestra la notificación local aunque la app esté en primer plano.
configureNotificationHandler();

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, info);
  }
  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>{t('errorBoundary.title')}</Text>
            <Text style={styles.message}>{t('errorBoundary.message')}</Text>
            {__DEV__ && this.state.error && (
              <Text style={styles.devStack}>
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </Text>
            )}
            <Pressable style={styles.retryButton} onPress={this.handleRetry}>
              <Text style={styles.retryText}>{t('errorBoundary.retry')}</Text>
            </Pressable>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: lightTheme.text,
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    fontSize: 15,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
  devStack: {
    marginTop: 16,
    fontSize: 12,
    color: lightTheme.textSecondary,
    fontFamily: 'monospace',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: lightTheme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

function AppContent() {
  const mode = useThemeMode();
  const navigationTheme = getNavigationTheme(mode);

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const settings = useStore((state) => state.settings);

  useEffect(() => {
    setLocale(settings.language);
  }, [settings.language]);

  // Sincroniza el recordatorio diario una única vez al arrancar la app, para
  // que sobreviva a reinstalaciones del binario nativo (que en Android
  // borran las notificaciones programadas). Si el store del persist aún no
  // ha hidratado, esperamos a que termine para no sincronizar con los
  // valores por defecto en lugar de los ajustes guardados del usuario.
  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      syncDailyReminder(useStore.getState().settings);
      return;
    }
    const unsubscribe = useStore.persist.onFinishHydration((state) => {
      syncDailyReminder(state.settings);
    });
    return unsubscribe;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
