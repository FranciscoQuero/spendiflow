import { DefaultTheme, DarkTheme, Theme as NavigationTheme } from '@react-navigation/native';
import { lightTheme, darkTheme } from './colors';
import { ThemeMode } from './useTheme';

/** Construye el tema de React Navigation (cabeceras, fondo de pantallas) a partir del tema activo de la app. */
export const getNavigationTheme = (mode: ThemeMode): NavigationTheme => {
  const base = mode === 'dark' ? DarkTheme : DefaultTheme;
  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return {
    ...base,
    dark: mode === 'dark',
    colors: {
      ...base.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
    },
  };
};
