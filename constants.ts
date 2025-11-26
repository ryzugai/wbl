import { UserRole } from './types';

export const MALAYSIAN_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan',
  'Pahang', 'Pulau Pinang', 'Perak', 'Perlis', 'Sabah',
  'Sarawak', 'Selangor', 'Terengganu', 'Kuala Lumpur', 
  'Labuan', 'Putrajaya'
];

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