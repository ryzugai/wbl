
export enum UserRole {
  COORDINATOR = 'coordinator',
  LECTURER = 'lecturer',
  TRAINER = 'trainer',
  SUPERVISOR = 'supervisor',
  STUDENT = 'student'
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  is_jkwbl?: boolean;
  program?: string;
  matric_no?: string;
  ic_no?: string;
  address?: string;
  staff_id?: string;
  company_affiliation?: string;
  company_position?: string;
  academic_level?: string;
  experience_years?: number;
  has_dual_role?: boolean;
  is_approved?: boolean;
  is_active?: boolean;
  profile_image?: string;
  // Supervisor assigned directly to student
  faculty_supervisor_id?: string;
  faculty_supervisor_name?: string;
  faculty_supervisor_staff_id?: string;
  faculty_supervisor_email?: string;
  // Industry Trainer / Jurulatih Industri assigned directly to student
  industry_trainer_id?: string;
  industry_trainer_name?: string;
  industry_trainer_position?: string;
  industry_trainer_company?: string;
  industry_trainer_email?: string;
  industry_trainer_phone?: string;
  // Teaching Subjects (for Lecturers)
  teaching_subjects?: string; // JSON string array
  // Resume Data Fields
  resume_about?: string;
  resume_skills_soft?: string; // Stored as JSON string [{name, level}]
  resume_skills_tech?: string; // Stored as JSON string [{name, level}]
  resume_languages?: string;   // Stored as JSON string [{name, level}]
  resume_education?: string;    // Format JSON stringified
  resume_projects?: string;     // Format JSON stringified
  resume_work_experience?: string; 
  resume_cgpa?: string;
  resume_courses?: string;
  enrolled_courses?: string[];
  last_login_at?: string;
  last_activity_at?: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  username: string;
  userRole: UserRole;
  name: string;
  type: string;
  description_ms: string;
  description_en: string;
  timestamp: string;
}

export interface Company {
  id: string;
  company_name: string;
  company_district: string;
  company_state: string;
  company_address: string;
  company_industry: string;
  company_contact_person: string;
  company_contact_email: string;
  company_contact_phone: string;
  has_mou: boolean;
  mou_type?: 'MoU' | 'LOI';
  has_previous_wbl_students?: boolean;
  agreed_wbl?: boolean;
  is_approved: boolean;
  created_by_role?: UserRole;
  created_at: string;
  updated_at?: string;
}

export interface Application {
  id: string;
  student_name: string;
  student_id: string;
  student_email: string;
  student_program: string;
  company_name: string;
  company_district: string;
  company_state: string;
  application_status: 'Menunggu' | 'Diluluskan' | 'Ditolak';
  start_date: string;
  faculty_supervisor_id?: string;
  faculty_supervisor_name?: string;
  faculty_supervisor_staff_id?: string;
  faculty_supervisor_email?: string;
  reply_form_image?: string;
  reply_form_uploaded_at?: string;
  reply_form_verified: boolean;
  reply_form_verified_by?: string;
  reply_form_verified_at?: string;
  reply_form_uploaded_tick?: boolean;
  offer_letter_image?: string;
  offer_letter_uploaded_at?: string;
  offer_letter_uploaded_tick?: boolean;
  offer_letter_verified?: boolean;
  offer_letter_verified_by?: string;
  offer_letter_verified_at?: string;
  application_letter_image?: string;
  application_letter_uploaded_at?: string;
  application_letter_uploaded_tick?: boolean;
  application_letter_verified?: boolean;
  application_letter_verified_by?: string;
  application_letter_verified_at?: string;
  student_preferred?: boolean;
  student_has_offer?: boolean;
  is_emailed?: boolean;
  emailed_at?: string;
  created_by: string;
  created_at: string;
}

export interface AdItem {
  id: string;
  imageUrl: string;
  destinationUrl: string;
}

export interface AdConfig {
  items: AdItem[];
  isEnabled: boolean;
}

export interface Notification {
  id: string;
  recipient_id: string; // 'coordinator' or user.id
  recipient_role?: UserRole;
  title_ms: string;
  title_en: string;
  message_ms: string;
  message_en: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_matric?: string;
  application_id?: string;
}

export interface DailyLogEntry {
  id: string;
  day: string; // e.g. 'Isnin' | 'Selasa' | 'Rabu' | 'Khamis' | 'Jumaat' | 'Sabtu' | 'Ahad'
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "08:30"
  endTime: string; // e.g. "17:30"
  department: string; // Bahagian / Jabatan / Seksyen
  tasks: string; // Ringkasan tugasan & aktiviti harian
  learningOutcomes: string; // Kemahiran & pengetahuan / hasil pembelajaran yang diperoleh
  toolsUsed?: string; // Peralatan, mesin, perisian, atau sistem yang digunakan
  remarks?: string; // Catatan tambahan
}

