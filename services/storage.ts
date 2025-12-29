
import { User, Company, Application, UserRole } from '../types';
import { COORDINATOR_ACCOUNT } from '../constants';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, query, writeBatch } from 'firebase/firestore';

const STORAGE_KEYS = {
  USERS: 'wbl_users',
  COMPANIES: 'wbl_companies',
  APPLICATIONS: 'wbl_applications',
  SESSION: 'wbl_session'
};

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAPAspAMGl6eevn__-mc-EW8ZKGw9J09dY",
  authDomain: "wblfptt.firebaseapp.com",
  projectId: "wblfptt",
  storageBucket: "wblfptt.firebasestorage.app",
  messagingSenderId: "293839705020",
  appId: "1:293839705020:web:452106a8d873256fc711b9",
  measurementId: "G-DCP1822ZES"
};

// --- CLOUD SYNC SETUP ---
let db: any = null;
let unsubscribeListeners: (() => void)[] = [];

const initFirebase = () => {
  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    console.log('🔥 WBL Cloud Connected');
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
      localStorage.setItem(storageKey, JSON.stringify(data));
      notifyListeners(); 
    }, (error) => {
        console.error("Sync Error:", error);
    });
    unsubscribeListeners.push(unsub);
  };

  syncCollection('users', STORAGE_KEYS.USERS);
  syncCollection('companies', STORAGE_KEYS.COMPANIES);
  syncCollection('applications', STORAGE_KEYS.APPLICATIONS);
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

/**
 * Agresif Sanitization untuk Firebase
 * Firestore akan reject ralat 400 jika ada key bernilai 'undefined'.
 */
const sanitizeForFirebase = (obj: any) => {
    if (obj === null || typeof obj !== 'object') return obj;
    
    const clean: any = Array.isArray(obj) ? [] : {};
    
    Object.keys(obj).forEach(key => {
        const value = obj[key];
        // Tukar undefined kepada string kosong, kekalkan yang lain
        if (value === undefined) {
            clean[key] = "";
        } else if (value !== null && typeof value === 'object') {
            clean[key] = sanitizeForFirebase(value);
        } else {
            clean[key] = value;
        }
    });
    
    return clean;
};

