export default {
  // General
  app: {
    name: 'Spendiflow',
    tagline: 'Personal expense tracker',
  },

  // Navigation
  nav: {
    home: 'Home',
    transactions: 'Transactions',
    charts: 'Charts',
    accounts: 'Accounts',
    settings: 'Settings',
  },

  // Home Screen
  home: {
    welcome: 'Welcome',
    monthlySummary: 'Monthly summary',
    totalExpenses: 'Total expenses',
    totalIncome: 'Total income',
    netBalance: 'Net balance',
    quickActions: 'Quick actions',
    addExpense: 'Add expense',
    addIncome: 'Add income',
    addBalance: 'Update balance',
    recentTransactions: 'Recent transactions',
    seeAll: 'See all',
    noTransactions: 'No transactions',
  },

  // Transactions
  transactions: {
    title: 'Transactions',
    expense: 'Expense',
    income: 'Income',
    transfer: 'Transfer',
    all: 'All',
    expenses: 'Expenses',
    incomes: 'Income',
    transfers: 'Transfers',
    noTransactions: 'No transactions',
    deleteConfirm: 'Delete this transaction?',
    noCategory: 'No category',
    unknownAccount: 'Unknown account',
    business: 'Business',
    edit: 'Edit',
    fromTo: '{{from}} → {{to}}',
  },

  // Add Transaction
  addTransaction: {
    addExpense: 'Add expense',
    addIncome: 'Add income',
    addTransfer: 'Add transfer',
    editExpense: 'Edit expense',
    editIncome: 'Edit income',
    editTransfer: 'Edit transfer',
    amount: 'Amount',
    concept: 'Description',
    conceptPlaceholder: 'E.g.: Gym',
    conceptPlaceholderTransfer: 'Transfer',
    category: 'Category',
    subcategory: 'Subcategory',
    date: 'Date',
    month: 'Month',
    note: 'Note (optional)',
    notePlaceholder: 'Add a note...',
    save: 'Save',
    saved: 'Saved',
    error: 'Error saving',
    errorAmount: 'Enter a valid amount',
    errorConcept: 'Enter a description',
    errorCategory: 'Select a category',
    errorFromAccount: 'Select the source account',
    errorToAccount: 'Select the destination account',
    errorSameAccount: 'Source and destination accounts must be different',
    account: 'Account',
    noAccount: 'No account',
    fromAccount: 'From',
    toAccount: 'To',
    scope: 'Scope',
    scopePersonal: 'Personal',
    scopeBusiness: 'Business',
  },

  // Categories
  categories: {
    casa: 'Housing',
    comida: 'Food',
    suscripciones: 'Subscriptions',
    ocio: 'Leisure',
    otros: 'Other',
    viajes: 'Travel',
    salary: 'Salary',
    bonus: 'Bonus',
    otherIncome: 'Other income',
  },

  // Subcategories
  subcategories: {
    // Housing
    alquiler: 'Rent',
    luz: 'Electricity',
    gas: 'Gas',
    agua: 'Water',
    internet: 'Internet',
    comunidad: 'HOA fees',
    seguro: 'Home insurance',
    // Food
    super: 'Groceries',
    comerFuera: 'Eating out',
    delivery: 'Delivery',
    // Subscriptions
    netflix: 'Netflix',
    spotify: 'Spotify',
    gimnasio: 'Gym',
    otherSubs: 'Other subscriptions',
    // Leisure
    cine: 'Movies',
    conciertos: 'Concerts',
    bares: 'Bars',
    hobbies: 'Hobbies',
    // Other
    ropa: 'Clothing',
    regalos: 'Gifts',
    salud: 'Health',
    transporte: 'Transportation',
    gasolina: 'Gas/Fuel',
    // Travel
    alojamiento: 'Accommodation',
    vuelos: 'Flights',
    actividades: 'Activities',
  },

  // Charts
  charts: {
    title: 'Charts',
    week: 'Week',
    month: 'Month',
    quarter: 'Quarter',
    year: 'Year',
    byCategory: 'By category',
    trend: 'Trend',
    total: 'Total',
    noData: 'No data for this period',
  },

  // Accounts
  accounts: {
    title: 'Accounts & Assets',
    bankAccounts: 'Bank accounts',
    investments: 'Investments',
    debts: 'Debts',
    addAccount: 'Add account',
    addInvestment: 'Add investment',
    addDebt: 'Add debt',
    balance: 'Balance',
    lastUpdate: 'Last updated',
    updateBalance: 'Update balance',
    totalBalance: 'Total balance',
    currentValue: 'Current value',
    totalContributed: 'Total contributed',
    totalDebt: 'Total debt',
    remaining: 'Remaining',
    paid: 'Paid',
    makePayment: 'Record payment',
    noAccounts: 'No accounts',
    noInvestments: 'No investments',
    noDebts: 'No debts',
  },

  // Settings
  settings: {
    title: 'Settings',
    language: 'Language',
    spanish: 'Español',
    english: 'English',
    currency: 'Currency',
    categories: 'Categories',
    editCategories: 'Edit categories',
    expenseCategories: 'Expense categories',
    incomeCategories: 'Income categories',
    addCategory: 'Add category',
    addSubcategory: 'Add subcategory',
    data: 'Data',
    exportData: 'Export data',
    exportingData: 'Exporting...',
    exportSuccessTitle: 'Backup created',
    exportSuccessMessage: 'Choose where to save or share your backup.',
    exportErrorTitle: 'Export failed',
    exportErrorMessage: 'Could not create the backup. Please try again.',
    exportSharingUnavailable: 'File sharing is not available on this device.',
    importData: 'Import data',
    importingData: 'Importing...',
    importConfirmTitle: 'Replace all data',
    importConfirmMessage:
      'This will replace ALL current app data. This action cannot be undone.',
    importSuccessTitle: 'Import completed',
    importSuccessMessage:
      '%{transactions} transactions, %{bankAccounts} accounts, %{investments} investments, %{debts} debts, %{provisions} savings pots, %{recurringRules} recurring rules and %{plannedEvents} planned events.',
    importErrorTitle: 'Import failed',
    importErrorInvalidFile: 'The selected file is not a valid Spendiflow backup.',
    importErrorGeneric: 'Could not import the file. Check that it is valid JSON.',
    about: 'About',
    version: 'Version',
    dangerZone: 'Danger zone',
    deleteAllData: 'Delete all data',
    deleteConfirm: 'Are you sure? This action cannot be undone.',
    dataDeletedMessage: 'All data has been deleted.',
  },

  // Common
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    close: 'Close',
    confirm: 'Confirm',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    today: 'Today',
    yesterday: 'Yesterday',
    currency: '€',
    underConstruction: 'Under construction',
  },

  // Transfers
  transfers: {
    title: 'Transfers',
  },

  // Provisions (savings pots)
  provisions: {
    title: 'Savings pots',
  },

  // Recurring rules
  recurring: {
    title: 'Recurring',
  },

  // Month close
  monthClose: {
    title: 'Month close',
  },

  // Planned events
  plannedEvents: {
    title: 'Financial calendar',
  },

  // Months
  months: {
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December',
  },
};
