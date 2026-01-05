
import { User, Company, Application, UserRole, AdConfig } from '../types';
import { COORDINATOR_ACCOUNT } from '../constants';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, writeBatch, getDoc } from 'firebase/firestore';

const STORAGE_KEYS = {
  USERS: 'wbl_users',
  COMPANIES: 'wbl_companies',
  APPLICATIONS: 'wbl_applications',
  SESSION: 'wbl_session',
  AD_CONFIG: 'wbl_ad_config'
};

const firebaseConfig = {
  apiKey: "AIzaSyAPAspAMGl6eevn__-mc-EW8ZKGw9J09dY",
  authDomain: "wblfptt.firebaseapp.com",
  projectId: "wblfptt",
  storageBucket: "wblfptt.firebasestorage.app",
  messagingSenderId: "293839705020",
  appId: "1:293839705020:web:452106a8d873256fc711b9",
  measurementId: "G-DCP1822ZES"
};

let db: any = null;
let unsubscribeListeners: (() => void)[] = [];

const initFirebase = () => {
  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    setupRealtimeListeners();
  } catch (e) {
    console.error('Firebase init failed', e);
  }
};

const setupRealtimeListeners = () => {
  if (!db) return;
  unsubscribeListeners.forEach(unsub => unsub());
  unsubscribeListeners = [];

  const syncCollection = (colName: string, storageKey: string) => {
    const q = query(collection(db, colName));
    const unsub = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data());
      });
      // Hanya kemaskini jika snapshot mempunyai data (elakkan overwrite data tempatan dengan array kosong masa loading)
      if (!snapshot.empty || snapshot.metadata.fromCache === false) {
          localStorage.setItem(storageKey, JSON.stringify(data));
          notifyListeners(); 
      }
    }, (error) => {
        console.error(`Sync Error for ${colName}:`, error);
    });
    unsubscribeListeners.push(unsub);
  };

  syncCollection('users', STORAGE_KEYS.USERS);
  syncCollection('companies', STORAGE_KEYS.COMPANIES);
  syncCollection('applications', STORAGE_KEYS.APPLICATIONS);
  
  const unsubAd = onSnapshot(doc(db, 'settings', 'ad_config'), (snapshot) => {
    if (snapshot.exists()) {
      localStorage.setItem(STORAGE_KEYS.AD_CONFIG, JSON.stringify(snapshot.data()));
      notifyListeners();
    }
  });
  unsubscribeListeners.push(unsubAd);
};

const listeners: (() => void)[] = [];
const notifyListeners = () => {
  listeners.forEach(l => l());
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const sanitizeForFirebase = (obj: any): any => {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) return obj.map(v => sanitizeForFirebase(v));
  if (typeof obj === 'object') {
    const clean: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clean[key] = sanitizeForFirebase(obj[key]);
      }
    }
    return clean;
  }
  return obj;
};

const getCurrentUser = (): User | null => {
  const session = localStorage.getItem(STORAGE_KEYS.SESSION);
  return session ? JSON.parse(session) : null;
};

const isCoordinator = () => {
  const user = getCurrentUser();
  if (!user) return false;
  return user.username === COORDINATOR_ACCOUNT.username || user.role === UserRole.COORDINATOR;
};

const isJKWBL = () => {
  const user = getCurrentUser();
  return user?.is_jkwbl === true;
};

const hasSystemAccess = () => isCoordinator() || isJKWBL();

const init = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.COMPANIES)) localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
  
  const rawAd = localStorage.getItem(STORAGE_KEYS.AD_CONFIG);
  if (!rawAd) {
    localStorage.setItem(STORAGE_KEYS.AD_CONFIG, JSON.stringify({ items: [], isEnabled: false }));
  }

  initFirebase();
};

init();

