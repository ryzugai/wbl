import React, { useState, useMemo } from 'react';
import { User, UserRole, Application } from '../types';
import { Mail, Phone, Building2, CreditCard, Briefcase, UserCog, CheckCircle, Edit, Trash2, Users, ShieldCheck, Key, BookOpen, Search, ShieldAlert, CheckCircle2, Lock, Unlock, RefreshCw } from 'lucide-react';
import { ROLE_LABELS } from '../constants';
import { Modal } from '../components/Modal';
import { toast } from 'react-hot-toast';
import { Language, t } from '../translations';
import { StorageService } from '../services/storage';

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
  const [activeTab, setActiveTab] = useState<'allUsers' | 'lecturers' | 'industry'>('allUsers');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Password Reset State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const isCoordinator = currentUser?.role === UserRole.COORDINATOR;
  const isJKWBLViewer = currentUser?.is_jkwbl === true;

  // Filtered lists
  const lecturers = useMemo(() => users.filter(u => u.role === UserRole.LECTURER), [users]);
  const industryStaff = useMemo(() => users.filter(u => u.role === UserRole.TRAINER || u.role === UserRole.SUPERVISOR), [users]);

  // Notifications related to forgot password
  const forgotPasswordRequests = useMemo(() => {
    try {
      const notifs = StorageService.getNotifications();
      return notifs.filter(n => 
        (n.title_ms && n.title_ms.toLowerCase().includes('lupa kata laluan')) ||
        (n.title_en && n.title_en.toLowerCase().includes('password reset'))
      );
    } catch {
      return [];
    }
  }, [users]);

  const displayedUsers = useMemo(() => {
    let list: User[] = [];
    if (activeTab === 'lecturers') list = lecturers;
    else if (activeTab === 'industry') list = industryStaff;
    else list = users;

    if (roleFilter !== 'all') {
      list = list.filter(u => u.role === roleFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(u => 
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.matric_no && u.matric_no.toLowerCase().includes(q)) ||
        ((u as any).staff_id && (u as any).staff_id.toLowerCase().includes(q)) ||
        (u.ic_no && u.ic_no.includes(q)) ||
        (u.company_affiliation && u.company_affiliation.toLowerCase().includes(q))
      );
    }

    return list;
  }, [users, activeTab, lecturers, industryStaff, roleFilter, searchQuery]);

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

  const handleToggleActiveStatus = async (user: User) => {
    if (!isCoordinator) return;
    try {
      const updated = await StorageService.toggleUserActiveStatus(user.id);
      await onUpdateUser(updated);
      toast.success(language === 'ms' 
        ? `Status akaun ${user.name} kini: ${updated.is_active !== false ? 'Aktif' : 'Digantung'}` 
        : `Account status updated`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleOpenResetModal = (user: User) => {
    setResettingUser({ ...user });
    setNewPassword('Utem@2026'); // Smart default
    setIsPasswordModalOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resettingUser || !newPassword.trim()) {
      toast.error(language === 'ms' ? 'Sila masukkan kata laluan baharu' : 'Please enter new password');
      return;
    }
    setIsResetting(true);
    try {
      const updated = await StorageService.resetUserPassword(resettingUser.id, newPassword.trim());
      await onUpdateUser(updated);
      toast.success(language === 'ms' 
        ? `Kata laluan bagi ${resettingUser.name} (${resettingUser.username}) berjaya direset!` 
        : 'Password reset successfully');
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setResettingUser(null);
    } catch (e: any) {
      toast.error(e.message || 'Gagal reset kata laluan');
    } finally {
      setIsResetting(false);
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
        toast.success(language === 'ms' ? 'Maklumat staf berjaya dikemaskini' : 'Staff info updated');
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (!isCoordinator) return;
    if (confirm(language === 'ms' ? 'Padam akaun pengguna ini secara kekal?' : 'Permanently delete this user account?')) {
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
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <UserCog size={22} />
            </span>
            <h2 className="text-xl font-black text-slate-800">
              {language === 'ms' ? 'Pengurusan Pengguna & Reset Kata Laluan' : 'User Management & Password Reset'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ms' 
              ? 'Penyelaras WBL boleh menetapkan semula kata laluan bagi semua akaun pengguna (Pelajar, Pensyarah, Jurulatih Industri & Penyelia) yang terlupa kata laluan.' 
              : 'WBL Coordinator can reset passwords for all user accounts who forgot passwords.'}
          </p>
        </div>

        {isCoordinator && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5">
              <Key size={14} className="text-amber-600" />
              <span>{users.length} {language === 'ms' ? 'Jumlah Akaun' : 'Total Accounts'}</span>
            </span>
          </div>
        )}
      </div>

      {/* Forgot Password Request Banner for Coordinator */}
      {isCoordinator && forgotPasswordRequests.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0 animate-pulse">
              <ShieldAlert size={20} />
            </span>
            <div>
              <h4 className="font-bold text-amber-950 text-sm">
                {language === 'ms' 
                  ? `${forgotPasswordRequests.length} Permohonan Bantuan Lupa Kata Laluan Menunggu Tindakan Penyelaras` 
                  : `${forgotPasswordRequests.length} Password Reset Requests Pending`}
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {language === 'ms'
                  ? 'Pengguna telah membuat permohonan melalui laman log masuk. Sila klik "Reset" pada akaun berkaitan di bawah.'
                  : 'Users requested password resets through the login screen.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setActiveTab('allUsers'); setRoleFilter('all'); }}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm"
          >
            {language === 'ms' ? 'Lihat Semua Akaun' : 'View All Accounts'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button 
          onClick={() => setActiveTab('allUsers')} 
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'allUsers' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users size={14} />
          <span>{language === 'ms' ? 'Semua Pengguna & Reset Akaun' : 'All Users & Reset'}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeTab === 'allUsers' ? 'bg-blue-400 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {users.length}
          </span>
        </button>

        <button 
          onClick={() => setActiveTab('lecturers')} 
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'lecturers' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserCog size={14} />
          <span>{t(language, 'lecturers')}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeTab === 'lecturers' ? 'bg-blue-400 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {lecturers.length}
          </span>
        </button>

        <button 
          onClick={() => setActiveTab('industry')} 
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'industry' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Briefcase size={14} />
          <span>{t(language, 'industryStaff')}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeTab === 'industry' ? 'bg-blue-400 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {industryStaff.length}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'ms' ? 'Cari nama, no. matrik, username, emel...' : 'Search name, matric, username, email...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {activeTab === 'allUsers' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-600 shrink-0">
              {language === 'ms' ? 'Peranan:' : 'Role:'}
            </span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{language === 'ms' ? 'Semua Peranan' : 'All Roles'}</option>
              <option value={UserRole.STUDENT}>{language === 'ms' ? 'Pelajar (Student)' : 'Student'}</option>
              <option value={UserRole.LECTURER}>{language === 'ms' ? 'Pensyarah (Lecturer)' : 'Lecturer'}</option>
              <option value={UserRole.TRAINER}>{language === 'ms' ? 'Jurulatih Industri (Trainer)' : 'Industry Trainer'}</option>
              <option value={UserRole.SUPERVISOR}>{language === 'ms' ? 'Penyelia Industri' : 'Supervisor'}</option>
              <option value={UserRole.COORDINATOR}>{language === 'ms' ? 'Penyelaras WBL' : 'Coordinator'}</option>
            </select>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold text-slate-700">{language === 'ms' ? 'Maklumat Pengguna' : 'User Info'}</th>
                <th className="p-4 font-bold text-slate-700">{language === 'ms' ? 'Peranan & ID / No. Matrik' : 'Role & ID'}</th>
                <th className="p-4 font-bold text-slate-700">{language === 'ms' ? 'Status Akaun' : 'Account Status'}</th>
                <th className="p-4 font-bold text-slate-700 text-center">{language === 'ms' ? 'Tindakan & Reset Kata Laluan' : 'Actions & Password Reset'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                    {language === 'ms' ? 'Tiada rekod pengguna dijumpai.' : t(language, 'noRecords')}
                  </td>
                </tr>
              ) : (
                displayedUsers.map(user => {
                  const teachingSubjects = user.role === UserRole.LECTURER 
                    ? JSON.parse(user.teaching_subjects || '[]') as string[]
                    : [];

                  const isInactive = user.is_active === false;

                  return (
                    <tr key={user.id} className={`hover:bg-slate-50/80 transition-colors ${isInactive ? 'bg-slate-50/50 opacity-75' : ''}`}>
                      <td className="p-4 align-top">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{user.name}</span>
                          {user.is_jkwbl && (
                            <span title="Ahli JKWBL" className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200 text-[10px] font-bold flex items-center gap-0.5">
                              <ShieldCheck size={11} /> JKWBL
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail size={12} className="text-slate-400" /> 
                          <span>{user.email || 'Tiada emel'}</span>
                        </div>
                        {user.phone && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone size={11} /> <span>{user.phone}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          Username: <strong className="text-slate-700">{user.username}</strong>
                        </div>
                        
                        {/* TEACHING SUBJECTS DISPLAY FOR LECTURER */}
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
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 ${
                          user.role === UserRole.COORDINATOR ? 'bg-purple-100 text-purple-800' :
                          user.role === UserRole.LECTURER ? 'bg-blue-100 text-blue-800' :
                          user.role === UserRole.TRAINER ? 'bg-amber-100 text-amber-800' :
                          user.role === UserRole.SUPERVISOR ? 'bg-indigo-100 text-indigo-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {ROLE_LABELS[user.role] || user.role}
                        </span>

                        <div className="text-xs font-mono font-bold text-slate-700 mt-1">
                          {user.matric_no ? `Matrik: ${user.matric_no}` :
                           (user as any).staff_id ? `Staf ID: ${(user as any).staff_id}` :
                           user.company_affiliation ? user.company_affiliation :
                           user.id}
                        </div>
                        {user.academic_level && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                            {user.academic_level}
                          </div>
                        )}
                      </td>

                      <td className="p-4 align-top">
                        <div className="space-y-1">
                          {user.is_approved === false ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Menunggu Kelulusan
                            </span>
                          ) : isInactive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <Lock size={10} /> Akaun Digantung
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 size={10} /> Aktif & Sah
                            </span>
                          )}

                          {user.last_login_at && (
                            <div className="text-[10px] text-slate-400">
                              Log masuk: {new Date(user.last_login_at).toLocaleDateString('ms-MY')}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-4 align-top">
                        <div className="flex items-center justify-center flex-wrap gap-1.5">
                          {/* 1. RESET PASSWORD BUTTON (Prominent for Coordinator) */}
                          {isCoordinator && (
                            <button 
                              type="button"
                              onClick={() => handleOpenResetModal(user)} 
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                              title={language === 'ms' ? 'Reset Kata Laluan Pengguna' : 'Reset Password'}
                            >
                              <Key size={13} />
                              <span>{language === 'ms' ? 'Reset Password' : 'Reset'}</span>
                            </button>
                          )}

                          {/* 2. Approve User Button */}
                          {(isCoordinator || isJKWBLViewer) && user.is_approved === false && (
                            <button 
                              type="button"
                              onClick={() => handleApproveUser(user)} 
                              className="p-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 hover:bg-emerald-100"
                              title={language === 'ms' ? 'Luluskan Akaun' : 'Approve Account'}
                            >
                              <CheckCircle size={15} />
                            </button>
                          )}
                          
                          {/* 3. JKWBL Toggle Button for Lecturer */}
                          {isCoordinator && user.role === UserRole.LECTURER && (
                            <button 
                              type="button"
                              onClick={() => handleToggleJKWBL(user)} 
                              className={`p-1.5 rounded-xl border transition-colors ${user.is_jkwbl ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}
                              title={user.is_jkwbl ? (language === 'ms' ? "Tarik Akses JKWBL" : "Remove JKWBL Access") : (language === 'ms' ? "Beri Akses JKWBL" : "Grant JKWBL Access")}
                            >
                              <ShieldCheck size={15} />
                            </button>
                          )}

                          {/* 4. Toggle Active / Suspend Button */}
                          {isCoordinator && user.role !== UserRole.COORDINATOR && (
                            <button
                              type="button"
                              onClick={() => handleToggleActiveStatus(user)}
                              className={`p-1.5 rounded-xl border transition-colors ${isInactive ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                              title={isInactive ? (language === 'ms' ? 'Aktifkan Semula Akaun' : 'Activate Account') : (language === 'ms' ? 'Gantung Akaun Sementara' : 'Suspend Account')}
                            >
                              {isInactive ? <Unlock size={14} /> : <Lock size={14} />}
                            </button>
                          )}

                          {/* 5. Edit Profile Button */}
                          {isCoordinator && (
                            <button 
                              type="button"
                              onClick={() => handleEditClick(user)} 
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200 hover:bg-blue-100"
                              title={t(language, 'editUser')}
                            >
                              <Edit size={14} />
                            </button>
                          )}

                          {/* 6. Delete Button */}
                          {isCoordinator && user.role !== UserRole.COORDINATOR && (
                            <button 
                              type="button"
                              onClick={() => handleDeleteClick(user.id)} 
                              className="p-1.5 bg-red-50 text-red-600 rounded-xl border border-red-200 hover:bg-red-100"
                              title={t(language, 'deleteUser')}
                            >
                              <Trash2 size={14} />
                            </button>
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

      {/* Enhanced Password Reset Modal */}
      {isPasswordModalOpen && resettingUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-6 bg-gradient-to-r from-amber-600 via-orange-600 to-slate-900 text-white flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider text-amber-200">
                  {language === 'ms' ? 'Tindakan Penyelaras' : 'Coordinator Action'}
                </span>
                <h3 className="text-lg font-black mt-1 flex items-center gap-1.5">
                  <Key size={18} />
                  <span>{language === 'ms' ? 'Reset Kata Laluan Pengguna' : 'Reset User Password'}</span>
                </h3>
                <p className="text-xs text-amber-100 mt-0.5">
                  {language === 'ms' 
                    ? 'Tetapkan kata laluan baharu untuk membolehkan pengguna log masuk semula.' 
                    : 'Set a new password for this account.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{language === 'ms' ? 'Nama Pengguna:' : 'Name:'}</span>
                  <span className="font-bold text-slate-900">{resettingUser.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{language === 'ms' ? 'Username / ID:' : 'Username:'}</span>
                  <span className="font-mono font-bold text-blue-700">{resettingUser.username}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{language === 'ms' ? 'Peranan:' : 'Role:'}</span>
                  <span className="font-bold text-slate-800">{ROLE_LABELS[resettingUser.role] || resettingUser.role}</span>
                </div>
                {resettingUser.matric_no && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">No. Matrik:</span>
                    <span className="font-mono font-bold text-slate-800">{resettingUser.matric_no}</span>
                  </div>
                )}
                {resettingUser.email && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Emel:</span>
                    <span className="font-mono text-slate-600">{resettingUser.email}</span>
                  </div>
                )}
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'ms' ? 'Pilihan Kata Laluan Cepat:' : 'Quick Presets:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPassword('Utem@2026')}
                    className="p-2 border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 rounded-xl text-xs font-bold text-slate-800 transition-colors text-left flex items-center justify-between"
                  >
                    <span>Lalai: Utem@2026</span>
                    <RefreshCw size={12} className="text-amber-600" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewPassword(resettingUser.matric_no || resettingUser.username || '123456')}
                    className="p-2 border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 rounded-xl text-xs font-bold text-slate-800 transition-colors text-left flex items-center justify-between"
                  >
                    <span>{resettingUser.matric_no ? 'No. Matrik' : 'Username'}</span>
                    <RefreshCw size={12} className="text-amber-600" />
                  </button>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ms' ? 'Kata Laluan Baharu:' : 'New Password:'}
                </label>
                <input 
                  type="text" 
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Masukkan kata laluan baharu..."
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {language === 'ms' ? 'Akan dihantar notifikasi automatik kepada pengguna.' : 'Notification will be sent to user.'}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  {language === 'ms' ? 'Batal' : 'Cancel'}
                </button>
                <button 
                  type="button"
                  onClick={handleResetPassword} 
                  disabled={!newPassword.trim() || isResetting} 
                  className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Key size={14} />
                  <span>{isResetting ? (language === 'ms' ? 'Menyimpan...' : 'Saving...') : (language === 'ms' ? 'Sahkan Reset' : 'Confirm Reset')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={language === 'ms' ? 'Kemaskini Profil Staf' : 'Update Staff Profile'}>
        {editingUser && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'ms' ? 'Nama Penuh' : 'Full Name'}</label>
              <input 
                required 
                type="text"
                className="w-full p-2 border rounded-xl bg-white text-slate-900 text-xs font-bold" 
                value={editingUser.name} 
                onChange={e => setEditingUser({...editingUser, name: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input 
                required 
                type="email"
                className="w-full p-2 border rounded-xl bg-white text-slate-900 text-xs font-medium" 
                value={editingUser.email} 
                onChange={e => setEditingUser({...editingUser, email: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'ms' ? 'No. Telefon' : 'Phone No.'}</label>
              <input 
                required 
                type="tel"
                className="w-full p-2 border rounded-xl bg-white text-slate-900 text-xs font-medium" 
                value={editingUser.phone} 
                onChange={e => setEditingUser({...editingUser, phone: e.target.value})} 
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95 text-xs">
              {t(language, 'save')}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};
