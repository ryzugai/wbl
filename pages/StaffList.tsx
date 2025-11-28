
import React, { useState } from 'react';
import { User, UserRole, Application } from '../types';
import { Mail, Phone, Building2, CreditCard, Briefcase, UserCog, PlusCircle, MinusCircle, UserPlus, Users, CheckCircle, Clock, GraduationCap, Edit, Trash2, Save } from 'lucide-react';
import { ROLE_LABELS } from '../constants';
import { Modal } from '../components/Modal';
import { toast } from 'react-hot-toast';

interface StaffListProps {
  users: User[];
  currentUser?: User;
  applications?: Application[];
  onUpdateApplication?: (app: Application) => Promise<void>;
  onUpdateUser: (user: User) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

export const StaffList: React.FC<StaffListProps> = ({ users, currentUser, applications = [], onUpdateApplication, onUpdateUser, onDeleteUser }) => {
  const [activeTab, setActiveTab] = useState<'lecturers' | 'industry'>('lecturers');
  const [isSupervisionModalOpen, setIsSupervisionModalOpen] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState<User | null>(null);
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const lecturers = users.filter(u => u.role === UserRole.LECTURER);
  const industryStaff = users.filter(u => u.role === UserRole.TRAINER || u.role === UserRole.SUPERVISOR);

  const getSupervisees = (lecturerId: string) => applications.filter(app => app.faculty_supervisor_id === lecturerId && app.application_status === 'Diluluskan');
  const getUnassignedStudents = () => applications.filter(app => !app.faculty_supervisor_id && app.application_status === 'Diluluskan');
  const getIndustrySupervisees = (companyName: string | undefined) => companyName ? applications.filter(app => app.company_name === companyName && app.application_status === 'Diluluskan') : [];

  const handleManageSupervision = (lecturer: User) => {
      setSelectedLecturer(lecturer);
      setIsSupervisionModalOpen(true);
  };

  const handleAssign = async (app: Application) => {
      if (!selectedLecturer || !onUpdateApplication) return;
      await onUpdateApplication({ ...app, faculty_supervisor_id: selectedLecturer.id, faculty_supervisor_name: selectedLecturer.name, faculty_supervisor_staff_id: selectedLecturer.staff_id });
  };

  const handleUnassign = async (app: Application) => {
      if (!onUpdateApplication) return;
      await onUpdateApplication({ ...app, faculty_supervisor_id: '', faculty_supervisor_name: '', faculty_supervisor_staff_id: '' });
  };

  const handleApproveUser = async (user: User) => {
      try {
          await onUpdateUser({ ...user, is_approved: true });
          toast.success('Pengguna telah diluluskan');
      } catch (e) {
          toast.error('Gagal meluluskan pengguna');
      }
  };

  const handleEditClick = (user: User) => {
      setEditingUser({ ...user });
      setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (editingUser) {
          await onUpdateUser(editingUser);
          setIsEditModalOpen(false);
          setEditingUser(null);
      }
  };

  const handleDeleteClick = async (id: string) => {
      if (confirm('Adakah anda pasti mahu memadam akaun staf ini? Tindakan ini tidak boleh dikembalikan.')) {
          await onDeleteUser(id);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Senarai Staf & Industri</h2>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setActiveTab('lecturers')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'lecturers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Pensyarah ({lecturers.length})</button>
        <button onClick={() => setActiveTab('industry')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'industry' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Staf Industri ({industryStaff.length})</button>
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
                    {currentUser?.role === UserRole.COORDINATOR && <th className="p-4 font-semibold text-sm text-slate-600 text-center">Tindakan</th>}
                  </>
                ) : (
                  <>
                    <th className="p-4 font-semibold text-sm text-slate-600">Syarikat & Jawatan</th>
                    <th className="p-4 font-semibold text-sm text-slate-600">Kelayakan & Pengalaman</th>
                    <th className="p-4 font-semibold text-sm text-slate-600">Pelajar Seliaan</th>
                    <th className="p-4 font-semibold text-sm text-slate-600">Peranan</th>
                    {currentUser?.role === UserRole.COORDINATOR && <th className="p-4 font-semibold text-sm text-slate-600 text-center">Tindakan</th>}
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(activeTab === 'lecturers' ? lecturers : industryStaff).length === 0 && (
                 <tr><td colSpan={6} className="p-8 text-center text-slate-500">Tiada rekod dijumpai.</td></tr>
              )}
              {(activeTab === 'lecturers' ? lecturers : industryStaff).map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4 align-top">
                    <div className="font-medium text-slate-900">{user.name}</div>
                    <div className="text-xs text-slate-500">Username: {user.username}</div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm text-slate-600"><Mail size={14} className="text-orange-500" />{user.email}</div>
                      <div className="flex items-center gap-2 text-sm text-slate-600"><Phone size={14} className="text-green-500" />{user.phone}</div>
                    </div>
                  </td>
                  
                  {activeTab === 'lecturers' ? (
                    <>
                        <td className="p-4 align-top">
                            <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded w-fit"><CreditCard size={14} />{user.staff_id || '-'}</div>
                        </td>
                        <td className="p-4 align-top">
                            {getSupervisees(user.id).length > 0 ? (
                                <div className="flex flex-col gap-1">
                                    {getSupervisees(user.id).map(app => (
                                        <div key={app.id} className="inline-flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>{app.student_name}</div>
                                    ))}
                                </div>
                            ) : <span className="text-xs text-slate-400 italic">Tiada pelajar</span>}
                        </td>
                        {currentUser?.role === UserRole.COORDINATOR && (
                            <td className="p-4 align-top text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <button onClick={() => handleManageSupervision(user)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded border border-blue-200 transition-colors" title="Urus Seliaan"><UserCog size={16} /></button>
                                    <button onClick={() => handleEditClick(user)} className="p-1.5 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded border border-yellow-200 transition-colors" title="Edit Staf"><Edit size={16} /></button>
                                    <button onClick={() => handleDeleteClick(user.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded border border-red-200 transition-colors" title="Padam Staf"><Trash2 size={16} /></button>
                                </div>
                            </td>
                        )}
                    </>
                  ) : (
                    <>
                      <td className="p-4 align-top">
                        <div className="font-medium text-slate-800 flex items-center gap-2"><Building2 size={16} className="text-blue-500" />{user.company_affiliation}</div>
                        <div className="text-sm text-slate-600 flex items-center gap-2 mt-1"><Briefcase size={14} className="text-slate-400" />{user.company_position}</div>
                      </td>
                      <td className="p-4 align-top">
                          <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2 text-sm text-slate-700">
                                  <GraduationCap size={16} className="text-indigo-500" />
                                  <span className="font-medium">{user.academic_level || '-'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <Clock size={14} className="text-slate-400" />
                                  <span>{user.experience_years ? `${user.experience_years} Tahun` : '0 Tahun'}</span>
                              </div>
                          </div>
                      </td>
                      <td className="p-4 align-top">
                          {getIndustrySupervisees(user.company_affiliation).length > 0 ? (
                              <div className="flex flex-col gap-1">
                                  {getIndustrySupervisees(user.company_affiliation).map(app => (
                                      <div key={app.id} className="inline-flex items-center gap-2 px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-100"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>{app.student_name}</div>
                                  ))}
                              </div>
                          ) : <span className="text-xs text-slate-400 italic">Tiada pelajar</span>}
                      </td>
                      <td className="p-4 align-top">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${user.role === UserRole.TRAINER ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>{ROLE_LABELS[user.role]}</span>
                        {user.has_dual_role && <span className="ml-2 inline-block px-2 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">+ Dual Role</span>}
                      </td>
                      {currentUser?.role === UserRole.COORDINATOR && (
                          <td className="p-4 align-top text-center">
                              <div className="flex items-center justify-center gap-2">
                                {user.is_approved === false && (
                                    <button onClick={() => handleApproveUser(user)} className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded border border-green-200 transition-colors" title="Luluskan Akaun"><CheckCircle size={16} /></button>
                                )}
                                <button onClick={() => handleEditClick(user)} className="p-1.5 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded border border-yellow-200 transition-colors" title="Edit Staf"><Edit size={16} /></button>
                                <button onClick={() => handleDeleteClick(user.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded border border-red-200 transition-colors" title="Padam Staf"><Trash2 size={16} /></button>
                              </div>
                          </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isSupervisionModalOpen} onClose={() => setIsSupervisionModalOpen(false)} title={`Urus Seliaan: ${selectedLecturer?.name}`}>
        <div className="space-y-6">
            <div>
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm"><UserCog size={16} className="text-blue-600" /> Pelajar Sedang Diselia ({selectedLecturer ? getSupervisees(selectedLecturer.id).length : 0})</h4>
                <div className="bg-slate-50 rounded-lg border border-slate-200 max-h-48 overflow-y-auto divide-y divide-slate-200">
                    {selectedLecturer && getSupervisees(selectedLecturer.id).length > 0 ? (
                        getSupervisees(selectedLecturer.id).map(app => (
                            <div key={app.id} className="p-3 flex justify-between items-center hover:bg-white transition-colors">
                                <div><div className="font-medium text-slate-800">{app.student_name}</div><div className="text-xs text-slate-500">{app.company_name}</div></div>
                                <button onClick={() => handleUnassign(app)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-full"><MinusCircle size={18} /></button>
                            </div>
                        ))
                    ) : <div className="p-4 text-center text-slate-500 text-sm italic">Tiada pelajar diselia.</div>}
                </div>
            </div>
            <div>
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm border-t pt-4"><UserPlus size={16} className="text-green-600" /> Pelajar Belum Ada Penyelia ({getUnassignedStudents().length})</h4>
                <div className="bg-slate-50 rounded-lg border border-slate-200 max-h-48 overflow-y-auto divide-y divide-slate-200">
                    {getUnassignedStudents().length > 0 ? (
                        getUnassignedStudents().map(app => (
                            <div key={app.id} className="p-3 flex justify-between items-center hover:bg-white transition-colors">
                                <div><div className="font-medium text-slate-800">{app.student_name}</div><div className="text-xs text-slate-500">{app.company_name}</div></div>
                                <button onClick={() => handleAssign(app)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-full"><PlusCircle size={18} /></button>
                            </div>
                        ))
                    ) : <div className="p-4 text-center text-slate-500 text-sm italic">Tiada pelajar menunggu penyelia.</div>}
                </div>
            </div>
        </div>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Kemaskini Maklumat Staf">
        {editingUser && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Penuh</label>
                    <input required type="text" className="w-full p-2 border rounded bg-white text-slate-900" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input required type="email" className="w-full p-2 border rounded bg-white text-slate-900" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                        <input required type="tel" className="w-full p-2 border rounded bg-white text-slate-900" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} />
                    </div>
                </div>

                {editingUser.role === UserRole.LECTURER && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">No. Staf</label>
                        <input required type="text" className="w-full p-2 border rounded bg-white text-slate-900" value={editingUser.staff_id || ''} onChange={e => setEditingUser({...editingUser, staff_id: e.target.value})} />
                    </div>
                )}

                {(editingUser.role === UserRole.TRAINER || editingUser.role === UserRole.SUPERVISOR) && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Syarikat</label>
                            <input disabled className="w-full p-2 border rounded bg-slate-100 text-slate-500" value={editingUser.company_affiliation || ''} />
                            <p className="text-xs text-slate-400 mt-1">Syarikat tidak boleh diubah.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Jawatan</label>
                            <input required type="text" className="w-full p-2 border rounded bg-white text-slate-900" value={editingUser.company_position || ''} onChange={e => setEditingUser({...editingUser, company_position: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tahap Akademik</label>
                                <select className="w-full p-2 border rounded bg-white text-slate-900" value={editingUser.academic_level || ''} onChange={e => setEditingUser({...editingUser, academic_level: e.target.value})}>
                                    <option value="">-- Pilih --</option>
                                    <option value="SPM">SPM / Sijil</option>
                                    <option value="Diploma">Diploma</option>
                                    <option value="Degree">Ijazah Sarjana Muda</option>
                                    <option value="Master">Sarjana (Master)</option>
                                    <option value="PhD">PhD</option>
                                    <option value="Lain-lain">Lain-lain</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Pengalaman (Tahun)</label>
                                <input type="number" min="0" className="w-full p-2 border rounded bg-white text-slate-900" value={editingUser.experience_years || 0} onChange={e => setEditingUser({...editingUser, experience_years: parseInt(e.target.value) || 0})} />
                            </div>
                        </div>
                    </>
                )}

                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 mt-4 flex justify-center items-center gap-2">
                    <Save size={18} /> Simpan Perubahan
                </button>
            </form>
        )}
      </Modal>
    </div>
  );
};
