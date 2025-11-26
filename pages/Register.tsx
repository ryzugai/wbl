
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { UserRole, Company } from '../types';
import { ROLE_LABELS } from '../constants';
import { toast } from 'react-hot-toast';
import { MapPin, Sparkles, Building2 } from 'lucide-react';

interface RegisterProps {
  onRegisterSuccess: () => void;
  onBack: () => void;
}

const PREDEFINED_PROGRAM = "Ijazah Sarjana Muda Teknousahawanan dengan Kepujian";

export const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onBack }) => {
  const [formData, setFormData] = useState({
    username: '', password: '', name: '', email: '', phone: '', role: UserRole.STUDENT,
    program: PREDEFINED_PROGRAM, matric_no: '', ic_no: '', address: '', staff_id: '',
    company_affiliation: '', company_position: '', has_dual_role: false
  });
  
  // State for Program Selection Logic
  const [programOption, setProgramOption] = useState<'default' | 'custom'>('default');
  const [customProgram, setCustomProgram] = useState('');

  // State for AI Suggestions & Company List
  const [companies, setCompanies] = useState<Company[]>([]);
  const [suggestedCompanies, setSuggestedCompanies] = useState<Company[]>([]);

  useEffect(() => {
    // Load companies for suggestion logic and dropdown
    setCompanies(StorageService.getCompanies());
  }, []);

  // "AI" Logic: Simple keyword matching based on address input
  useEffect(() => {
    if (formData.role === UserRole.STUDENT && formData.address && formData.address.length > 3) {
      const addressLower = formData.address.toLowerCase();
      
      const matches = companies.filter(c => {
        // Check if company state or district exists in the user's address
        const stateMatch = c.company_state && addressLower.includes(c.company_state.toLowerCase());
        const districtMatch = c.company_district && addressLower.includes(c.company_district.toLowerCase());
        
        // Bonus match: check if address contains part of company address
        const addressMatch = c.company_address && addressLower.includes(c.company_address.split(',')[0].toLowerCase());

        return stateMatch || districtMatch || addressMatch;
      });
      
      setSuggestedCompanies(matches.slice(0, 3)); // Top 3 suggestions
    } else {
      setSuggestedCompanies([]);
    }
  }, [formData.address, formData.role, companies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Finalize program value
      const finalProgram = programOption === 'default' ? PREDEFINED_PROGRAM : customProgram;
      
      await StorageService.createUser({
        ...formData,
        program: finalProgram
      });
      toast.success('Pendaftaran berjaya! Sila log masuk.');
      onRegisterSuccess();
    } catch (e: any) {
      toast.error(e.message || 'Pendaftaran gagal');
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({ 
        ...prev, 
        role,
        has_dual_role: false // Reset dual role when changing main role
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl my-8 animate-fadeIn">
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">Daftar Akaun Baru</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Penuh</label>
              <input required type="text" className="w-full p-2 border rounded-lg bg-white" onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Peranan</label>
              <select 
                className="w-full p-2 border rounded-lg bg-white"
                value={formData.role}
                onChange={e => handleRoleChange(e.target.value as UserRole)}
              >
                {Object.values(UserRole).filter(r => r !== UserRole.COORDINATOR).map(role => (
                  <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input required type="text" className="w-full p-2 border rounded-lg bg-white" onChange={e => setFormData({...formData, username: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input required type="password" className="w-full p-2 border rounded-lg bg-white" onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input required type="email" className="w-full p-2 border rounded-lg bg-white" onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
              <input required type="tel" className="w-full p-2 border rounded-lg bg-white" onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>

          {/* Conditional Fields based on Role */}
          {formData.role === UserRole.STUDENT && (
            <div className="p-4 bg-slate-50 rounded-lg space-y-3 border border-slate-200">
               <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Maklumat Pelajar</h4>
               
               {/* Program Selection */}
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Program</label>
                  <select 
                    className="w-full p-2 border rounded bg-white mb-2"
                    value={programOption}
                    onChange={(e) => setProgramOption(e.target.value as 'default' | 'custom')}
                  >
                    <option value="default">{PREDEFINED_PROGRAM}</option>
                    <option value="custom">Lain-lain (Taip manual)</option>
                  </select>
                  
                  {programOption === 'custom' && (
                    <input 
                      type="text" 
                      placeholder="Masukkan nama program..." 
                      className="w-full p-2 border rounded bg-white"
                      value={customProgram}
                      onChange={e => setCustomProgram(e.target.value)}
                      required
                    />
                  )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700">No. Matrik</label>
                      <input required type="text" className="w-full p-2 border rounded bg-white" onChange={e => setFormData({...formData, matric_no: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700">No. KP</label>
                      <input required type="text" className="w-full p-2 border rounded bg-white" onChange={e => setFormData({...formData, ic_no: e.target.value})} />
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Tempat Tinggal</label>
                  <textarea 
                    required 
                    className="w-full p-2 border rounded bg-white" 
                    rows={3} 
                    placeholder="Contoh: No 123, Jalan Bunga, Taman Mawar, 75450 Ayer Keroh, Melaka"
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                  />
                  <p className="text-xs text-slate-500 mt-1">Sistem akan cuba mencari syarikat berhampiran berdasarkan alamat anda.</p>
               </div>

               {/* AI Suggestions Box */}
               {suggestedCompanies.length > 0 && (
                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 animate-fadeIn">
                    <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold text-sm">
                      <Sparkles size={16} />
                      Cadangan Syarikat Berhampiran (AI)
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

          {(formData.role === UserRole.LECTURER || formData.role === UserRole.TRAINER) && (
              <div className="p-4 bg-slate-50 rounded-lg space-y-3 border border-slate-200">
                 <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Maklumat Staf</h4>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">No. Staf</label>
                    <input required type="text" className="w-full p-2 border rounded bg-white" onChange={e => setFormData({...formData, staff_id: e.target.value})} />
                 </div>
              </div>
          )}

          {(formData.role === UserRole.TRAINER || formData.role === UserRole.SUPERVISOR) && (
               <div className="p-4 bg-slate-50 rounded-lg space-y-3 border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                      <Building2 size={16} />
                      Maklumat Industri
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Syarikat</label>
                    <select 
                        required 
                        className="w-full p-2 border rounded bg-white"
                        value={formData.company_affiliation}
                        onChange={e => setFormData({...formData, company_affiliation: e.target.value})}
                    >
                        <option value="">-- Pilih Syarikat dari Senarai --</option>
                        {companies.map(c => (
                            <option key={c.id} value={c.company_name}>{c.company_name}</option>
                        ))}
                    </select>
                    {companies.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">Tiada syarikat didaftarkan dalam sistem.</p>
                    )}
                  </div>

                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Jawatan</label>
                    <input required type="text" className="w-full p-2 border rounded bg-white" onChange={e => setFormData({...formData, company_position: e.target.value})} />
                  </div>

                  {/* Dual Role Toggle */}
                  <div className="pt-2">
                      <label className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded cursor-pointer hover:bg-blue-100 transition-colors">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 text-blue-600 rounded"
                            checked={formData.has_dual_role}
                            onChange={(e) => setFormData({...formData, has_dual_role: e.target.checked})}
                          />
                          <div>
                              <div className="text-sm font-bold text-slate-800">
                                  {formData.role === UserRole.SUPERVISOR 
                                    ? "Bertindak juga sebagai Jurulatih Industri?" 
                                    : "Bertindak juga sebagai Penyelia Industri?"}
                              </div>
                              <div className="text-xs text-slate-500">
                                  Tandakan jika anda memegang kedua-dua jawatan.
                              </div>
                          </div>
                      </label>
                  </div>
               </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onBack} className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 bg-white">
              Batal
            </button>
            <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
              Daftar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
