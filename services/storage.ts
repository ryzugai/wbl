
import { User, Company, Application } from '../types';
import { COORDINATOR_ACCOUNT } from '../constants';

const STORAGE_KEYS = {
  USERS: 'wbl_users',
  COMPANIES: 'wbl_companies',
  APPLICATIONS: 'wbl_applications',
  SESSION: 'wbl_session'
};

// Safe ID Generator (Fallback for non-secure contexts)
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Initialize default data if empty
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
};

init();

export const StorageService = {
  // Auth
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

  // Users
  getUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  },

  createUser: async (user: Omit<User, 'id'>): Promise<User> => {
    const users = StorageService.getUsers();
    if (users.some(u => u.username === user.username)) throw new Error('Username already exists');
    
    const newUser = { ...user, id: generateId() };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return newUser;
  },

  updateUser: async (updatedUser: User): Promise<User> => {
    const users = StorageService.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index === -1) {
        // Coordinator static check
        if(updatedUser.id === COORDINATOR_ACCOUNT.id) return updatedUser;
        throw new Error('User not found');
    }
    users[index] = updatedUser;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    // Update session if it's the current user
    const currentUser = StorageService.getCurrentUser();
    if (currentUser && currentUser.id === updatedUser.id) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedUser));
    }
    return updatedUser;
  },

  // Companies
  getCompanies: (): Company[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANIES) || '[]');
  },

  createCompany: async (company: Omit<Company, 'id'>): Promise<Company> => {
    const companies = StorageService.getCompanies();
    const newCompany = { ...company, id: generateId() };
    companies.push(newCompany);
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
    return newCompany;
  },

  updateCompany: async (updatedCompany: Company): Promise<Company> => {
    const companies = StorageService.getCompanies();
    const index = companies.findIndex(c => c.id === updatedCompany.id);
    if (index === -1) throw new Error('Company not found');
    companies[index] = updatedCompany;
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
    return updatedCompany;
  },

  deleteCompany: async (id: string): Promise<void> => {
    const companies = StorageService.getCompanies();
    const filtered = companies.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(filtered));
  },

  // Applications
  getApplications: (): Application[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]');
  },

  createApplication: async (app: Omit<Application, 'id'>): Promise<Application> => {
    const apps = StorageService.getApplications();
    const newApp = { ...app, id: generateId() };
    apps.push(newApp);
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    return newApp;
  },

  updateApplication: async (updatedApp: Application): Promise<Application> => {
    const apps = StorageService.getApplications();
    const index = apps.findIndex(a => a.id === updatedApp.id);
    if (index === -1) throw new Error('Application not found');
    apps[index] = updatedApp;
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    return updatedApp;
  },

  // NEW: Full System Backup/Restore
  getFullSystemBackup: () => {
    return {
      users: JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),
      companies: JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANIES) || '[]'),
      applications: JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]'),
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
  },

  restoreFullSystem: (data: any) => {
    if (!data.users || !data.companies || !data.applications) {
      throw new Error('Format fail sandaran tidak sah.');
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(data.companies));
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(data.applications));
  }
};
