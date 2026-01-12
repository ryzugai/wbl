
import React, { useMemo } from 'react';
import { User, Application } from '../types';
import { UserCheck, ShieldCheck, Mail, Building2, CreditCard, CheckCircle2, AlertCircle, FileText, Calendar, GraduationCap, MapPin } from 'lucide-react';
import { Language, t } from '../translations';

interface StudentSupervisionProps {
  currentUser: User;
  applications: Application[];
  users: User[];
  language: Language;
}

export const StudentSupervision: React.FC<StudentSupervisionProps> = ({ currentUser, applications, users, language }) => {
  // Maklumat penyelia biasanya ada dalam profile currentUser jika Penyelaras/JKWBL dah assign.
  // Tetapi kita juga semak dalam applications untuk redundancy.
  const myApprovedApp = useMemo(() => {
    return applications.find(a => 
      (a.student_id === currentUser.matric_no || a.created_by === currentUser.username) && 
      (a.application_status === 'Diluluskan' || a.application_status === 'Menunggu')
    );
  }, [applications, currentUser]);

  const supervisorName = currentUser.faculty_supervisor_name || myApprovedApp?.faculty_supervisor_name;
  const supervisorStaffId = currentUser.faculty_supervisor_staff_id || myApprovedApp?.faculty_supervisor_staff_id;
  const supervisorId = currentUser.faculty_supervisor_id || myApprovedApp?.faculty_supervisor_id;

  // Cari profil lengkap penyelia untuk dapatkan gambar dan butiran lain
  const supervisorProfile = useMemo(() => {
    if (!supervisorId && !supervisorStaffId && !supervisorName) return null;
    return users.find(u => 
      (supervisorId && u.id === supervisorId) || 
      (supervisorStaffId && u.staff_id === supervisorStaffId) ||
      (supervisorName && u.name === supervisorName)
    );
  }, [users, supervisorId, supervisorStaffId, supervisorName]);

  if (!supervisorName) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <UserCheck size={40} className="text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-700">{t(language, 'studentSupNoAssigned')}</h3>
        <p className="text-slate-500 text-sm mt-2 max-w-sm text-center px-6">
            {t(language, 'studentSupNoAssignedDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-blue-600" />
            {t(language, 'studentSupTitle')}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{t(language, 'studentSupDesc')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supervisor Info Card */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm relative">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
                <div className="px-8 pb-8 -mt-12">
                    <div className="flex flex-col md:flex-row items-end gap-6 mb-6">
                        <div className="w-24 h-24 bg-white rounded-3xl p-1 shadow-xl flex items-center justify-center text-blue-600 border border-slate-100 overflow-hidden">
                             <div className="w-full h-full bg-blue-50 rounded-2xl flex items-center justify-center overflow-hidden">
                                {supervisorProfile?.profile_image ? (
                                    <img src={supervisorProfile.profile_image} className="w-full h-full object-cover" alt={supervisorName} />
                                ) : (
                                    <UserCheck size={48} />
                                )}
                             </div>
                        </div>
                        <div className="mb-2 text-center md:text-left">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{supervisorName}</h3>
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">Penyelia Fakulti (Industrial Mode)</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 transition-colors hover:bg-slate-100">
                            <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">No. Staf</p>
                                <p className="text-sm font-bold text-slate-700">{supervisorStaffId || supervisorProfile?.staff_id || '-'}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 transition-colors hover:bg-slate-100">
                            <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400">
                                <Building2 size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Jabatan / Fakulti</p>
                                <p className="text-sm font-bold text-slate-700">FPTT, UTeM</p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 transition-colors hover:bg-slate-100">
                            <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Hubungan Rasmi</p>
                                <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{supervisorProfile?.email || 'Sistem Pesanan WBL'}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 transition-colors hover:bg-slate-100">
                            <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Sesi WBL</p>
                                <p className="text-sm font-bold text-slate-700">2026 / 2027</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl h-fit">
                    <AlertCircle size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-blue-900">Peranan Penyelia Fakulti</h4>
                    <p className="text-sm text-blue-700 mt-1 leading-relaxed">
                        Penyelia fakulti anda akan bertanggungjawab untuk memantau kemajuan latihan industri anda, menyemak laporan mingguan, dan melakukan lawatan pemantauan ke premis industri sebanyak 4 kali sepanjang tempoh WBL.
                    </p>
                </div>
            </div>
        </div>

        {/* Documentation Status Sidebar */}
        <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FileText size={18} className="text-indigo-600" />
                    {t(language, 'studentSupDocStatus')}
                </h3>
                
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className={`p-1 rounded-full ${myApprovedApp?.reply_form_image ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-300'}`}>
                            <CheckCircle2 size={16} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-700">Borang Jawapan Industri</p>
                            <p className="text-[10px] text-slate-400">{myApprovedApp?.reply_form_image ? 'Telah Dimuat Naik' : 'Belum Dihantar'}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className={`p-1 rounded-full ${myApprovedApp?.reply_form_verified ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-300'}`}>
                            <CheckCircle2 size={16} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-700">Pengesahan Dokumen</p>
                            <p className="text-[10px] text-slate-400">{myApprovedApp?.reply_form_verified ? `Disahkan oleh ${myApprovedApp.reply_form_verified_by}` : 'Menunggu Pengesahan'}</p>
                        </div>
                    </div>
                </div>

                {myApprovedApp && !myApprovedApp.reply_form_image && (
                    <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                        <p className="text-[10px] font-bold text-orange-800 leading-tight">
                            TINDAKAN: Sila muat naik borang jawapan industri di menu "Permohonan" untuk disemak oleh {supervisorName}.
                        </p>
                    </div>
                )}
            </div>

            <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative group shadow-lg">
                <div className="relative z-10">
                    <GraduationCap size={32} className="text-blue-400 mb-4" />
                    <h4 className="font-bold text-lg leading-tight mb-2">Penempatan Latihan</h4>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Building2 size={12} />
                            <span className="font-bold text-slate-200">{myApprovedApp?.company_name || 'Belum Diluluskan'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <MapPin size={12} />
                            <span>{myApprovedApp?.company_district}, {myApprovedApp?.company_state}</span>
                        </div>
                    </div>
                </div>
                <Building2 size={100} className="absolute -right-4 -bottom-4 text-white/5 rotate-12" />
            </div>
        </div>
      </div>
    </div>
  );
};
