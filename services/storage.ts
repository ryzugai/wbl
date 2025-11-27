
import { User, Company, Application } from '../types';
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

// Real-time listeners: Firestore -> LocalStorage -> UI
const setupRealtimeListeners = () => {
  if (!db) return;

  // Clear old listeners
  unsubscribeListeners.forEach(unsub => unsub());
  unsubscribeListeners = [];

  // Helper to sync collection
  const syncCollection = (colName: string, storageKey: string) => {
    const q = query(collection(db, colName));
    const unsub = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data());
      });
      // Update Local Storage (Cache)
      localStorage.setItem(storageKey, JSON.stringify(data));
      // Notify UI
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

// --- LOCAL EVENT BUS ---
const listeners: (() => void)[] = [];
const notifyListeners = () => {
  listeners.forEach(l => l());
};

// Safe ID Generator
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Init Default Data
const init = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMPANIES)) {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
  }
  // Initialize Cloud automatically
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

  // --- CLOUD MIGRATION TOOL ---
  uploadLocalToCloud: async () => {
    if (!db) throw new Error('Cloud not connected');
    
    const batch = writeBatch(db);
    const users = StorageService.getUsers();
    const companies = StorageService.getCompanies();
    const apps = StorageService.getApplications();

    // Filter out hardcoded admin to avoid overwriting if not needed, or include strictly
    users.forEach(u => {
        if(u.id) batch.set(doc(db, 'users', u.id), u);
    });
    companies.forEach(c => {
        if(c.id) batch.set(doc(db, 'companies', c.id), c);
    });
    apps.forEach(a => {
        if(a.id) batch.set(doc(db, 'applications', a.id), a);
    });

    await batch.commit();
  },

  // --- AUTH ---
  login: async (username: string, password: string): Promise<User | null> => {
    if (username === COORDINATOR_ACCOUNT.username && password === COORDINATOR_ACCOUNT.password) {
      const user = COORDINATOR_ACCOUNT as unknown as User;
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
      return user;
    }
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find((u: User) => u.username === username && u.password === password);
    if (user) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
      return user;
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  getCurrentUser: (): User | null => {
    const session = localStorage.getItem(STORAGE_KEYS.SESSION);
    return session ? JSON.parse(session) : null;
  },

  // --- USERS ---
  getUsers: (): User[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),

  createUser: async (user: Omit<User, 'id'>): Promise<User> => {
    const users = StorageService.getUsers();
    if (users.some(u => u.username === user.username)) throw new Error('Username already exists');
    
    const newUser = { ...user, id: generateId() };
    
    if (db) {
      await setDoc(doc(db, 'users', newUser.id), newUser);
    } else {
      users.push(newUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      notifyListeners();
    }
    return newUser;
  },

  updateUser: async (updatedUser: User): Promise<User> => {
    if (updatedUser.id === COORDINATOR_ACCOUNT.id) return updatedUser;

    if (db) {
      await setDoc(doc(db, 'users', updatedUser.id), updatedUser, { merge: true });
    } else {
      const users = StorageService.getUsers();
      const index = users.findIndex(u => u.id === updatedUser.id);
      if (index !== -1) {
        users[index] = updatedUser;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        notifyListeners();
      }
    }
    
    // Update session if needed
    const currentUser = StorageService.getCurrentUser();
    if (currentUser && currentUser.id === updatedUser.id) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedUser));
    }
    return updatedUser;
  },

  // --- COMPANIES ---
  getCompanies: (): Company[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANIES) || '[]'),

  createCompany: async (company: Omit<Company, 'id'>): Promise<Company> => {
    const newCompany = { ...company, id: generateId() };
    if (db) {
      await setDoc(doc(db, 'companies', newCompany.id), newCompany);
    } else {
      const companies = StorageService.getCompanies();
      companies.push(newCompany);
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
      notifyListeners();
    }
    return newCompany;
  },

  // NEW: Bulk Create for efficient uploads
  bulkCreateCompanies: async (companies: Omit<Company, 'id'>[]): Promise<void> => {
    const companiesWithIds = companies.map(c => ({ ...c, id: generateId() }));

    if (db) {
      // Firestore batch limit is 500
      const chunkArray = (arr: any[], size: number) => {
        const results = [];
        while (arr.length) {
          results.push(arr.splice(0, size));
        }
        return results;
      };

      const chunks = chunkArray([...companiesWithIds], 450); // 450 to be safe

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((company: any) => {
          const ref = doc(db, 'companies', company.id);
          batch.set(ref, company);
        });
        await batch.commit();
      }
    } else {
      const existing = StorageService.getCompanies();
      const updated = [...existing, ...companiesWithIds];
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updated));
      notifyListeners();
    }
  },

  updateCompany: async (updatedCompany: Company): Promise<Company> => {
    if (db) {
      await setDoc(doc(db, 'companies', updatedCompany.id), updatedCompany, { merge: true });
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
    if (db) {
      await deleteDoc(doc(db, 'companies', id));
    } else {
      const companies = StorageService.getCompanies();
      const filtered = companies.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(filtered));
      notifyListeners();
    }
  },

  // --- APPLICATIONS ---
  getApplications: (): Application[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]'),

  createApplication: async (app: Omit<Application, 'id'>): Promise<Application> => {
    const newApp = { ...app, id: generateId() };
    if (db) {
      await setDoc(doc(db, 'applications', newApp.id), newApp);
    } else {
      const apps = StorageService.getApplications();
      apps.push(newApp);
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
      notifyListeners();
    }
    return newApp;
  },

  updateApplication: async (updatedApp: Application): Promise<Application> => {
    if (db) {
      await setDoc(doc(db, 'applications', updatedApp.id), updatedApp, { merge: true });
    } else {
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

  // --- BACKUP/RESTORE (Manual) ---
  getFullSystemBackup: () => {
    return {
      users: JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),
      companies: JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANIES) || '[]'),
      applications: JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]'),
      timestamp: new Date().toISOString(),
      version: '3.0'
    };
  },

  restoreFullSystem: (data: any) => {
    if (!data.users || !data.companies || !data.applications) throw new Error('Format fail tidak sah');
    
    // Restore to local storage
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(data.companies));
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(data.applications));
    notifyListeners();
  }
};
