
import React, { useState, useMemo, useEffect } from 'react';
import { User, Application, UserRole } from '../types';
import { UsersRound, FileText, Eye, Building2, CheckCircle2, AlertCircle, Clock, Search, GraduationCap, Printer, ShieldCheck, FileCheck, Target, TrendingUp, RefreshCcw } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Language, t } from '../translations';
import { toast } from 'react-hot-toast';

interface SupervisedStudentsProps {
  currentUser: User;
  users: User[];
  applications: Application[];
  language: Language;
  onUpdateApplication: (app: Application) => Promise<void>;
}

export const SupervisedStudents: React.FC<SupervisedStudentsProps> = ({ currentUser, users, applications, language, onUpdateApplication }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // LOGIK PENYELIAAN YANG LEBIH MANTAP
  const supervisedStudents = useMemo(() => {
    // Gunakan JSON.stringify untuk memastikan kita memantau setiap perubahan kecil dalam array
    const filtered = users.filter(u => {
      if (u.role !== UserRole.STUDENT) return false;
      
      // Kriteria 1: Padanan ID (Utama)
      const isMyStudentById = u.faculty_supervisor_id === currentUser.id;
      
      // Kriteria 2: Padanan Nama (Fallback jika ID belum sinkron)
      const isMyStudentByName = u.faculty_supervisor_name === currentUser.name && currentUser.name !== "";
      
      // Kriteria 3: Semak dalam permohonan aktif pelajar tersebut
      const studentApps = applications.filter(a => 
        (a.student_id === u.matric_no || a.created_by === u.username)
      );
      const isMyStudentInApps = studentApps.some(a => 
        a.faculty_supervisor_id === currentUser.id || 
        (a.faculty_supervisor_name === currentUser.name && currentUser.name !== "")
      );

      const isMySupervisedStudent = isMyStudentById || isMyStudentByName || isMyStudentInApps;
      
      const searchMatch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (u.matric_no?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      
      return isMySupervisedStudent && searchMatch;
    }).map(student => {
      const studentApps = applications.filter(a => a.student_id === student.matric_no || a.created_by === student.username);
      // Dapatkan permohonan yang paling relevan (Diluluskan dahulu, kemudian Menunggu)
      const activeApp = studentApps.find(a => a.application_status === 'Diluluskan') || 
                        studentApps.find(a => a.application_status === 'Menunggu');
      
      return { ...student, activeApp };
    });

    return filtered;
  }, [users, applications, currentUser, searchTerm, lastRefreshed]);

  const handleRefresh = () => {
      setLastRefreshed(new Date());
      toast.success(language === 'ms' ? "Senarai seliaan dikemaskini!" : "Supervised list updated!");
  };

  const totalSupervised = supervisedStudents.length;
  const isGoalReached = totalSupervised >= 2;

  const handleVerifyBorang = async (app: Application) => {
    try {
      await onUpdateApplication({
        ...app,
        reply_form_verified: true,
        reply_form_verified_by: currentUser.name,
        reply_form_verified_at: new Date().toISOString()
      });
      toast.success(language === 'ms' ? "Borang disahkan!" : "Form verified!");
      setIsPdfModalOpen(false);
    } catch (err) {
      toast.error("Gagal mengesahkan borang.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-blue-600" />
            {t(language, 'supervisedTitle')}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{t(language, 'supervisedDesc')}</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
                onClick={handleRefresh}
                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 shadow-sm transition-all active:rotate-180 duration-500"
                title="Refresh Senarai"
            >
                <RefreshCcw size={18} />
            </button>
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder={t(language, 'search')} 
                    className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border transition-all duration-500 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm ${
        isGoalReached ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
      }`}>
          <div className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl shadow-sm ${isGoalReached ? 'bg-green-600 text-white' : 'bg-orange-500 text-white'}`}>
                  <Target size={28} />
              </div>
              <div>
                  <h3 className={`font-black text-lg ${isGoalReached ? 'text-green-900' : 'text-orange-900'}`}>{t(language, 'supervisedQuotaTitle')}</h3>
                  <p className={`text-xs font-bold ${isGoalReached ? 'text-green-700' : 'text-orange-700'}`}>
                      {totalSupervised} {language === 'ms' ? 'Pelajar dipilih' : 'Students selected'} • {isGoalReached ? (language === 'ms' ? 'Sasaran minimum dicapai' : 'Minimum target reached') : t(language, 'supervisedQuotaHint')}
                  </p>
              </div>
          </div>
          <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ms' ? 'Progress Seliaan' : 'Supervision Progress'}</p>
                  <div className="w-48 h-2 bg-slate-200 rounded-full mt-1 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${isGoalReached ? 'bg-green-500' : 'bg-orange-500'}`} 
                        style={{ width: `${Math.min((totalSupervised / 2) * 100, 100)}%` }}
                      />
                  </div>
              </div>
              <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-black text-lg shadow-inner ${
                isGoalReached ? 'bg-white border-green-200 text-green-600' : 'bg-white border-orange-200 text-orange-600'
              }`}>
                  {totalSupervised}/2
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {supervisedStudents.length === 0 ? (
          <div className="col-span-full bg-white p-16 rounded-3xl border border-dashed border-slate-300 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersRound size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">{language === 'ms' ? 'Tiada Pelajar Seliaan' : 'No Supervised Students'}</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                {language === 'ms' 
                    ? `Akaun ${currentUser.name} belum mempunyai pelajar seliaan. Sila ke menu "Senarai Pelajar" untuk memilih pelajar anda.` 
                    : `Account ${currentUser.name} has no supervised students. Please go to "Student List" to select yours.`}
            </p>
            <button 
                onClick={handleRefresh}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all"
            >
                <RefreshCcw size={14} /> Muat Semula Data
            </button>
          </div>
        ) : (
          supervisedStudents.map(student => (
            <div key={student.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col">
              <div className="p-5 border-b border-slate-50 bg-slate-50/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 overflow-hidden flex items-center justify-center text-blue-700 font-bold shrink-0 shadow-sm border border-white">
                      {student.profile_image ? (
                          <img src={student.profile_image} className="w-full h-full object-cover" alt={student.name} />
                      ) : (
                          student.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 leading-tight group-hover:text-blue-700 transition-colors">{student.name}</h3>
                      <p className="text-[10px] font-bold text-blue-600 uppercase mt-0.5">{student.matric_no}</p>
                    </div>
                  </div>
                  {student.activeApp?.reply_form_verified && (
                    <div className="text-green-600" title="Borang Disahkan">
                      <CheckCircle2 size={18} />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 flex-1 space-y-4">
                <div>
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <GraduationCap size={10} /> {language === 'ms' ? 'Program Pengajian' : 'Program'}
                   </div>
                   <p className="text-xs text-slate-600 font-medium line-clamp-1">{student.program}</p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Building2 size={10} /> {language === 'ms' ? 'Tempat Latihan (WBL)' : 'Placement'}
                   </div>
                   {student.activeApp ? (
                     <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{student.activeApp.company_name}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                student.activeApp.application_status === 'Diluluskan' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                                {student.activeApp.application_status}
                            </span>
                        </div>
                        
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {student.activeApp.reply_form_image ? (
                                <button 
                                    onClick={() => { setSelectedApp(student.activeApp || null); setIsPdfModalOpen(true); }}
                                    className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                >
                                    <FileText size={14} />
                                    {t(language, 'supervisedViewDoc')}
                                </button>
                            ) : (
                                <div className="flex items-center justify-center gap-2 py-2 text-slate-400 text-[10px] italic">
                                    <AlertCircle size={14} />
                                    {t(language, 'supervisedNoDoc')}
                                </div>
                            )}
                        </div>
                     </div>
                   ) : (
                     <div className="flex items-center gap-2 text-slate-400 text-[10px] italic py-1">
                        <Clock size={12} /> Belum Memohon Penempatan
                     </div>
                   )}
                </div>
              </div>
              
              <div className="px-5 py-3 bg-slate-50/30 border-t border-slate-100 flex justify-between items-center">
                 <span className="text-[9px] text-slate-400 font-medium italic">WBL Session 2026/2027</span>
                 {student.activeApp?.reply_form_uploaded_at && (
                    <span className="text-[8px] text-slate-400 font-medium">
                      Kemas Kini: {new Date(student.activeApp.reply_form_uploaded_at).toLocaleDateString()}
                    </span>
                 )}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} title="Semakan Dokumen Pelajar Seliaan">
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-900 text-sm leading-tight">{selectedApp?.student_name}</h4>
                <p className="text-xs text-blue-600 mt-1 uppercase font-bold">{selectedApp?.company_name}</p>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative shadow-inner" style={{ height: '500px' }}>
                {selectedApp?.reply_form_image ? (
                    <iframe 
                        src={selectedApp.reply_form_image} 
                        className="w-full h-full"
                        title="PDF Preview"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 italic">Fail tidak ditemui.</div>
                )}
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button 
                      onClick={() => {
                          if (selectedApp?.reply_form_image) {
                              const link = document.createElement('a');
                              link.href = selectedApp.reply_form_image;
                              link.download = `Borang_Jawapan_${selectedApp.student_id}.pdf`;
                              link.click();
                          }
                      }}
                      className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
                  >
                      <Printer size={20} /> Muat Turun PDF
                  </button>
                  <button 
                      onClick={() => setIsPdfModalOpen(false)}
                      className="px-6 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
                  >
                      {t(language, 'cancel')}
                  </button>
                </div>
                
                {selectedApp?.reply_form_image && !selectedApp.reply_form_verified && (
                    <button 
                        onClick={() => selectedApp && handleVerifyBorang(selectedApp)}
                        className="w-full py-4 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg shadow-green-100 transition-all active:scale-[0.98]"
                    >
                        <FileCheck size={20} />
                        Sahkan Borang Jawapan
                    </button>
                )}
            </div>
            
            {selectedApp?.reply_form_verified && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-green-600" />
                    <div>
                        <p className="text-[11px] font-bold text-green-800 uppercase">Dokumen Telah Disahkan</p>
                        <p className="text-[10px] text-green-600 italic">Disahkan oleh: {selectedApp.reply_form_verified_by}</p>
                    </div>
                </div>
            )}
        </div>
      </Modal>
    </div>
  );
};
