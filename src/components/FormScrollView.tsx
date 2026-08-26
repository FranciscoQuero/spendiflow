import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, ViewProps } from 'react-native';

interface FormScrollViewProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * Envoltorio consistente para pantallas de formulario (ScrollView + botón de
 * guardar, o el contenido de un Modal con inputs).
 *
 * - iOS: usa `behavior="padding"` para desplazar el contenido por encima del
 *   teclado.
 * - Android: `app.json` fija `android.softwareKeyboardLayoutMode: "resize"`,
 *   por lo que la ventana ya se redimensiona sola; no aplicamos ningún
 *   `behavior` aquí para evitar un doble desplazamiento. Cada ScrollView debe
 *   añadir su propio padding inferior extra en `contentContainerStyle` y
 *   `keyboardShouldPersistTaps="handled"` para que los botones sigan
 *   funcionando con el teclado abierto.
 */
export const FormScrollView: React.FC<FormScrollViewProps> = ({ children, style, ...rest }) => (
  <KeyboardAvoidingView
    style={[styles.flex, style]}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    {...rest}
  >
    {children}
  </KeyboardAvoidingView>
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
