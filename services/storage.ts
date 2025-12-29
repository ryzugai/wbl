
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

// Sanitization Helper to remove undefined values for Firebase
const sanitizeForFirebase = (obj: any) => {
    const clean: any = {};
    Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined) {
            clean[key] = obj[key];
        }
    });
    return clean;
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

    users.forEach(u => {
        if(u.id) batch.set(doc(db, 'users', u.id), sanitizeForFirebase(u));
    });
    companies.forEach(c => {
        if(c.id) batch.set(doc(db, 'companies', c.id), sanitizeForFirebase(c));
    });
    apps.forEach(a => {
        if(a.id) batch.set(doc(db, 'applications', a.id), sanitizeForFirebase(a));
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
      // Check for approval (Strict check against false, undefined implies approved for legacy users)
      if (user.is_approved === false) {
          throw new Error('Akaun anda masih dalam proses pengesahan oleh Penyelaras.');
      }
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
    
    // Determine Approval Status
    // Trainers or Supervisors acting as Trainers need approval.
    // Pure Supervisors do not.
    const needsApproval = user.role === UserRole.TRAINER || (user.role === UserRole.SUPERVISOR && user.has_dual_role);

    const newUser = { 
        ...user, 
        id: generateId(),
        is_approved: needsApproval ? false : true 
    };
    
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
    if (updatedUser.id === COORDINATOR_ACCOUNT.id) return updatedUser;

    const sanitizedUser = sanitizeForFirebase(updatedUser);

    if (db) {
      await setDoc(doc(db, 'users', updatedUser.id), sanitizedUser, { merge: true });
    } else {
      const users = StorageService.getUsers();
      const index = users.findIndex(u => u.id === updatedUser.id);
      if (index !== -1) {
        users[index] = updatedUser;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        notifyListeners();
      }
    }
    
    const currentUser = StorageService.getCurrentUser();
    if (currentUser && currentUser.id === updatedUser.id) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedUser));
    }
    return updatedUser;
  },

  deleteUser: async (id: string): Promise<void> => {
    if (db) {
      await deleteDoc(doc(db, 'users', id));
    } else {
      const users = StorageService.getUsers();
      const filtered = users.filter(u => u.id !== id);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
      notifyListeners();
    }
  },

  // --- COMPANIES ---
  getCompanies: (): Company[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANIES) || '[]'),

  createCompany: async (company: Omit<Company, 'id'>): Promise<Company> => {
    const newCompany = { ...company, id: generateId() };
    if (db) {
      await setDoc(doc(db, 'companies', newCompany.id), sanitizeForFirebase(newCompany));
    } else {
      const companies = StorageService.getCompanies();
      companies.push(newCompany);
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
      notifyListeners();
    }
    return newCompany;
  },

  bulkCreateCompanies: async (companies: Omit<Company, 'id'>[]): Promise<void> => {
    const sanitizedCompanies = companies.map(c => ({
      id: generateId(),
      company_name: c.company_name || '',
      company_district: c.company_district || '',
      company_state: c.company_state || '',
      company_address: c.company_address || '',
      company_industry: c.company_industry || '',
      company_contact_person: c.company_contact_person || '',
      company_contact_email: c.company_contact_email || '',
      company_contact_phone: c.company_contact_phone || '',
      has_mou: !!c.has_mou,
      mou_type: c.mou_type || null,
      created_at: new Date().toISOString()
    }));

    if (db) {
      const chunkArray = (arr: any[], size: number) => {
        const results = [];
        while (arr.length) {
          results.push(arr.splice(0, size));
        }
        return results;
      };

      const chunks = chunkArray([...sanitizedCompanies], 250);

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((company: any) => {
          const ref = doc(db, 'companies', company.id);
          batch.set(ref, sanitizeForFirebase(company));
        });
        await batch.commit();
      }
    } else {
      const existing = StorageService.getCompanies();
      const updated = [...existing, ...sanitizedCompanies];
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updated));
      notifyListeners();
    }
  },

  updateCompany: async (updatedCompany: Company): Promise<Company> => {
    const sanitized = sanitizeForFirebase(updatedCompany);
    
    if (db) {
      await setDoc(doc(db, 'companies', updatedCompany.id), sanitized, { merge: true });
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
      await setDoc(doc(db, 'applications', newApp.id), sanitizeForFirebase(newApp));
    } else {
      const apps = StorageService.getApplications();
      apps.push(newApp);
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
      notifyListeners();
    }
    return newApp;
  },

  updateApplication: async (updatedApp: Application): Promise<Application> => {
    const sanitized = sanitizeForFirebase(updatedApp);
    
    if (db) {
      await setDoc(doc(db, 'applications', updatedApp.id), sanitized, { merge: true });
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
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(data.companies));
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(data.applications));
    notifyListeners();
  }
};
