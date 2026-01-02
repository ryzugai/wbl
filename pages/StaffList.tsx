
import React, { useState } from 'react';
import { User, UserRole, Application } from '../types';
import { Mail, Phone, Building2, CreditCard, Briefcase, UserCog, CheckCircle, Edit, Trash2, Users, ShieldCheck, Key, BookOpen } from 'lucide-react';
import { ROLE_LABELS } from '../constants';
import { Modal } from '../components/Modal';
import { toast } from 'react-hot-toast';
import { Language, t } from '../translations';

interface StaffListProps {
  users: User[];
  currentUser?: User;
  applications?: Application[];
  onUpdateApplication?: (app: Application) => Promise<void>;
  onUpdateUser: (user: User) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  language: Language;
}

export const StaffList: React.FC<StaffListProps> = ({ users, currentUser, applications = [], onUpdateUser, onDeleteUser, language }) => {
  const [activeTab, setActiveTab] = useState<'lecturers' | 'industry'>('lecturers');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Password Reset State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resettingUser, setResettingUser] = useState<User | null>(null);

  const lecturers = users.filter(u => u.role === UserRole.LECTURER);
  const industryStaff = users.filter(u => u.role === UserRole.TRAINER || u.role === UserRole.SUPERVISOR);

  const isCoordinator = currentUser?.role === UserRole.COORDINATOR;
  const isJKWBLViewer = currentUser?.is_jkwbl === true;

  const handleApproveUser = async (user: User) => {
    if (!isCoordinator && !isJKWBLViewer) return;
    try {
      await onUpdateUser({ ...user, is_approved: true });
      toast.success(language === 'ms' ? 'Pengguna telah diluluskan' : 'User approved');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleToggleJKWBL = async (user: User) => {
    if (!isCoordinator) {
        toast.error(language === 'ms' ? "Hanya Penyelaras boleh menukar status JKWBL." : "Only Coordinators can change JKWBL status.");
        return;
    }
    if (user.role !== UserRole.LECTURER) {
        toast.error(language === 'ms' ? "Hanya pensyarah boleh dilantik sebagai ahli JKWBL." : "Only lecturers can be appointed as JKWBL members.");
        return;
    }
    try {
      await onUpdateUser({ ...user, is_jkwbl: !user.is_jkwbl });
      toast.success(language === 'ms' ? `Status JKWBL ${user.is_jkwbl ? 'dikeluarkan' : 'diberikan'}` : `JKWBL status ${user.is_jkwbl ? 'removed' : 'given'}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser({ ...user });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      try {
        await onUpdateUser(editingUser);
        setIsEditModalOpen(false);
        setEditingUser(null);
      } catch (err: any) {
        toast.error(err.message);
      }
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

  const handleDeleteClick = async (id: string) => {
    if (!isCoordinator) return;
    if (confirm(language === 'ms' ? 'Padam akaun staf ini secara kekal?' : 'Permanently delete this staff account?')) {
      try {
        await onDeleteUser(id);
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  const subjectLabels: Record<string, string> = {
    analitik: t(language, 'subAnalitik'),
    operasi: t(language, 'subOperasi'),
    digital: t(language, 'subDigital'),
    jenama: t(language, 'subJenama'),
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">{language === 'ms' ? 'Senarai Staf & Industri' : 'Staff & Industry List'}</h2>

      <div className="flex gap-2 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('lecturers')} 
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'lecturers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
        >
          {t(language, 'lecturers')} ({lecturers.length})
        </button>
        <button 
          onClick={() => setActiveTab('industry')} 
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'industry' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
        >
          {t(language, 'industryStaff')} ({industryStaff.length})
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-sm text-slate-600">{language === 'ms' ? 'Nama' : 'Name'}</th>
                <th className="p-4 font-semibold text-sm text-slate-600">{language === 'ms' ? 'ID / Syarikat' : 'ID / Company'}</th>
                <th className="p-4 font-semibold text-sm text-slate-600 text-center">{t(language, 'actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(activeTab === 'lecturers' ? lecturers : industryStaff).length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500 italic">{t(language, 'noRecords')}</td>
                </tr>
              ) : (
                (activeTab === 'lecturers' ? lecturers : industryStaff).map(user => {
                  const teachingSubjects = user.role === UserRole.LECTURER 
                    ? JSON.parse(user.teaching_subjects || '[]') as string[]
                    : [];

                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 align-top">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                            {user.name}
                            {user.is_jkwbl && <ShieldCheck size={14} className="text-indigo-600" title="Ahli JKWBL" />}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mb-2"><Mail size={12} /> {user.email}</div>
                        
                        {/* TEACHING SUBJECTS DISPLAY */}
                        {user.role === UserRole.LECTURER && teachingSubjects.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {teachingSubjects.map(subKey => (
                              <span key={subKey} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                <BookOpen size={10} /> {subjectLabels[subKey] || subKey}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-4 align-top">
                        <div className="text-sm font-medium text-slate-700">
                          {activeTab === 'lecturers' ? user.staff_id : user.company_affiliation}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">
                            {ROLE_LABELS[user.role]}
                            {user.is_jkwbl && <span className="ml-1 text-indigo-600">(JKWBL)</span>}
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <div className="flex items-center justify-center gap-2">
                          {(isCoordinator || isJKWBLViewer) && user.is_approved === false && (
                            <button 
                              onClick={() => handleApproveUser(user)} 
                              className="p-1.5 bg-green-50 text-green-600 rounded border border-green-200 hover:bg-green-100"
                              title={language === 'ms' ? 'Luluskan Akaun' : 'Approve Account'}
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          
                          {isCoordinator && user.role === UserRole.LECTURER && (
                              <button 
                                  onClick={() => handleToggleJKWBL(user)} 
                                  className={`p-1.5 rounded border ${user.is_jkwbl ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}
                                  title={user.is_jkwbl ? (language === 'ms' ? "Tarik Akses JKWBL" : "Remove JKWBL Access") : (language === 'ms' ? "Beri Akses JKWBL" : "Grant JKWBL Access")}
                              >
                                  <ShieldCheck size={16} />
                              </button>
                          )}

                          {isCoordinator && (
                            <>
                              <button 
                                  onClick={() => { setResettingUser({...user}); setIsPasswordModalOpen(true); }} 
                                  className="p-1.5 bg-slate-100 text-slate-600 rounded border border-slate-200 hover:bg-slate-200"
                                  title={t(language, 'resetPassword')}
                              >
                                  <Key size={16} />
                              </button>
                              <button 
                                onClick={() => handleEditClick(user)} 
                                className="p-1.5 bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100"
                                title={t(language, 'editUser')}
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteClick(user.id)} 
                                className="p-1.5 bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100"
                                title={t(language, 'deleteUser')}
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset Modal */}
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title={t(language, 'resetPassword')}>
        <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600">{language === 'ms' ? 'Nama Penuh' : 'Full Name'}: <strong>{resettingUser?.name}</strong></p>
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

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={language === 'ms' ? 'Kemaskini Profil Staf' : 'Update Staff Profile'}>
        {editingUser && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'ms' ? 'Nama Penuh' : 'Full Name'}</label>
              <input 
                required 
                type="text"
                className="w-full p-2 border rounded bg-white text-slate-900" 
                value={editingUser.name} 
                onChange={e => setEditingUser({...editingUser, name: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input 
                required 
                type="email"
                className="w-full p-2 border rounded bg-white text-slate-900" 
                value={editingUser.email} 
                onChange={e => setEditingUser({...editingUser, email: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'ms' ? 'No. Telefon' : 'Phone No.'}</label>
              <input 
                required 
                type="tel"
                className="w-full p-2 border rounded bg-white text-slate-900" 
                value={editingUser.phone} 
                onChange={e => setEditingUser({...editingUser, phone: e.target.value})} 
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95">
              {t(language, 'save')}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};