const init = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.COMPANIES)) localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
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

  uploadLocalToCloud: async () => {
    if (!db) throw new Error('Cloud not connected');
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
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find((u: User) => u.username === username && u.password === password);
    if (user) {
      if (user.is_approved === false) throw new Error('Akaun masih menunggu kelulusan.');
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
      return user;
    }
    return null;
  },

  logout: () => localStorage.removeItem(STORAGE_KEYS.SESSION),
  getCurrentUser: (): User | null => {
    const session = localStorage.getItem(STORAGE_KEYS.SESSION);
    return session ? JSON.parse(session) : null;
  },

  getUsers: (): User[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),
  createUser: async (user: Omit<User, 'id'>): Promise<User> => {
    const users = StorageService.getUsers();
    if (users.some(u => u.username === user.username)) throw new Error('Username sudah wujud');
    const needsApproval = user.role === UserRole.TRAINER || (user.role === UserRole.SUPERVISOR && user.has_dual_role);
    const newUser = { ...user, id: generateId(), is_approved: !needsApproval };
    if (db) {
      await setDoc(doc(db, 'users', newUser.id), sanitizeForFirebase(newUser));
    } else {
      users.push(newUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      notifyListeners();
    }
    return newUser;
  },

  updateUser: async (updatedUser: User): Promise<User> => {
    const sanitized = sanitizeForFirebase(updatedUser);
    if (db) {
      await setDoc(doc(db, 'users', updatedUser.id), sanitized, { merge: true });
    } else {
      const users = StorageService.getUsers();
      const index = users.findIndex(u => u.id === updatedUser.id);
      if (index !== -1) {
        users[index] = updatedUser;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        notifyListeners();
      }
    }
    return updatedUser;
  },

  deleteUser: async (id: string): Promise<void> => {
    if (db) await deleteDoc(doc(db, 'users', id));
    else {
      const users = StorageService.getUsers().filter(u => u.id !== id);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      notifyListeners();
    }
  },

  getCompanies: (): Company[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANIES) || '[]'),
  createCompany: async (company: Omit<Company, 'id'>): Promise<Company> => {
    const newCompany = { ...company, id: generateId() };
    if (db) await setDoc(doc(db, 'companies', newCompany.id), sanitizeForFirebase(newCompany));
    else {
      const companies = StorageService.getCompanies();
      companies.push(newCompany);
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
      notifyListeners();
    }
    return newCompany;
  },

  bulkCreateCompanies: async (companies: Omit<Company, 'id'>[]): Promise<void> => {
    const sanitizedCompanies = companies.map(c => ({
      ...c,
      id: generateId(),
      has_mou: !!c.has_mou,
      created_at: c.created_at || new Date().toISOString()
    }));

    if (db) {
      const chunk = (arr: any[], size: number) => {
        const results = [];
        for (let i = 0; i < arr.length; i += size) results.push(arr.slice(i, i + size));
        return results;
      };

      const batches = chunk(sanitizedCompanies, 400); // Batch limit Firebase is 500
      for (const b of batches) {
        const writeBatchObj = writeBatch(db);
        b.forEach(comp => {
            const ref = doc(db, 'companies', comp.id);
            writeBatchObj.set(ref, sanitizeForFirebase(comp));
        });
        await writeBatchObj.commit();
      }
    } else {
      const existing = StorageService.getCompanies();
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify([...existing, ...sanitizedCompanies]));
      notifyListeners();
    }
  },

  updateCompany: async (updatedCompany: Company): Promise<Company> => {
    const sanitized = sanitizeForFirebase(updatedCompany);
    if (db) {
      try {
        await setDoc(doc(db, 'companies', updatedCompany.id), sanitized, { merge: true });
      } catch (e: any) {
        console.error("Firestore Update Error:", e);
        throw new Error(`Gagal mengemaskini di server: ${e.message}`);
      }
    } else {
      const companies = StorageService.getCompanies();
      const index = companies.findIndex(c => c.id === updatedCompany.id);
      if (index !== -1) {
        companies[index] = updatedCompany;
        localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
        notifyListeners();
      }
    }
    return updatedCompany;
  },

  deleteCompany: async (id: string): Promise<void> => {
    if (db) await deleteDoc(doc(db, 'companies', id));
    else {
      const filtered = StorageService.getCompanies().filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(filtered));
      notifyListeners();
    }
  },

  getApplications: (): Application[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]'),
  createApplication: async (app: Omit<Application, 'id'>): Promise<Application> => {
    const newApp = { ...app, id: generateId() };
    if (db) await setDoc(doc(db, 'applications', newApp.id), sanitizeForFirebase(newApp));
    else {
      const apps = StorageService.getApplications();
      apps.push(newApp);
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
      notifyListeners();
    }
    return newApp;
  },

  updateApplication: async (updatedApp: Application): Promise<Application> => {
    const sanitized = sanitizeForFirebase(updatedApp);
    if (db) await setDoc(doc(db, 'applications', updatedApp.id), sanitized, { merge: true });
    else {
      const apps = StorageService.getApplications();
      const index = apps.findIndex(a => a.id === updatedApp.id);
      if (index !== -1) {
        apps[index] = updatedApp;
        localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
        notifyListeners();
      }
    }
    return updatedApp;
  },

  getFullSystemBackup: () => ({
    users: StorageService.getUsers(),
    companies: StorageService.getCompanies(),
    applications: StorageService.getApplications(),
    timestamp: new Date().toISOString(),
    version: '3.1'
  }),

  restoreFullSystem: (data: any) => {
    if (!data.users || !data.companies || !data.applications) throw new Error('Fail tidak sah');
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(data.companies));
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(data.applications));
    notifyListeners();
  }
};
