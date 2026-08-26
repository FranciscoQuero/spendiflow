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
    pendingRecurrences: 'Pending confirmations',
    moreCount: '+%{count} more',
  },

  // Transactions
  transactions: {
    title: 'Transactions',
    expense: 'Expense',
    income: 'Income',
    all: 'All',
    expenses: 'Expenses',
    incomes: 'Income',
    noTransactions: 'No transactions',
    deleteConfirm: 'Delete this transaction?',
  },

  // Add Transaction
  addTransaction: {
    addExpense: 'Add expense',
    addIncome: 'Add income',
    amount: 'Amount',
    concept: 'Description',
    conceptPlaceholder: 'E.g.: Gym',
    category: 'Category',
    subcategory: 'Subcategory',
    date: 'Date',
    month: 'Month',
    note: 'Note (optional)',
    notePlaceholder: 'Add a note...',
    save: 'Save',
    saved: 'Saved',
    error: 'Error saving',
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
    categories: 'Categories',
    editCategories: 'Edit categories',
    expenseCategories: 'Expense categories',
    incomeCategories: 'Income categories',
    addCategory: 'Add category',
    addSubcategory: 'Add subcategory',
    exportData: 'Export data',
    importData: 'Import data',
    about: 'About',
    version: 'Version',
    deleteAllData: 'Delete all data',
    deleteConfirm: 'Are you sure? This action cannot be undone.',
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
    emptyTitle: 'No recurring movements',
    emptyDescription:
      "Add your freelance fees, loan payments, and periodic transfers so Spendiflow can prompt you when it's time to confirm them.",
    createButton: 'Create recurring rule',
    addTitle: 'New recurring rule',
    editTitle: 'Edit recurring rule',
    name: 'Name',
    namePlaceholder: 'E.g.: Freelance fee',
    type: 'Type',
    typeExpense: 'Expense',
    typeIncome: 'Income',
    typeTransfer: 'Transfer',
    amount: 'Amount',
    concept: 'Description',
    conceptPlaceholder: 'The name will be used if left empty',
    scope: 'Scope',
    scopePersonal: 'Personal',
    scopeBusiness: 'Business',
    category: 'Category',
    subcategory: 'Subcategory',
    account: 'Account',
    noAccount: 'No account',
    fromAccount: 'From account',
    toAccount: 'To account',
    needTwoAccounts: 'You need at least two accounts to create a recurring transfer.',
    frequency: {
      label: 'Frequency',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
    },
    nextDueDate: 'Next due date',
    active: 'Active',
    done: 'Done',
    deleteConfirm: 'Delete this recurring rule?',
    confirm: 'Confirm',
    skip: 'Skip',
    overdue: 'Overdue',
    errors: {
      name: 'Add a name for the rule',
      amount: 'Enter a valid amount',
      category: 'Select a category',
      accounts: 'Select a from and to account, and make sure they are different',
    },
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
