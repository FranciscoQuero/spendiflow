import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';
import { Transaction } from '../types';

const DEFAULT_DURATION_MS = 5000;
const ANIMATION_MS = 220;

interface SnackbarProps {
  /** Controla la visibilidad; el propio componente anima entrada/salida al cambiar. */
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Se llama al terminar de ocultarse, tanto por timeout como por acción. */
  onDismiss: () => void;
  durationMs?: number;
}

/**
 * Snackbar inferior reutilizable: aparece con una animación de entrada,
 * se autooculta tras `durationMs` (por defecto 5s) y admite una acción
 * opcional (p.ej. "Deshacer"). Theming para ambos temas vía `useTheme()`.
 */
export const Snackbar: React.FC<SnackbarProps> = ({
  visible,
  message,
  actionLabel,
  onAction,
  onDismiss,
  durationMs = DEFAULT_DURATION_MS,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: ANIMATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: ANIMATION_MS,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(() => {
        hide();
      }, durationMs);
    } else {
      hide();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, durationMs]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 80,
        duration: ANIMATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: ANIMATION_MS,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onDismiss();
    });
  };

  const handleAction = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onAction?.();
    hide();
  };

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrapper, { opacity, transform: [{ translateY }] }]}
    >
      <View style={styles.bar}>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        {actionLabel && onAction && (
          <Pressable onPress={handleAction} hitSlop={8} style={styles.actionButton}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};

const makeStyles = (theme: Theme) => StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.text,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  message: {
    flex: 1,
    color: theme.background,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 12,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  actionText: {
    color: theme.primaryLight,
    fontSize: 14,
    fontWeight: '700',
  },
});

// --- Coordinación del deshacer entre TransactionDetailScreen y TransactionsScreen ---
//
// TransactionDetailScreen borra y navega hacia atrás inmediatamente, pero el
// snackbar de deshacer vive en TransactionsScreen (la pantalla a la que se
// vuelve). En vez de crear un store/context nuevo solo para esto, usamos un
// pequeño "buzón" de módulo: TransactionDetailScreen deja la transacción
// borrada aquí antes de volver atrás, y TransactionsScreen la recoge en su
// `useFocusEffect` al recuperar el foco. Es deliberadamente efímero (no es
// estado de React ni se persiste) y expira solo si nadie lo consume, para
// evitar que un snackbar "fantasma" aparezca en una navegación no relacionada.
let pendingTransactionUndo: { transaction: Transaction; deletedAt: number } | null = null;
const PENDING_UNDO_TTL_MS = 10000;

export const setPendingTransactionUndo = (transaction: Transaction) => {
  pendingTransactionUndo = { transaction, deletedAt: Date.now() };
};

export const consumePendingTransactionUndo = (): Transaction | null => {
  if (!pendingTransactionUndo) return null;
  const { transaction, deletedAt } = pendingTransactionUndo;
  pendingTransactionUndo = null;
  if (Date.now() - deletedAt > PENDING_UNDO_TTL_MS) return null;
  return transaction;
};
