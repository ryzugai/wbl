
import React, { useState } from 'react';
import { User, UserRole, Application } from '../types';
import { Mail, Phone, Building2, CreditCard, Briefcase, UserCog, PlusCircle, MinusCircle, UserPlus, Users } from 'lucide-react';
import { ROLE_LABELS } from '../constants';
import { Modal } from '../components/Modal';

interface StaffListProps {
  users: User[];
  currentUser?: User;
  applications?: Application[];
  onUpdateApplication?: (app: Application) => Promise<void>;
}

export const StaffList: React.FC<StaffListProps> = ({ users, currentUser, applications = [], onUpdateApplication }) => {
  const [activeTab, setActiveTab] = useState<'lecturers' | 'industry'>('lecturers');
  
  // Supervision Management State
  const [isSupervisionModalOpen, setIsSupervisionModalOpen] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState<User | null>(null);

  const lecturers = users.filter(u => u.role === UserRole.LECTURER);
  const industryStaff = users.filter(u => u.role === UserRole.TRAINER || u.role === UserRole.SUPERVISOR);

  // Filter logic for Lecturers (Explicit Assignment)
  const getSupervisees = (lecturerId: string) => {
      return applications.filter(app => app.faculty_supervisor_id === lecturerId && app.application_status === 'Diluluskan');
  };

  const getUnassignedStudents = () => {
      return applications.filter(app => !app.faculty_supervisor_id && app.application_status === 'Diluluskan');
  };

  // Filter logic for Industry (Implicit Assignment by Company)
  const getIndustrySupervisees = (companyName: string | undefined) => {
      if (!companyName) return [];
      return applications.filter(app => 
          app.company_name === companyName && 
          app.application_status === 'Diluluskan'
      );
  };

  const handleManageSupervision = (lecturer: User) => {
      setSelectedLecturer(lecturer);
      setIsSupervisionModalOpen(true);
  };

  const handleAssign = async (app: Application) => {
      if (!selectedLecturer || !onUpdateApplication) return;
      await onUpdateApplication({
          ...app,
          faculty_supervisor_id: selectedLecturer.id,
          faculty_supervisor_name: selectedLecturer.name,
          faculty_supervisor_staff_id: selectedLecturer.staff_id
      });
  };

  const handleUnassign = async (app: Application) => {
      if (!onUpdateApplication) return;
      await onUpdateApplication({
          ...app,
          faculty_supervisor_id: '',
          faculty_supervisor_name: '',
          faculty_supervisor_staff_id: ''
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Senarai Staf & Industri</h2>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('lecturers')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'lecturers' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Pensyarah ({lecturers.length})
        </button>
        <button 
          onClick={() => setActiveTab('industry')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'industry' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Staf Industri ({industryStaff.length})
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-sm text-slate-600">Nama</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Hubungi</th>
                {activeTab === 'lecturers' ? (
                  <>
                    <th className="p-4 font-semibold text-sm text-slate-600">ID Staf</th>
                    <th className="p-4 font-semibold text-sm text-slate-600">Pelajar Seliaan</th>
                    {currentUser?.role === UserRole.COORDINATOR && (
                        <th className="p-4 font-semibold text-sm text-slate-600 text-center">Tindakan</th>
                    )}
                  </>
                ) : (
                  <>
                    <th className="p-4 font-semibold text-sm text-slate-600">Syarikat & Jawatan</th>
                    <th className="p-4 font-semibold text-sm text-slate-600">Pelajar Seliaan (Auto)</th>
                    <th className="p-4 font-semibold text-sm text-slate-600">Peranan</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(activeTab === 'lecturers' ? lecturers : industryStaff).length === 0 && (
                 <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">Tiada rekod dijumpai.</td>
                 </tr>
              )}
              {(activeTab === 'lecturers' ? lecturers : industryStaff).map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 align-top">
                    <div className="font-medium text-slate-900">{user.name}</div>
                    <div className="text-xs text-slate-500">Username: {user.username}</div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail size={14} className="text-orange-500" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone size={14} className="text-green-500" />
                        {user.phone}
                      </div>
                    </div>
                  </td>
                  
                  {activeTab === 'lecturers' ? (
                    <>
                        <td className="p-4 align-top">
                            <div className="flex items-center gap-2 text-sm text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded w-fit">
                                <CreditCard size={14} />
                                {user.staff_id || '-'}
                            </div>
                        </td>
                        <td className="p-4 align-top">
                            {getSupervisees(user.id).length > 0 ? (
                                <div className="flex flex-col gap-1">
                                    {getSupervisees(user.id).map(app => (
                                        <div key={app.id} className="inline-flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            {app.student_name}
                                        </div>
                                    ))}
                                    <div className="mt-1 text-xs text-slate-400 font-medium">
                                        Total: {getSupervisees(user.id).length}
                                    </div>
                                </div>
                            ) : (
                                <span className="text-xs text-slate-400 italic">Tiada pelajar</span>
                            )}
                        </td>
                        {currentUser?.role === UserRole.COORDINATOR && (
                            <td className="p-4 align-top text-center">
                                <button 
                                    onClick={() => handleManageSupervision(user)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded border border-blue-200 transition-colors text-sm font-medium"
                                >
                                    <UserCog size={16} /> Urus Seliaan
                                </button>
                            </td>
                        )}
                    </>
                  ) : (
                    <>
                      <td className="p-4 align-top">
                        <div className="font-medium text-slate-800 flex items-center gap-2">
                           <Building2 size={16} className="text-blue-500" />
                           {user.company_affiliation}
                        </div>
                        <div className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                           <Briefcase size={14} className="text-slate-400" />
                           {user.company_position}
                        </div>
                      </td>
                      <td className="p-4 align-top">
                          {getIndustrySupervisees(user.company_affiliation).length > 0 ? (
                              <div className="flex flex-col gap-1">
                                  {getIndustrySupervisees(user.company_affiliation).map(app => (
                                      <div key={app.id} className="inline-flex items-center gap-2 px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-100">
                                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                          {app.student_name}
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <span className="text-xs text-slate-400 italic">Tiada pelajar diluluskan</span>
                          )}
                      </td>
                      <td className="p-4 align-top">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                           user.role === UserRole.TRAINER ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                        }`}>
                           {ROLE_LABELS[user.role]}
                        </span>
                        {user.has_dual_role && (
                             <span className="ml-2 inline-block px-2 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                               + Dual Role
                             </span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Supervision Modal */}
      <Modal 
        isOpen={isSupervisionModalOpen} 
        onClose={() => setIsSupervisionModalOpen(false)} 
        title={`Urus Seliaan: ${selectedLecturer?.name}`}
      >
        <div className="space-y-6">
            {/* Current Supervisees */}
            <div>
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                    <UserCog size={16} className="text-blue-600" />
                    Pelajar Sedang Diselia ({selectedLecturer ? getSupervisees(selectedLecturer.id).length : 0})
                </h4>
                <div className="bg-slate-50 rounded-lg border border-slate-200 max-h-48 overflow-y-auto divide-y divide-slate-200">
                    {selectedLecturer && getSupervisees(selectedLecturer.id).length > 0 ? (
                        getSupervisees(selectedLecturer.id).map(app => (
                            <div key={app.id} className="p-3 flex justify-between items-center hover:bg-white transition-colors">
                                <div>
                                    <div className="font-medium text-slate-800">{app.student_name}</div>
                                    <div className="text-xs text-slate-500">{app.company_name}</div>
                                </div>
                                <button 
                                    onClick={() => handleUnassign(app)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-full"
                                    title="Buang Seliaan"
                                >
                                    <MinusCircle size={18} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center text-slate-500 text-sm italic">Tiada pelajar diselia.</div>
                    )}
                </div>
            </div>

            {/* Available Students */}
            <div>
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm border-t pt-4">
                    <UserPlus size={16} className="text-green-600" />
                    Pelajar Belum Ada Penyelia ({getUnassignedStudents().length})
                </h4>
                <div className="bg-slate-50 rounded-lg border border-slate-200 max-h-48 overflow-y-auto divide-y divide-slate-200">
                    {getUnassignedStudents().length > 0 ? (
                        getUnassignedStudents().map(app => (
                            <div key={app.id} className="p-3 flex justify-between items-center hover:bg-white transition-colors">
                                <div>
                                    <div className="font-medium text-slate-800">{app.student_name}</div>
                                    <div className="text-xs text-slate-500">{app.company_name}</div>
                                </div>
                                <button 
                                    onClick={() => handleAssign(app)}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-full"
                                    title="Tambah ke Seliaan"
                                >
                                    <PlusCircle size={18} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center text-slate-500 text-sm italic">Tiada pelajar menunggu penyelia.</div>
                    )}
                </div>
            </div>
        </div>
      </Modal>
    </div>
  );
};
