
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { UserRole, Company } from '../types';
import { getRoleLabels } from '../constants';
import { toast } from 'react-hot-toast';
import { MapPin, Sparkles, Building2 } from 'lucide-react';
import { Language, t } from '../translations';

interface RegisterProps {
  onRegisterSuccess: () => void;
  onBack: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const PREDEFINED_PROGRAM = "Ijazah Sarjana Muda Teknousahawanan dengan Kepujian";

export const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onBack, language, onLanguageChange }) => {
  const [formData, setFormData] = useState({
    username: '', password: '', name: '', email: '', phone: '', role: UserRole.STUDENT,
    program: PREDEFINED_PROGRAM, matric_no: '', ic_no: '', address: '', staff_id: '',
    company_affiliation: '', company_position: '', has_dual_role: false,
    academic_level: '', experience_years: 0
  });
  
  const [programOption, setProgramOption] = useState<'default' | 'custom'>('default');
  const [customProgram, setCustomProgram] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [suggestedCompanies, setSuggestedCompanies] = useState<Company[]>([]);

  useEffect(() => {
    setCompanies(StorageService.getCompanies());
  }, []);

  useEffect(() => {
    if (formData.role === UserRole.STUDENT && formData.address && formData.address.length > 3) {
      const addressLower = formData.address.toLowerCase();
      const matches = companies.filter(c => {
        const stateMatch = c.company_state && addressLower.includes(c.company_state.toLowerCase());
        const districtMatch = c.company_district && addressLower.includes(c.company_district.toLowerCase());
        const addressMatch = c.company_address && addressLower.includes(c.company_address.split(',')[0].toLowerCase());
        return stateMatch || districtMatch || addressMatch;
      });
      setSuggestedCompanies(matches.slice(0, 3));
    } else {
      setSuggestedCompanies([]);
    }
  }, [formData.address, formData.role, companies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalProgram = programOption === 'default' ? PREDEFINED_PROGRAM : customProgram;
      
      await StorageService.createUser({
        ...formData,
        program: finalProgram
      });

      // Check if approval is needed
      const needsApproval = formData.role === UserRole.TRAINER || (formData.role === UserRole.SUPERVISOR && formData.has_dual_role);
      
      if (needsApproval) {
          toast.success(t(language, 'regSuccessApproval'));
      } else {
          toast.success(t(language, 'regSuccessLogin'));
      }
      
      onRegisterSuccess();
    } catch (e: any) {
      toast.error(e.message || t(language, 'regFailed'));
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({ 
        ...prev, 
        role,
        has_dual_role: false 
    }));
  };

  const roleLabels = getRoleLabels(language);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl my-8 animate-fadeIn relative">
        
        {/* Inline Language Switcher */}
        <div className="absolute top-4 right-8 flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
           <button 
                type="button"
                onClick={() => onLanguageChange('ms')}
                className={`px-3 py-1 text-[11px] font-bold rounded ${language === 'ms' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
                MS
           </button>
           <button 
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-3 py-1 text-[11px] font-bold rounded ${language === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
                EN
           </button>
        </div>

        <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">{t(language, 'registerTitle')}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t(language, 'fullName')}</label>
              <input required type="text" className="w-full p-2 border rounded-lg bg-white" onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t(language, 'role')}</label>
              <select 
                className="w-full p-2 border rounded-lg bg-white"
                value={formData.role}
                onChange={e => handleRoleChange(e.target.value as UserRole)}
              >
                {Object.values(UserRole).filter(r => r !== UserRole.COORDINATOR).map(role => (
                  <option key={role} value={role}>{roleLabels[role]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t(language, 'username')}</label>
              <input required type="text" className="w-full p-2 border rounded-lg bg-white" onChange={e => setFormData({...formData, username: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t(language, 'password')}</label>
              <input required type="password" className="w-full p-2 border rounded-lg bg-white" onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t(language, 'email')}</label>
              <input required type="email" className="w-full p-2 border rounded-lg bg-white" onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t(language, 'phone')}</label>
              <input required type="tel" className="w-full p-2 border rounded-lg bg-white" onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>

          {/* STUDENT FIELDS */}
          {formData.role === UserRole.STUDENT && (
            <div className="p-4 bg-slate-50 rounded-lg space-y-3 border border-slate-200">
               <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wide">{t(language, 'profileStudentInfo')}</h4>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t(language, 'program')}</label>
                  <select 
                    className="w-full p-2 border rounded bg-white mb-2"
                    value={programOption}
                    onChange={(e) => setProgramOption(e.target.value as 'default' | 'custom')}
                  >
                    <option value="default">{PREDEFINED_PROGRAM}</option>
                    <option value="custom">{t(language, 'otherCustom')}</option>
                  </select>
                  {programOption === 'custom' && (
                    <input 
                      type="text" 
                      placeholder={t(language, 'program')} 
                      className="w-full p-2 border rounded bg-white"
                      value={customProgram}
                      onChange={e => setCustomProgram(e.target.value)}
                      required
                    />
                  )}
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700">{t(language, 'matricNo')}</label>
                      <input required type="text" className="w-full p-2 border rounded bg-white" onChange={e => setFormData({...formData, matric_no: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700">{t(language, 'icNo')}</label>
                      <input required type="text" className="w-full p-2 border rounded bg-white" onChange={e => setFormData({...formData, ic_no: e.target.value})} />
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t(language, 'address')}</label>
                  <textarea required className="w-full p-2 border rounded bg-white" rows={3} placeholder={t(language, 'address')} onChange={e => setFormData({...formData, address: e.target.value})} />
                  <p className="text-xs text-slate-500 mt-1">{t(language, 'addressHint')}</p>
               </div>
               {suggestedCompanies.length > 0 && (
                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 animate-fadeIn">
                    <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold text-sm">
                      <Sparkles size={16} /> {t(language, 'aiSuggestion')}
                    </div>
                    <div className="space-y-2">
                      {suggestedCompanies.map(c => (
                        <div key={c.id} className="bg-white p-2 rounded border border-blue-100 shadow-sm text-sm">
                          <div className="font-semibold text-slate-800">{c.company_name}</div>
                          <div className="flex items-center gap-1 text-slate-500 text-xs">
                             <MapPin size={12} /> {c.company_district}, {c.company_state}
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               )}
            </div>
          )}

          {/* STAFF FIELDS */}
          {(formData.role === UserRole.LECTURER || formData.role === UserRole.TRAINER) && (
              <div className="p-4 bg-slate-50 rounded-lg space-y-3 border border-slate-200">
                 <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wide">{t(language, 'staffInfo')}</h4>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">{t(language, 'staffId')}</label>
                    <input required type="text" className="w-full p-2 border rounded bg-white" onChange={e => setFormData({...formData, staff_id: e.target.value})} />
                 </div>
              </div>
          )}

          {/* INDUSTRY FIELDS */}
          {(formData.role === UserRole.TRAINER || formData.role === UserRole.SUPERVISOR) && (
               <div className="p-4 bg-slate-50 rounded-lg space-y-3 border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                      <Building2 size={16} /> {t(language, 'industryInfo')}
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t(language, 'selectCompany')}</label>
                    <select required className="w-full p-2 border rounded bg-white" value={formData.company_affiliation} onChange={e => setFormData({...formData, company_affiliation: e.target.value})}>
                        <option value="">{t(language, 'selectOption')}</option>
                        {companies.map(c => <option key={c.id} value={c.company_name}>{c.company_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t(language, 'position')}</label>
                    <input required type="text" className="w-full p-2 border rounded bg-white" onChange={e => setFormData({...formData, company_position: e.target.value})} />
                  </div>
                  
                  {/* NEW FIELDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">{t(language, 'academicLevel')}</label>
                          <select required className="w-full p-2 border rounded bg-white" onChange={e => setFormData({...formData, academic_level: e.target.value})}>
                              <option value="">{t(language, 'selectOption')}</option>
                              <option value="SPM">SPM / Sijil</option>
                              <option value="Diploma">Diploma</option>
                              <option value="Degree">Ijazah Sarjana Muda</option>
                              <option value="Master">Sarjana (Master)</option>
                              <option value="PhD">PhD</option>
                              <option value="Lain-lain">Lain-lain</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">{t(language, 'experienceYears')}</label>
                          <input required type="number" min="0" className="w-full p-2 border rounded bg-white" onChange={e => setFormData({...formData, experience_years: parseInt(e.target.value) || 0})} />
                      </div>
                  </div>

                  <div className="pt-2">
                      <label className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded cursor-pointer hover:bg-blue-100 transition-colors">
                          <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" checked={formData.has_dual_role} onChange={(e) => setFormData({...formData, has_dual_role: e.target.checked})} />
                          <div>
                              <div className="text-sm font-bold text-slate-800">
                                  {t(language, 'dualRoleLabel')}
                              </div>
                              <div className="text-xs text-slate-500">{t(language, 'dualRoleHint')}</div>
                          </div>
                      </label>
                  </div>
               </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onBack} className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 bg-white">{t(language, 'cancel')}</button>
            <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">{t(language, 'register')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
