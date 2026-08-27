// Backup (export/import) helpers for Spendiflow.
//
// `validateBackup` is a pure function (no I/O) so it can be unit tested in
// isolation. The rest of this module wraps expo-file-system / expo-sharing /
// expo-document-picker to write, share, pick and read backup files.

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { migrate, STORE_VERSION } from '../store/useStore';
import {
  Transaction,
  Category,
  BankAccount,
  Investment,
  Debt,
  Provision,
  RecurringRule,
  PlannedEvent,
  CategoryBudget,
  AppSettings,
} from '../types';

export const BACKUP_APP_ID = 'spendiflow' as const;
export const BACKUP_SCHEMA_VERSION = STORE_VERSION;

export interface BackupData {
  transactions: Transaction[];
  categories: Category[];
  bankAccounts: BankAccount[];
  investments: Investment[];
  debts: Debt[];
  provisions: Provision[];
  recurringRules: RecurringRule[];
  plannedEvents: PlannedEvent[];
  categoryBudgets: CategoryBudget[];
  settings: AppSettings;
}

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  schemaVersion: number;
  exportedAt: string;
  data: BackupData;
}

const COLLECTION_FIELDS = [
  'transactions',
  'categories',
  'bankAccounts',
  'investments',
  'debts',
  'provisions',
  'recurringRules',
  'plannedEvents',
  'categoryBudgets',
] as const;

/** Nombre de archivo con la fecha del día: spendiflow-backup-YYYY-MM-DD.json */
export const getBackupFileName = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `spendiflow-backup-${year}-${month}-${day}.json`;
};

export const createBackupFile = (data: BackupData): BackupFile => ({
  app: BACKUP_APP_ID,
  schemaVersion: BACKUP_SCHEMA_VERSION,
  exportedAt: new Date().toISOString(),
  data,
});

export type ValidateBackupResult =
  | { ok: true; data: BackupFile }
  | { ok: false; error: string };

/**
 * Valida que `raw` (JSON ya parseado, de origen no confiable) tenga la forma
 * de un backup de Spendiflow y no sea de una versión de esquema futura.
 * Las colecciones ausentes se rellenan con sus valores por defecto (nunca
 * `undefined`) reutilizando la función `migrate` del store, que ya gestiona
 * ese relleno para versiones antiguas/parciales.
 *
 * Función pura: no hace I/O, para poder testearla de forma aislada.
 */
export const validateBackup = (raw: unknown): ValidateBackupResult => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'invalidFormat' };
  }

  const obj = raw as Record<string, unknown>;

  if (obj.app !== BACKUP_APP_ID) {
    return { ok: false, error: 'invalidApp' };
  }

  if (typeof obj.schemaVersion !== 'number' || !Number.isFinite(obj.schemaVersion)) {
    return { ok: false, error: 'invalidSchemaVersion' };
  }

  if (obj.schemaVersion > BACKUP_SCHEMA_VERSION) {
    return { ok: false, error: 'schemaVersionTooNew' };
  }

  if (!obj.data || typeof obj.data !== 'object' || Array.isArray(obj.data)) {
    return { ok: false, error: 'missingData' };
  }

  const data = obj.data as Record<string, unknown>;

  for (const field of COLLECTION_FIELDS) {
    const value = data[field];
    if (value !== undefined && !Array.isArray(value)) {
      return { ok: false, error: `invalidCollection:${field}` };
    }
  }

  if (data.settings !== undefined && (typeof data.settings !== 'object' || data.settings === null)) {
    return { ok: false, error: 'invalidSettings' };
  }

  // `migrate` rellena colecciones/settings ausentes con sus defaults y
  // normaliza campos añadidos en versiones posteriores del store (v0/v1 -> v2).
  const migrated = migrate(data);

  const exportedAt = typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString();

  return {
    ok: true,
    data: {
      app: BACKUP_APP_ID,
      schemaVersion: obj.schemaVersion,
      exportedAt,
      data: {
        transactions: migrated.transactions,
        categories: migrated.categories,
        bankAccounts: migrated.bankAccounts,
        investments: migrated.investments,
        debts: migrated.debts,
        provisions: migrated.provisions,
        recurringRules: migrated.recurringRules,
        plannedEvents: migrated.plannedEvents,
        categoryBudgets: migrated.categoryBudgets,
        settings: migrated.settings,
      },
    },
  };
};

/** Recuento de elementos importados, para el mensaje de confirmación. */
export const summarizeBackup = (data: BackupData) => ({
  transactions: data.transactions.length,
  categories: data.categories.length,
  bankAccounts: data.bankAccounts.length,
  investments: data.investments.length,
  debts: data.debts.length,
  provisions: data.provisions.length,
  recurringRules: data.recurringRules.length,
  plannedEvents: data.plannedEvents.length,
  categoryBudgets: data.categoryBudgets.length,
});

/**
 * Escribe el backup como JSON en el directorio de caché de la app y devuelve
 * la URI del archivo escrito.
 */
export const writeBackupFile = (data: BackupData): string => {
  const backup = createBackupFile(data);
  const json = JSON.stringify(backup, null, 2);
  const file = new File(Paths.cache, getBackupFileName());

  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(json);

  return file.uri;
};

/** Abre la hoja de compartir del sistema para el archivo indicado. */
export const shareBackupFile = async (uri: string): Promise<void> => {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('sharingUnavailable');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    dialogTitle: getBackupFileName(),
    UTI: 'public.json',
  });
};

/**
 * Abre el selector de documentos filtrando JSON y devuelve el contenido ya
 * parseado, o `null` si el usuario cancela la selección.
 */
export const pickAndReadBackupFile = async (): Promise<unknown | null> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/json', 'text/plain'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const picked = new File(result.assets[0].uri);
  const text = await picked.text();
  return JSON.parse(text);
};
