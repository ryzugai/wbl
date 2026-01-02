
import { UserRole } from './types';

export const MALAYSIAN_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan',
  'Pahang', 'Pulau Pinang', 'Perak', 'Perlis', 'Sabah',
  'Sarawak', 'Selangor', 'Terengganu', 'Kuala Lumpur', 
  'Labuan', 'Putrajaya'
];

export const getRoleLabels = (lang: 'ms' | 'en'): Record<UserRole, string> => ({
  [UserRole.COORDINATOR]: lang === 'ms' ? 'Penyelaras' : 'Coordinator',
  [UserRole.LECTURER]: lang === 'ms' ? 'Pensyarah' : 'Lecturer',
  [UserRole.TRAINER]: lang === 'ms' ? 'Jurulatih Industri' : 'Industry Trainer',
  [UserRole.SUPERVISOR]: lang === 'ms' ? 'Penyelia Industri' : 'Industry Supervisor',
  [UserRole.STUDENT]: lang === 'ms' ? 'Pelajar' : 'Student'
});

// For legacy code support
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.COORDINATOR]: 'Penyelaras (Coordinator)',
  [UserRole.LECTURER]: 'Pensyarah (Lecturer)',
  [UserRole.TRAINER]: 'Jurulatih Industri (Trainer)',
  [UserRole.SUPERVISOR]: 'Penyelia Industri (Supervisor)',
  [UserRole.STUDENT]: 'Pelajar (Student)'
};

export const COORDINATOR_ACCOUNT = {
  username: 'guzairy',
  password: 'mie136bie175',
  role: UserRole.COORDINATOR,
  name: 'Dr. Mohd Guzairy bin Abd Ghani',
  email: 'guzairy@utem.edu.my',
  phone: '0123456789',
  id: 'coordinator_guzairy'
};
