
import { User, Company, Application, UserRole, AdConfig, UserActivity, Notification } from '../types';
import { COORDINATOR_ACCOUNT } from '../constants';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, writeBatch, getDoc } from 'firebase/firestore';

const STORAGE_KEYS = {
  USERS: 'wbl_users',
  COMPANIES: 'wbl_companies',
  APPLICATIONS: 'wbl_applications',
  SESSION: 'wbl_session',
  AD_CONFIG: 'wbl_ad_config',
  ACTIVITIES: 'wbl_activities',
  NOTIFICATIONS: 'wbl_notifications'
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
  syncCollection('activities', STORAGE_KEYS.ACTIVITIES);
  syncCollection('notifications', STORAGE_KEYS.NOTIFICATIONS);
  
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
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  
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
      const user = {
        ...COORDINATOR_ACCOUNT,
        last_login_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      } as unknown as User;
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
      
      await StorageService.logActivity(
        user.id || 'coordinator-id',
        user.username,
        user.role,
        user.name,
        'login',
        'Telah log masuk ke dalam sistem.',
        'Logged into the system.'
      );
      
      return user;
    }
    const users = StorageService.getUsers();
    const userIdx = users.findIndex((u: User) => u.username === username && u.password === password);
    if (userIdx !== -1) {
      const user = users[userIdx];
      if (user.is_approved === false) throw new Error('Akaun masih menunggu kelulusan.');
      
      user.last_login_at = new Date().toISOString();
      user.last_activity_at = new Date().toISOString();
      users[userIdx] = user;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
      
      if (db) {
        await setDoc(doc(db, 'users', user.id), sanitizeForFirebase(user), { merge: true });
      }
      
      await StorageService.logActivity(
        user.id,
        user.username,
        user.role,
        user.name,
        'login',
        'Telah log masuk ke dalam sistem.',
        'Logged into the system.'
      );
      
      notifyListeners();
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
    updatedUser.last_activity_at = new Date().toISOString();
    const users = StorageService.getUsers();
    const idx = users.findIndex(u => u.id === updatedUser.id);
    if (idx !== -1) {
        users[idx] = updatedUser;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        notifyListeners();
    }
    if (db) await setDoc(doc(db, 'users', updatedUser.id), sanitizeForFirebase(updatedUser), { merge: true });
    
    const curSession = getCurrentUser();
    if (curSession && curSession.id === updatedUser.id) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedUser));
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

    await StorageService.logActivity(
      updatedUser.id,
      updatedUser.username,
      updatedUser.role,
      updatedUser.name,
      actType,
      msgMs,
      msgEn
    );

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

    if (user) {
      user.last_activity_at = timestamp;
      const users = StorageService.getUsers();
      const uIdx = users.findIndex(u => u.id === user.id);
      if (uIdx !== -1) {
        users[uIdx] = user;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
      if (db) {
        await setDoc(doc(db, 'users', user.id), sanitizeForFirebase(user), { merge: true });
      }
      
      await StorageService.logActivity(
        user.id,
        user.username,
        user.role,
        user.name,
        'company_create',
        `Telah mencadangkan / menambah syarikat baharu: ${newCompany.company_name}.`,
        `Proposed / added a new company: ${newCompany.company_name}.`
      );
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
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedTotal));
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
    
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies));
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
    const user = getCurrentUser();
    const timestamp = new Date().toISOString();
    const newApp = { ...app, id: generateId() };
    const apps = StorageService.getApplications();
    apps.push(newApp as Application);
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    notifyListeners();

    if (db) await setDoc(doc(db, 'applications', newApp.id), sanitizeForFirebase(newApp));

    if (user) {
      user.last_activity_at = timestamp;
      const users = StorageService.getUsers();
      const uIdx = users.findIndex(u => u.id === user.id);
      if (uIdx !== -1) {
        users[uIdx] = user;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
      if (db) {
        await setDoc(doc(db, 'users', user.id), sanitizeForFirebase(user), { merge: true });
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
    return newApp as Application;
  },

  updateApplication: async (updatedApp: Application): Promise<Application> => {
    const apps = StorageService.getApplications();
    const idx = apps.findIndex(a => a.id === updatedApp.id);
    const oldApp = idx !== -1 ? apps[idx] : null;

    if (idx !== -1) {
        apps[idx] = updatedApp;
        localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
        notifyListeners();
    }
    if (db) await setDoc(doc(db, 'applications', updatedApp.id), sanitizeForFirebase(updatedApp), { merge: true });

    // Track user action
    const user = getCurrentUser();
    const timestamp = new Date().toISOString();

    if (user) {
      user.last_activity_at = timestamp;
      const users = StorageService.getUsers();
      const uIdx = users.findIndex(u => u.id === user.id);
      if (uIdx !== -1) {
        users[uIdx] = user;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
      if (db) {
        await setDoc(doc(db, 'users', user.id), sanitizeForFirebase(user), { merge: true });
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
    const apps = StorageService.getApplications().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    notifyListeners();
    if (db) await deleteDoc(doc(db, 'applications', id));
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
    const trimmed = activities.slice(0, 200);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(trimmed));
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
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
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
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
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
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifications));
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
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    notifyListeners();
    if (db) await deleteDoc(doc(db, 'notifications', id));
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
