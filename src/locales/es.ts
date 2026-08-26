export default {
  // General
  app: {
    name: 'Spendiflow',
    tagline: 'Control de gastos personal',
  },

  // Navigation
  nav: {
    home: 'Inicio',
    transactions: 'Transacciones',
    charts: 'Gráficos',
    accounts: 'Cuentas',
    settings: 'Ajustes',
  },

  // Home Screen
  home: {
    welcome: 'Bienvenido',
    monthlySummary: 'Resumen del mes',
    totalExpenses: 'Total gastos',
    totalIncome: 'Total ingresos',
    netBalance: 'Balance neto',
    quickActions: 'Acciones rápidas',
    addExpense: 'Añadir gasto',
    addIncome: 'Añadir ingreso',
    addBalance: 'Actualizar saldo',
    recentTransactions: 'Transacciones recientes',
    seeAll: 'Ver todo',
    noTransactions: 'No hay transacciones',
  },

  // Transactions
  transactions: {
    title: 'Transacciones',
    expense: 'Gasto',
    income: 'Ingreso',
    transfer: 'Transferencia',
    all: 'Todos',
    expenses: 'Gastos',
    incomes: 'Ingresos',
    transfers: 'Transferencias',
    noTransactions: 'No hay transacciones',
    deleteConfirm: '¿Eliminar esta transacción?',
    noCategory: 'Sin categoría',
    unknownAccount: 'Cuenta desconocida',
    business: 'Negocio',
    edit: 'Editar',
    fromTo: '{{from}} → {{to}}',
  },

  // Add Transaction
  addTransaction: {
    addExpense: 'Añadir gasto',
    addIncome: 'Añadir ingreso',
    addTransfer: 'Añadir transferencia',
    editExpense: 'Editar gasto',
    editIncome: 'Editar ingreso',
    editTransfer: 'Editar transferencia',
    amount: 'Importe',
    concept: 'Concepto',
    conceptPlaceholder: 'Ej: Gimnasio',
    conceptPlaceholderTransfer: 'Transferencia',
    category: 'Categoría',
    subcategory: 'Subcategoría',
    date: 'Fecha',
    month: 'Mes',
    note: 'Nota (opcional)',
    notePlaceholder: 'Añade una nota...',
    save: 'Guardar',
    saved: 'Guardado',
    error: 'Error al guardar',
    errorAmount: 'Introduce un importe válido',
    errorConcept: 'Introduce una descripción',
    errorCategory: 'Selecciona una categoría',
    errorFromAccount: 'Selecciona la cuenta de origen',
    errorToAccount: 'Selecciona la cuenta de destino',
    errorSameAccount: 'Las cuentas de origen y destino deben ser distintas',
    account: 'Cuenta',
    noAccount: 'Sin cuenta',
    fromAccount: 'Desde',
    toAccount: 'Hacia',
    scope: 'Ámbito',
    scopePersonal: 'Personal',
    scopeBusiness: 'Negocio',
  },

  // Categories (matching Excel)
  categories: {
    casa: 'Casa',
    comida: 'Comida',
    suscripciones: 'Suscripciones',
    ocio: 'Ocio',
    otros: 'Otros',
    viajes: 'Viajes',
    salary: 'Salario',
    bonus: 'Bonus',
    otherIncome: 'Otros ingresos',
  },

  // Subcategories
  subcategories: {
    // Casa
    alquiler: 'Alquiler',
    luz: 'Luz',
    gas: 'Gas',
    agua: 'Agua',
    internet: 'Internet',
    comunidad: 'Comunidad',
    seguro: 'Seguro hogar',
    // Comida
    super: 'Supermercado',
    comerFuera: 'Comer fuera',
    delivery: 'Delivery',
    // Suscripciones
    netflix: 'Netflix',
    spotify: 'Spotify',
    gimnasio: 'Gimnasio',
    otherSubs: 'Otras suscripciones',
    // Ocio
    cine: 'Cine',
    conciertos: 'Conciertos',
    bares: 'Bares',
    hobbies: 'Hobbies',
    // Otros
    ropa: 'Ropa',
    regalos: 'Regalos',
    salud: 'Salud',
    transporte: 'Transporte',
    gasolina: 'Gasolina',
    // Viajes
    alojamiento: 'Alojamiento',
    vuelos: 'Vuelos',
    actividades: 'Actividades',
  },

  // Charts
  charts: {
    title: 'Gráficos',
    week: 'Semana',
    month: 'Mes',
    quarter: 'Trimestre',
    year: 'Año',
    byCategory: 'Por categoría',
    trend: 'Tendencia',
    total: 'Total',
    noData: 'Sin datos para este período',
  },

  // Accounts
  accounts: {
    title: 'Cuentas y Activos',
    bankAccounts: 'Cuentas bancarias',
    investments: 'Inversiones',
    debts: 'Deudas',
    addAccount: 'Añadir cuenta',
    addInvestment: 'Añadir inversión',
    addDebt: 'Añadir deuda',
    balance: 'Saldo',
    lastUpdate: 'Última actualización',
    updateBalance: 'Actualizar saldo',
    totalBalance: 'Balance total',
    currentValue: 'Valor actual',
    totalContributed: 'Total aportado',
    totalDebt: 'Deuda total',
    remaining: 'Pendiente',
    paid: 'Pagado',
    makePayment: 'Registrar pago',
    noAccounts: 'No hay cuentas',
    noInvestments: 'No hay inversiones',
    noDebts: 'No hay deudas',
  },

  // Settings
  settings: {
    title: 'Ajustes',
    language: 'Idioma',
    spanish: 'Español',
    english: 'English',
    categories: 'Categorías',
    editCategories: 'Editar categorías',
    expenseCategories: 'Categorías de gastos',
    incomeCategories: 'Categorías de ingresos',
    addCategory: 'Añadir categoría',
    addSubcategory: 'Añadir subcategoría',
    exportData: 'Exportar datos',
    importData: 'Importar datos',
    about: 'Acerca de',
    version: 'Versión',
    deleteAllData: 'Borrar todos los datos',
    deleteConfirm: '¿Estás seguro? Esta acción no se puede deshacer.',
  },

  // Common
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Añadir',
    close: 'Cerrar',
    confirm: 'Confirmar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    today: 'Hoy',
    yesterday: 'Ayer',
    currency: '€',
    underConstruction: 'En construcción',
  },

  // Transfers
  transfers: {
    title: 'Transferencias',
  },

  // Provisions (huchas)
  provisions: {
    title: 'Huchas',
  },

  // Recurring rules
  recurring: {
    title: 'Recurrentes',
  },

  // Month close
  monthClose: {
    title: 'Cierre de mes',
  },

  // Planned events
  plannedEvents: {
    title: 'Calendario financiero',
  },

  // Months
  months: {
    january: 'Enero',
    february: 'Febrero',
    march: 'Marzo',
    april: 'Abril',
    may: 'Mayo',
    june: 'Junio',
    july: 'Julio',
    august: 'Agosto',
    september: 'Septiembre',
    october: 'Octubre',
    november: 'Noviembre',
    december: 'Diciembre',
  },
};
