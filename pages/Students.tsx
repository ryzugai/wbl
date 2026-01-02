
import React, { useState } from 'react';
import { User, Application, UserRole } from '../types';
import { UserPlus, UserCheck, Edit, Trash2, FileText, Download, FileSpreadsheet, Clock } from 'lucide-react';
import { Modal } from '../components/Modal';
import { generateResume } from '../utils/resumeGenerator';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';

interface StudentsProps {
  users: User[];
  applications: Application[];
  currentUser: User;
  onUpdateApplication: (app: Application) => Promise<void>;
  onUpdateUser: (user: User) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

export const Students: React.FC<StudentsProps> = ({ users, applications, currentUser, onUpdateApplication, onUpdateUser, onDeleteUser }) => {
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [supervisorId, setSupervisorId] = useState('');

  // Edit Student State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);

  // Get all registered students
  const students = users.filter(u => u.role === UserRole.STUDENT);
  const lecturers = users.filter(u => u.role === UserRole.LECTURER);
  
  const isCoordinator = currentUser.role === UserRole.COORDINATOR;
  const isJKWBL = currentUser.is_jkwbl === true;
  const hasSystemAccess = isCoordinator || isJKWBL;

  // Map student to their application and filter based on viewer role
  const studentList = students.map(student => {
    // Priority: 1. Approved App, 2. Pending App
    const studentApps = applications.filter(a => a.student_id === student.matric_no || a.created_by === student.username);
    const approvedApp = studentApps.find(a => a.application_status === 'Diluluskan');
    const pendingApp = studentApps.find(a => a.application_status === 'Menunggu');
    
    const primaryApp = approvedApp || pendingApp;
    
    // STRICT FILTERING for Industry Users
    if (currentUser.role === UserRole.TRAINER || currentUser.role === UserRole.SUPERVISOR) {
        if (!currentUser.company_affiliation) return null;
        if (!approvedApp || approvedApp.company_name !== currentUser.company_affiliation) {
            return null;
        }
    }

    return {
      ...student,
      placement: primaryApp
    };
  }).filter(Boolean) as (User & { placement?: Application })[];

  const exportToExcel = () => {
    try {
      const dataToExport = studentList.map(s => ({
        'Nama Pelajar': s.name,
        'No. Matrik': s.matric_no,
        'No. KP': s.ic_no,
        'Program': s.program,
        'Email': s.email,
        'Telefon': s.phone,
        'Status Penempatan': s.placement ? (s.placement.application_status === 'Diluluskan' ? 'Sudah Ditempatkan' : 'Menunggu Kelulusan') : 'Belum Ditempatkan',
        'Syarikat': s.placement?.company_name || '-',
        'Daerah (Syarikat)': s.placement?.company_district || '-',
        'Negeri (Syarikat)': s.placement?.company_state || '-',
        'Tarikh Mula': s.placement?.start_date || '-',
        'Penyelia Fakulti': s.placement?.faculty_supervisor_name || s.faculty_supervisor_name || '-',
        'ID Staf Penyelia': s.placement?.faculty_supervisor_staff_id || s.faculty_supervisor_staff_id || '-'
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Senarai Pelajar WBL');
      
      const fileName = `Senarai_Pelajar_WBL_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success('Senarai pelajar berjaya dieksport!');
    } catch (error) {
      toast.error('Gagal mengeksport senarai pelajar.');
      console.error(error);
    }
  };

  const handleAssignClick = (student: any) => {
    if (!isCoordinator) {
        toast.error("Hanya Penyelaras boleh menugaskan penyelia.");
        return;
    }
    setSelectedStudent(student);
    setSelectedApp(student.placement || null);
    
    // Set current supervisor if exists
    const currentSupId = student.placement?.faculty_supervisor_id || student.faculty_supervisor_id || '';
    setSupervisorId(currentSupId);
    setIsAssignModalOpen(true);
  };

  const handleSaveSupervisor = async () => {
    if (!selectedStudent || !supervisorId) return;
    if (!isCoordinator) {
        toast.error("Akses Ditolak: Hanya Penyelaras boleh menugaskan penyelia.");
        return;
    }

    const lecturer = lecturers.find(l => l.id === supervisorId);
    if (!lecturer) return;

    try {
        // 1. Update ALL active Applications for this student (Approved or Pending)
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

        // 2. Also update User profile to ensure it persists regardless of placement status
        const { placement, ...studentData } = selectedStudent as any;
        await onUpdateUser({
            ...studentData,
            faculty_supervisor_id: lecturer.id,
            faculty_supervisor_name: lecturer.name,
            faculty_supervisor_staff_id: lecturer.staff_id
        });
        
        toast.success(`Penyelia ${lecturer.name} telah ditugaskan.`);
        setIsAssignModalOpen(false);
        setSelectedStudent(null);
        setSelectedApp(null);
    } catch (e: any) {
        toast.error(`Gagal menyimpan: ${e.message}`);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(editingStudent) {
          await onUpdateUser(editingStudent);
          setIsEditModalOpen(false);
          setEditingStudent(null);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Senarai Pelajar</h2>
          <p className="text-sm text-slate-500 mt-1">Menguruskan profil dan penempatan pelajar WBL.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {hasSystemAccess && (
            <button 
              onClick={exportToExcel}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm transition-all font-bold text-sm"
            >
              <FileSpreadsheet size={18} /> Eksport Excel
            </button>
          )}
          {(currentUser.role === UserRole.TRAINER || currentUser.role === UserRole.SUPERVISOR) && (
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm border border-blue-100 font-bold flex items-center gap-2">
                  <Download size={16} /> Syarikat: {currentUser.company_affiliation}
              </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-sm text-slate-600">Nama Pelajar</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Program</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Penempatan</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Tarikh Mula</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Penyelia Fakulti</th>
                <th className="p-4 font-semibold text-sm text-slate-600 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentList.length === 0 && (
                <tr>
                   <td colSpan={6} className="p-8 text-center text-slate-500">
                       {(currentUser.role === UserRole.TRAINER || currentUser.role === UserRole.SUPERVISOR) 
                        ? `Tiada pelajar yang diluluskan untuk syarikat ${currentUser.company_affiliation || 'anda'}.`
                        : "Tiada pelajar dijumpai."}
                   </td>
                </tr>
              )}
              {studentList.map((item: any) => {
                const displaySupName = item.placement?.faculty_supervisor_name || item.faculty_supervisor_name;
                const isApproved = item.placement?.application_status === 'Diluluskan';
                const isPending = item.placement?.application_status === 'Menunggu';
                
                return (
                  <tr key={item.id} className="hover:bg-slate-50 group transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">
                          {item.name}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">{item.matric_no}</div>
                      <div className="text-xs text-slate-400 mt-1">{item.email}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-700 max-w-xs truncate" title={item.program}>{item.program}</td>
                    <td className="p-4">
                      {isApproved ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200 shadow-sm">
                          {item.placement.company_name}
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm">
                          <Clock size={10} /> Menunggu: {item.placement.company_name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Belum ditempatkan
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-medium">
                        {item.placement?.start_date || '-'}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                        {displaySupName ? (
                            <div className="flex items-center gap-2 text-blue-700">
                                <UserCheck size={16} />
                                <span className="font-bold text-xs">{displaySupName}</span>
                            </div>
                        ) : (
                            <span className="text-slate-400 italic text-xs">Belum ditugaskan</span>
                        )}
                    </td>
                    <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Resume View for Staff / Coordinator */}
                          <button 
                              onClick={() => generateResume(item)}
                              className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
                              title="Lihat Resume Pelajar"
                          >
                              <FileText size={18} />
                          </button>

                          {/* Assign Supervisor - ONLY Coordinator and only if student has a placement app (Approved or Pending) */}
                          {isCoordinator && item.placement && (
                              <button 
                                  onClick={() => handleAssignClick(item)}
                                  className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all border border-blue-100 shadow-sm"
                                  title="Tugaskan Penyelia"
                              >
                                  <UserPlus size={18} />
                              </button>
                          )}
                          {/* Edit/Delete Restricted to Coordinator ONLY */}
                          {isCoordinator && (
                              <>
                                  <button 
                                      onClick={() => { 
                                          const { placement, ...userData } = item;
                                          setEditingStudent(userData); 
                                          setIsEditModalOpen(true); 
                                      }}
                                      className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-all border border-yellow-100 shadow-sm"
                                      title="Edit Pelajar"
                                  >
                                      <Edit size={18} />
                                  </button>
                                  <button 
                                      onClick={() => { if(confirm('Adakah anda pasti mahu memadam pelajar ini?')) onDeleteUser(item.id); }}
                                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all border border-red-100 shadow-sm"
                                      title="Padam Pelajar"
                                  >
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

      {/* Assign Supervisor Modal */}
      <Modal 
            isOpen={isAssignModalOpen} 
            onClose={() => setIsAssignModalOpen(false)} 
            title="Tugaskan Penyelia Fakulti"
        >
            <div className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">Pelajar: <strong>{selectedStudent?.name}</strong></p>
                    <p className="text-xs text-slate-500">{selectedStudent?.matric_no}</p>
                    {selectedApp && (
                        <p className={`text-xs font-bold mt-1 ${selectedApp.application_status === 'Diluluskan' ? 'text-green-600' : 'text-orange-600'}`}>
                            {selectedApp.application_status === 'Diluluskan' ? 'Syarikat Diluluskan: ' : 'Menunggu Kelulusan Syarikat: '}
                            {selectedApp.company_name}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Pensyarah</label>
                    <select 
                        value={supervisorId}
                        onChange={(e) => setSupervisorId(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                    >
                        <option value="">-- Pilih --</option>
                        {lecturers.length > 0 ? (
                            lecturers.map(lec => (
                                <option key={lec.id} value={lec.id}>
                                    {lec.name} ({lec.staff_id}) {lec.is_jkwbl ? ' - [Ahli JKWBL]' : ''}
                                </option>
                            ))
                        ) : (
                            <option value="" disabled>Tiada pensyarah berdaftar</option>
                        )}
                    </select>
                </div>
                <button 
                    onClick={handleSaveSupervisor}
                    disabled={!supervisorId}
                    className={`w-full py-2 rounded text-white font-bold transition-all ${!supervisorId ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md active:scale-95'}`}
                >
                    Simpan Tugasan
                </button>
                <p className="text-[10px] text-slate-500 italic text-center">
                    Nota: Maklumat penyelia akan dikemaskini pada profil pelajar dan semua permohonan aktif mereka.
                </p>
            </div>
        </Modal>

        {/* Edit Student Modal */}
        <Modal 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)} 
            title="Kemaskini Maklumat Pelajar"
        >
            {editingStudent && (
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Penuh</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900"
                            value={editingStudent.name}
                            onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                            required 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">No. Matrik</label>
                            <input 
                                type="text" 
                                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900"
                                value={editingStudent.matric_no || ''}
                                onChange={(e) => setEditingStudent({...editingStudent, matric_no: e.target.value})}
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">No. KP</label>
                            <input 
                                type="text" 
                                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900"
                                value={editingStudent.ic_no || ''}
                                onChange={(e) => setEditingStudent({...editingStudent, ic_no: e.target.value})}
                                required 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Program</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900"
                            value={editingStudent.program || ''}
                            onChange={(e) => setEditingStudent({...editingStudent, program: e.target.value})}
                            required 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input 
                                type="email" 
                                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900"
                                value={editingStudent.email}
                                onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                            <input 
                                type="tel" 
                                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900"
                                value={editingStudent.phone}
                                onChange={(e) => setEditingStudent({...editingStudent, phone: e.target.value})}
                                required 
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 mt-4 shadow-md transition-all active:scale-95">
                        Simpan Perubahan
                    </button>
                </form>
            )}
        </Modal>
    </div>
  );
};
