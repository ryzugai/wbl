
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
      localStorage.setItem(storageKey, JSON.stringify(data));
      notifyListeners(); 
    }, (error) => {
        console.error(`Sync Error for ${colName}:`, error);
    });
    unsubscribeListeners.push(unsub);
  };

  syncCollection('users', STORAGE_KEYS.USERS);
  syncCollection('companies', STORAGE_KEYS.COMPANIES);
  syncCollection('applications', STORAGE_KEYS.APPLICATIONS);
  
  // Sync Ad Config
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
  
  // Migrasi data lama jika perlu atau set default baru
  const rawAd = localStorage.getItem(STORAGE_KEYS.AD_CONFIG);
  if (!rawAd) {
    localStorage.setItem(STORAGE_KEYS.AD_CONFIG, JSON.stringify({ items: [], isEnabled: false }));
  } else {
    try {
      const parsed = JSON.parse(rawAd);
      // Jika masih format lama (string imageUrl), tukar ke format baru
      if (parsed.imageUrl !== undefined) {
        localStorage.setItem(STORAGE_KEYS.AD_CONFIG, JSON.stringify({ 
          items: parsed.imageUrl ? [{ id: 'legacy', imageUrl: parsed.imageUrl, destinationUrl: parsed.destinationUrl || '' }] : [], 
          isEnabled: parsed.isEnabled || false 
        }));
      }
    } catch(e) {}
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
    const defaultVal = { items: [], isEnabled: false };
    if (!data) return defaultVal;
    try {
      const parsed = JSON.parse(data);
      // Safety check for legacy formats
      if (parsed.items) return parsed;
      if (parsed.imageUrl) return { items: [{ id: 'migrated', imageUrl: parsed.imageUrl, destinationUrl: parsed.destinationUrl || '' }], isEnabled: parsed.isEnabled };
      return defaultVal;
    } catch(e) {
      return defaultVal;
    }
  },

  updateAdConfig: async (config: AdConfig): Promise<void> => {
    if (!isCoordinator()) throw new Error('Hanya Penyelaras boleh mengemaskini iklan.');
    if (db) {
      await setDoc(doc(db, 'settings', 'ad_config'), sanitizeForFirebase(config));
    } else {
      localStorage.setItem(STORAGE_KEYS.AD_CONFIG, JSON.stringify(config));
      notifyListeners();
    }
  },

  uploadLocalToCloud: async () => {
    if (!hasSystemAccess()) throw new Error('Akses Ditolak: Hanya Penyelaras atau JKWBL boleh memuat naik data ke Cloud.');
    if (!db) throw new Error('Cloud tidak disambungkan');
    const batch = writeBatch(db);
    StorageService.getUsers().forEach(u => u.id && batch.set(doc(db, 'users', u.id), sanitizeForFirebase(u)));
    StorageService.getCompanies().forEach(c => c.id && batch.set(doc(db, 'companies', c.id), sanitizeForFirebase(c)));
    StorageService.getApplications().forEach(a => a.id && batch.set(doc(db, 'applications', a.id), sanitizeForFirebase(a)));
    
    batch.set(doc(db, 'settings', 'ad_config'), sanitizeForFirebase(StorageService.getAdConfig()));
    
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
  getCurrentUser,

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
    const current = getCurrentUser();
    const isSelf = current?.id === updatedUser.id;
    
    if (!isCoordinator() && !isSelf) {
        throw new Error('Akses Ditolak: Hanya Penyelaras boleh mengemaskini maklumat pengguna lain.');
    }
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
    if (!isCoordinator()) throw new Error('Akses Ditolak: Hanya Penyelaras boleh memadam akaun.');
    if (db) await deleteDoc(doc(db, 'users', id));
    else {
      const users = StorageService.getUsers().filter(u => u.id !== id);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      notifyListeners();
    }
  },

  getCompanies: (): Company[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANIES) || '[]'),
  
  createCompany: async (company: Omit<Company, 'id'>): Promise<Company> => {
    if (!hasSystemAccess()) throw new Error('Akses Ditolak: Hanya Penyelaras atau JKWBL boleh menambah syarikat.');
    const timestamp = new Date().toISOString();
    const newCompany = { ...company, id: generateId(), created_at: timestamp, updated_at: timestamp };
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
    if (!hasSystemAccess()) throw new Error('Akses Ditolak: Hanya Penyelaras atau JKWBL boleh melakukan upload pukal.');
    if (companies.length === 0) return;
    
    const timestamp = new Date().toISOString();
    const sanitizedCompanies = companies.map(c => ({
      ...c,
      id: generateId(),
      has_mou: !!c.has_mou,
      mou_type: c.has_mou ? (c.mou_type || 'MoU') : null,
      created_at: c.created_at || timestamp,
      updated_at: timestamp
    }));

    if (db) {
      const chunk = (arr: any[], size: number) => {
        const results = [];
        for (let i = 0; i < arr.length; i += size) results.push(arr.slice(i, i + size));
        return results;
      };

      const batches = chunk(sanitizedCompanies, 200); 
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
    if (!hasSystemAccess()) {
        throw new Error('Akses Ditolak: Anda tidak mempunyai kebenaran untuk menyimpan data ke database.');
    }

    const timestamp = new Date().toISOString();
    const dataToSave = { ...updatedCompany, updated_at: timestamp };
    const { id, ...dataToUpdate } = dataToSave;
    const sanitizedData = sanitizeForFirebase(dataToUpdate);

    if (db) {
      try {
        const docRef = doc(db, 'companies', id);
        await updateDoc(docRef, sanitizedData);
      } catch (e: any) {
        console.error("Firebase Update Error:", e);
        if (e.code === 'permission-denied') {
            throw new Error("Ralat Firebase: Insufficient Permissions. Sila pastikan Rules di Console telah ditetapkan kepada 'allow read, write: if true' untuk sementara waktu.");
        }
        await setDoc(doc(db, 'companies', id), sanitizeForFirebase(dataToSave), { merge: true });
      }
    } else {
      const companies = StorageService.getCompanies();
      const index = companies.findIndex(c => c.id === id);
      if (index !== -1) {
        companies[index] = dataToSave;
        localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
        notifyListeners();
      }
    }
    return dataToSave;
  },

  deleteCompany: async (id: string): Promise<void> => {
    if (!hasSystemAccess()) throw new Error('Akses Ditolak: Hanya Penyelaras atau JKWBL boleh memadam syarikat.');
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
    adConfig: StorageService.getAdConfig(),
    timestamp: new Date().toISOString(),
    version: '4.0'
  }),

  restoreFullSystem: (data: any) => {
    if (!hasSystemAccess()) throw new Error('Hanya Penyelaras atau JKWBL boleh melakukan operasi Restore.');
    if (!data.users || !data.companies || !data.applications) throw new Error('Fail tidak sah.');
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(data.companies));
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(data.applications));
    if (data.adConfig) localStorage.setItem(STORAGE_KEYS.AD_CONFIG, JSON.stringify(data.adConfig));
    notifyListeners();
  }
};
