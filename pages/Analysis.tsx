
import React, { useState, useMemo } from 'react';
import { Application, User, Company } from '../types';
import { Search, MapPin, Building2, FileSpreadsheet, Info, Sparkles, CheckCircle2, User as UserIcon, ArrowRight, LocateFixed } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Language, t } from '../translations';
import { toast } from 'react-hot-toast';

interface AnalysisProps {
  applications: Application[];
  users: User[];
  companies: Company[];
  language: Language;
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
  }[];
}

export const Analysis: React.FC<AnalysisProps> = ({ applications, users, companies, language }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localSuggestions, setLocalSuggestions] = useState<Record<string, string[]>>({});

  // Group applications by student
  const groupedMatchingData = useMemo(() => {
    const groups: Record<string, GroupedStudentData> = {};

    applications.forEach(app => {
      const studentKey = app.student_id;
      if (!groups[studentKey]) {
        const student = users.find(u => u.username === app.created_by || u.matric_no === app.student_id);
        groups[studentKey] = {
          student_id: studentKey,
          student_matric: app.student_id,
          student_name: app.student_name,
          student_id_internal: student?.id || app.id,
          student_address: student?.address || (language === 'ms' ? 'Tiada Maklumat Alamat' : 'No Address Info'),
          apps: []
        };
      }
      
      if (!groups[studentKey].apps.find(a => a.company_name === app.company_name)) {
        groups[studentKey].apps.push({
          company_name: app.company_name,
          company_location: `${app.company_district}, ${app.company_state}`,
          status: app.application_status
        });
      }
    });

    return Object.values(groups).filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return item.student_name.toLowerCase().includes(searchLower) || 
             item.student_matric.toLowerCase().includes(searchLower) ||
             item.apps.some(a => a.company_name.toLowerCase().includes(searchLower));
    });
  }, [applications, users, searchTerm, language]);

  /**
   * Logik Padanan Lokal (Tanpa API)
   * Menggunakan perbandingan string antara alamat pelajar dan lokasi syarikat.
   */
  const generateLocalSuggestion = (studentIdInternal: string, address: string) => {
    if (!address || address.length < 5 || address.includes('Tiada Maklumat')) {
      toast.error(language === 'ms' ? 'Alamat pelajar tidak lengkap.' : 'Student address is incomplete.');
      return;
    }

    const addrLower = address.toLowerCase();
    
    // Berikan skor kepada setiap syarikat berdasarkan padanan kata kunci
    const scoredCompanies = companies.map(comp => {
      let score = 0;
      const district = comp.company_district.toLowerCase();
      const state = comp.company_state.toLowerCase();
      const name = comp.company_name.toLowerCase();

      // Padanan Daerah (Skor tinggi)
      if (district && addrLower.includes(district)) score += 10;
      
      // Padanan Negeri (Skor sederhana)
      if (state && addrLower.includes(state)) score += 5;

      // Jika syarikat pernah ambil pelajar WBL sebelum ini, beri bonus kecil
      if (comp.has_previous_wbl_students) score += 1;

      return { name: comp.company_name, score };
    });

    // Susun mengikut skor tertinggi dan ambil 3 teratas (skor mesti > 0)
    const topSuggestions = scoredCompanies
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(c => c.name);

    if (topSuggestions.length === 0) {
      toast.error(language === 'ms' ? 'Tiada syarikat sepadan dijumpai berhampiran lokasi ini.' : 'No matching companies found near this location.');
    } else {
      setLocalSuggestions(prev => ({ ...prev, [studentIdInternal]: topSuggestions }));
      toast.success(language === 'ms' ? 'Analisis lokasi selesai.' : 'Location analysis complete.');
    }
  };

  const exportToExcel = () => {
    try {
      const dataToExport = groupedMatchingData.map(item => ({
        [t(language, 'fullName')]: item.student_name,
        [t(language, 'matricNo')]: item.student_matric,
        [t(language, 'studentResidence')]: item.student_address,
        'Syarikat Dimohon': item.apps.map(a => `${a.company_name} (${a.company_location})`).join(' | '),
        'Cadangan Sistem': (localSuggestions[item.student_id_internal] || []).join(', ')
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Analisis_Padanan_WBL');
      XLSX.writeFile(workbook, `WBL_Location_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(language === 'ms' ? 'Eksport Berjaya!' : 'Export Success!');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t(language, 'analysisTitle')}</h2>
          <p className="text-sm text-slate-500 mt-1">{language === 'ms' ? 'Memadankan lokasi kediaman pelajar dengan pangkalan data industri.' : 'Matching student residences with industry database.'}</p>
        </div>
        <button 
          onClick={exportToExcel} 
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm font-bold text-sm transition-all"
        >
          <FileSpreadsheet size={18} /> {t(language, 'exportExcel')}
        </button>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3 text-indigo-800 text-sm">
        <LocateFixed className="shrink-0 text-indigo-600" size={20} />
        <p>
            {language === 'ms' 
                ? 'Sistem kini menggunakan "Analisis Pintar Lokal" yang memadankan kata kunci alamat pelajar dengan lokasi syarikat secara automatik (Tanpa API AI).' 
                : 'System now uses "Local Smart Analysis" which automatically matches student address keywords with company locations (No AI API required).'}
        </p>
      </div>

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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold text-xs text-slate-500 uppercase tracking-wider w-[25%]">{t(language, 'appStudent')} & {language === 'ms' ? 'Kediaman' : 'Residence'}</th>
                <th className="p-4 font-bold text-xs text-slate-500 uppercase tracking-wider w-[40%]">{language === 'ms' ? 'Syarikat Dimohon & Lokasi' : 'Applied Companies & Location'}</th>
                <th className="p-4 font-bold text-xs text-slate-500 uppercase tracking-wider w-[35%]">{language === 'ms' ? 'Analisis Lokasi Pintar' : 'Smart Location Analysis'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupedMatchingData.length === 0 ? (
                <tr>
                   <td colSpan={3} className="p-12 text-center text-slate-400 italic">
                      <div className="flex flex-col items-center gap-2">
                        <UserIcon size={40} className="opacity-20" />
                        {t(language, 'noRecords')}
                      </div>
                   </td>
                </tr>
              ) : (
                groupedMatchingData.map((item) => {
                  const suggestions = localSuggestions[item.student_id_internal];

                  return (
                    <tr key={item.student_id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Pelajar & Alamat */}
                      <td className="p-4 align-top">
                        <div className="space-y-3">
                          <div>
                            <div className="font-black text-slate-900 leading-none">{item.student_name}</div>
                            <div className="text-[10px] text-indigo-600 font-bold mt-1 tracking-wider uppercase">{item.student_matric}</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex gap-2 items-start">
                            <MapPin size={14} className="text-red-500 shrink-0 mt-0.5" />
                            <div className="text-[11px] text-slate-600 leading-relaxed italic line-clamp-3">
                                {item.student_address}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Syarikat Dimohon */}
                      <td className="p-4 align-top">
                        <div className="grid grid-cols-1 gap-2">
                          {item.apps.map((app, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm group hover:border-blue-300 transition-colors">
                              <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                  <Building2 size={14} className="text-blue-600" />
                                  <span className="font-bold text-xs text-slate-800">{app.company_name}</span>
                                </div>
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border ${
                                  app.status === 'Diluluskan' ? 'bg-green-100 text-green-700 border-green-200' :
                                  app.status === 'Ditolak' ? 'bg-red-100 text-red-700 border-red-200' :
                                  'bg-yellow-100 text-yellow-700 border-yellow-200'
                                }`}>
                                  {app.status}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                                <MapPin size={10} /> {app.company_location}
                              </div>
                            </div>
                          ))}
                          {item.apps.length === 0 && (
                            <div className="text-[11px] text-slate-400 italic py-6 text-center border border-dashed rounded-xl">
                              {language === 'ms' ? 'Tiada permohonan aktif' : 'No active applications'}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Cadangan Sistem (Lokal) */}
                      <td className="p-4 align-top">
                        {suggestions ? (
                          <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100 space-y-3 animate-fadeIn">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-green-700 uppercase tracking-widest flex items-center gap-1">
                                <Sparkles size={12} /> {language === 'ms' ? 'Padanan Sistem' : 'System Match'}
                              </span>
                              <button 
                                onClick={() => generateLocalSuggestion(item.student_id_internal, item.student_address)}
                                className="text-[9px] text-green-600 hover:text-green-800 underline font-bold"
                              >
                                {language === 'ms' ? 'Kemaskini' : 'Update'}
                              </button>
                            </div>
                            <div className="space-y-2">
                              {suggestions.map((s, si) => {
                                const isApplied = item.apps.some(a => a.company_name.toLowerCase().trim() === s.toLowerCase().trim());
                                return (
                                  <div 
                                    key={si} 
                                    className={`flex items-center justify-between gap-2 p-2 rounded-lg text-[11px] font-bold border transition-all ${
                                      isApplied 
                                        ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-[1.02]' 
                                        : 'bg-white text-slate-700 border-slate-200 shadow-sm'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {isApplied ? <CheckCircle2 size={12} /> : <ArrowRight size={12} className="text-green-500" />}
                                      <span className="truncate max-w-[150px]">{s}</span>
                                    </div>
                                    {isApplied && <span className="text-[8px] bg-blue-500 px-1 rounded uppercase">Applied</span>}
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-[9px] text-slate-400 italic mt-2">
                                {language === 'ms' 
                                  ? '*Keputusan berdasarkan padanan kata kunci geografi.' 
                                  : '*Results based on geographic keyword matching.'}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full py-6 space-y-3">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                <LocateFixed size={24} />
                            </div>
                            <button 
                              onClick={() => generateLocalSuggestion(item.student_id_internal, item.student_address)}
                              className="flex items-center gap-2 px-6 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                            >
                              <LocateFixed size={14} className="text-blue-600" />
                              {language === 'ms' ? 'Analisis Lokasi' : 'Analyze Location'}
                            </button>
                            <p className="text-[10px] text-slate-400 text-center px-6 leading-relaxed">
                                {language === 'ms' ? 'Sistem akan membedah alamat untuk mencari syarikat berhampiran.' : 'System will parse the address to find nearby companies.'}
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
