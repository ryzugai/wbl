
import React, { useState, useEffect } from 'react';
import { User, Application, UserRole } from '../types';
import { UserPlus, UserCheck, Edit, Trash2 } from 'lucide-react';
import { Modal } from '../components/Modal';

interface StudentsProps {
  users: User[];
  applications: Application[];
  currentUser: User;
  onUpdateApplication: (app: Application) => Promise<void>;
  onUpdateUser: (user: User) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

export const Students: React.FC<StudentsProps> = ({ users, applications, currentUser, onUpdateApplication, onUpdateUser, onDeleteUser }) => {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [supervisorId, setSupervisorId] = useState('');

  // Edit Student State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);

  // Get all registered students
  const students = users.filter(u => u.role === UserRole.STUDENT);
  const lecturers = users.filter(u => u.role === UserRole.LECTURER);
  
  // Get all approved applications for matching
  const approvedApps = applications.filter(a => a.application_status === 'Diluluskan');

  // Map student to their approved application (if any) and filter based on viewer role
  const studentList = students.map(student => {
    // Find if student has an approved application
    const app = approvedApps.find(a => a.student_id === student.matric_no || a.created_by === student.username);
    
    // STRICT FILTERING for Industry Users
    if (currentUser.role === UserRole.TRAINER || currentUser.role === UserRole.SUPERVISOR) {
        // If user is from Industry, they MUST have a company affiliation
        if (!currentUser.company_affiliation) return null;

        // If student has no approved app, or approved app is NOT for this user's company, hide them
        if (!app || app.company_name !== currentUser.company_affiliation) {
            return null;
        }
    }

    return {
      ...student,
      placement: app
    };
  }).filter(Boolean); // Remove nulls (filtered out students)

  const handleAssignClick = (app: Application) => {
    setSelectedApp(app);
    setSupervisorId(app.faculty_supervisor_id || '');
    setIsAssignModalOpen(true);
  };

  const handleSaveSupervisor = async () => {
    if (!selectedApp || !supervisorId) return;
    const lecturer = lecturers.find(l => l.id === supervisorId);
    if (!lecturer) return;

    await onUpdateApplication({
      ...selectedApp,
      faculty_supervisor_id: lecturer.id,
      faculty_supervisor_name: lecturer.name,
      faculty_supervisor_staff_id: lecturer.staff_id
    });
    
    setIsAssignModalOpen(false);
    setSelectedApp(null);
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Senarai Pelajar</h2>
        {(currentUser.role === UserRole.TRAINER || currentUser.role === UserRole.SUPERVISOR) && (
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm border border-blue-100">
                Syarikat: <strong>{currentUser.company_affiliation}</strong>
            </div>
        )}
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
                {currentUser.role === UserRole.COORDINATOR && (
                    <th className="p-4 font-semibold text-sm text-slate-600 text-center">Tindakan</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentList.length === 0 && (
                <tr>
                   <td colSpan={currentUser.role === UserRole.COORDINATOR ? 6 : 5} className="p-8 text-center text-slate-500">
                       {(currentUser.role === UserRole.TRAINER || currentUser.role === UserRole.SUPERVISOR) 
                        ? `Tiada pelajar yang diluluskan untuk syarikat ${currentUser.company_affiliation || 'anda'}.`
                        : "Tiada pelajar dijumpai."}
                   </td>
                </tr>
              )}
              {studentList.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 group">
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.matric_no}</div>
                    <div className="text-xs text-slate-400 mt-1">{item.email}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-700 max-w-xs truncate" title={item.program}>{item.program}</td>
                  <td className="p-4">
                    {item.placement ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {item.placement.company_name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        Belum ditempatkan
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                      {item.placement?.start_date || '-'}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                      {item.placement?.faculty_supervisor_name ? (
                          <div className="flex items-center gap-2 text-blue-700">
                              <UserCheck size={16} />
                              <span className="font-medium">{item.placement.faculty_supervisor_name}</span>
                          </div>
                      ) : (
                          <span className="text-slate-400 italic text-xs">Belum ditugaskan</span>
                      )}
                  </td>
                  {currentUser.role === UserRole.COORDINATOR && (
                      <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            {item.placement && (
                                <button 
                                    onClick={() => handleAssignClick(item.placement)}
                                    className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                                    title="Assign Penyelia"
                                >
                                    <UserPlus size={18} />
                                </button>
                            )}
                            <button 
                                onClick={() => { setEditingStudent(item); setIsEditModalOpen(true); }}
                                className="p-2 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition-colors"
                                title="Edit Pelajar"
                            >
                                <Edit size={18} />
                            </button>
                            <button 
                                onClick={() => { if(confirm('Adakah anda pasti mahu memadam pelajar ini?')) onDeleteUser(item.id); }}
                                className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                                title="Padam Pelajar"
                            >
                                <Trash2 size={18} />
                            </button>
                          </div>
                      </td>
                  )}
                </tr>
              ))}
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
                <p className="text-sm text-slate-600">Pelajar: <strong>{selectedApp?.student_name}</strong></p>
                <p className="text-sm text-slate-600">Syarikat: <strong>{selectedApp?.company_name}</strong></p>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Pensyarah</label>
                    <select 
                        value={supervisorId}
                        onChange={(e) => setSupervisorId(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                    >
                        <option value="">-- Pilih --</option>
                        {users.filter(u => u.role === UserRole.LECTURER).length > 0 ? (
                            users.filter(u => u.role === UserRole.LECTURER).map(lec => (
                                <option key={lec.id} value={lec.id}>{lec.name} ({lec.staff_id})</option>
                            ))
                        ) : (
                            <option value="" disabled>Tiada pensyarah berdaftar</option>
                        )}
                    </select>
                </div>
                <button 
                    onClick={handleSaveSupervisor}
                    disabled={!supervisorId}
                    className={`w-full py-2 rounded text-white ${!supervisorId ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    Simpan
                </button>
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
                            className="w-full p-2 border border-slate-300 rounded"
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
                                className="w-full p-2 border border-slate-300 rounded"
                                value={editingStudent.matric_no || ''}
                                onChange={(e) => setEditingStudent({...editingStudent, matric_no: e.target.value})}
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">No. KP</label>
                            <input 
                                type="text" 
                                className="w-full p-2 border border-slate-300 rounded"
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
                            className="w-full p-2 border border-slate-300 rounded"
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
                                className="w-full p-2 border border-slate-300 rounded"
                                value={editingStudent.email}
                                onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                            <input 
                                type="tel" 
                                className="w-full p-2 border border-slate-300 rounded"
                                value={editingStudent.phone}
                                onChange={(e) => setEditingStudent({...editingStudent, phone: e.target.value})}
                                required 
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 mt-4">
                        Simpan Perubahan
                    </button>
                </form>
            )}
        </Modal>
    </div>
  );
};
