
export interface Customer {
  id: string;
  name: string;
  nameHindi?: string; // New field for Hindi Name
  area: string;
  address: string; 
  landmark: string;
  mobile: string;
  rateJar: number;
  rateThermos: number;
  securityDeposit: number;
  startDate: string;
}

export interface Area {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  date: string; // YYYY-MM-DD
  jarsDelivered: number;
  jarsReturned: number;
  thermosDelivered: number;
  thermosReturned: number;
  paymentAmount: number;
}

export interface CustomerStats {
  currentJarBalance: number;
  currentThermosBalance: number;
  totalDue: number;
}

export interface AppSettings {
  companyName: string;
  companyAddress: string;
  companyMobile: string;
  billFooterNote: string;
}

// Helper to calculate cost for a single transaction based on customer rates
export const calculateDailyCost = (t: Transaction, c: Customer): number => {
  return (t.jarsDelivered * c.rateJar) + (t.thermosDelivered * c.rateThermos);
};
