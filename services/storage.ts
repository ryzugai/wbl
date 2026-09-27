
import { User, Company, Application, UserRole, AdConfig, UserActivity, Notification, WeeklyLogbook, DailyLogEntry } from '../types';
import { COORDINATOR_ACCOUNT } from '../constants';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, writeBatch, getDoc } from 'firebase/firestore';
import { IDBDocStorage } from './idbStorage';

const STORAGE_KEYS = {
  USERS: 'wbl_users',
  COMPANIES: 'wbl_companies',
  APPLICATIONS: 'wbl_applications',
  SESSION: 'wbl_session',
  AD_CONFIG: 'wbl_ad_config',
  ACTIVITIES: 'wbl_activities',
  NOTIFICATIONS: 'wbl_notifications',
  LOGBOOKS: 'wbl_weekly_logbooks'
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
let inMemoryUsers: User[] = [];
let inMemoryApplications: Application[] = [];
let inMemoryLogbooks: WeeklyLogbook[] = [];

const stripHeavyFields = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = { ...obj };
  if (typeof clone.application_letter_image === 'string' && clone.application_letter_image.length > 50000) {
    clone.application_letter_image = 'idb_stored';
  }
  if (typeof clone.reply_form_image === 'string' && clone.reply_form_image.length > 50000) {
    clone.reply_form_image = 'idb_stored';
  }
  if (typeof clone.offer_letter_image === 'string' && clone.offer_letter_image.length > 50000) {
    clone.offer_letter_image = 'idb_stored';
  }
  if (typeof clone.profile_image === 'string' && clone.profile_image.length > 5000) {
    clone.profile_image = 'idb_stored';
  }
  return clone;
};

const safeSaveLocalStorage = (key: string, data: any) => {
  try {
    let payload = data;
    if (Array.isArray(data)) {
      payload = data.map(item => stripHeavyFields(item));
    } else if (data && typeof data === 'object') {
      payload = stripHeavyFields(data);
    }
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (e) {
    console.warn(`localStorage quota exceeded for ${key}, running aggressive quota relief:`, e);
    try {
      // 1. Trim activities in storage to 25 items
      try {
        const rawActs = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
        if (rawActs) {
          const acts = JSON.parse(rawActs);
          if (acts.length > 25) {
            localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(acts.slice(0, 25)));
          }
        }
      } catch {}

      // 2. Trim notifications in storage to 25 items
      try {
        const rawNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
        if (rawNotifs) {
          const notifs = JSON.parse(rawNotifs);
          if (notifs.length > 25) {
            localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs.slice(0, 25)));
          }
        }
      } catch {}

      // 3. Offload any heavy user profile image from data to IDB if saving USERS
      let stripped = data;
      if (Array.isArray(data)) {
        stripped = data.map(item => {
          const s = stripHeavyFields(item);
          if (s.profile_image && s.profile_image.length > 200) {
            IDBDocStorage.saveDocument(`${s.id}_profile_image`, s.profile_image).catch(() => {});
            s.profile_image = 'idb_stored';
          }
          return s;
        });
      } else if (data && typeof data === 'object') {
        stripped = stripHeavyFields(data);
      }

      localStorage.setItem(key, JSON.stringify(stripped));
    } catch (err2) {
      console.warn(`Secondary quota relief failed for ${key}, executing emergency cleanup:`, err2);
      try {
        localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
        localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);

        let minimal = data;
        if (Array.isArray(data)) {
          minimal = data.map(item => {
            const s = stripHeavyFields(item);
            if (s.profile_image) s.profile_image = 'idb_stored';
            return s;
          });
        }
        localStorage.setItem(key, JSON.stringify(minimal));
      } catch (err3) {
        console.error(`Emergency save failed for ${key}. Data retained in memory:`, err3);
      }
    }
  }
};

const hydrateUsersFromIDB = async () => {
  try {
    const docs = await IDBDocStorage.getAllDocuments();
    let updated = false;
    inMemoryUsers = inMemoryUsers.map(user => {
      let userCopy = { ...user };
      const profileKey = `${user.id}_profile_image`;
      if (docs[profileKey] && (!userCopy.profile_image || userCopy.profile_image === 'idb_stored')) {
        userCopy.profile_image = docs[profileKey];
        updated = true;
      }
      return userCopy;
    });
    if (updated) {
      notifyListeners();
    }
  } catch (err) {
    console.warn('Failed to hydrate users from IndexedDB:', err);
  }
};

const cleanAndMigrateLocalStorage = async () => {
  try {
    const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (rawUsers) {
      const users: User[] = JSON.parse(rawUsers);
      let modified = false;
      for (const u of users) {
        if (u.profile_image && u.profile_image.startsWith('data:') && u.profile_image.length > 5000) {
          try {
            await IDBDocStorage.saveDocument(`${u.id}_profile_image`, u.profile_image);
            u.profile_image = 'idb_stored';
            modified = true;
          } catch (e) {
            console.warn('Failed to migrate user photo to IDB:', e);
          }
        }
      }
      if (modified) {
        safeSaveLocalStorage(STORAGE_KEYS.USERS, users);
      }
    }
  } catch (e) {
    console.warn('cleanAndMigrateLocalStorage error:', e);
  }

  try {
    const rawActs = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    if (rawActs) {
      const acts = JSON.parse(rawActs);
      if (acts.length > 40) {
        safeSaveLocalStorage(STORAGE_KEYS.ACTIVITIES, acts.slice(0, 40));
      }
    }
  } catch {}

  try {
    const rawNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (rawNotifs) {
      const notifs = JSON.parse(rawNotifs);
      if (notifs.length > 40) {
        safeSaveLocalStorage(STORAGE_KEYS.NOTIFICATIONS, notifs.slice(0, 40));
      }
    }
  } catch {}
};

