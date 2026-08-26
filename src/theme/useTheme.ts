import { useColorScheme } from 'react-native';
import { useStore } from '../store/useStore';
import { lightTheme, darkTheme, Theme } from './colors';

export type ThemeMode = 'light' | 'dark';

/**
 * Resuelve el ajuste `settings.theme` ('light' | 'dark' | 'system') combinado
 * con el esquema de color del sistema operativo, y devuelve el modo activo.
 */
export const useThemeMode = (): ThemeMode => {
  const themeSetting = useStore((state) => state.settings.theme);
  const systemScheme = useColorScheme();

  if (themeSetting === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return themeSetting;
};

/** Devuelve el objeto de tema (misma forma que `colors`) activo en este momento. */
export const useTheme = (): Theme => {
  const mode = useThemeMode();
  return mode === 'dark' ? darkTheme : lightTheme;
};