export type LogbookStatus = 'draft' | 'submitted' | 'verified' | 'revision';

export interface WeeklyLogbook {
  id: string;
  studentId: string;
  studentName: string;
  studentMatric: string;
  studentProgram: string;
  companyName: string;
  companyAddress?: string;
  weekNumber: number; // 1 to 52
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalHours?: number;
  entries: DailyLogEntry[];
  weeklySummary: string; // Refleksi Mingguan Pelajar (pencapaian, cabaran & penyelesaian)
  status: LogbookStatus;
  submittedAt?: string;
  // Pengesahan Jurulatih Industri
  verifiedByTrainerId?: string;
  trainerName?: string;
  trainerPosition?: string;
  trainerCompany?: string;
  trainerEmail?: string;
  trainerPhone?: string;
  trainerRating?: 'cemerlang' | 'baik' | 'memuaskan' | 'perlu_bimbingan';
  trainerComments?: string;
  verifiedAt?: string;
  revisionNotes?: string;
  // Semakan & Ulasan Penyelia Fakulti / Universiti (Supervisor)
  supervisorId?: string;
  supervisorName?: string;
  supervisorStaffId?: string;
  supervisorComments?: string;
  supervisorReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type EvaluationStatus = 'draft' | 'submitted_by_trainer' | 'verified_by_lecturer' | 'revision_requested';

export interface CourseLecturerAssignment {
  id: string;
  courseCode: string;
  courseName: string;
  lecturerId: string;
  lecturerName: string;
  lecturerStaffId?: string;
  lecturerEmail?: string;
  semester?: string;
  assignedStudentIds?: string[]; // Optional specific students, or cohort-wide if empty
  updatedAt: string;
}

export interface StudentEvaluationCriteriaScores {
  // Bahagian A: Kemahiran Teknikal & Pelaksanaan Tugasan (40 markah)
  taskKnowledge: number;       // 0 - 10
  workQuality: number;         // 0 - 10
  problemSolving: number;      // 0 - 10
  toolCompetency: number;      // 0 - 10
  // Bahagian B: Kemahiran Insaniah & Profesionalisme (40 markah)
  punctuality: number;         // 0 - 10
  communication: number;       // 0 - 10
  workEthics: number;          // 0 - 10
  adaptability: number;        // 0 - 10
  // Bahagian C: Buku Log & Dokumentasi (20 markah)
  logbookQuality: number;      // 0 - 10
  reflectionQuality: number;   // 0 - 10
}

export type EvaluationFormType = 'weekly' | 'comprehensive';

export interface StudentEvaluation {
  id: string;
  studentId: string;
  studentName: string;
  studentMatric: string;
  studentProgram: string;
  companyName: string;
  companyAddress?: string;
  courseCode: string;
  courseName: string;
  // Type: Weekly Task (Week 1-5) or Full Portfolio / Course Evaluation
  evaluationType?: EvaluationFormType;
  weekNumber?: number; // 1, 2, 3, 4, 5
  weeklyTaskTitle?: string;
  weeklyScores?: {
    area1: number; // 1 - 4
    area2: number; // 1 - 4
    area3: number; // 1 - 4
    total: number; // / 12
  };
  // Detailed Rubric scores mapping (criterion ID -> score 1 to 4)
  rubricScores?: Record<string, number>;
  jiWeightedScore?: number;
  tpfWeightedScore?: number;
  // Pensyarah Kursus
  lecturerId: string;
  lecturerName: string;
  lecturerStaffId?: string;
  lecturerEmail?: string;
  // Jurulatih Industri
  trainerId: string;
  trainerName: string;
  trainerPosition?: string;
  trainerCompany?: string;
  trainerEmail?: string;
  trainerPhone?: string;
  // Markah mengikut rubrik
  scores: StudentEvaluationCriteriaScores;
  technicalSubtotal: number;    // / 40
  softSkillsSubtotal: number;   // / 40
  logbookSubtotal: number;      // / 20
  totalScore: number;           // / 100
  grade: string;                // A+, A, A-, B+, etc.
  // Ulasan Jurulatih Industri
  trainerComments: string;
  trainerRecommendation?: string;
  submittedAt?: string;
  // Pengesahan Pensyarah Kursus
  status: EvaluationStatus;
  lecturerComments?: string;
  verifiedAt?: string;
  verifiedByLecturerName?: string;
  revisionNotes?: string;
  createdAt: string;
  updatedAt: string;
}