const hydrateAppsFromIDB = async () => {
  try {
    const docs = await IDBDocStorage.getAllDocuments();
    let updated = false;
    inMemoryApplications = inMemoryApplications.map(app => {
      let appCopy = { ...app };
      const appLetKey = `${app.id}_app_letter`;
      const replyKey = `${app.id}_reply_form`;
      const offerKey = `${app.id}_offer_letter`;

      if (docs[appLetKey] && (!appCopy.application_letter_image || appCopy.application_letter_image === 'idb_stored')) {
        appCopy.application_letter_image = docs[appLetKey];
        updated = true;
      }
      if (docs[replyKey] && (!appCopy.reply_form_image || appCopy.reply_form_image === 'idb_stored')) {
        appCopy.reply_form_image = docs[replyKey];
        updated = true;
      }
      if (docs[offerKey] && (!appCopy.offer_letter_image || appCopy.offer_letter_image === 'idb_stored')) {
        appCopy.offer_letter_image = docs[offerKey];
        updated = true;
      }
      return appCopy;
    });
    if (updated) {
      notifyListeners();
    }
  } catch (err) {
    console.warn('Failed to hydrate apps from IndexedDB:', err);
  }
};

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
      if (!snapshot.empty || snapshot.metadata.fromCache === false) {
        if (colName === 'users') {
          const firestoreUsers = data as User[];
          inMemoryUsers = firestoreUsers.map(fUser => {
            const localUser = inMemoryUsers.find(u => u.id === fUser.id);
            return {
              ...fUser,
              profile_image: (fUser.profile_image && fUser.profile_image !== 'idb_stored') ? fUser.profile_image : localUser?.profile_image,
            };
          });
          safeSaveLocalStorage(storageKey, inMemoryUsers);
        } else if (colName === 'applications') {
          const firestoreApps = data as Application[];
          inMemoryApplications = firestoreApps.map(fApp => {
            const localApp = inMemoryApplications.find(a => a.id === fApp.id);
            return {
              ...fApp,
              application_letter_image: (fApp.application_letter_image && fApp.application_letter_image !== 'idb_stored') ? fApp.application_letter_image : localApp?.application_letter_image,
              reply_form_image: (fApp.reply_form_image && fApp.reply_form_image !== 'idb_stored') ? fApp.reply_form_image : localApp?.reply_form_image,
              offer_letter_image: (fApp.offer_letter_image && fApp.offer_letter_image !== 'idb_stored') ? fApp.offer_letter_image : localApp?.offer_letter_image,
            };
          });
          safeSaveLocalStorage(storageKey, inMemoryApplications);
        } else {
          safeSaveLocalStorage(storageKey, data);
        }
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
  syncCollection('activities', STORAGE_KEYS.ACTIVITIES);
  syncCollection('notifications', STORAGE_KEYS.NOTIFICATIONS);
  syncCollection('weekly_logbooks', STORAGE_KEYS.LOGBOOKS);
  
  const unsubAd = onSnapshot(doc(db, 'settings', 'ad_config'), (snapshot) => {
    if (snapshot.exists()) {
      safeSaveLocalStorage(STORAGE_KEYS.AD_CONFIG, snapshot.data());
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
  try {
    const session = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!session) return null;
    const user = JSON.parse(session);
    if (user && user.profile_image === 'idb_stored') {
      const full = inMemoryUsers.find(u => u.id === user.id);
      if (full?.profile_image && full.profile_image !== 'idb_stored') {
        user.profile_image = full.profile_image;
      }
    }
    return user;
  } catch {
    return null;
  }
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
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) safeSaveLocalStorage(STORAGE_KEYS.USERS, []);
  if (!localStorage.getItem(STORAGE_KEYS.COMPANIES)) safeSaveLocalStorage(STORAGE_KEYS.COMPANIES, []);
  if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) safeSaveLocalStorage(STORAGE_KEYS.APPLICATIONS, []);
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) safeSaveLocalStorage(STORAGE_KEYS.NOTIFICATIONS, []);
  if (!localStorage.getItem(STORAGE_KEYS.LOGBOOKS)) safeSaveLocalStorage(STORAGE_KEYS.LOGBOOKS, []);
  
  const rawAd = localStorage.getItem(STORAGE_KEYS.AD_CONFIG);
  if (!rawAd) {
    safeSaveLocalStorage(STORAGE_KEYS.AD_CONFIG, { items: [], isEnabled: false });
  }

  try {
    inMemoryUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  } catch {
    inMemoryUsers = [];
  }

  try {
    inMemoryApplications = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]');
  } catch {
    inMemoryApplications = [];
  }

  try {
    inMemoryLogbooks = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGBOOKS) || '[]');
  } catch {
    inMemoryLogbooks = [];
  }

  cleanAndMigrateLocalStorage();
  hydrateUsersFromIDB();
  hydrateAppsFromIDB();

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
    safeSaveLocalStorage(STORAGE_KEYS.AD_CONFIG, config);
    notifyListeners();
  },

  uploadLocalToCloud: async () => {
    if (!hasSystemAccess()) throw new Error('Akses Ditolak.');
    if (!db) throw new Error('Cloud tidak disambungkan');
    const batch = writeBatch(db);
    StorageService.getUsers().forEach(u => u.id && batch.set(doc(db, 'users', u.id), sanitizeForFirebase(u)));
    StorageService.getCompanies().forEach(c => c.id && batch.set(doc(db, 'companies', c.id), sanitizeForFirebase(c)));
    StorageService.getApplications().forEach(a => {
      if (a.id) {
        const payload = stripHeavyFields(a);
        batch.set(doc(db, 'applications', a.id), sanitizeForFirebase(payload));
      }
    });
    await batch.commit();
  },

  login: async (username: string, password: string): Promise<User | null> => {
    if (username === COORDINATOR_ACCOUNT.username && password === COORDINATOR_ACCOUNT.password) {
      const user = {
        ...COORDINATOR_ACCOUNT,
        last_login_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      } as unknown as User;
      safeSaveLocalStorage(STORAGE_KEYS.SESSION, user);
      
      try {
        await StorageService.logActivity(
          user.id || 'coordinator-id',
          user.username,
          user.role,
          user.name,
          'login',
          'Telah log masuk ke dalam sistem.',
          'Logged into the system.'
        );
      } catch (e) {
        console.warn('Failed to log coordinator login:', e);
      }
      
      return user;
    }
    const users = StorageService.getUsers();
    const userIdx = users.findIndex((u: User) => u.username === username && u.password === password);
    if (userIdx !== -1) {
      const user = users[userIdx];
      if (user.is_approved === false) throw new Error('Akaun masih menunggu kelulusan.');
      
      user.last_login_at = new Date().toISOString();
      user.last_activity_at = new Date().toISOString();
      inMemoryUsers[userIdx] = user;
      safeSaveLocalStorage(STORAGE_KEYS.USERS, inMemoryUsers);
      safeSaveLocalStorage(STORAGE_KEYS.SESSION, stripHeavyFields(user));
      
      if (db) {
        try {
          await setDoc(doc(db, 'users', user.id), sanitizeForFirebase(stripHeavyFields(user)), { merge: true });
        } catch (e) {
          console.warn('Firebase login sync notice:', e);
        }
      }
      
      try {
        await StorageService.logActivity(
          user.id,
          user.username,
          user.role,
          user.name,
          'login',
          'Telah log masuk ke dalam sistem.',
          'Logged into the system.'
        );
      } catch (e) {
        console.warn('Failed to log user login:', e);
      }
      
      notifyListeners();
      return user;
    }
    return null;
  },

  logout: () => localStorage.removeItem(STORAGE_KEYS.SESSION),
  getCurrentUser,

  getUsers: (): User[] => {
    if (inMemoryUsers && inMemoryUsers.length > 0) {
      return inMemoryUsers;
    }
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      inMemoryUsers = data;
      return inMemoryUsers;
    } catch {
      return [];
    }
  },
  
  createUser: async (user: Omit<User, 'id'>): Promise<User> => {
    const users = StorageService.getUsers();
    if (users.some(u => u.username === user.username)) throw new Error('Username sudah wujud');
    const newUser = { ...user, id: generateId(), is_approved: user.role === UserRole.STUDENT } as User;
    
    if (newUser.profile_image && newUser.profile_image !== 'idb_stored') {
      if (newUser.profile_image.length > 5000) {
        await IDBDocStorage.saveDocument(`${newUser.id}_profile_image`, newUser.profile_image);
      }
    }

    inMemoryUsers.push(newUser);
    safeSaveLocalStorage(STORAGE_KEYS.USERS, inMemoryUsers);
    notifyListeners();

    if (db) {
      try {
        const firebaseUser = stripHeavyFields(newUser);
        await setDoc(doc(db, 'users', newUser.id), sanitizeForFirebase(firebaseUser));
      } catch (e) {
        console.warn('Firebase create user sync notice:', e);
      }
    }
    return newUser as User;
  },

  updateUser: async (updatedUser: User): Promise<User> => {
    updatedUser.last_activity_at = new Date().toISOString();

    if (updatedUser.profile_image && updatedUser.profile_image !== 'idb_stored') {
      if (updatedUser.profile_image.length > 5000) {
        await IDBDocStorage.saveDocument(`${updatedUser.id}_profile_image`, updatedUser.profile_image);
      }
    } else if (!updatedUser.profile_image) {
      await IDBDocStorage.deleteDocument(`${updatedUser.id}_profile_image`);
    }

    const idx = inMemoryUsers.findIndex(u => u.id === updatedUser.id);
    if (idx !== -1) {
      inMemoryUsers[idx] = updatedUser;
    } else {
      inMemoryUsers.push(updatedUser);
    }
    safeSaveLocalStorage(STORAGE_KEYS.USERS, inMemoryUsers);
    notifyListeners();

    if (db) {
      try {
        const firebaseUser = stripHeavyFields(updatedUser);
        await setDoc(doc(db, 'users', updatedUser.id), sanitizeForFirebase(firebaseUser), { merge: true });
      } catch (e) {
        console.warn('Firebase user sync notice:', e);
      }
    }
    
    const curSession = getCurrentUser();
    if (curSession && curSession.id === updatedUser.id) {
      safeSaveLocalStorage(STORAGE_KEYS.SESSION, stripHeavyFields(updatedUser));
    }

    // Identify update type for elegant logging
    let actType = 'profile_update';
    let msgMs = 'Telah mengemaskini maklumat profil.';
    let msgEn = 'Updated profile information.';

    if (updatedUser.role === UserRole.STUDENT) {
      msgMs = 'Telah mengemaskini maklumat pelajar / resume.';
      msgEn = 'Updated student/resume information.';
    } else if (updatedUser.role === UserRole.LECTURER) {
      msgMs = 'Telah mengemaskini maklumat pensyarah.';
      msgEn = 'Updated lecturer information.';
    }

    try {
      await StorageService.logActivity(
        updatedUser.id,
        updatedUser.username,
        updatedUser.role,
        updatedUser.name,
        actType,
        msgMs,
        msgEn
      );
    } catch (e) {
      console.warn('Failed to log update user activity:', e);
    }

    return updatedUser;
  },

  deleteUser: async (id: string): Promise<void> => {
    inMemoryUsers = inMemoryUsers.filter(u => u.id !== id);
    safeSaveLocalStorage(STORAGE_KEYS.USERS, inMemoryUsers);
    await IDBDocStorage.deleteDocument(`${id}_profile_image`);
    notifyListeners();
    if (db) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (e) {
        console.warn('Firebase delete user notice:', e);
      }
    }
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
    safeSaveLocalStorage(STORAGE_KEYS.COMPANIES, companies);
    notifyListeners();

    if (db) await setDoc(doc(db, 'companies', newCompany.id), sanitizeForFirebase(newCompany));

    if (user) {
      user.last_activity_at = timestamp;
      const users = StorageService.getUsers();
      const uIdx = users.findIndex(u => u.id === user.id);
      if (uIdx !== -1) {
        users[uIdx] = user;
        safeSaveLocalStorage(STORAGE_KEYS.USERS, users);
      }
      safeSaveLocalStorage(STORAGE_KEYS.SESSION, stripHeavyFields(user));
      if (db) {
        await setDoc(doc(db, 'users', user.id), sanitizeForFirebase(stripHeavyFields(user)), { merge: true });
      }
      
      try {
        await StorageService.logActivity(
          user.id,
          user.username,
          user.role,
          user.name,
          'company_create',
          `Telah mencadangkan / menambah syarikat baharu: ${newCompany.company_name}.`,
          `Proposed / added a new company: ${newCompany.company_name}.`
        );
      } catch (e) {
        console.warn('Failed to log company creation activity:', e);
      }
    }

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

    const updatedTotal = [...existing, ...newItems];
    safeSaveLocalStorage(STORAGE_KEYS.COMPANIES, updatedTotal);
    notifyListeners();

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
    
    const updatedCompanies = companies.map(c => ({
      ...c,
      is_approved: true,
      updated_at: timestamp
    }));
    
    safeSaveLocalStorage(STORAGE_KEYS.COMPANIES, updatedCompanies);
    notifyListeners();

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
        safeSaveLocalStorage(STORAGE_KEYS.COMPANIES, companies);
        notifyListeners();
    }
    if (db) await setDoc(doc(db, 'companies', updatedCompany.id), sanitizeForFirebase(updatedCompany), { merge: true });
    return updatedCompany;
  },

  deleteCompany: async (id: string): Promise<void> => {
    const companies = StorageService.getCompanies().filter(c => c.id !== id);
    safeSaveLocalStorage(STORAGE_KEYS.COMPANIES, companies);
    notifyListeners();
    if (db) await deleteDoc(doc(db, 'companies', id));
  },

  getApplications: (): Application[] => inMemoryApplications,
  
  createApplication: async (app: Omit<Application, 'id'>): Promise<Application> => {
    const user = getCurrentUser();
    const timestamp = new Date().toISOString();
    const newApp = { ...app, id: generateId() } as Application;

    if (newApp.application_letter_image && newApp.application_letter_image !== 'idb_stored') {
      await IDBDocStorage.saveDocument(`${newApp.id}_app_letter`, newApp.application_letter_image);
    }
    if (newApp.reply_form_image && newApp.reply_form_image !== 'idb_stored') {
      await IDBDocStorage.saveDocument(`${newApp.id}_reply_form`, newApp.reply_form_image);
    }
    if (newApp.offer_letter_image && newApp.offer_letter_image !== 'idb_stored') {
      await IDBDocStorage.saveDocument(`${newApp.id}_offer_letter`, newApp.offer_letter_image);
    }

    inMemoryApplications.push(newApp);
    safeSaveLocalStorage(STORAGE_KEYS.APPLICATIONS, inMemoryApplications);
    notifyListeners();

    if (db) {
      try {
        const firebasePayload = stripHeavyFields(newApp);
        await setDoc(doc(db, 'applications', newApp.id), sanitizeForFirebase(firebasePayload));
      } catch (e) {
        console.warn('Firebase sync notice (saved locally in IndexedDB):', e);
      }
    }

    if (user) {
      user.last_activity_at = timestamp;
      const users = StorageService.getUsers();
      const uIdx = users.findIndex(u => u.id === user.id);
      if (uIdx !== -1) {
        users[uIdx] = user;
        safeSaveLocalStorage(STORAGE_KEYS.USERS, users);
      }
      safeSaveLocalStorage(STORAGE_KEYS.SESSION, user);
      if (db) {
        try {
          await setDoc(doc(db, 'users', user.id), sanitizeForFirebase(user), { merge: true });
        } catch (e) {
          console.warn('Firebase user sync notice:', e);
        }
      }

      await StorageService.logActivity(
        user.id,
        user.username,
        user.role,
        user.name,
        'apply',
        `Telah memohon latihan industri di: ${newApp.company_name}.`,
        `Applied for industrial training at: ${newApp.company_name}.`
      );
    }
    return newApp;
  },

  updateApplication: async (updatedApp: Application): Promise<Application> => {
    if (updatedApp.application_letter_image && updatedApp.application_letter_image !== 'idb_stored') {
      await IDBDocStorage.saveDocument(`${updatedApp.id}_app_letter`, updatedApp.application_letter_image);
    } else if (!updatedApp.application_letter_image) {
      await IDBDocStorage.deleteDocument(`${updatedApp.id}_app_letter`);
    }

    if (updatedApp.reply_form_image && updatedApp.reply_form_image !== 'idb_stored') {
      await IDBDocStorage.saveDocument(`${updatedApp.id}_reply_form`, updatedApp.reply_form_image);
    } else if (!updatedApp.reply_form_image) {
      await IDBDocStorage.deleteDocument(`${updatedApp.id}_reply_form`);
    }

    if (updatedApp.offer_letter_image && updatedApp.offer_letter_image !== 'idb_stored') {
      await IDBDocStorage.saveDocument(`${updatedApp.id}_offer_letter`, updatedApp.offer_letter_image);
    } else if (!updatedApp.offer_letter_image) {
      await IDBDocStorage.deleteDocument(`${updatedApp.id}_offer_letter`);
    }

    const idx = inMemoryApplications.findIndex(a => a.id === updatedApp.id);
    const oldApp = idx !== -1 ? inMemoryApplications[idx] : null;

    if (idx !== -1) {
      inMemoryApplications[idx] = updatedApp;
    } else {
      inMemoryApplications.push(updatedApp);
    }

    safeSaveLocalStorage(STORAGE_KEYS.APPLICATIONS, inMemoryApplications);
    notifyListeners();

    if (db) {
      try {
        const firebasePayload = stripHeavyFields(updatedApp);
        await setDoc(doc(db, 'applications', updatedApp.id), sanitizeForFirebase(firebasePayload), { merge: true });
      } catch (e) {
        console.warn('Firebase cloud sync notice (saved locally in IndexedDB):', e);
      }
    }

    // Track user action
    const user = getCurrentUser();
    const timestamp = new Date().toISOString();

    if (user) {
      user.last_activity_at = timestamp;
      const users = StorageService.getUsers();
      const uIdx = users.findIndex(u => u.id === user.id);
      if (uIdx !== -1) {
        users[uIdx] = user;
        safeSaveLocalStorage(STORAGE_KEYS.USERS, users);
      }
      safeSaveLocalStorage(STORAGE_KEYS.SESSION, user);
      if (db) {
        try {
          await setDoc(doc(db, 'users', user.id), sanitizeForFirebase(user), { merge: true });
        } catch (e) {
          console.warn('Firebase user sync notice:', e);
        }
      }

      // Detect what changed to log a descriptive message
      let msgMs = `Telah mengemaskini permohonan latihan industri untuk pelajar ${updatedApp.student_name}.`;
      let msgEn = `Updated industrial training application for student ${updatedApp.student_name}.`;
      let actType = 'application_update';

      if (oldApp) {
        if (oldApp.reply_form_image !== updatedApp.reply_form_image && updatedApp.reply_form_image) {
          actType = 'reply_form_upload';
          msgMs = `Telah memuat naik Borang Maklum Balas (Reply Form) untuk ${updatedApp.company_name}.`;
          msgEn = `Uploaded Reply Form for ${updatedApp.company_name}.`;
        } else if (oldApp.offer_letter_image !== updatedApp.offer_letter_image && updatedApp.offer_letter_image) {
          actType = 'offer_letter_upload';
          msgMs = `Telah memuat naik Surat Tawaran (Offer Letter) dari ${updatedApp.company_name}.`;
          msgEn = `Uploaded Offer Letter from ${updatedApp.company_name}.`;
        } else if (oldApp.application_status !== updatedApp.application_status) {
          actType = 'application_status_update';
          msgMs = `Telah menukar status permohonan ${updatedApp.student_name} di ${updatedApp.company_name} kepada "${updatedApp.application_status}".`;
          msgEn = `Changed application status for ${updatedApp.student_name} at ${updatedApp.company_name} to "${updatedApp.application_status}".`;
        } else if (oldApp.faculty_supervisor_id !== updatedApp.faculty_supervisor_id && updatedApp.faculty_supervisor_id) {
          actType = 'supervisor_assign';
          msgMs = `Telah menugaskan ${updatedApp.faculty_supervisor_name} sebagai Penyelia Fakulti untuk ${updatedApp.student_name}.`;
          msgEn = `Assigned ${updatedApp.faculty_supervisor_name} as Faculty Supervisor for ${updatedApp.student_name}.`;
        } else if (oldApp.reply_form_verified !== updatedApp.reply_form_verified) {
          actType = 'application_verification';
          msgMs = `Telah ${updatedApp.reply_form_verified ? 'mengesahkan' : 'membatalkan pengesahan'} Borang Maklum Balas untuk ${updatedApp.student_name}.`;
          msgEn = `${updatedApp.reply_form_verified ? 'Verified' : 'Unverified'} Reply Form for ${updatedApp.student_name}.`;
        }
      }

      await StorageService.logActivity(
        user.id,
        user.username,
        user.role,
        user.name,
        actType,
        msgMs,
        msgEn
      );
    }

    return updatedApp;
  },

  deleteApplication: async (id: string): Promise<void> => {
    inMemoryApplications = inMemoryApplications.filter(a => a.id !== id);
    safeSaveLocalStorage(STORAGE_KEYS.APPLICATIONS, inMemoryApplications);
    notifyListeners();

    await IDBDocStorage.deleteDocument(`${id}_app_letter`);
    await IDBDocStorage.deleteDocument(`${id}_reply_form`);
    await IDBDocStorage.deleteDocument(`${id}_offer_letter`);

    if (db) {
      try {
        await deleteDoc(doc(db, 'applications', id));
      } catch (e) {
        console.warn('Firebase delete application notice:', e);
      }
    }
  },

  setStudentPlacement: async ({
    student,
    company,
    targetApplicationId,
    deleteOtherChoices = true,
    supervisorId,
    performedBy
  }: {
    student: User;
    company: { company_name: string; company_state?: string; company_district?: string; company_address?: string };
    targetApplicationId?: string;
    deleteOtherChoices?: boolean;
    supervisorId?: string;
    performedBy?: User;
  }): Promise<{ placementApp: Application; deletedCount: number }> => {
    // 1. If supervisor is selected, update student record
    let updatedStudent = { ...student };
    if (supervisorId) {
      const users = StorageService.getUsers();
      const lecturer = users.find(u => u.id === supervisorId);
      if (lecturer) {
        updatedStudent = {
          ...updatedStudent,
          faculty_supervisor_id: lecturer.id,
          faculty_supervisor_name: lecturer.name,
          faculty_supervisor_staff_id: lecturer.staff_id || '',
          faculty_supervisor_email: lecturer.email || ''
        };
        await StorageService.updateUser(updatedStudent);
      }
    }

    // 2. Find or create the placement application
    const studentApps = inMemoryApplications.filter(a => 
      (a.student_id === student.matric_no || a.created_by === student.username)
    );

    let targetApp: Application | undefined;
    if (targetApplicationId) {
      targetApp = studentApps.find(a => a.id === targetApplicationId);
    }
    if (!targetApp) {
      targetApp = studentApps.find(a => a.company_name.trim().toLowerCase() === company.company_name.trim().toLowerCase());
    }

    let finalApp: Application;

    if (targetApp) {
      finalApp = {
        ...targetApp,
        company_name: company.company_name,
        company_state: company.company_state || targetApp.company_state,
        company_district: company.company_district || targetApp.company_district,
        application_status: 'Diluluskan',
        student_preferred: true,
        student_has_offer: true,
        reply_form_verified: true,
        faculty_supervisor_id: updatedStudent.faculty_supervisor_id || targetApp.faculty_supervisor_id,
        faculty_supervisor_name: updatedStudent.faculty_supervisor_name || targetApp.faculty_supervisor_name,
        faculty_supervisor_staff_id: updatedStudent.faculty_supervisor_staff_id || targetApp.faculty_supervisor_staff_id,
        faculty_supervisor_email: updatedStudent.faculty_supervisor_email || targetApp.faculty_supervisor_email
      };
      await StorageService.updateApplication(finalApp);
    } else {
      finalApp = await StorageService.createApplication({
        student_name: student.name,
        student_id: student.matric_no || '',
        student_email: student.email || '',
        student_program: student.program || '',
        company_name: company.company_name,
        company_state: company.company_state || 'Melaka',
        company_district: company.company_district || '',
        application_status: 'Diluluskan',
        student_preferred: true,
        student_has_offer: true,
        start_date: new Date().toISOString().split('T')[0],
        created_by: student.username,
        created_at: new Date().toISOString(),
        reply_form_verified: true,
        faculty_supervisor_id: updatedStudent.faculty_supervisor_id,
        faculty_supervisor_name: updatedStudent.faculty_supervisor_name,
        faculty_supervisor_staff_id: updatedStudent.faculty_supervisor_staff_id,
        faculty_supervisor_email: updatedStudent.faculty_supervisor_email
      });
    }

    // 3. Delete other choices if requested
    let deletedCount = 0;
    if (deleteOtherChoices) {
      const othersToDelete = inMemoryApplications.filter(a => 
        (a.student_id === student.matric_no || a.created_by === student.username) && 
        a.id !== finalApp.id
      );
      for (const other of othersToDelete) {
        await StorageService.deleteApplication(other.id);
        deletedCount++;
      }
    }

    // 4. Send notification to student
    try {
      await StorageService.createNotification({
        recipient_id: student.id || student.username,
        recipient_role: UserRole.STUDENT,
        title_ms: `Penetapan Rasmi Syarikat Penempatan WBL`,
        title_en: `Official WBL Placement Assignment`,
        message_ms: `Tahniah! Anda telah ditetapkan secara rasmi di syarikat ${company.company_name} oleh Penyelaras WBL.${deletedCount > 0 ? ` Sebanyak ${deletedCount} permohonan pilihan lain telah dipadamkan.` : ''}`,
        message_en: `Congratulations! You have been officially assigned to ${company.company_name} by WBL Coordinator.${deletedCount > 0 ? ` ${deletedCount} other application choices have been deleted.` : ''}`,
        is_read: false,
        created_at: new Date().toISOString(),
        sender_name: performedBy?.name || 'Penyelaras WBL',
        application_id: finalApp.id
      });
    } catch (e) {
      console.warn('Failed to send placement notification:', e);
    }

    // 5. Log activity
    if (performedBy) {
      try {
        await StorageService.logActivity(
          performedBy.id,
          performedBy.username,
          performedBy.role,
          performedBy.name,
          'placement_set_by_coordinator',
          `Menetapkan syarikat penempatan rasmi "${company.company_name}" untuk pelajar ${student.name} (${student.matric_no})${deletedCount > 0 ? ` dan memadam ${deletedCount} pilihan lain` : ''}.`,
          `Assigned official placement "${company.company_name}" for student ${student.name} (${student.matric_no})${deletedCount > 0 ? ` and deleted ${deletedCount} other choices` : ''}.`
        );
      } catch (e) {
        console.warn('Failed to log placement activity:', e);
      }
    }

    return { placementApp: finalApp, deletedCount };
  },

  deleteOtherStudentApplications: async (studentMatricOrUsername: string, keepAppId: string): Promise<number> => {
    const others = inMemoryApplications.filter(a => 
      (a.student_id === studentMatricOrUsername || a.created_by === studentMatricOrUsername) && 
      a.id !== keepAppId
    );
    for (const other of others) {
      await StorageService.deleteApplication(other.id);
    }
    return others.length;
  },

  getActivities: (): UserActivity[] => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '[]') as UserActivity[];
    } catch {
      return [];
    }
  },

  logActivity: async (
    userId: string,
    username: string,
    userRole: UserRole,
    name: string,
    type: string,
    description_ms: string,
    description_en: string
  ): Promise<void> => {
    const activities = StorageService.getActivities();
    const newActivity: UserActivity = {
      id: generateId(),
      userId,
      username,
      userRole,
      name,
      type,
      description_ms,
      description_en,
      timestamp: new Date().toISOString()
    };
    activities.unshift(newActivity);
    const trimmed = activities.slice(0, 40);
    safeSaveLocalStorage(STORAGE_KEYS.ACTIVITIES, trimmed);
    notifyListeners();
    if (db) {
      try {
        await setDoc(doc(db, 'activities', newActivity.id), sanitizeForFirebase(newActivity));
      } catch (e) {
        console.error('Failed to sync activity to cloud:', e);
      }
    }
  },

  getNotifications: (): Notification[] => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]') as Notification[];
    } catch {
      return [];
    }
  },

  createNotification: async (notif: Omit<Notification, 'id'>): Promise<Notification> => {
    const notifications = StorageService.getNotifications();
    const newNotif: Notification = {
      ...notif,
      id: generateId()
    };
    notifications.unshift(newNotif);
    const trimmed = notifications.slice(0, 40);
    safeSaveLocalStorage(STORAGE_KEYS.NOTIFICATIONS, trimmed);
    notifyListeners();
    if (db) {
      try {
        await setDoc(doc(db, 'notifications', newNotif.id), sanitizeForFirebase(newNotif));
      } catch (e) {
        console.error('Failed to sync notification to cloud:', e);
      }
    }
    return newNotif;
  },

  markNotificationAsRead: async (id: string): Promise<void> => {
    const notifications = StorageService.getNotifications();
    const idx = notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      notifications[idx].is_read = true;
      safeSaveLocalStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
      notifyListeners();
      if (db) {
        await setDoc(doc(db, 'notifications', id), { is_read: true }, { merge: true });
      }
    }
  },

  markAllNotificationsAsRead: async (recipientId: string): Promise<void> => {
    const notifications = StorageService.getNotifications();
    let updated = false;
    const updatedNotifications = notifications.map(n => {
      const isRecipient = n.recipient_id === recipientId || (recipientId === 'coordinator' && n.recipient_id === 'coordinator');
      if (isRecipient && !n.is_read) {
        n.is_read = true;
        updated = true;
      }
      return n;
    });
    if (updated) {
      safeSaveLocalStorage(STORAGE_KEYS.NOTIFICATIONS, updatedNotifications);
      notifyListeners();
      if (db) {
        const batch = writeBatch(db);
        updatedNotifications.forEach(n => {
          const isRecipient = n.recipient_id === recipientId || (recipientId === 'coordinator' && n.recipient_id === 'coordinator');
          if (isRecipient && n.is_read) {
            batch.set(doc(db, 'notifications', n.id), { is_read: true }, { merge: true });
          }
        });
        await batch.commit();
      }
    }
  },

  deleteNotification: async (id: string): Promise<void> => {
    const notifications = StorageService.getNotifications().filter(n => n.id !== id);
    safeSaveLocalStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    notifyListeners();
    if (db) await deleteDoc(doc(db, 'notifications', id));
  },

  // ==================== DAILY & WEEKLY LOGBOOK MODULE ====================
  getWeeklyLogbooks: (): WeeklyLogbook[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGBOOKS);
      if (raw) {
        const parsed = JSON.parse(raw) as WeeklyLogbook[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryLogbooks = parsed;
          return parsed;
        }
      }
    } catch {}

    // Seed default demo logbooks if none exist so all roles can immediately test and review
    if (inMemoryLogbooks.length === 0) {
      const demoLogs: WeeklyLogbook[] = [
        {
          id: 'logbook_demo_1',
          studentId: 'student_demo_1',
          studentName: 'Muhammad Amirul bin Razak',
          studentMatric: 'B062110045',
          studentProgram: 'SARJANA MUDA TEKNOUSAHAWANAN DENGAN KEPUJIAN (BTEC)',
          companyName: 'PETRONAS Digital Sdn Bhd',
          companyAddress: 'Level 18, Menara Dayabumi, Jalan Sultan Hishamuddin, Kuala Lumpur',
          weekNumber: 1,
          startDate: '2026-09-08',
          endDate: '2026-09-12',
          totalHours: 40,
          entries: [
            {
              id: 'entry_demo_1_1',
              day: 'Isnin',
              date: '2026-09-08',
              startTime: '08:30',
              endTime: '17:30',
              department: 'Digital Operations & IT Enterprise',
              tasks: 'Sesi suai kenal bersama Jurulatih Industri dan pasukan IT. Taklimat keselamatan industri, pengenalan sistem tiket ITIL, dan penetapan stesen kerja.',
              learningOutcomes: 'Memahami carta organisasi bahagian IT syarikat, prosedur keselamatan siber korporat, dan protokol komunikasi dalaman.',
              toolsUsed: 'Microsoft Teams, Jira Service Management, Cisco AnyConnect VPN',
              remarks: 'Semua prosedur orientasi selesai dengan baik.'
            },
            {
              id: 'entry_demo_1_2',
              day: 'Selasa',
              date: '2026-09-09',
              startTime: '08:30',
              endTime: '17:30',
              department: 'Cloud Solutions & Infrastructure',
              tasks: 'Membantu jurutera awan mengkonfigurasi persekitaran ujian staging pada portal AWS dan Azure. Meneliti dokumentasi senibina pelayan awan.',
              learningOutcomes: 'Mempelajari konsep Infrastructure as Code (IaC) dan struktur penempatan perkhidmatan awan hibrid.',
              toolsUsed: 'AWS Management Console, Terraform, Visual Studio Code',
              remarks: 'Berjaya melancarkan instans ujian mengikut spesifikasi.'
            },
            {
              id: 'entry_demo_1_3',
              day: 'Rabu',
              date: '2026-09-10',
              startTime: '08:30',
              endTime: '17:30',
              department: 'Cloud Solutions & Infrastructure',
              tasks: 'Menjalankan diagnostik kesihatan sistem dan semakan log pelayan pangkalan data. Menyediakan laporan ringkas penggunaan sumber CPU & memori.',
              learningOutcomes: 'Kemahiran menganalisis metrik prestasi pelayan dan mengesan latensi dalam sistem pengeluaran.',
              toolsUsed: 'Datadog, Prometheus, Grafana Dashboard',
              remarks: 'Tiada ralat kritikal dikesan.'
            },
            {
              id: 'entry_demo_1_4',
              day: 'Khamis',
              date: '2026-09-11',
              startTime: '08:30',
              endTime: '17:30',
              department: 'Software Quality Assurance',
              tasks: 'Menyertai ujian penerimaan pengguna (UAT) bagi modul pengurusan inventori digital syarikat. Merekodkan pepijat dan mengesahkan patch kemas kini.',
              learningOutcomes: 'Mengaplikasikan kaedah ujian regresi dan dokumentasi kes ujian (test cases) mengikut piawaian industri.',
              toolsUsed: 'Postman API Client, Jira Bug Tracker, Selenium Webdriver',
              remarks: 'Menjumpai 2 isu kecil susun atur responsif dan telah dilaporkan kepada pembangun.'
            },
            {
              id: 'entry_demo_1_5',
              day: 'Jumaat',
              date: '2026-09-12',
              startTime: '08:30',
              endTime: '17:30',
              department: 'Digital Operations & IT Enterprise',
              tasks: 'Mengemas kini pangkalan pengetahuan (knowledge base) teknikal untuk panduan pengguna baru. Sesi semakan mingguan bersama jurulatih industri.',
              learningOutcomes: 'Kemahiran penulisan dokumentasi teknikal yang jelas serta kemahiran komunikasi profesional semasa pembentangan kemajuan kerja.',
              toolsUsed: 'Confluence Wiki, Microsoft SharePoint, MS Office 365',
              remarks: 'Jurulatih industri memberikan maklum balas positif terhadap inisiatif pembelajaran.'
            }
          ],
          weeklySummary: 'Minggu pertama latihan industri di PETRONAS Digital memberi pendedahan menyeluruh terhadap ekosistem teknologi perusahaan. Saya telah berjaya membiasakan diri dengan aliran kerja harian dan persekitaran ITIL.',
          status: 'verified',
          submittedAt: '2026-09-12T17:45:00.000Z',
          verifiedByTrainerId: 'trainer_azman',
          trainerName: 'En. Azman bin Khalid',
          trainerPosition: 'Pengurus Operasi Digital & Jurulatih Industri',
          trainerCompany: 'PETRONAS Digital Sdn Bhd',
          trainerEmail: 'azman.khalid@petronas.com',
          trainerPhone: '012-3849102',
          trainerRating: 'cemerlang',
          trainerComments: 'Pelajar menunjukkan sikap inisiatif yang sangat cemerlang, pantas mempelajari alat baharu, dan sentiasa mematuhi prosedur kerja syarikat.',
          verifiedAt: '2026-09-13T10:30:00.000Z',
          supervisorName: 'Dr. Mohd Guzairy bin Abd Ghani',
          supervisorComments: 'Perkembangan awal yang sangat memuaskan. Teruskan usaha dan terapkan teori pengurusan teknologi dalam tugasan harian.',
          supervisorReviewedAt: '2026-09-14T09:15:00.000Z',
          createdAt: '2026-09-08T08:00:00.000Z',
          updatedAt: '2026-09-14T09:15:00.000Z'
        },
        {
          id: 'logbook_demo_2',
          studentId: 'student_demo_1',
          studentName: 'Muhammad Amirul bin Razak',
          studentMatric: 'B062110045',
          studentProgram: 'SARJANA MUDA TEKNOUSAHAWANAN DENGAN KEPUJIAN (BTEC)',
          companyName: 'PETRONAS Digital Sdn Bhd',
          companyAddress: 'Level 18, Menara Dayabumi, Jalan Sultan Hishamuddin, Kuala Lumpur',
          weekNumber: 2,
          startDate: '2026-09-15',
          endDate: '2026-09-19',
          totalHours: 40,
          entries: [
            {
              id: 'entry_demo_2_1',
              day: 'Isnin',
              date: '2026-09-15',
              startTime: '08:30',
              endTime: '17:30',
              department: 'Data Analytics & AI Engineering',
              tasks: 'Mempelajari pipeline pengekstrakan data (ETL) menggunakan Apache Spark. Melakukan pembersihan dataset jualan bulanan.',
              learningOutcomes: 'Memahami teknik data wrangling dan pengesahan kualiti data sebelum dimasukkan ke dalam model analitik.',
              toolsUsed: 'Python, Pandas, Jupyter Notebook, Apache Spark',
              remarks: 'Berjaya membersihkan 95% data tidak lengkap.'
            },
            {
              id: 'entry_demo_2_2',
              day: 'Selasa',
              date: '2026-09-16',
              startTime: '08:30',
              endTime: '17:30',
              department: 'Data Analytics & AI Engineering',
              tasks: 'Membangunkan papan pemuka (dashboard) visualisasi KPI operasi menggunakan Power BI.',
              learningOutcomes: 'Pendedahan kepada reka bentuk visualisasi data yang mesra eksekutif (Executive BI Reporting).',
              toolsUsed: 'Power BI Desktop, SQL Server Management Studio',
              remarks: 'Menerima maklum balas daripada pasukan kanan untuk menambah penapis tarikh dinamik.'
            },
            {
              id: 'entry_demo_2_3',
              day: 'Rabu',
              date: '2026-09-17',
              startTime: '08:30',
              endTime: '17:30',
              department: 'Digital Operations & IT Enterprise',
              tasks: 'Menyertai taklimat pengurusan insiden keselamatan siber (SOC). Mengkaji corak percubaan pencerobohan sistem.',
              learningOutcomes: 'Memahami rangka kerja tindak balas insiden (NIST Incident Response) dan analisis forensik log keselamatan.',
              toolsUsed: 'Splunk Enterprise SIEM, Wireshark',
              remarks: 'Latihan simulasi ancaman keselamatan dijalankan dengan jayanya.'
            },
            {
              id: 'entry_demo_2_4',
              day: 'Khamis',
              date: '2026-09-18',
              startTime: '08:30',
              endTime: '17:30',
              department: 'DevOps & Continuous Integration',
              tasks: 'Menulis skrip automasi pengujian kod dalam pipeline GitHub Actions. Menguji binaan aplikasi mudah alih dalaman.',
              learningOutcomes: 'Menguasai konsep CI/CD dan automasi semakan kualiti kod (SonarQube analysis).',
              toolsUsed: 'GitHub Actions, Docker, SonarQube, YAML',
              remarks: 'Pipeline berjaya diintegrasikan dengan cawangan staging.'
            },
            {
              id: 'entry_demo_2_5',
              day: 'Jumaat',
              date: '2026-09-19',
              startTime: '08:30',
              endTime: '17:30',
              department: 'DevOps & Continuous Integration',
              tasks: 'Melakukan semakan kod (code review) dan dokumentasi penambahbaikan pipeline. Menyelesaikan ringkasan aktiviti mingguan untuk semakan jurulatih.',
              learningOutcomes: 'Kemahiran bekerjasama dalam pasukan kejuruteraan perisian dan pematuhan standard pengekodan.',
              toolsUsed: 'Git, GitHub Enterprise, Markdown',
              remarks: 'Logbook dihantar tepat pada waktu untuk pengesahan jurulatih industri.'
            }
          ],
          weeklySummary: 'Minggu kedua memberi tumpuan kepada kejuruteraan data dan automasi CI/CD. Saya mempelajari banyak alatan baharu yang digunakan secara meluas di peringkat perusahaan.',
          status: 'submitted',
          submittedAt: '2026-09-19T17:30:00.000Z',
          trainerName: 'En. Azman bin Khalid',
          trainerPosition: 'Pengurus Operasi Digital & Jurulatih Industri',
          trainerCompany: 'PETRONAS Digital Sdn Bhd',
          trainerEmail: 'azman.khalid@petronas.com',
          trainerPhone: '012-3849102',
          createdAt: '2026-09-15T08:00:00.000Z',
          updatedAt: '2026-09-19T17:30:00.000Z'
        }
      ];

      inMemoryLogbooks = demoLogs;
      safeSaveLocalStorage(STORAGE_KEYS.LOGBOOKS, demoLogs);
      return demoLogs;
    }

    return inMemoryLogbooks;
  },

  getStudentLogbooks: (studentIdOrMatric: string): WeeklyLogbook[] => {
    const all = StorageService.getWeeklyLogbooks();
    return all.filter(l => l.studentId === studentIdOrMatric || l.studentMatric === studentIdOrMatric)
              .sort((a, b) => a.weekNumber - b.weekNumber);
  },

  getTrainerLogbooks: (trainerId: string, companyName?: string): WeeklyLogbook[] => {
    const all = StorageService.getWeeklyLogbooks();
    const cleanComp = (companyName || '').trim().toLowerCase();
    return all.filter(l => {
      if (l.verifiedByTrainerId === trainerId) return true;
      if (cleanComp && l.companyName && l.companyName.trim().toLowerCase() === cleanComp) return true;
      return false;
    }).sort((a, b) => b.weekNumber - a.weekNumber);
  },

  getLogbookById: (id: string): WeeklyLogbook | undefined => {
    const all = StorageService.getWeeklyLogbooks();
    return all.find(l => l.id === id);
  },

  saveWeeklyLogbook: async (logbookData: Partial<WeeklyLogbook> & { studentId: string; weekNumber: number }): Promise<WeeklyLogbook> => {
    const all = StorageService.getWeeklyLogbooks();
    const existingIndex = all.findIndex(l => 
      (logbookData.id && l.id === logbookData.id) || 
      (l.studentId === logbookData.studentId && l.weekNumber === logbookData.weekNumber)
    );

    const now = new Date().toISOString();
    let savedLogbook: WeeklyLogbook;

    if (existingIndex !== -1) {
      const existing = all[existingIndex];
      savedLogbook = {
        ...existing,
        ...logbookData,
        id: existing.id,
        updatedAt: now
      };
      all[existingIndex] = savedLogbook;
    } else {
      savedLogbook = {
        ...logbookData,
        id: logbookData.id || generateId(),
        studentId: logbookData.studentId,
        studentName: logbookData.studentName || '',
        studentMatric: logbookData.studentMatric || '',
        studentProgram: logbookData.studentProgram || '',
        companyName: logbookData.companyName || '',
        companyAddress: logbookData.companyAddress || '',
        weekNumber: logbookData.weekNumber,
        startDate: logbookData.startDate || new Date().toISOString().split('T')[0],
        endDate: logbookData.endDate || new Date().toISOString().split('T')[0],
        totalHours: logbookData.totalHours || 40,
        entries: logbookData.entries || [],
        weeklySummary: logbookData.weeklySummary || '',
        status: logbookData.status || 'draft',
        createdAt: now,
        updatedAt: now
      };
      all.push(savedLogbook);
    }

    inMemoryLogbooks = [...all];
    safeSaveLocalStorage(STORAGE_KEYS.LOGBOOKS, all);
    notifyListeners();

    if (db) {
      try {
        await setDoc(doc(db, 'weekly_logbooks', savedLogbook.id), sanitizeForFirebase(savedLogbook));
      } catch (err) {
        console.error('Failed to sync logbook to Firebase:', err);
      }
    }

    return savedLogbook;
  },

  submitWeeklyLogbook: async (id: string, trainerDetails?: { name?: string; email?: string; position?: string; company?: string; trainerId?: string }): Promise<WeeklyLogbook> => {
    const all = StorageService.getWeeklyLogbooks();
    const target = all.find(l => l.id === id);
    if (!target) throw new Error('Buku log tidak ditemui.');

    const now = new Date().toISOString();
    const updated: WeeklyLogbook = {
      ...target,
      status: 'submitted',
      submittedAt: now,
      updatedAt: now,
      trainerName: trainerDetails?.name || target.trainerName,
      trainerEmail: trainerDetails?.email || target.trainerEmail,
      trainerPosition: trainerDetails?.position || target.trainerPosition,
      trainerCompany: trainerDetails?.company || target.companyName,
      verifiedByTrainerId: trainerDetails?.trainerId || target.verifiedByTrainerId
    };

    const newAll = all.map(l => l.id === id ? updated : l);
    inMemoryLogbooks = [...newAll];
    safeSaveLocalStorage(STORAGE_KEYS.LOGBOOKS, newAll);
    notifyListeners();

    if (db) {
      try {
        await setDoc(doc(db, 'weekly_logbooks', id), sanitizeForFirebase(updated), { merge: true });
      } catch (e) {
        console.error('Cloud sync error for logbook submit:', e);
      }
    }

    // Send notification to Coordinator & Industry Trainer
    try {
      await StorageService.createNotification({
        recipient_id: trainerDetails?.trainerId || 'coordinator',
        recipient_role: UserRole.TRAINER,
        sender_name: updated.studentName,
        sender_matric: updated.studentMatric,
        title_ms: `Logbook Mingguan Dihantar - Minggu ${updated.weekNumber}`,
        title_en: `Weekly Logbook Submitted - Week ${updated.weekNumber}`,
        message_ms: `Pelajar ${updated.studentName} (${updated.studentMatric}) telah menghantar logbook Minggu ${updated.weekNumber} bagi penempatan di ${updated.companyName} untuk pengesahan jurulatih industri.`,
        message_en: `Student ${updated.studentName} (${updated.studentMatric}) submitted Week ${updated.weekNumber} logbook at ${updated.companyName} for trainer verification.`,
        is_read: false,
        created_at: now
      });
    } catch {}

    const currentUser = getCurrentUser();
    if (currentUser) {
      await StorageService.logActivity(
        currentUser.id,
        currentUser.username,
        currentUser.role,
        currentUser.name,
        'LOGBOOK_SUBMIT',
        `Menghantar Log Latihan Harian Minggu ${updated.weekNumber} untuk pengesahan jurulatih industri.`,
        `Submitted Daily Training Log for Week ${updated.weekNumber} for industry coach verification.`
      );
    }

    return updated;
  },

  verifyWeeklyLogbook: async (id: string, verification: {
    trainerName: string;
    trainerPosition: string;
    trainerCompany?: string;
    trainerComments: string;
    trainerRating?: 'cemerlang' | 'baik' | 'memuaskan' | 'perlu_bimbingan';
    verifiedByTrainerId?: string;
    trainerEmail?: string;
    trainerPhone?: string;
  }): Promise<WeeklyLogbook> => {
    const all = StorageService.getWeeklyLogbooks();
    const target = all.find(l => l.id === id);
    if (!target) throw new Error('Buku log tidak dijumpai.');

    const now = new Date().toISOString();
    const updated: WeeklyLogbook = {
      ...target,
      status: 'verified',
      verifiedAt: now,
      updatedAt: now,
      trainerName: verification.trainerName,
      trainerPosition: verification.trainerPosition,
      trainerCompany: verification.trainerCompany || target.companyName,
      trainerComments: verification.trainerComments,
      trainerRating: verification.trainerRating || 'cemerlang',
      verifiedByTrainerId: verification.verifiedByTrainerId,
      trainerEmail: verification.trainerEmail || target.trainerEmail,
      trainerPhone: verification.trainerPhone || target.trainerPhone,
      revisionNotes: undefined
    };

    const newAll = all.map(l => l.id === id ? updated : l);
    inMemoryLogbooks = [...newAll];
    safeSaveLocalStorage(STORAGE_KEYS.LOGBOOKS, newAll);
    notifyListeners();

    if (db) {
      try {
        await setDoc(doc(db, 'weekly_logbooks', id), sanitizeForFirebase(updated), { merge: true });
      } catch (e) {
        console.error('Cloud sync error for logbook verify:', e);
      }
    }

    // Send notification to the student
    try {
      await StorageService.createNotification({
        recipient_id: updated.studentId,
        recipient_role: UserRole.STUDENT,
        sender_name: verification.trainerName,
        title_ms: `Logbook Minggu ${updated.weekNumber} Telah Disahkan!`,
        title_en: `Week ${updated.weekNumber} Logbook Verified!`,
        message_ms: `Tahniah! Jurulatih Industri (${verification.trainerName}) telah mengesahkan logbook harian anda bagi Minggu ${updated.weekNumber}. Ulasan: "${verification.trainerComments || 'Disahkan dengan jayanya'}"`,
        message_en: `Congratulations! Industry Coach (${verification.trainerName}) verified your Week ${updated.weekNumber} logbook. Feedback: "${verification.trainerComments || 'Verified successfully'}"`,
        is_read: false,
        created_at: now
      });
    } catch {}

    const currentUser = getCurrentUser();
    if (currentUser) {
      await StorageService.logActivity(
        currentUser.id,
        currentUser.username,
        currentUser.role,
        currentUser.name,
        'LOGBOOK_VERIFIED',
        `Mengesahkan Logbook Latihan Harian Minggu ${updated.weekNumber} bagi pelajar ${updated.studentName} (${updated.studentMatric}).`,
        `Verified Week ${updated.weekNumber} Daily Training Log for student ${updated.studentName} (${updated.studentMatric}).`
      );
    }

    return updated;
  },

  requestRevisionWeeklyLogbook: async (id: string, revisionNotes: string, trainerName: string): Promise<WeeklyLogbook> => {
    const all = StorageService.getWeeklyLogbooks();
    const target = all.find(l => l.id === id);
    if (!target) throw new Error('Buku log tidak dijumpai.');

    const now = new Date().toISOString();
    const updated: WeeklyLogbook = {
      ...target,
      status: 'revision',
      revisionNotes,
      updatedAt: now
    };

    const newAll = all.map(l => l.id === id ? updated : l);
    inMemoryLogbooks = [...newAll];
    safeSaveLocalStorage(STORAGE_KEYS.LOGBOOKS, newAll);
    notifyListeners();

    if (db) {
      try {
        await setDoc(doc(db, 'weekly_logbooks', id), sanitizeForFirebase(updated), { merge: true });
      } catch (e) {
        console.error('Cloud sync error for logbook revision request:', e);
      }
    }

    // Send notification to student
    try {
      await StorageService.createNotification({
        recipient_id: updated.studentId,
        recipient_role: UserRole.STUDENT,
        sender_name: trainerName,
        title_ms: `Pembetulan Logbook Diperlukan - Minggu ${updated.weekNumber}`,
        title_en: `Logbook Revision Needed - Week ${updated.weekNumber}`,
        message_ms: `Jurulatih Industri (${trainerName}) meminta pembetulan bagi logbook Minggu ${updated.weekNumber}. Catatan: "${revisionNotes}"`,
        message_en: `Industry Coach (${trainerName}) requested revisions for Week ${updated.weekNumber} logbook. Notes: "${revisionNotes}"`,
        is_read: false,
        created_at: now
      });
    } catch {}

    return updated;
  },

  directVerifyWeeklyLogbook: async (id: string, trainer: {
    trainerId: string;
    trainerName: string;
    trainerPosition?: string;
    trainerCompany?: string;
    trainerEmail?: string;
    trainerPhone?: string;
    trainerRating?: 'cemerlang' | 'baik' | 'memuaskan' | 'perlu_bimbingan';
    trainerComments?: string;
  }): Promise<WeeklyLogbook> => {
    return StorageService.verifyWeeklyLogbook(id, {
      trainerName: trainer.trainerName,
      trainerPosition: trainer.trainerPosition || 'Jurulatih Industri (Industry Coach)',
      trainerCompany: trainer.trainerCompany,
      trainerComments: trainer.trainerComments?.trim() || 'Disahkan aktiviti harian dan kemahiran industri pelajar telah disemak, menepati sukatan latihan dan memuaskan.',
      trainerRating: trainer.trainerRating || 'cemerlang',
      verifiedByTrainerId: trainer.trainerId,
      trainerEmail: trainer.trainerEmail,
      trainerPhone: trainer.trainerPhone
    });
  },

  addSupervisorReview: async (id: string, review: {
    supervisorId: string;
    supervisorName: string;
    supervisorStaffId?: string;
    supervisorComments: string;
  }): Promise<WeeklyLogbook> => {
    const all = StorageService.getWeeklyLogbooks();
    const target = all.find(l => l.id === id);
    if (!target) throw new Error('Buku log tidak dijumpai.');

    const now = new Date().toISOString();
    const updated: WeeklyLogbook = {
      ...target,
      supervisorId: review.supervisorId,
      supervisorName: review.supervisorName,
      supervisorStaffId: review.supervisorStaffId,
      supervisorComments: review.supervisorComments,
      supervisorReviewedAt: now,
      updatedAt: now
    };

    const newAll = all.map(l => l.id === id ? updated : l);
    inMemoryLogbooks = [...newAll];
    safeSaveLocalStorage(STORAGE_KEYS.LOGBOOKS, newAll);
    notifyListeners();

    if (db) {
      try {
        await setDoc(doc(db, 'weekly_logbooks', id), sanitizeForFirebase(updated), { merge: true });
      } catch (e) {
        console.error('Cloud sync error for supervisor review:', e);
      }
    }

    // Send notification to student
    try {
      await StorageService.createNotification({
        recipient_id: updated.studentId,
        recipient_role: UserRole.STUDENT,
        sender_name: review.supervisorName,
        title_ms: `Ulasan Penyelia Fakulti - Minggu ${updated.weekNumber}`,
        title_en: `Faculty Supervisor Review - Week ${updated.weekNumber}`,
        message_ms: `Penyelia Fakulti (${review.supervisorName}) telah menyemak logbook harian anda bagi Minggu ${updated.weekNumber} dan memberikan maklum balas pemantauan.`,
        message_en: `Faculty Supervisor (${review.supervisorName}) reviewed your Week ${updated.weekNumber} logbook and provided feedback.`,
        is_read: false,
        created_at: now
      });
    } catch {}

    const currentUser = getCurrentUser();
    if (currentUser) {
      await StorageService.logActivity(
        currentUser.id,
        currentUser.username,
        currentUser.role,
        currentUser.name,
        'SUPERVISOR_LOGBOOK_REVIEW',
        `Menyemak dan memberi ulasan pemantauan pada Logbook Minggu ${updated.weekNumber} bagi pelajar ${updated.studentName}.`,
        `Reviewed and commented on Week ${updated.weekNumber} Logbook for student ${updated.studentName}.`
      );
    }

    return updated;
  },

  sendTrainerVerificationReminder: async (logbookId: string, senderName: string): Promise<void> => {
    const all = StorageService.getWeeklyLogbooks();
    const target = all.find(l => l.id === logbookId);
    if (!target) throw new Error('Buku log tidak ditemui.');

    const now = new Date().toISOString();
    await StorageService.createNotification({
      recipient_id: target.verifiedByTrainerId || 'trainer',
      recipient_role: UserRole.TRAINER,
      sender_name: senderName,
      title_ms: `Peringatan: Pengesahan Logbook Diperlukan - Minggu ${target.weekNumber}`,
      title_en: `Reminder: Logbook Verification Needed - Week ${target.weekNumber}`,
      message_ms: `Peringatan daripada Penyelaras WBL (${senderName}): Sila buat pengesahan bagi Log Latihan Harian Minggu ${target.weekNumber} untuk pelajar ${target.studentName} (${target.studentMatric}) di ${target.companyName}.`,
      message_en: `Reminder from WBL Coordinator (${senderName}): Please verify Week ${target.weekNumber} Daily Training Log for ${target.studentName} at ${target.companyName}.`,
      is_read: false,
      created_at: now
    });
  },

  deleteWeeklyLogbook: async (id: string): Promise<void> => {
    const all = StorageService.getWeeklyLogbooks().filter(l => l.id !== id);
    inMemoryLogbooks = [...all];
    safeSaveLocalStorage(STORAGE_KEYS.LOGBOOKS, all);
    notifyListeners();
    if (db) await deleteDoc(doc(db, 'weekly_logbooks', id));
  },

  getFullSystemBackup: () => ({
    users: StorageService.getUsers(),
    companies: StorageService.getCompanies(),
    applications: StorageService.getApplications(),
    logbooks: StorageService.getWeeklyLogbooks(),
    adConfig: StorageService.getAdConfig(),
    timestamp: new Date().toISOString()
  }),

  restoreFullSystem: (data: any) => {
    if (!hasSystemAccess()) throw new Error('Akses Ditolak.');
    safeSaveLocalStorage(STORAGE_KEYS.USERS, data.users || []);
    safeSaveLocalStorage(STORAGE_KEYS.COMPANIES, data.companies || []);
    safeSaveLocalStorage(STORAGE_KEYS.APPLICATIONS, data.applications || []);
    if (data.logbooks) safeSaveLocalStorage(STORAGE_KEYS.LOGBOOKS, data.logbooks || []);
    if (data.adConfig) safeSaveLocalStorage(STORAGE_KEYS.AD_CONFIG, data.adConfig);
    notifyListeners();
  }
};
