
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
  profile_image?: string;
  // Supervisor assigned directly to student
  faculty_supervisor_id?: string;
  faculty_supervisor_name?: string;
  faculty_supervisor_staff_id?: string;
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
  created_at: string;
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
  reply_form_image?: string;
  reply_form_uploaded_at?: string;
  reply_form_verified: boolean;
  reply_form_verified_by?: string;
  reply_form_verified_at?: string;
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
