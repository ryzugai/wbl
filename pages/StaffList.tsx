
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Mail, Phone, Building2, CreditCard, Briefcase, GraduationCap } from 'lucide-react';
import { ROLE_LABELS } from '../constants';

interface StaffListProps {
  users: User[];
}

export const StaffList: React.FC<StaffListProps> = ({ users }) => {
  const [activeTab, setActiveTab] = useState<'lecturers' | 'industry'>('lecturers');

  const lecturers = users.filter(u => u.role === UserRole.LECTURER);
  const industryStaff = users.filter(u => u.role === UserRole.TRAINER || u.role === UserRole.SUPERVISOR);

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
                  <th className="p-4 font-semibold text-sm text-slate-600">ID Staf</th>
                ) : (
                  <>
                    <th className="p-4 font-semibold text-sm text-slate-600">Syarikat & Jawatan</th>
                    <th className="p-4 font-semibold text-sm text-slate-600">Peranan</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(activeTab === 'lecturers' ? lecturers : industryStaff).length === 0 && (
                 <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">Tiada rekod dijumpai.</td>
                 </tr>
              )}
              {(activeTab === 'lecturers' ? lecturers : industryStaff).map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{user.name}</div>
                    <div className="text-xs text-slate-500">Username: {user.username}</div>
                  </td>
                  <td className="p-4">
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
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded w-fit">
                        <CreditCard size={14} />
                        {user.staff_id || '-'}
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="p-4">
                        <div className="font-medium text-slate-800 flex items-center gap-2">
                           <Building2 size={16} className="text-blue-500" />
                           {user.company_affiliation}
                        </div>
                        <div className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                           <Briefcase size={14} className="text-slate-400" />
                           {user.company_position}
                        </div>
                      </td>
                      <td className="p-4">
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
    </div>
  );
};
