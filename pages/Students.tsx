
import React, { useState } from 'react';
import { User, Application, UserRole } from '../types';
import { UserPlus, UserCheck, Edit, Trash2, FileText, Download, FileSpreadsheet, Clock } from 'lucide-react';
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
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [supervisorId, setSupervisorId] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);

  const students = users.filter(u => u.role === UserRole.STUDENT);
  const lecturers = users.filter(u => u.role === UserRole.LECTURER);
  
  const isCoordinator = currentUser.role === UserRole.COORDINATOR;
  const isJKWBL = currentUser.is_jkwbl === true;
  const hasSystemAccess = isCoordinator || isJKWBL;

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
    return { ...student, placement: primaryApp };
  }).filter(Boolean) as (User & { placement?: Application })[];

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
    setSelectedApp(student.placement || null);
    const currentSupId = student.placement?.faculty_supervisor_id || student.faculty_supervisor_id || '';
    setSupervisorId(currentSupId);
    setIsAssignModalOpen(true);
  };

  const handleSaveSupervisor = async () => {
    if (!selectedStudent || !supervisorId) return;
    const lecturer = lecturers.find(l => l.id === supervisorId);
    if (!lecturer) return;
    try {
        const studentApps = applications.filter(a => 
            (a.student_id === selectedStudent.matric_no || a.created_by === selectedStudent.username) &&
            (a.application_status === 'Diluluskan' || a.application_status === 'Menunggu')
        );
        for (const app of studentApps) {
            await onUpdateApplication({
                ...app,
                faculty_supervisor_id: lecturer.id,
                faculty_supervisor_name: lecturer.name,
                faculty_supervisor_staff_id: lecturer.staff_id
            });
        }
        const { placement, ...studentData } = selectedStudent as any;
        await onUpdateUser({
            ...studentData,
            faculty_supervisor_id: lecturer.id,
            faculty_supervisor_name: lecturer.name,
            faculty_supervisor_staff_id: lecturer.staff_id
        });
        toast.success(language === 'ms' ? `Penyelia ${lecturer.name} ditugaskan.` : `Supervisor ${lecturer.name} assigned.`);
        setIsAssignModalOpen(false);
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
        <div className="flex gap-3 w-full md:w-auto">
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
                const displaySupName = item.placement?.faculty_supervisor_name || item.faculty_supervisor_name;
                const isApproved = item.placement?.application_status === 'Diluluskan';
                const isPending = item.placement?.application_status === 'Menunggu';
                
                // Cek jika resume sudah diisi
                const hasResume = !!(item.resume_about || item.resume_education || item.resume_skills_soft);
                
                return (
                  <tr key={item.id} className="hover:bg-slate-50 group transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.matric_no}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-700 max-w-xs truncate">{item.program}</td>
                    <td className="p-4">
                      {isApproved ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200 shadow-sm">{item.placement.company_name}</span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm"><Clock size={10} /> {item.placement.company_name}</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">{language === 'ms' ? 'Belum Ditempatkan' : 'Not Placed'}</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                        {displaySupName ? (
                            <div className="flex items-center gap-2 text-blue-700">
                                <UserCheck size={16} />
                                <span className="font-bold text-xs">{displaySupName}</span>
                            </div>
                        ) : (
                            <span className="text-slate-400 italic text-xs">{language === 'ms' ? 'Belum ditugaskan' : 'Not assigned'}</span>
                        )}
                    </td>
                    <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => generateResume(item, language)} 
                            className={`p-2 rounded-lg transition-colors ${
                                hasResume 
                                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                            }`}
                            title={hasResume 
                                ? (language === 'ms' ? 'Lihat Resume (Lengkap)' : 'View Resume (Complete)') 
                                : (language === 'ms' ? 'Resume Belum Lengkap' : 'Resume Incomplete')
                            }
                          >
                              <FileText size={18} />
                          </button>
                          {isCoordinator && item.placement && (
                              <button onClick={() => handleAssignClick(item)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title={t(language, 'assignSup')}>
                                  <UserPlus size={18} />
                              </button>
                          )}
                          {isCoordinator && (
                              <>
                                  <button onClick={() => { setEditingStudent({...item}); setIsEditModalOpen(true); }} className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100" title={t(language, 'editUser')}>
                                      <Edit size={18} />
                                  </button>
                                  <button onClick={() => { if(confirm('Delete user?')) onDeleteUser(item.id); }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title={t(language, 'deleteUser')}>
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
                  <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold">{t(language, 'save')}</button>
              </form>
          )}
      </Modal>
    </div>
  );
};