export const StorageService = {
  subscribe: (callback: () => void) => {
    listeners.push(callback);
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    };
  },

  isCloudEnabled: () => !!db,

  getAdConfig: (): AdConfig => {
    const data = localStorage.getItem(STORAGE_KEYS.AD_CONFIG);
    return data ? JSON.parse(data) : { items: [], isEnabled: false };
  },

  updateAdConfig: async (config: AdConfig): Promise<void> => {
    if (!isCoordinator()) throw new Error('Hanya Penyelaras boleh mengemaskini iklan.');
    if (db) await setDoc(doc(db, 'settings', 'ad_config'), sanitizeForFirebase(config));
    localStorage.setItem(STORAGE_KEYS.AD_CONFIG, JSON.stringify(config));
    notifyListeners();
  },

  uploadLocalToCloud: async () => {
    if (!hasSystemAccess()) throw new Error('Akses Ditolak.');
    if (!db) throw new Error('Cloud tidak disambungkan');
    const batch = writeBatch(db);
    StorageService.getUsers().forEach(u => u.id && batch.set(doc(db, 'users', u.id), sanitizeForFirebase(u)));
    StorageService.getCompanies().forEach(c => c.id && batch.set(doc(db, 'companies', c.id), sanitizeForFirebase(c)));
    StorageService.getApplications().forEach(a => a.id && batch.set(doc(db, 'applications', a.id), sanitizeForFirebase(a)));
    await batch.commit();
  },

  login: async (username: string, password: string): Promise<User | null> => {
    if (username === COORDINATOR_ACCOUNT.username && password === COORDINATOR_ACCOUNT.password) {
      const user = COORDINATOR_ACCOUNT as unknown as User;
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
      return user;
    }
    const users = StorageService.getUsers();
    const user = users.find((u: User) => u.username === username && u.password === password);
    if (user) {
      if (user.is_approved === false) throw new Error('Akaun masih menunggu kelulusan.');
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
      return user;
    }
    return null;
  },

  logout: () => localStorage.removeItem(STORAGE_KEYS.SESSION),
  getCurrentUser,

  getUsers: (): User[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),
  
  createUser: async (user: Omit<User, 'id'>): Promise<User> => {
    const users = StorageService.getUsers();
    if (users.some(u => u.username === user.username)) throw new Error('Username sudah wujud');
    const newUser = { ...user, id: generateId(), is_approved: user.role === UserRole.STUDENT };
    
    users.push(newUser as User);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    notifyListeners();

    if (db) await setDoc(doc(db, 'users', newUser.id), sanitizeForFirebase(newUser));
    return newUser as User;
  },

  updateUser: async (updatedUser: User): Promise<User> => {
    const users = StorageService.getUsers();
    const idx = users.findIndex(u => u.id === updatedUser.id);
    if (idx !== -1) {
        users[idx] = updatedUser;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        notifyListeners();
    }
    if (db) await setDoc(doc(db, 'users', updatedUser.id), sanitizeForFirebase(updatedUser), { merge: true });
    return updatedUser;
  },

  deleteUser: async (id: string): Promise<void> => {
    const users = StorageService.getUsers().filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    notifyListeners();
    if (db) await deleteDoc(doc(db, 'users', id));
  },

  getCompanies: (): Company[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANIES) || '[]'),
  
  createCompany: async (company: Omit<Company, 'id'>): Promise<Company> => {
    const user = getCurrentUser();
    const timestamp = new Date().toISOString();
    const isAutoApproved = user?.role === UserRole.COORDINATOR || user?.is_jkwbl;

    const newCompany: Company = { 
      ...company, 
      id: generateId(), 
      is_approved: isAutoApproved,
      created_at: timestamp, 
      updated_at: timestamp 
    } as Company;

    const companies = StorageService.getCompanies();
    companies.push(newCompany);
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
    notifyListeners();

    if (db) await setDoc(doc(db, 'companies', newCompany.id), sanitizeForFirebase(newCompany));
    return newCompany;
  },

  bulkCreateCompanies: async (companies: Omit<Company, 'id'>[]): Promise<void> => {
    if (!hasSystemAccess()) throw new Error('Akses Ditolak.');
    if (companies.length === 0) return;
    
    const timestamp = new Date().toISOString();
    const existing = StorageService.getCompanies();
    const newItems = companies.map(c => ({
        ...c,
        id: generateId(),
        is_approved: true,
        created_at: timestamp,
        updated_at: timestamp
    }));

    // Update Local First
    const updatedTotal = [...existing, ...newItems];
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedTotal));
    notifyListeners();

    // Then Sync to Cloud
    if (db) {
        const batch = writeBatch(db);
        newItems.forEach(c => {
            batch.set(doc(db, 'companies', c.id), sanitizeForFirebase(c));
        });
        await batch.commit();
    }
  },

  bulkApproveCompanies: async (): Promise<void> => {
    if (!hasSystemAccess()) throw new Error('Akses Ditolak.');
    const companies = StorageService.getCompanies();
    const timestamp = new Date().toISOString();
    
    // Kemaskini LocalStorage dahulu untuk respon pantas
    const updatedCompanies = companies.map(c => ({
      ...c,
      is_approved: true,
      updated_at: timestamp
    }));
    
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies));
    notifyListeners();

    // Cuba kemaskini Cloud jika ada db
    if (db) {
        try {
            const batch = writeBatch(db);
            updatedCompanies.forEach(c => {
                batch.set(doc(db, 'companies', c.id), sanitizeForFirebase(c), { merge: true });
            });
            await batch.commit();
        } catch (e) {
            console.error("Gagal sinkron kelulusan ke cloud:", e);
        }
    }
  },

  repairCompanyData: async (): Promise<void> => {
    await StorageService.bulkApproveCompanies();
  },

  updateCompany: async (updatedCompany: Company): Promise<Company> => {
    const companies = StorageService.getCompanies();
    const idx = companies.findIndex(c => c.id === updatedCompany.id);
    if (idx !== -1) {
        companies[idx] = updatedCompany;
        localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
        notifyListeners();
    }
    if (db) await setDoc(doc(db, 'companies', updatedCompany.id), sanitizeForFirebase(updatedCompany), { merge: true });
    return updatedCompany;
  },

  deleteCompany: async (id: string): Promise<void> => {
    const companies = StorageService.getCompanies().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
    notifyListeners();
    if (db) await deleteDoc(doc(db, 'companies', id));
  },

  getApplications: (): Application[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]'),
  
  createApplication: async (app: Omit<Application, 'id'>): Promise<Application> => {
    const newApp = { ...app, id: generateId() };
    const apps = StorageService.getApplications();
    apps.push(newApp as Application);
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    notifyListeners();

    if (db) await setDoc(doc(db, 'applications', newApp.id), sanitizeForFirebase(newApp));
    return newApp as Application;
  },

  updateApplication: async (updatedApp: Application): Promise<Application> => {
    const apps = StorageService.getApplications();
    const idx = apps.findIndex(a => a.id === updatedApp.id);
    if (idx !== -1) {
        apps[idx] = updatedApp;
        localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
        notifyListeners();
    }
    if (db) await setDoc(doc(db, 'applications', updatedApp.id), sanitizeForFirebase(updatedApp), { merge: true });
    return updatedApp;
  },

  getFullSystemBackup: () => ({
    users: StorageService.getUsers(),
    companies: StorageService.getCompanies(),
    applications: StorageService.getApplications(),
    adConfig: StorageService.getAdConfig(),
    timestamp: new Date().toISOString()
  }),

  restoreFullSystem: (data: any) => {
    if (!hasSystemAccess()) throw new Error('Akses Ditolak.');
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users || []));
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(data.companies || []));
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(data.applications || []));
    if (data.adConfig) localStorage.setItem(STORAGE_KEYS.AD_CONFIG, JSON.stringify(data.adConfig));
    notifyListeners();
  }
};
