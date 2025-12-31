
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
  is_jkwbl?: boolean; // New: Jawatankuasa WBL status
  // Student fields
  program?: string;
  matric_no?: string;
  ic_no?: string;
  address?: string; // Added residential address
  // Staff fields
  staff_id?: string;
  // Industry fields
  company_affiliation?: string;
  company_position?: string;
  academic_level?: string; // New: Highest Academic Level
  experience_years?: number; // New: Years of Experience
  has_dual_role?: boolean;
  
  // System fields
  is_approved?: boolean; // New: Approval status for Trainers
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
  has_previous_wbl_students?: boolean; // New: Track if company has history with WBL
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
  // Supervisor
  faculty_supervisor_id?: string;
  faculty_supervisor_name?: string;
  faculty_supervisor_staff_id?: string;
  // Reply Form
  reply_form_image?: string; // Storing status text or base64
  reply_form_uploaded_at?: string;
  reply_form_verified: boolean;
  reply_form_verified_by?: string;
  reply_form_verified_at?: string;
  
  created_by: string; // student username
  created_at: string;
}
