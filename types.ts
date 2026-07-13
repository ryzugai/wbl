
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

