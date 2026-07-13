
import React, { useState } from 'react';
import { User, Application, UserRole } from '../types';
import { UserPlus, UserMinus, UserCheck, Edit, Trash2, FileText, Download, FileSpreadsheet, Clock, Key, Handshake, ShieldCheck, CheckCircle2, Infinity, Mail, Phone, MapPin, GraduationCap, Briefcase, Code, Globe, Languages, Star, BookOpen } from 'lucide-react';
import { Modal } from '../components/Modal';
import { generateResume } from '../utils/resumeGenerator';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { Language, t } from '../translations';
import { getRoleLabels } from '../constants';

interface StudentsProps {
  users: User[];
  applications: Application[];
  currentUser: User;
  onUpdateApplication: (app: Application) => Promise<void>;
  onUpdateUser: (user: User) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  language: Language;
}

export const Students: React.FC<StudentsProps> = ({ users, applications, currentUser, onUpdateApplication, onUpdateUser, onDeleteUser, language }) => {
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [supervisorId, setSupervisorId] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  
  // Password Reset State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resettingUser, setResettingUser] = useState<User | null>(null);

  // Student Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<any | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'profile' | 'resume'>('profile');

  const parseJSON = (str: string | undefined, def: any = []) => {
    if (!str) return def;
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : def;
    } catch (e) {
      return def;
    }
  };

  const getFullProgramName = (program: string | undefined): string => {
    if (!program) return '-';
    const cleanCode = program.trim().toUpperCase();
    const mapping: Record<string, string> = {
      'BMM': 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
      'BMMW': 'Ijazah Sarjana Muda Teknologi Kejuruteraan Pembuatan (WBL) dengan Kepujian',
      'BMMT': 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian (WBL)',
      'BMMH': 'Ijazah Sarjana Muda Pengurusan Teknologi (Pengurusan Inovasi) dengan Kepujian',
      'BMMG': 'Ijazah Sarjana Muda Pengurusan Teknologi (Pengurusan Teknologi Tinggi) dengan Kepujian',
      'BITD': 'Ijazah Sarjana Muda Sains Komputer (Pembangunan Perisian) dengan Kepujian',
      'BITS': 'Ijazah Sarjana Muda Sains Komputer (Keselamatan Komputer) dengan Kepujian',
      'BITC': 'Ijazah Sarjana Muda Sains Komputer (Rangkaian Komputer) dengan Kepujian',
      'BITM': 'Ijazah Sarjana Muda Sains Komputer (Media Interaktif) dengan Kepujian',
      'BITI': 'Ijazah Sarjana Muda Sains Komputer (Kecerdasan Buatan) dengan Kepujian',
      'BMMD': 'Ijazah Sarjana Muda Pengurusan Teknologi (Pemasaran Digital) dengan Kepujian',
      'BMMA': 'Ijazah Sarjana Muda Pengurusan Teknologi (Analitik Data) dengan Kepujian',
    };
    return mapping[cleanCode] || program;
  };

  const students = users.filter(u => u.role === UserRole.STUDENT);
  const lecturers = users.filter(u => u.role === UserRole.LECTURER);
  
  const isCoordinator = currentUser.role === UserRole.COORDINATOR;
  const isJKWBL = currentUser.is_jkwbl === true;
  const isLecturer = currentUser.role === UserRole.LECTURER;
  const hasSystemAccess = isCoordinator || isJKWBL;

  // Penyelaras ATAU Pensyarah JKWBL boleh pilih pelajar sendiri
  const canSelfAssign = isCoordinator || (isLecturer && isJKWBL);

  // Kira kuota semasa currentUser
  const mySupervisedCount = users.filter(u => 
    u.role === UserRole.STUDENT && u.faculty_supervisor_id === currentUser.id
  ).length;

  const studentList = students.map(student => {
    const studentApps = applications.filter(a => a.student_id === student.matric_no || a.created_by === student.username);
    const approvedApp = studentApps.find(a => a.application_status === 'Diluluskan');
    const pendingApp = studentApps.find(a => a.application_status === 'Menunggu');
    const primaryApp = approvedApp || pendingApp;
    
    if (currentUser.role === UserRole.TRAINER || currentUser.role === UserRole.SUPERVISOR) {
        if (!currentUser.company_affiliation) return null;
        if (!approvedApp || approvedApp.company_name !== currentUser.company_affiliation) {
            return null;
        }
    }
    const isAllDocsVerified = approvedApp ? (
      approvedApp.application_letter_verified === true &&
      approvedApp.reply_form_verified === true &&
      approvedApp.offer_letter_verified === true
    ) : false;
    return { ...student, placement: primaryApp, studentApps, isAllDocsVerified };
  }).filter(Boolean) as (User & { placement?: Application; studentApps?: Application[]; isAllDocsVerified?: boolean })[];

  const exportToExcel = () => {
    try {
      const dataToExport = studentList.map(s => ({
        [t(language, 'fullName')]: s.name,
        [t(language, 'matricNo')]: s.matric_no,
        [t(language, 'icNo')]: s.ic_no,
        [t(language, 'program')]: s.program,
        'Email': s.email,
        'Phone': s.phone,
        'Status': s.placement ? (s.placement.application_status === 'Diluluskan' ? (language === 'ms' ? 'Sudah Ditempatkan' : 'Placed') : (language === 'ms' ? 'Menunggu Kelulusan' : 'Pending')) : (language === 'ms' ? 'Belum Ditempatkan' : 'Not Placed'),
        'Company': s.placement?.company_name || '-',
        'Supervisor': s.placement?.faculty_supervisor_name || s.faculty_supervisor_name || '-'
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'WBL_Students');
      XLSX.writeFile(workbook, `WBL_Students_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(language === 'ms' ? 'Eksport Berjaya!' : 'Export Success!');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleAssignClick = (student: any) => {
    if (!isCoordinator) {
        toast.error(language === 'ms' ? "Hanya Penyelaras boleh menugaskan penyelia." : "Only Coordinators can assign supervisors.");
        return;
    }
    setSelectedStudent(student);
    const currentSupId = student.faculty_supervisor_id || student.placement?.faculty_supervisor_id || '';
    setSupervisorId(currentSupId);
    setIsAssignModalOpen(true);
  };

  const handleUnassignSupervisor = async (student: any) => {
    if (!isCoordinator) return;
    
    if (!confirm(language === 'ms' ? `Adakah anda pasti ingin membatalkan penugasan penyelia bagi pelajar ${student.name}?` : `Are you sure you want to cancel the supervisor assignment for ${student.name}?`)) return;

    const loadingToast = toast.loading(language === 'ms' ? "Membatalkan penugasan..." : "Cancelling assignment...");

    try {
        const { placement, ...studentClean } = student;
        
        // 1. Reset Profil Pelajar
        await onUpdateUser({
            ...studentClean,
            faculty_supervisor_id: "",
            faculty_supervisor_name: "",
            faculty_supervisor_staff_id: "",
            faculty_supervisor_email: ""
        });

        // 2. Reset SEMUA permohonan pelajar tersebut
        const studentApps = applications.filter(a => 
            (a.student_id === student.matric_no || a.created_by === student.username)
        );
        
        const updatePromises = studentApps.map(app => onUpdateApplication({
            ...app,
            faculty_supervisor_id: "",
            faculty_supervisor_name: "",
            faculty_supervisor_staff_id: "",
            faculty_supervisor_email: ""
        }));

        await Promise.all(updatePromises);

        toast.success(language === 'ms' ? "Penugasan telah dibatalkan." : "Assignment has been cancelled.", { id: loadingToast });
    } catch (e: any) {
        console.error(e);
        toast.error(e.message || "Gagal", { id: loadingToast });
    }
  };

  const handleSelfAssign = async (student: any) => {
    if (!canSelfAssign) return;

    // 1. Semakan Kuota (Penyelaras tiada had, JKWBL had 5)
    if (!isCoordinator && mySupervisedCount >= 5) {
        toast.error(language === 'ms' ? "Had kuota 5 pelajar telah dicapai." : "Maximum quota of 5 students reached.");
        return;
    }

    if (!confirm(t(language, 'claimConfirm'))) return;

    const loadingToast = toast.loading(language === 'ms' ? "Menugaskan pelajar kepada anda..." : "Assigning student to you...");

    try {
        // 2. Pembersihan Data Pelajar
        const { placement, ...studentClean } = student;
        
        // 3. Kemaskini Profil Pelajar
        await onUpdateUser({
            ...studentClean,
            faculty_supervisor_id: currentUser.id,
            faculty_supervisor_name: currentUser.name,
            faculty_supervisor_staff_id: currentUser.staff_id || "",
            faculty_supervisor_email: currentUser.email || ""
        });

        // 4. Kemaskini SEMUA permohonan pelajar tersebut
        const studentApps = applications.filter(a => 
            (a.student_id === student.matric_no || a.created_by === student.username)
        );
        
        const updatePromises = studentApps.map(app => onUpdateApplication({
            ...app,
            faculty_supervisor_id: currentUser.id,
            faculty_supervisor_name: currentUser.name,
            faculty_supervisor_staff_id: currentUser.staff_id || "",
            faculty_supervisor_email: currentUser.email || ""
        }));

        await Promise.all(updatePromises);

        toast.success(language === 'ms' ? `Berjaya! ${studentClean.name} kini dalam seliaan anda.` : `Success! ${studentClean.name} added to your list.`, { id: loadingToast });
    } catch (e: any) {
        console.error(e);
        toast.error(e.message || "Gagal kemaskini", { id: loadingToast });
    }
  };

  const handleSaveSupervisor = async () => {
    if (!selectedStudent || !supervisorId) return;
    const lecturer = lecturers.find(l => l.id === supervisorId);
    if (!lecturer) return;
    
    const loadingToast = toast.loading(language === 'ms' ? "Menugaskan penyelia..." : "Assigning supervisor...");
    
    try {
        const { placement, ...studentClean } = selectedStudent as any;

        const updatedStudent: User = {
            ...studentClean,
            faculty_supervisor_id: lecturer.id,
            faculty_supervisor_name: lecturer.name,
            faculty_supervisor_staff_id: lecturer.staff_id || "",
            faculty_supervisor_email: lecturer.email || ""
        };

        await onUpdateUser(updatedStudent);

        const studentApps = applications.filter(a => 
            (a.student_id === selectedStudent.matric_no || a.created_by === selectedStudent.username)
        );
        
        const updatePromises = studentApps.map(app => onUpdateApplication({
            ...app,
            faculty_supervisor_id: lecturer.id,
            faculty_supervisor_name: lecturer.name,
            faculty_supervisor_staff_id: lecturer.staff_id || "",
            faculty_supervisor_email: lecturer.email || ""
        }));

        await Promise.all(updatePromises);

        toast.success(language === 'ms' ? `Penyelia ${lecturer.name} ditugaskan.` : `Supervisor ${lecturer.name} assigned.`, { id: loadingToast });
        setIsAssignModalOpen(false);
    } catch (e: any) {
        toast.error(e.message, { id: loadingToast });
    }
  };

  const handleResetPassword = async () => {
    if (!resettingUser || !newPassword) return;
    try {
      await onUpdateUser({ ...resettingUser, password: newPassword });
      toast.success(language === 'ms' ? 'Kata laluan berjaya dikemaskini' : 'Password updated successfully');
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setResettingUser(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t(language, 'studentTitle')}</h2>
          <p className="text-sm text-slate-500 mt-1">{t(language, 'studentDesc')}</p>
        </div>
        <div className="flex flex-col md:flex-row items-end md:items-center gap-3 w-full md:w-auto">
          {canSelfAssign && (
              <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center gap-2 ${isCoordinator ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                  {isCoordinator ? (
                      <>Seliaan Saya: {mySupervisedCount} <Infinity size={14} className="inline" /></>
                  ) : (
                      <>Kuota Anda: {mySupervisedCount}/5</>
                  )}
              </div>
          )}
          {hasSystemAccess && (
            <button onClick={exportToExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm font-bold text-sm">
              <FileSpreadsheet size={18} /> {t(language, 'exportExcel')}
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-sm text-slate-600">{t(language, 'appStudent')}</th>
                <th className="p-4 font-semibold text-sm text-slate-600">{t(language, 'program')}</th>
                <th className="p-4 font-semibold text-sm text-slate-600">{language === 'ms' ? 'Penempatan' : 'Placement'}</th>
                <th className="p-4 font-semibold text-sm text-slate-600">{language === 'ms' ? 'Penyelia Fakulti' : 'Faculty Sup.'}</th>
                <th className="p-4 font-semibold text-sm text-slate-600 text-center">{t(language, 'actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentList.length === 0 && (
                <tr>
                   <td colSpan={5} className="p-8 text-center text-slate-500">{t(language, 'noRecords')}</td>
                </tr>
              )}
              {studentList.map((item: any) => {
                const displaySupName = item.faculty_supervisor_name || item.placement?.faculty_supervisor_name;
                const isApproved = item.placement?.application_status === 'Diluluskan';
                const isPending = item.placement?.application_status === 'Menunggu';
                const hasResume = !!(item.resume_about || item.resume_education || item.resume_skills_soft);
                
                // Semakan status pemilihan oleh CURRENT USER
                const isMyStudent = item.faculty_supervisor_id === currentUser.id;

                const activeNames = [
                  "nor afizzi aqimi bin norihsan",
                  "nurul izzati binti yusri",
                  "yap yan zi",
                  "ahmad rifa'at bin rosdi rifaa'at",
                  "muhammad arif izzuddin bin mad nasir",
                  "auni haziqah binti haswadi",
                  "irsyad bin ahmad nizam",
                  "joviar khor jian h’ng",
                  "joviar khor jian h'ng",
                  "muhammad nor hafiz ahmad saidi",
                  "muhammad fikri bin hamzah",
                  "intan natasha binti mohd farino",
                  "wong wen hui",
                  "teoh yi xian",
                  "muhammad alif bin md farid",
                  "laila suraya bt adnan",
                  "laila suraya binti adnan",
                  "nur syahirah binti mohd nor radzief",
                  "putri zainab binti dzainuddin",
                  "noor suhaila binti mohamed",
                  "ker guo fuk",
                  "siti nurnazura binti mohd nahar",
                  "danial haikal bin abdul latif"
                ];
                const normalizedName = item.name.toLowerCase().trim();
                const matchedActiveStatic = activeNames.some(activeName => {
                  const cleanActive = activeName.replace(/[^a-z0-9]/g, '');
                  const cleanInput = normalizedName.replace(/[^a-z0-9]/g, '');
                  return cleanInput === cleanActive || cleanInput.includes(cleanActive) || cleanActive.includes(cleanInput);
                });
                const isActive = item.is_active !== undefined ? item.is_active : matchedActiveStatic;

                return (
                  <tr key={item.id} className="hover:bg-slate-50 group transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Student Profile Image / Avatar */}
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 shadow-md">
                          {item.profile_image ? (
                            <img 
                              src={item.profile_image} 
                              alt={item.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="font-black text-indigo-600 text-2xl">
                              {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => { setViewingStudent(item); setIsDetailModalOpen(true); }}
                              className="text-left font-extrabold text-slate-900 hover:text-indigo-600 hover:underline transition-all text-sm md:text-base"
                            >
                              {item.name}
                            </button>
                            {isActive ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                AKTIF
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                TIDAK AKTIF
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{item.matric_no}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-700 max-w-md break-words font-medium">
                      {getFullProgramName(item.program)}
                    </td>
                    <td className="p-4">
                      {item.isAllDocsVerified ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white border border-emerald-700 shadow-sm">
                            <span className="text-white">✓</span> {item.placement?.company_name}
                          </span>
                          <span className="block text-[10px] text-emerald-600 font-semibold italic">
                            {language === 'ms' ? 'Dokumen Lengkap & Disahkan' : 'All Docs Verified'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5 max-w-[240px]">
                          {item.studentApps && item.studentApps.length > 0 ? (
                            item.studentApps.map((app: any) => {
                              const isPreferred = app.student_preferred;
                              return (
                                <div 
                                  key={app.id} 
                                  className={`px-2 py-1 rounded-lg text-xs font-semibold border flex flex-col gap-0.5 ${
                                    isPreferred 
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' 
                                      : 'bg-slate-50 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="truncate font-bold">{app.company_name}</span>
                                    {isPreferred && (
                                      <span className="shrink-0 text-[8px] bg-emerald-600 text-white px-1 py-0.2 rounded font-black uppercase">
                                        PILIHAN
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between gap-1 text-[9px] text-slate-500">
                                    <span>
                                      Status: {app.application_status}
                                    </span>
                                    {/* Document Status Check indicator */}
                                    <span className="text-[8px] text-slate-400">
                                      Docs: {[
                                        app.application_letter_verified ? '✓' : '✗',
                                        app.reply_form_verified ? '✓' : '✗',
                                        app.offer_letter_verified ? '✓' : '✗'
                                      ].join('/')}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              {language === 'ms' ? 'Tiada Permohonan' : 'No Applications'}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                        {displaySupName ? (
                            <div className={`flex items-center gap-2 ${isMyStudent ? 'text-green-700 font-black' : 'text-blue-700'}`}>
                                {isMyStudent ? <CheckCircle2 size={16} /> : <UserCheck size={16} />}
                                <span className="text-xs font-bold">{displaySupName} {isMyStudent && '(Anda)'}</span>
                            </div>
                        ) : (
                            <span className="text-slate-400 italic text-xs">{language === 'ms' ? 'Belum ditugaskan' : 'Not assigned'}</span>
                        )}
                    </td>
                    <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => generateResume(item, language, 'modern-blue', users)} 
                            className={`p-2 rounded-lg transition-colors ${
                                hasResume 
                                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                            }`}
                            title={hasResume ? "Lihat Resume" : "Resume Belum Lengkap"}
                          >
                              <FileText size={18} />
                          </button>

                          {/* ACTION FOR COORDINATOR OR JKWBL LECTURERS: SELF ASSIGN */}
                          {canSelfAssign && (
                              isMyStudent ? (
                                  <button 
                                    disabled
                                    className="px-3 py-2 bg-green-600 text-white rounded-lg shadow-md flex items-center gap-1.5 border-2 border-green-400 transition-all scale-105" 
                                  >
                                      <CheckCircle2 size={16} />
                                      <span className="text-[10px] font-black uppercase tracking-tight">{t(language, 'studentClaimed')}</span>
                                  </button>
                              ) : !displaySupName && (
                                  <button 
                                    onClick={() => handleSelfAssign(item)} 
                                    disabled={!isCoordinator && mySupervisedCount >= 5}
                                    className={`px-3 py-2 text-white rounded-lg shadow-sm transition-all flex items-center gap-1 active:scale-95 border-2 ${
                                        (!isCoordinator && mySupervisedCount >= 5)
                                        ? 'bg-slate-300 border-slate-400 cursor-not-allowed' 
                                        : 'bg-indigo-600 hover:bg-indigo-700 border-indigo-400'
                                    }`} 
                                    title={!isCoordinator && mySupervisedCount >= 5 ? "Kuota Maksimum 5 Pelajar telah dipenuhi" : "Pilih Sebagai Pelajar Seliaan Saya"}
                                  >
                                      <ShieldCheck size={16} />
                                      <span className="text-[10px] font-bold uppercase">{t(language, 'claimStudent')}</span>
                                  </button>
                              )
                          )}

                          {isCoordinator && (
                              <>
                                <button onClick={() => handleAssignClick(item)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 shadow-sm" title={t(language, 'assignSup')}>
                                    <UserPlus size={18} />
                                </button>
                                {displaySupName && (
                                    <button 
                                        onClick={() => handleUnassignSupervisor(item)} 
                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 shadow-sm" 
                                        title={language === 'ms' ? "Batal Penugasan Penyelia" : "Cancel Supervisor Assignment"}
                                    >
                                        <UserMinus size={18} />
                                    </button>
                                )}
                              </>
                          )}
                          {isCoordinator && (
                              <>
                                  <button onClick={() => { setResettingUser({...item}); setIsPasswordModalOpen(true); }} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200" title={t(language, 'resetPassword')}>
                                      <Key size={18} />
                                  </button>
                                  <button onClick={() => { setEditingStudent({...item}); setIsEditModalOpen(true); }} className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100" title={t(language, 'editUser')}>
                                      <Edit size={18} />
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      const newStatus = !isActive;
                                      const { placement, ...cleanItem } = item;
                                      await onUpdateUser({
                                        ...cleanItem,
                                        is_active: newStatus
                                      });
                                      toast.success(language === 'ms' 
                                        ? `Status aktif ${item.name} telah dikemaskini!` 
                                        : `Active status for ${item.name} updated!`
                                      );
                                    }}
                                    className={`p-2 rounded-lg transition-colors border ${
                                      isActive 
                                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200' 
                                        : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200'
                                    }`}
                                    title={isActive ? (language === 'ms' ? "Nyahaktif Pelajar" : "Deactivate Student") : (language === 'ms' ? "Aktifkan Pelajar" : "Activate Student")}
                                  >
                                    {isActive ? <UserCheck size={18} /> : <UserMinus size={18} />}
                                  </button>
                                  <button onClick={() => { if(confirm('Hapus pengguna?')) onDeleteUser(item.id); }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title={t(language, 'deleteUser')}>
                                      <Trash2 size={18} />
                                  </button>
                              </>
                          )}
                        </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title={t(language, 'resetPassword')}>
        <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600">{t(language, 'fullName')}: <strong>{resettingUser?.name}</strong></p>
                <p className="text-xs text-slate-500">{t(language, 'username')}: {resettingUser?.username}</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t(language, 'newPassword')}</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="********"
                />
            </div>
            <button 
              onClick={handleResetPassword} 
              disabled={!newPassword} 
              className="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:bg-slate-300"
            >
                {t(language, 'save')}
            </button>
        </div>
      </Modal>

      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={t(language, 'assignSup')}>
          <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600">{t(language, 'appStudent')}: <strong>{selectedStudent?.name}</strong></p>
                  <p className="text-xs text-slate-500">{selectedStudent?.matric_no}</p>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'ms' ? 'Pilih Pensyarah' : 'Select Lecturer'}</label>
                  <select value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)} className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900">
                      <option value="">-- {language === 'ms' ? 'Pilih' : 'Select'} --</option>
                      {lecturers.map(lec => <option key={lec.id} value={lec.id}>{lec.name}</option>)}
                  </select>
              </div>
              <button onClick={handleSaveSupervisor} disabled={!supervisorId} className="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">
                  {t(language, 'save')}
              </button>
          </div>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={t(language, 'editUser')}>
          {editingStudent && (
              <form onSubmit={async (e) => { e.preventDefault(); await onUpdateUser(editingStudent); setIsEditModalOpen(false); }} className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t(language, 'fullName')}</label>
                      <input type="text" className="w-full p-2 border border-slate-300 rounded" value={editingStudent.name} onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})} required />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t(language, 'matricNo')}</label>
                      <input type="text" className="w-full p-2 border border-slate-300 rounded" value={editingStudent.matric_no || ''} onChange={(e) => setEditingStudent({...editingStudent, matric_no: e.target.value})} required />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">{t(language, 'save')}</button>
              </form>
          )}
      </Modal>

      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => { setIsDetailModalOpen(false); setViewingStudent(null); }} 
        title={language === 'ms' ? 'Butiran Lengkap Pelajar' : 'Student Full Details'}
      >
        {viewingStudent && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
            {/* Header / Profile Summary Card */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-5">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-200 bg-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                {viewingStudent.profile_image ? (
                  <img 
                    src={viewingStudent.profile_image} 
                    alt={viewingStudent.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="font-black text-indigo-600 text-3xl">
                    {viewingStudent.name ? viewingStudent.name.charAt(0).toUpperCase() : '?'}
                  </span>
                )}
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h3 className="text-xl font-black text-slate-900 leading-tight">{viewingStudent.name}</h3>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded">
                    {viewingStudent.matric_no || (language === 'ms' ? 'Tiada No Matrik' : 'No Matric')}
                  </span>
                  {viewingStudent.is_active !== false ? (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {language === 'ms' ? 'Aktif' : 'Active'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full">
                      {language === 'ms' ? 'Tidak Aktif' : 'Inactive'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium">{getFullProgramName(viewingStudent.program)}</p>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveDetailTab('profile')}
                className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition-all ${
                  activeDetailTab === 'profile'
                    ? 'border-indigo-600 text-indigo-600 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {language === 'ms' ? 'Profil & Penempatan' : 'Profile & Placement'}
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('resume')}
                className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition-all ${
                  activeDetailTab === 'resume'
                    ? 'border-indigo-600 text-indigo-600 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {language === 'ms' ? 'Resume & Kemahiran' : 'Resume & Skills'}
              </button>
            </div>

            {/* Tab Contents */}
            {activeDetailTab === 'profile' ? (
              <div className="space-y-4 animate-fadeIn">
                {/* Personal Information */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h4 className="text-sm font-black text-indigo-900 border-b pb-1.5 flex items-center gap-2">
                    <UserCheck size={16} /> {language === 'ms' ? 'Maklumat Peribadi' : 'Personal Information'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-400 font-medium">{language === 'ms' ? 'No. Kad Pengenalan' : 'IC Number'}</span>
                      <p className="font-bold text-slate-800">{viewingStudent.ic_no || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 font-medium">{language === 'ms' ? 'No. Matrik' : 'Matric No'}</span>
                      <p className="font-bold text-slate-800">{viewingStudent.matric_no || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 font-medium">{language === 'ms' ? 'E-mel' : 'Email'}</span>
                      <p className="font-bold text-slate-800 hover:text-indigo-600 transition-colors">
                        <a href={`mailto:${viewingStudent.email}`}>{viewingStudent.email}</a>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 font-medium">{language === 'ms' ? 'No. Telefon' : 'Phone'}</span>
                      <p className="font-bold text-slate-800">{viewingStudent.phone || '-'}</p>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <span className="text-slate-400 font-medium">{language === 'ms' ? 'Alamat' : 'Address'}</span>
                      <p className="font-bold text-slate-800 leading-relaxed">{viewingStudent.address || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Placement Information */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h4 className="text-sm font-black text-indigo-900 border-b pb-1.5 flex items-center gap-2">
                    <Handshake size={16} /> {language === 'ms' ? 'Status Penempatan WBL' : 'WBL Placement Status'}
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700">{language === 'ms' ? 'Status Dokumen Keperluan' : 'Required Docs Status'}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        viewingStudent.isAllDocsVerified 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                        {viewingStudent.isAllDocsVerified 
                          ? (language === 'ms' ? 'LENGKAP & DISAHKAN' : 'VERIFIED & COMPLETE') 
                          : (language === 'ms' ? 'BELUM LENGKAP' : 'INCOMPLETE')}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-slate-400 font-medium block">{language === 'ms' ? 'Syarikat Dipohon / Ditempatkan' : 'Applied / Placed Companies'}</span>
                      {viewingStudent.studentApps && viewingStudent.studentApps.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {viewingStudent.studentApps.map((app: any) => {
                            const isPreferred = app.student_preferred;
                            return (
                              <div 
                                key={app.id} 
                                className={`p-3 rounded-lg border transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-2 ${
                                  isPreferred 
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                                    : 'bg-slate-50 border-slate-200 text-slate-800'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold">{app.company_name}</span>
                                    {isPreferred && (
                                      <span className="bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded uppercase">
                                        Pilihan Utama
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                                    <span>{language === 'ms' ? 'Status' : 'Status'}: <strong>{app.application_status}</strong></span>
                                    <span>{language === 'ms' ? 'Tarikh' : 'Date'}: {app.created_at ? new Date(app.created_at).toLocaleDateString() : '-'}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px]">
                                  <span className={`px-1.5 py-0.5 rounded font-bold ${app.application_letter_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                    Surat: {app.application_letter_verified ? '✓' : '✗'}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded font-bold ${app.reply_form_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                    Jawapan: {app.reply_form_verified ? '✓' : '✗'}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded font-bold ${app.offer_letter_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                    Tawaran: {app.offer_letter_verified ? '✓' : '✗'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200 text-center">
                          {language === 'ms' ? 'Tiada permohonan aktif.' : 'No active applications.'}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      <div className="space-y-1">
                        <span className="text-slate-400 font-medium block">{language === 'ms' ? 'Penyelia Fakulti' : 'Faculty Supervisor'}</span>
                        {viewingStudent.faculty_supervisor_name ? (
                          <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                            <p className="font-extrabold text-indigo-900 text-xs">{viewingStudent.faculty_supervisor_name}</p>
                            <p className="text-[10px] text-indigo-700 font-medium">ID: {viewingStudent.faculty_supervisor_staff_id || '-'}</p>
                            <p className="text-[10px] text-indigo-700 font-medium">{viewingStudent.faculty_supervisor_email || '-'}</p>
                          </div>
                        ) : (
                          <p className="text-slate-400 italic">{language === 'ms' ? 'Belum ditugaskan' : 'Not assigned'}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 font-medium block">{language === 'ms' ? 'Syarikat Ditugaskan' : 'Assigned Company'}</span>
                        {viewingStudent.isAllDocsVerified ? (
                          <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                            <p className="font-extrabold text-emerald-900 text-xs">{viewingStudent.placement?.company_name}</p>
                            <p className="text-[10px] text-emerald-700 font-bold mt-1">✓ {language === 'ms' ? 'Dokumen Disahkan Lengkap' : 'Documents Verified Complete'}</p>
                          </div>
                        ) : (
                          <p className="text-slate-400 italic">{language === 'ms' ? 'Belum lengkap dokumen keperluan' : 'Required documents incomplete'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                {/* About Section */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <h4 className="text-sm font-black text-indigo-900 border-b pb-1.5 flex items-center gap-2">
                    <BookOpen size={16} /> {language === 'ms' ? 'Tentang Pelajar' : 'About Student'}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed text-justify whitespace-pre-line">
                    {viewingStudent.resume_about || (language === 'ms' ? 'Pelajar belum mengisi deskripsi diri.' : 'Student has not filled their description yet.')}
                  </p>
                </div>

                {/* Academic & Education */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h4 className="text-sm font-black text-indigo-900 border-b pb-1.5 flex items-center gap-2">
                    <GraduationCap size={16} /> {language === 'ms' ? 'Latar Belakang Pendidikan' : 'Education History'}
                  </h4>
                  {viewingStudent.resume_cgpa && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-slate-700">PNGK Semasa / CGPA:</span>
                      <span className="bg-indigo-600 text-white px-2.5 py-1 rounded font-black text-sm">{viewingStudent.resume_cgpa}</span>
                    </div>
                  )}
                  <div className="space-y-3">
                    {parseJSON(viewingStudent.resume_education).length > 0 ? (
                      parseJSON(viewingStudent.resume_education).map((edu: any, idx: number) => (
                        <div key={idx} className="border-l-2 border-indigo-500 pl-3 py-0.5 space-y-1 text-xs">
                          <div className="flex justify-between items-start gap-1 flex-wrap">
                            <span className="font-extrabold text-slate-800">{edu.school || edu.institution}</span>
                            <span className="text-[10px] text-slate-500 font-semibold">{edu.year || edu.period}</span>
                          </div>
                          <p className="text-slate-600 italic">{edu.degree || edu.course}</p>
                          {edu.grade && <p className="text-indigo-600 font-bold text-[10px]">CGPA: {edu.grade}</p>}
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic text-xs">{language === 'ms' ? 'Tiada maklumat pendidikan.' : 'No education info.'}</p>
                    )}
                  </div>
                </div>

                {/* Work Experience */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h4 className="text-sm font-black text-indigo-900 border-b pb-1.5 flex items-center gap-2">
                    <Briefcase size={16} /> {language === 'ms' ? 'Pengalaman Kerja & Latihan' : 'Work & Internship Experience'}
                  </h4>
                  <div className="space-y-3">
                    {parseJSON(viewingStudent.resume_work_experience).length > 0 ? (
                      parseJSON(viewingStudent.resume_work_experience).map((work: any, idx: number) => (
                        <div key={idx} className="border-l-2 border-slate-400 pl-3 py-0.5 space-y-1 text-xs">
                          <div className="flex justify-between items-start gap-1 flex-wrap">
                            <span className="font-extrabold text-slate-800">{work.role || work.position}</span>
                            <span className="text-[10px] text-slate-500 font-semibold">{work.period || work.year}</span>
                          </div>
                          <p className="text-slate-600 font-bold">{work.company}</p>
                          <p className="text-slate-500 text-[11px] leading-relaxed whitespace-pre-line">{work.description}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic text-xs">{language === 'ms' ? 'Tiada pengalaman kerja.' : 'No work experience.'}</p>
                    )}
                  </div>
                </div>

                {/* Skills Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Technical Skills */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <h4 className="text-sm font-black text-indigo-900 border-b pb-1.5 flex items-center gap-2">
                      <Code size={16} /> {language === 'ms' ? 'Kemahiran Teknikal' : 'Technical Skills'}
                    </h4>
                    <div className="space-y-2 text-xs">
                      {parseJSON(viewingStudent.resume_skills_tech).length > 0 ? (
                        parseJSON(viewingStudent.resume_skills_tech).map((skill: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between gap-2 p-1.5 hover:bg-slate-50 rounded transition-colors">
                            <span className="font-bold text-slate-700">{skill.name}</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star 
                                  key={s} 
                                  size={10} 
                                  className={s <= (skill.level || 3) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'} 
                                />
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 italic text-xs">{language === 'ms' ? 'Tiada kemahiran teknikal.' : 'No technical skills.'}</p>
                      )}
                    </div>
                  </div>

                  {/* Soft Skills */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <h4 className="text-sm font-black text-indigo-900 border-b pb-1.5 flex items-center gap-2">
                      <Globe size={16} /> {language === 'ms' ? 'Kemahiran Insaniah' : 'Soft Skills'}
                    </h4>
                    <div className="space-y-2 text-xs">
                      {parseJSON(viewingStudent.resume_skills_soft).length > 0 ? (
                        parseJSON(viewingStudent.resume_skills_soft).map((skill: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between gap-2 p-1.5 hover:bg-slate-50 rounded transition-colors">
                            <span className="font-bold text-slate-700">{skill.name}</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star 
                                  key={s} 
                                  size={10} 
                                  className={s <= (skill.level || 3) ? 'text-indigo-500 fill-indigo-500' : 'text-slate-200'} 
                                />
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 italic text-xs">{language === 'ms' ? 'Tiada kemahiran insaniah.' : 'No soft skills.'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Languages */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h4 className="text-sm font-black text-indigo-900 border-b pb-1.5 flex items-center gap-2">
                    <Languages size={16} /> {language === 'ms' ? 'Penguasaan Bahasa' : 'Languages'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {parseJSON(viewingStudent.resume_languages).length > 0 ? (
                      parseJSON(viewingStudent.resume_languages).map((lang: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="font-bold text-slate-800">{lang.name}</span>
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                            {lang.level === 5 ? (language === 'ms' ? 'Sangat Baik' : 'Excellent') : lang.level >= 3 ? (language === 'ms' ? 'Baik' : 'Good') : (language === 'ms' ? 'Sederhana' : 'Basic')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic text-xs col-span-2">{language === 'ms' ? 'Tiada data bahasa.' : 'No language data.'}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
