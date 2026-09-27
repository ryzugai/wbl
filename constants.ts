
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

export interface WBLCourse {
  code: string;
  name_ms: string;
  name_en: string;
  creditHours: number;
  semester: string;
}

export const DEFAULT_WBL_COURSES: WBLCourse[] = [
  {
    code: 'BTMT 3283(i)',
    name_ms: 'Analitik Perniagaan',
    name_en: 'Business Analytics',
    creditHours: 3,
    semester: 'Semester 7'
  },
  {
    code: 'BTMU 2103(i)',
    name_ms: 'Pengurusan Operasi',
    name_en: 'Operations Management',
    creditHours: 3,
    semester: 'Semester 7'
  },
  {
    code: 'BTMT 3273(i)',
    name_ms: 'Keusahawanan Digital',
    name_en: 'Digital Entrepreneurship',
    creditHours: 3,
    semester: 'Semester 7'
  },
  {
    code: 'BTMT 2113(i)',
    name_ms: 'Pengurusan Penjenamaan',
    name_en: 'Brand Management',
    creditHours: 3,
    semester: 'Semester 7'
  },
  {
    code: 'BTMU 4084(i)',
    name_ms: 'Projek Sarjana Muda II',
    name_en: 'Final Year Project II',
    creditHours: 4,
    semester: 'Semester 8'
  },
  {
    code: 'BTMU 4056(i)',
    name_ms: 'Latihan Industri (WBL)',
    name_en: 'Industrial Training (WBL)',
    creditHours: 6,
    semester: 'Semester 8'
  }
];

export const calculateUTeMGrade = (score: number): { grade: string; pointer: number; status: string } => {
  if (score >= 90) return { grade: 'A+', pointer: 4.0, status: 'Cemerlang' };
  if (score >= 80) return { grade: 'A', pointer: 4.0, status: 'Cemerlang' };
  if (score >= 75) return { grade: 'A-', pointer: 3.7, status: 'Kepujian' };
  if (score >= 70) return { grade: 'B+', pointer: 3.3, status: 'Kepujian' };
  if (score >= 65) return { grade: 'B', pointer: 3.0, status: 'Lulus' };
  if (score >= 60) return { grade: 'B-', pointer: 2.7, status: 'Lulus' };
  if (score >= 55) return { grade: 'C+', pointer: 2.3, status: 'Lulus' };
  if (score >= 50) return { grade: 'C', pointer: 2.0, status: 'Lulus' };
  if (score >= 40) return { grade: 'D', pointer: 1.0, status: 'Lulus Bersyarat' };
  return { grade: 'E', pointer: 0.0, status: 'Gagal' };
};
