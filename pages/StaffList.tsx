
import React, { useState } from 'react';
import { User, UserRole, Application } from '../types';
import { Mail, Phone, Building2, CreditCard, Briefcase, UserCog, CheckCircle, Edit, Trash2, Users, ShieldCheck } from 'lucide-react';
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

export const StaffList: React.FC<StaffListProps> = ({ users, currentUser, applications = [], onUpdateUser, onDeleteUser }) => {
  const [activeTab, setActiveTab] = useState<'lecturers' | 'industry'>('lecturers');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const lecturers = users.filter(u => u.role === UserRole.LECTURER);
  const industryStaff = users.filter(u => u.role === UserRole.TRAINER || u.role === UserRole.SUPERVISOR);

  const isCoordinator = currentUser?.role === UserRole.COORDINATOR;
  const isJKWBLViewer = currentUser?.is_jkwbl === true;

  const handleApproveUser = async (user: User) => {
    if (!isCoordinator && !isJKWBLViewer) return;
    try {
      await onUpdateUser({ ...user, is_approved: true });
      toast.success('Pengguna telah diluluskan');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleToggleJKWBL = async (user: User) => {
    if (!isCoordinator) {
        toast.error("Hanya Penyelaras boleh menukar status JKWBL.");
        return;
    }
    if (user.role !== UserRole.LECTURER) {
        toast.error("Hanya pensyarah boleh dilantik sebagai ahli JKWBL.");
        return;
    }
    try {
      await onUpdateUser({ ...user, is_jkwbl: !user.is_jkwbl });
      toast.success(`Status JKWBL ${user.is_jkwbl ? 'dikeluarkan' : 'diberikan'}`);
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

  const handleDeleteClick = async (id: string) => {
    if (!isCoordinator) return;
    if (confirm('Padam akaun staf ini secara kekal?')) {
      try {
        await onDeleteUser(id);
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Senarai Staf & Industri</h2>

      <div className="flex gap-2 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('lecturers')} 
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'lecturers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
        >
          Pensyarah ({lecturers.length})
        </button>
        <button 
          onClick={() => setActiveTab('industry')} 
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'industry' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
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
                <th className="p-4 font-semibold text-sm text-slate-600">ID / Syarikat</th>
                <th className="p-4 font-semibold text-sm text-slate-600 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(activeTab === 'lecturers' ? lecturers : industryStaff).length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500 italic">Tiada rekod dijumpai.</td>
                </tr>
              ) : (
                (activeTab === 'lecturers' ? lecturers : industryStaff).map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                          {user.name}
                          {user.is_jkwbl && <ShieldCheck size={14} className="text-indigo-600" title="Ahli JKWBL" />}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1"><Mail size={12} /> {user.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-slate-700">
                        {activeTab === 'lecturers' ? user.staff_id : user.company_affiliation}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                          {ROLE_LABELS[user.role]}
                          {user.is_jkwbl && <span className="ml-1 text-indigo-600">(JKWBL)</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Approval Action for Coordinator or JKWBL */}
                        {(isCoordinator || isJKWBLViewer) && user.is_approved === false && (
                          <button 
                            onClick={() => handleApproveUser(user)} 
                            className="p-1.5 bg-green-50 text-green-600 rounded border border-green-200 hover:bg-green-100"
                            title="Luluskan Akaun"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        
                        {/* JKWBL Toggle - ONLY Coordinator and ONLY for Lecturers */}
                        {isCoordinator && user.role === UserRole.LECTURER && (
                            <button 
                                onClick={() => handleToggleJKWBL(user)} 
                                className={`p-1.5 rounded border ${user.is_jkwbl ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}
                                title={user.is_jkwbl ? "Tarik Akses JKWBL" : "Beri Akses JKWBL"}
                            >
                                <ShieldCheck size={16} />
                            </button>
                        )}

                        {/* Edit/Delete - ONLY Coordinator */}
                        {isCoordinator && (
                          <>
                            <button 
                              onClick={() => handleEditClick(user)} 
                              className="p-1.5 bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(user.id)} 
                              className="p-1.5 bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100"
                              title="Padam"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Kemaskini Profil Staf">
        {editingUser && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Penuh</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">No. Telefon</label>
              <input 
                required 
                type="tel"
                className="w-full p-2 border rounded bg-white text-slate-900" 
                value={editingUser.phone} 
                onChange={e => setEditingUser({...editingUser, phone: e.target.value})} 
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95">
              Simpan Perubahan
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};
