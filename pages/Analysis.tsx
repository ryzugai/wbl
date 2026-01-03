
import React, { useState, useMemo } from 'react';
import { Application, User, Company } from '../types';
import { Search, MapPin, Building2, FileSpreadsheet, Info, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Language, t } from '../translations';
import { toast } from 'react-hot-toast';
import { GoogleGenAI } from "@google/genai";

interface AnalysisProps {
  applications: Application[];
  users: User[];
  companies: Company[];
  language: Language;
}

export const Analysis: React.FC<AnalysisProps> = ({ applications, users, companies, language }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string[]>>({});
  const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({});

  const matchingData = useMemo(() => {
    return applications.map(app => {
      const student = users.find(u => u.username === app.created_by || u.matric_no === app.student_id);
      return {
        ...app,
        student_id_internal: student?.id || app.id,
        student_address: student?.address || (language === 'ms' ? 'Tiada Maklumat' : 'No Information'),
        student_phone: student?.phone || '-'
      };
    }).filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return item.student_name.toLowerCase().includes(searchLower) || 
               item.company_name.toLowerCase().includes(searchLower) || 
               item.student_id.toLowerCase().includes(searchLower);
    });
  }, [applications, users, searchTerm, language]);

  const generateAISuggestion = async (studentId: string, address: string) => {
    if (!address || address.length < 5) {
      toast.error(language === 'ms' ? 'Alamat pelajar tidak lengkap untuk dianalisis.' : 'Student address is incomplete for analysis.');
      return;
    }

    setLoadingAi(prev => ({ ...prev, [studentId]: true }));
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const companiesList = companies.map(c => ({
        name: c.company_name,
        location: `${c.company_district}, ${c.company_state}`
      }));

      const prompt = `
        Sebagai pembantu penempatan WBL (Work-Based Learning), tugas anda adalah mencadangkan syarikat yang paling berdekatan atau mudah dicapai dari alamat pelajar berikut.
        
        Alamat Pelajar: "${address}"
        
        Senarai Syarikat Tersedia:
        ${JSON.stringify(companiesList)}
        
        Berdasarkan jarak geografi dan logistik di Malaysia, pilih 3 syarikat terbaik yang paling dekat atau dalam negeri/daerah yang sama.
        Sila pulangkan hasil dalam format JSON ARRAY yang hanya mengandungi nama syarikat sahaja.
        Contoh format pulangan: ["Syarikat A", "Syarikat B", "Syarikat C"]
        Hanya berikan JSON, jangan beri penjelasan lain.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
      });

      const text = response.text || "[]";
      const cleanedJson = text.replace(/```json|```/g, "").trim();
      const suggestions = JSON.parse(cleanedJson);

      setAiSuggestions(prev => ({ ...prev, [studentId]: suggestions }));
    } catch (error) {
      console.error("AI Error:", error);
      toast.error(language === 'ms' ? 'Gagal menjana cadangan AI.' : 'Failed to generate AI suggestions.');
    } finally {
      setLoadingAi(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const exportToExcel = () => {
    try {
      const dataToExport = matchingData.map(item => ({
        [t(language, 'fullName')]: item.student_name,
        [t(language, 'matricNo')]: item.student_id,
        [t(language, 'appCompany')]: item.company_name,
        [t(language, 'companyLocation')]: `${item.company_district}, ${item.company_state}`,
        [t(language, 'studentResidence')]: item.student_address,
        [t(language, 'status')]: item.application_status,
        'Cadangan AI': (aiSuggestions[item.student_id_internal] || []).join(', ')
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Analisis_Padanan_WBL');
      XLSX.writeFile(workbook, `WBL_Matching_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
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
          <p className="text-sm text-slate-500 mt-1">{t(language, 'analysisDesc')}</p>
        </div>
        <button 
          onClick={exportToExcel} 
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm font-bold text-sm transition-all"
        >
          <FileSpreadsheet size={18} /> {t(language, 'exportExcel')}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-800 text-sm">
        <Info className="shrink-0 text-blue-600" size={20} />
        <p>
            {language === 'ms' 
                ? 'Jadual ini membantu Penyelaras untuk melihat sejauh mana penempatan yang dipohon berada dengan kediaman pelajar bagi tujuan kebajikan dan logistik.' 
                : 'This table helps Coordinators see how close the applied placements are to the students residence for welfare and logistical purposes.'}
        </p>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder={t(language, 'search')} 
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-sm text-slate-600">{t(language, 'appStudent')}</th>
                <th className="p-4 font-semibold text-sm text-slate-600">{t(language, 'studentResidence')}</th>
                <th className="p-4 font-semibold text-sm text-slate-600">{t(language, 'appCompany')}</th>
                <th className="p-4 font-semibold text-sm text-slate-600">{t(language, 'aiSuggestTitle')}</th>
                <th className="p-4 font-semibold text-sm text-slate-600 text-center">{t(language, 'status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matchingData.length === 0 ? (
                <tr>
                   <td colSpan={5} className="p-8 text-center text-slate-500 italic">{t(language, 'noRecords')}</td>
                </tr>
              ) : (
                matchingData.map((item, idx) => {
                  const hasSuggestions = aiSuggestions[item.student_id_internal];
                  const isLoading = loadingAi[item.student_id_internal];

                  return (
                    <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 align-top">
                        <div className="font-bold text-slate-900">{item.student_name}</div>
                        <div className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">{item.student_id}</div>
                      </td>
                      <td className="p-4 align-top">
                        <div className="flex gap-2 items-start max-w-xs">
                          <MapPin size={16} className="text-red-500 shrink-0 mt-0.5" />
                          <div className="text-xs text-slate-600 leading-relaxed italic">
                              {item.student_address}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-top">
                          <div className="flex items-center gap-2 mb-1">
                              <Building2 size={16} className="text-blue-600" />
                              <div className="font-bold text-slate-800 text-sm">{item.company_name}</div>
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase font-medium">{item.company_district}, {item.company_state}</div>
                      </td>
                      <td className="p-4 align-top min-w-[200px]">
                        {hasSuggestions ? (
                          <div className="space-y-1">
                            {hasSuggestions.map((s, si) => {
                                // Logic to check if suggested company matches the applied company
                                const isMatch = s.toLowerCase().trim() === item.company_name.toLowerCase().trim();
                                return (
                                    <div 
                                        key={si} 
                                        className={`text-[11px] font-bold px-2 py-1 rounded flex items-center justify-between gap-1 border transition-all ${
                                            isMatch 
                                                ? 'bg-green-100 text-green-700 border-green-200 shadow-sm' 
                                                : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1">
                                            {isMatch ? <CheckCircle2 size={10} /> : <Sparkles size={10} />}
                                            {s}
                                        </div>
                                        {isMatch && <span className="text-[8px] uppercase tracking-tighter bg-green-200 px-1 rounded">Match</span>}
                                    </div>
                                );
                            })}
                            <button 
                              onClick={() => generateAISuggestion(item.student_id_internal, item.student_address)}
                              className="text-[9px] text-slate-400 hover:text-indigo-600 flex items-center gap-1 mt-2 underline"
                            >
                                {language === 'ms' ? 'Jana semula' : 'Regenerate'}
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => generateAISuggestion(item.student_id_internal, item.student_address)}
                            disabled={isLoading}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                              isLoading 
                                ? 'bg-slate-100 text-slate-400' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                            }`}
                          >
                            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            {isLoading ? t(language, 'aiProcessing') : t(language, 'aiSuggestBtn')}
                          </button>
                        )}
                        {!hasSuggestions && !isLoading && (
                          <p className="text-[10px] text-slate-400 mt-1">{t(language, 'aiNoSuggest')}</p>
                        )}
                      </td>
                      <td className="p-4 text-center align-top">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              item.application_status === 'Diluluskan' ? 'bg-green-100 text-green-800 border-green-200' :
                              item.application_status === 'Ditolak' ? 'bg-red-100 text-red-800 border-red-200' :
                              'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }`}>
                              {item.application_status}
                          </span>
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
