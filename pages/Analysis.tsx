
import React, { useState, useMemo } from 'react';
import { Application, User, Company, UserRole } from '../types';
import { 
  Search, MapPin, Building2, FileSpreadsheet, Sparkles, CheckCircle2, 
  User as UserIcon, ArrowRight, LocateFixed, Mail, Download, 
  Printer, Copy, FileText, AlertTriangle, Users as UsersIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Language, t } from '../translations';
import { toast } from 'react-hot-toast';
import { generateInvitationLetter, generateLOI } from '../utils/letterGenerator';
import { Modal } from '../components/Modal';

interface AnalysisProps {
  applications: Application[];
  users: User[];
  companies: Company[];
  language: Language;
  currentUser: User;
}

interface GroupedStudentData {
  student_id: string;
  student_name: string;
  student_address: string;
  student_matric: string;
  student_id_internal: string;
  apps: {
    company_name: string;
    company_location: string;
    status: string;
    company_id?: string;
  }[];
}

interface GroupedCompanyData {
  company_name: string;
  company_location: string;
  company_id?: string;
  applicants: {
    student_name: string;
    student_matric: string;
    student_address: string;
    status: string;
  }[];
}

export const Analysis: React.FC<AnalysisProps> = ({ applications, users, companies, language, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'student' | 'company'>('student');
  const [localSuggestions, setLocalSuggestions] = useState<Record<string, string[]>>({});
  
  // Email Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [currentRowIndex, setCurrentRowIndex] = useState<number>(0);

  // Count total occurrences of each company name to detect duplicates
  const companyAppCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!applications) return counts;
    applications.forEach(app => {
      const name = app.company_name;
      counts[name] = (counts[name] || 0) + 1;
    });
    return counts;
  }, [applications]);

  const groupedMatchingData = useMemo(() => {
    const groups: Record<string, GroupedStudentData> = {};
    
    if (!applications) return [];

    applications.forEach(app => {
      const studentKey = app.student_id;
      if (!groups[studentKey]) {
        const student = users.find(u => u.username === app.created_by || u.matric_no === app.student_id);
        groups[studentKey] = {
          student_id: studentKey,
          student_matric: app.student_id,
          student_name: app.student_name,
          student_id_internal: student?.id || app.id,
          student_address: student?.address || (language === 'ms' ? 'Tiada Alamat' : 'No Address'),
          apps: []
        };
      }
      
      const companyRef = companies.find(c => c.company_name === app.company_name);
      
      if (!groups[studentKey].apps.find(a => a.company_name === app.company_name)) {
        groups[studentKey].apps.push({
          company_name: app.company_name,
          company_location: `${app.company_district}, ${app.company_state}`,
          status: app.application_status,
          company_id: companyRef?.id
        });
      }
    });

    return Object.values(groups).filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return (item.student_name?.toLowerCase() || "").includes(searchLower) || 
             (item.student_matric?.toLowerCase() || "").includes(searchLower) ||
             item.apps.some(a => (a.company_name?.toLowerCase() || "").includes(searchLower));
    });
  }, [applications, users, companies, searchTerm, language]);

  const groupedByCompanyData = useMemo(() => {
    const groups: Record<string, GroupedCompanyData> = {};

    if (!applications) return [];

    applications.forEach(app => {
      const companyKey = app.company_name;
      if (!groups[companyKey]) {
        const companyRef = companies.find(c => c.company_name === app.company_name);
        groups[companyKey] = {
          company_name: companyKey,
          company_location: `${app.company_district}, ${app.company_state}`,
          company_id: companyRef?.id,
          applicants: []
        };
      }

      const student = users.find(u => u.username === app.created_by || u.matric_no === app.student_id);
      
      if (!groups[companyKey].applicants.find(s => s.student_matric === app.student_id)) {
        groups[companyKey].applicants.push({
          student_name: app.student_name,
          student_matric: app.student_id,
          student_address: student?.address || (language === 'ms' ? 'Tiada Alamat' : 'No Address'),
          status: app.application_status
        });
      }
    });

    return Object.values(groups).filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return (item.company_name?.toLowerCase() || "").includes(searchLower) || 
             item.applicants.some(s => 
               (s.student_name?.toLowerCase() || "").includes(searchLower) || 
               (s.student_matric?.toLowerCase() || "").includes(searchLower)
             );
    });
  }, [applications, users, companies, searchTerm, language]);

  const openEmailModal = (companyName: string, rowIndex: number) => {
    const company = companies.find(c => c.company_name === companyName);
    if (!company) {
      toast.error(language === 'ms' ? 'Maklumat syarikat tidak ditemui.' : 'Company info not found.');
      return;
    }
    setSelectedCompany(company);
    setCurrentRowIndex(rowIndex);
    setIsEmailModalOpen(true);
  };

  const getEmailBody = () => {
    if (!currentUser) return "";
    const jawatan = currentUser.role === UserRole.COORDINATOR ? 'Penyelaras' : 'Ahli Jawatankuasa (JK)';
    return `Assalamualaikum dan salam sejahtera Tuan/Puan. Saya ${currentUser.name}, ${jawatan} program BTEC WBL ingin mempelawa pihak Tuan/Puan sebagai rakan Kerjasama industri seperti terkandung didalam surat yang dilampirkan.\n\nMohon jasa baik tuan untuk berikan respon pada pautan berikut https://forms.office.com/r/Z1QEaXM6RR\n\nSekian terima kasih atas perhatian dan kerjasama.`;
  };

  const handleLaunchEmail = () => {
    if (!selectedCompany?.company_contact_email) {
      toast.error(language === 'ms' ? 'Syarikat ini tidak mempunyai alamat emel.' : 'This company has no email address.');
      return;
    }
    const subject = encodeURIComponent(`Pelawaan Kerjasama Industri WBL UTeM - ${selectedCompany.company_name}`);
    const body = encodeURIComponent(getEmailBody());
    window.location.href = `mailto:${selectedCompany.company_contact_email}?subject=${subject}&body=${body}`;
    setIsEmailModalOpen(false);
    toast.success(language === 'ms' ? 'Membuka aplikasi emel...' : 'Opening email app...');
  };

  const generateLocalSuggestion = (studentIdInternal: string, address: string) => {
    if (!address || address.length < 5 || address.includes('Tiada Alamat')) {
      toast.error(language === 'ms' ? 'Alamat pelajar tidak lengkap.' : 'Student address is incomplete.');
      return;
    }
    const addrLower = address.toLowerCase();
    const scoredCompanies = companies.map(comp => {
      let score = 0;
      const district = comp.company_district?.toLowerCase() || "";
      const state = comp.company_state?.toLowerCase() || "";
      if (district && addrLower.includes(district)) score += 10;
      if (state && addrLower.includes(state)) score += 5;
      return { name: comp.company_name, score };
    });
    const topSuggestions = scoredCompanies
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(c => c.name);
    
    if (topSuggestions.length === 0) {
      toast.error(language === 'ms' ? 'Tiada syarikat sepadan dijumpai.' : 'No matching companies found.');
    } else {
      setLocalSuggestions(prev => ({ ...prev, [studentIdInternal]: topSuggestions }));
      toast.success(language === 'ms' ? 'Analisis lokasi selesai.' : 'Location analysis complete.');
    }
  };

  const exportToExcel = () => {
    const dataToExport = viewMode === 'student' 
      ? groupedMatchingData.map(item => ({
          'Nama Pelajar': item.student_name,
          'No Matrik': item.student_matric,
          'Alamat': item.student_address,
          'Syarikat': item.apps.map(a => a.company_name).join(', ')
        }))
      : groupedByCompanyData.map(item => ({
          'Nama Syarikat': item.company_name,
          'Lokasi': item.company_location,
          'Pemohon': item.applicants.map(s => `${s.student_name} (${s.student_matric})`).join(', ')
        }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Analisis');
    XLSX.writeFile(workbook, `Analisis_WBL_${viewMode}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t(language, 'analysisTitle')}</h2>
          <p className="text-sm text-slate-500 mt-1">{t(language, 'analysisDesc')}</p>
        </div>
        <div className="flex gap-2">
            <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex">
                <button 
                    onClick={() => setViewMode('student')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'student' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <UserIcon size={14} /> {language === 'ms' ? 'Ikut Pelajar' : 'By Student'}
                </button>
                <button 
                    onClick={() => setViewMode('company')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'company' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Building2 size={14} /> {language === 'ms' ? 'Ikut Syarikat' : 'By Company'}
                </button>
            </div>
            <button 
              onClick={exportToExcel} 
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm font-bold text-sm transition-all"
            >
              <FileSpreadsheet size={18} /> {t(language, 'exportExcel')}
            </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input 
            type="text" 
            placeholder={t(language, 'search')} 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-[10px] font-bold text-yellow-700 shadow-sm">
            <AlertTriangle size={14} />
            <span>KUNING: Syarikat mempunyai >1 permohonan (Elakkan Spam Emel)</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold text-xs text-slate-500 uppercase tracking-wider w-[30%]">
                    {viewMode === 'student' ? 'Pelajar & Alamat' : 'Syarikat & Lokasi'}
                </th>
                <th className="p-4 font-bold text-xs text-slate-500 uppercase tracking-wider w-[40%]">
                    {viewMode === 'student' ? 'Syarikat & Emel' : 'Pemohon (Pelajar)'}
                </th>
                <th className="p-4 font-bold text-xs text-slate-500 uppercase tracking-wider w-[30%]">
                    {viewMode === 'student' ? 'Analisis Sistem' : 'Tindakan Industri'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {viewMode === 'student' ? (
                groupedMatchingData.length === 0 ? (
                  <tr><td colSpan={3} className="p-12 text-center text-slate-400 italic">Tiada rekod.</td></tr>
                ) : (
                  groupedMatchingData.map((item, rowIndex) => (
                    <tr key={item.student_id || rowIndex} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 align-top">
                        <div className="font-bold text-slate-900">{item.student_name}</div>
                        <div className="text-[10px] text-indigo-600 font-bold mb-2 uppercase">{item.student_matric}</div>
                        <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 italic line-clamp-2">
                          {item.student_address}
                        </div>
                      </td>
                      <td className="p-4 align-top space-y-2">
                        {item.apps.map((app, appIdx) => {
                          const totalAppCount = companyAppCounts[app.company_name] || 0;
                          const isMultiple = totalAppCount > 1;

                          return (
                              <div 
                                  key={appIdx} 
                                  className={`p-2 rounded-xl border shadow-sm flex justify-between items-center group transition-all ${
                                      isMultiple 
                                      ? 'bg-yellow-50 border-yellow-200 ring-1 ring-yellow-100 animate-pulse-slow' 
                                      : 'bg-white border-slate-200'
                                  }`}
                              >
                              <div className="flex-1">
                                  <div className="flex items-center gap-1.5">
                                      <div className={`text-xs font-bold ${isMultiple ? 'text-yellow-900' : 'text-slate-800'}`}>
                                          {app.company_name}
                                      </div>
                                      {isMultiple && (
                                          <div className="flex items-center gap-0.5 bg-yellow-200 text-yellow-800 text-[8px] px-1 py-0.5 rounded font-black uppercase tracking-tighter" title={`Terdapat ${totalAppCount} permohonan ke syarikat ini.`}>
                                              <AlertTriangle size={8} /> {totalAppCount} PERMOHONAN
                                          </div>
                                      )}
                                  </div>
                                  <div className={`text-[9px] ${isMultiple ? 'text-yellow-600' : 'text-slate-400'}`}>
                                      {app.company_location}
                                  </div>
                              </div>
                              <button 
                                  onClick={() => openEmailModal(app.company_name, rowIndex + 1)}
                                  className={`p-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm ${
                                      isMultiple 
                                      ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                              >
                                  <Mail size={12} />
                                  <span className="text-[9px] font-bold uppercase">Emel</span>
                              </button>
                              </div>
                          );
                        })}
                      </td>
                      <td className="p-4 align-top">
                        {localSuggestions[item.student_id_internal] ? (
                          <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                            <p className="text-[10px] font-black text-green-700 uppercase mb-2 flex items-center gap-1"><Sparkles size={12}/> Padanan Lokasi</p>
                            <div className="space-y-1">
                              {localSuggestions[item.student_id_internal].map((s, si) => (
                                <div key={si} className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                  <ArrowRight size={10} className="text-green-500" /> {s}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => generateLocalSuggestion(item.student_id_internal, item.student_address)}
                            className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50"
                          >
                            <LocateFixed size={14} /> Analisis Lokasi
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )
              ) : (
                // VIEW BY COMPANY
                groupedByCompanyData.length === 0 ? (
                  <tr><td colSpan={3} className="p-12 text-center text-slate-400 italic">Tiada rekod.</td></tr>
                ) : (
                  groupedByCompanyData.map((item, rowIndex) => {
                    const isMultiple = item.applicants.length > 1;
                    return (
                      <tr key={item.company_name || rowIndex} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 align-top">
                          <div className={`p-4 rounded-2xl border transition-all ${
                              isMultiple 
                              ? 'bg-yellow-50 border-yellow-200 ring-1 ring-yellow-100' 
                              : 'bg-slate-50 border-slate-100'
                          }`}>
                              <div className="flex items-center gap-2">
                                  <Building2 size={16} className={isMultiple ? 'text-yellow-600' : 'text-slate-400'} />
                                  <div className={`font-bold leading-tight ${isMultiple ? 'text-yellow-900' : 'text-slate-900'}`}>{item.company_name}</div>
                              </div>
                              <div className="flex items-center gap-1.5 mt-2">
                                  <MapPin size={12} className="text-slate-400" />
                                  <div className="text-[10px] text-slate-500">{item.company_location}</div>
                              </div>
                              {isMultiple && (
                                <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-200 text-yellow-800 text-[9px] font-black uppercase tracking-tighter shadow-sm animate-pulse-slow">
                                    <AlertTriangle size={10} /> {item.applicants.length} PERMOHONAN
                                </div>
                              )}
                          </div>
                        </td>
                        <td className="p-4 align-top space-y-2">
                          {item.applicants.map((student, sIdx) => (
                            <div key={sIdx} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex justify-between items-center group">
                                <div>
                                    <div className="text-xs font-bold text-slate-800">{student.student_name}</div>
                                    <div className="text-[9px] text-indigo-600 font-bold uppercase">{student.student_matric}</div>
                                    <div className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[200px]">{student.student_address}</div>
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                    student.status === 'Diluluskan' ? 'bg-green-100 text-green-700' : 
                                    student.status === 'Ditolak' ? 'bg-red-100 text-red-700' : 
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {student.status}
                                </div>
                            </div>
                          ))}
                        </td>
                        <td className="p-4 align-top">
                           <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => openEmailModal(item.company_name, rowIndex + 1)}
                                    className={`w-full py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm font-bold text-xs ${
                                        isMultiple 
                                        ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    <Mail size={16} /> {language === 'ms' ? 'Sediakan Emel Industri' : 'Prepare Industry Email'}
                                </button>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                                        <UsersIcon size={12} /> {language === 'ms' ? 'Kekuatan Padanan' : 'Matching Strength'}
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${Math.min(item.applicants.length * 20, 100)}%` }}
                                        />
                                    </div>
                                </div>
                           </div>
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}} />

      {/* EMAIL PREPARATION MODAL */}
      <Modal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} title="Pusat Penghantaran Emel">
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Penerima Industri</p>
            <p className="font-black text-blue-900 text-lg leading-tight">{selectedCompany?.company_name}</p>
            <p className="text-xs text-blue-600 font-medium italic mt-1">{selectedCompany?.company_contact_email || 'Tiada Emel'}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs font-black">1</div>
              <h5 className="text-sm font-black text-slate-800 uppercase tracking-wide">Muat Turun Lampiran (PDF)</h5>
            </div>
            <div className="grid grid-cols-2 gap-3 pl-10">
              <button 
                onClick={() => generateInvitationLetter(selectedCompany || undefined, currentRowIndex)}
                className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all group"
              >
                <Printer size={20} className="text-red-500 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-700">Surat Pelawaan</span>
              </button>
              <button 
                onClick={() => { if(selectedCompany) generateLOI(selectedCompany); }}
                className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all group"
              >
                <FileText size={20} className="text-purple-500 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-700">Dokumen LOI</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs font-black">2</div>
              <h5 className="text-sm font-black text-slate-800 uppercase tracking-wide">Semak Kandungan Emel</h5>
            </div>
            <div className="pl-10 space-y-2">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed italic max-h-32 overflow-y-auto shadow-inner">
                {getEmailBody()}
              </div>
              <button 
                onClick={() => { navigator.clipboard.writeText(getEmailBody()); toast.success(language === 'ms' ? 'Draf disalin!' : 'Draft copied!'); }}
                className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:underline"
              >
                <Copy size={12} /> Salin Teks Draf
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button 
              onClick={handleLaunchEmail}
              disabled={!selectedCompany?.company_contact_email}
              className="w-full flex items-center justify-center gap-3 p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 group active:scale-95 disabled:bg-slate-300"
            >
              <Mail size={24} className="group-hover:rotate-12 transition-transform" />
              <div className="text-left">
                <span className="text-sm font-black block">Langkah 3: Buka Emel Sekarang</span>
                <span className="text-[9px] opacity-90 font-medium tracking-wide">Auto-fill Penerima & Kandungan</span>
              </div>
            </button>
            <p className="text-[9px] text-center text-slate-400 mt-4 px-6 italic">
              *Nota: Sila lampirkan (attach) fail PDF yang dimuat turun di Langkah 1 ke dalam emel anda secara manual.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
