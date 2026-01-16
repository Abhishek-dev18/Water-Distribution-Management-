
export interface Customer {
  id: string;
  name: string;
  nameHindi?: string;
  area: string;
  address: string; 
  landmark: string;
  landmarkHindi?: string;
  mobile: string;
  rateJar: number;
  rateThermos: number;
  securityDeposit: number;
  oldDues: number;
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
  dataStoragePath?: string; // Path for Electron DB
  autoBackupPath?: string;  // Path for Backups
}

export const calculateDailyCost = (t: Transaction, c: Customer): number => {
  return (t.jarsDelivered * c.rateJar) + (t.thermosDelivered * c.rateThermos);
};
