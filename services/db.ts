
import { Customer, Transaction, CustomerStats, Area, calculateDailyCost, AppSettings } from '../types';

const STORAGE_KEYS = {
  CUSTOMERS: 'aquaflow_customers',
  TRANSACTIONS: 'aquaflow_transactions',
  AREAS: 'aquaflow_areas',
  SETTINGS: 'aquaflow_settings',
};

// --- Helpers ---
const generateId = () => Math.random().toString(36).substr(2, 9);

const getStoredData = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(`Error loading ${key}`, e);
    return [];
  }
};

const setStoredData = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key}`, e);
  }
};

// --- Settings Service ---
export const getSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Error loading settings", e);
  }
  return {
    companyName: 'AquaFlow Services',
    companyAddress: 'Main Market, City',
    companyMobile: '',
    billFooterNote: 'Thank you for your business!'
  };
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

// --- Area Service ---

export const getAreas = (): Area[] => {
  return getStoredData<Area>(STORAGE_KEYS.AREAS).sort((a, b) => a.name.localeCompare(b.name));
};

export const saveArea = (area: Partial<Area>): Area => {
  const areas = getAreas();
  let newArea: Area;

  if (area.id) {
    // Update
    const index = areas.findIndex(a => a.id === area.id);
    if (index >= 0) {
      const oldName = areas[index].name;
      // Cascade update if name changed
      if (oldName !== area.name && area.name) {
        const customers = getCustomers();
        let changed = false;
        const updatedCustomers = customers.map(c => {
          if (c.area === oldName) {
            changed = true;
            return { ...c, area: area.name! };
          }
          return c;
        });
        if (changed) setStoredData(STORAGE_KEYS.CUSTOMERS, updatedCustomers);
      }
      
      areas[index] = { ...areas[index], ...area } as Area;
      newArea = areas[index];
    } else {
      newArea = { id: generateId(), name: area.name || 'New Area' };
      areas.push(newArea);
    }
  } else {
    // Create
    newArea = { id: generateId(), name: area.name || 'New Area' };
    areas.push(newArea);
  }
  setStoredData(STORAGE_KEYS.AREAS, areas);
  return newArea;
};

export const deleteArea = (id: string) => {
  const areas = getAreas().filter(a => a.id !== id);
  setStoredData(STORAGE_KEYS.AREAS, areas);
};


// --- Customer Service ---

export const getCustomers = (): Customer[] => {
  return getStoredData<Customer>(STORAGE_KEYS.CUSTOMERS);
};

export const generateNextCustomerId = (dateStr: string): string => {
  const customers = getCustomers();
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return ''; 

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `${year}${month}`;

  let maxSeq = 0;
  // Format: YYYYMMxxxx (e.g., 2025020001)
  customers.forEach(c => {
    // Check if ID matches format YYYYMM + 4 digits
    if (c.id.startsWith(prefix) && c.id.length === 10) {
        const seqPart = c.id.substring(6);
        const seq = parseInt(seqPart, 10);
        if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
        }
    }
  });

  // Increment sequence
  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
};

export const saveCustomer = (customer: Omit<Customer, 'id'> | Customer): Customer => {
  const customers = getCustomers();
  let newCustomer: Customer;

  // Check if we are updating (ID exists in DB) or Creating
  if ('id' in customer && customer.id) {
    const index = customers.findIndex(c => c.id === customer.id);
    if (index >= 0) {
      // Update existing
      customers[index] = customer as Customer;
      newCustomer = customer as Customer;
    } else {
      // Create new with specific ID (e.g. generated formatted ID)
      newCustomer = customer as Customer;
      customers.push(newCustomer);
    }
  } else {
    // Fallback: Create with random ID if no ID provided
    newCustomer = { ...customer, id: generateId() };
    customers.push(newCustomer);
  }
  
  setStoredData(STORAGE_KEYS.CUSTOMERS, customers);
  return newCustomer;
};

export const deleteCustomer = (id: string) => {
  const customers = getCustomers().filter(c => c.id !== id);
  setStoredData(STORAGE_KEYS.CUSTOMERS, customers);
};

// --- Transaction Service ---

export const getTransactions = (): Transaction[] => {
  return getStoredData<Transaction>(STORAGE_KEYS.TRANSACTIONS);
};

export const getTransactionsByDate = (date: string): Transaction[] => {
  return getTransactions().filter(t => t.date === date);
};

export const getTransactionsByCustomerAndMonth = (customerId: string, year: number, month: number): Transaction[] => {
  return getTransactions().filter(t => {
    // Parse Date manually to avoid Timezone issues causing off-by-one day/month
    const [tYear, tMonth, tDay] = t.date.split('-').map(Number);
    // tMonth is 1-based (01..12), JS Month is 0-based (0..11)
    return t.customerId === customerId && tYear === year && tMonth === (month + 1);
  });
};

export const saveTransaction = (transaction: Partial<Transaction> & { customerId: string, date: string }): Transaction => {
  const transactions = getTransactions();
  const existingIndex = transactions.findIndex(t => t.customerId === transaction.customerId && t.date === transaction.date);

  const defaults = {
    jarsDelivered: 0,
    jarsReturned: 0,
    thermosDelivered: 0,
    thermosReturned: 0,
    paymentAmount: 0,
  };

  let savedTx: Transaction;

  if (existingIndex >= 0) {
    const updated = { ...transactions[existingIndex], ...transaction };
    transactions[existingIndex] = updated;
    savedTx = updated;
  } else {
    savedTx = { id: generateId(), ...defaults, ...transaction } as Transaction;
    transactions.push(savedTx);
  }

  setStoredData(STORAGE_KEYS.TRANSACTIONS, transactions);
  return savedTx;
};

// --- Stats Service ---

export const getCustomerStats = (customerId: string): CustomerStats => {
  const transactions = getTransactions().filter(t => t.customerId === customerId);
  const customers = getCustomers();
  const customer = customers.find(c => c.id === customerId);

  if (!customer) return { currentJarBalance: 0, currentThermosBalance: 0, totalDue: 0 };

  let jarBal = 0;
  let thermosBal = 0;
  let due = 0;

  transactions.forEach(t => {
    jarBal += (t.jarsDelivered - t.jarsReturned);
    thermosBal += (t.thermosDelivered - t.thermosReturned);
    
    const cost = calculateDailyCost(t, customer);
    due += (cost - t.paymentAmount);
  });

  return {
    currentJarBalance: jarBal,
    currentThermosBalance: thermosBal,
    totalDue: due 
  };
};

export const getAllCustomerStats = (): Record<string, CustomerStats> => {
    const customers = getCustomers();
    const stats: Record<string, CustomerStats> = {};
    customers.forEach(c => {
        stats[c.id] = getCustomerStats(c.id);
    });
    return stats;
}
