
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { User as UserIcon, Mail, Phone, Lock, Save, Building2, BookOpen, Fingerprint, CreditCard, Briefcase, MapPin, GraduationCap, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ROLE_LABELS } from '../constants';

const PREDEFINED_PROGRAM = "Ijazah Sarjana Muda Teknousahawanan dengan Kepujian";

interface InputFieldProps {
  label: string;
  icon: any;
  value: string | undefined;
  onChange?: (val: string) => void;
  disabled?: boolean;
  type?: string;
  isEditing: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ label, icon: Icon, value, onChange, disabled = false, type = "text", isEditing }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <Icon size={18} />
      </div>
      <input
        type={type}
        disabled={disabled || !isEditing}
        className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-colors ${
          disabled ? 'bg-slate-100 text-slate-500 border-slate-200' : 
          isEditing ? 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500' : 'bg-slate-50 border-transparent'
        }`}
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
    </div>
  </div>
);

interface ProfileProps {
  user: User;
  onUpdateUser: (updatedUser: User) => Promise<void>;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState<User>({ ...user });
  const [password, setPassword] = useState(user.password || '');
  const [isEditing, setIsEditing] = useState(false);
  const [programOption, setProgramOption] = useState<'default' | 'custom'>('default');
  const [customProgram, setCustomProgram] = useState('');

  useEffect(() => {
    if (user.role === UserRole.STUDENT) {
      if (user.program === PREDEFINED_PROGRAM || !user.program) {
        setProgramOption('default');
      } else {
        setProgramOption('custom');
        setCustomProgram(user.program);
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let updatedUser = { ...formData, password };
      if (updatedUser.role === UserRole.STUDENT) {
        updatedUser.program = programOption === 'default' ? PREDEFINED_PROGRAM : customProgram;
      }
      await onUpdateUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengemaskini profil');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Profil Pengguna</h2>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">Kemaskini Profil</button>
        ) : (
          <button onClick={() => { setFormData({...user}); setPassword(user.password || ''); setIsEditing(false); }} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium transition-colors">Batal</button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="flex items-end gap-6">
              <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><UserIcon size={40} /></div>
              </div>
              <div className="mb-1">
                <h3 className="text-2xl font-bold text-slate-800">{formData.name}</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{ROLE_LABELS[formData.role]}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-4">
              <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">Maklumat Akaun</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Username" icon={UserIcon} value={formData.username} disabled={true} isEditing={isEditing} />
                <InputField label="Kata Laluan" icon={Lock} type="password" value={password} onChange={setPassword} isEditing={isEditing} />
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">Maklumat Peribadi</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <InputField label="Nama Penuh" icon={UserIcon} value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} isEditing={isEditing} />
                </div>
                <InputField label="Email" icon={Mail} value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} isEditing={isEditing} />
                <InputField label="No. Telefon" icon={Phone} value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} isEditing={isEditing} />
              </div>
            </section>

            {formData.role === UserRole.STUDENT && (
                <section className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">Maklumat Pelajar</h4>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Program</label>
                    {isEditing ? (
                        <div className="space-y-2">
                             <select className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" value={programOption} onChange={(e) => setProgramOption(e.target.value as 'default' | 'custom')}>
                                <option value="default">{PREDEFINED_PROGRAM}</option>
                                <option value="custom">Lain-lain (Custom)</option>
                            </select>
                            {programOption === 'custom' && (
                                <input type="text" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" placeholder="Masukkan nama program..." value={customProgram} onChange={(e) => setCustomProgram(e.target.value)} />
                            )}
                        </div>
                    ) : (
                        <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><BookOpen size={18} /></div><input disabled className="w-full pl-10 pr-4 py-2 border border-transparent bg-slate-50 rounded-lg text-slate-500" value={formData.program} /></div>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="No. Matrik" icon={CreditCard} value={formData.matric_no} onChange={(v: string) => setFormData({...formData, matric_no: v})} isEditing={isEditing} />
                    <InputField label="No. Kad Pengenalan" icon={Fingerprint} value={formData.ic_no} onChange={(v: string) => setFormData({...formData, ic_no: v})} isEditing={isEditing} />
                </div>
                <div className="space-y-1">
                     <label className="text-sm font-medium text-slate-700">Alamat Tempat Tinggal</label>
                     <div className="relative">
                        <div className="absolute top-3 left-3 text-slate-400"><MapPin size={18} /></div>
                        <textarea disabled={!isEditing} className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-colors ${!isEditing ? 'bg-slate-100 text-slate-500 border-transparent' : 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500'}`} rows={3} value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                     </div>
                </div>
                </section>
            )}

            {(formData.role === UserRole.LECTURER || formData.role === UserRole.TRAINER) && (
                <section className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">Maklumat Staf</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="No. Staf / ID Pekerja" icon={CreditCard} value={formData.staff_id} onChange={(v: string) => setFormData({...formData, staff_id: v})} isEditing={isEditing} />
                </div>
                </section>
            )}

            {(formData.role === UserRole.TRAINER || formData.role === UserRole.SUPERVISOR) && (
                 <section className="space-y-4">
                 <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">Maklumat Industri</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <InputField label="Syarikat" icon={Building2} value={formData.company_affiliation} disabled={true} isEditing={isEditing} />
                     <InputField label="Jawatan" icon={Briefcase} value={formData.company_position} onChange={(v: string) => setFormData({...formData, company_position: v})} isEditing={isEditing} />
                     <InputField label="Tahap Akademik" icon={GraduationCap} value={formData.academic_level} onChange={(v: string) => setFormData({...formData, academic_level: v})} isEditing={isEditing} />
                     <InputField label="Pengalaman (Tahun)" icon={Clock} value={String(formData.experience_years || 0)} onChange={(v: string) => setFormData({...formData, experience_years: parseInt(v) || 0})} isEditing={isEditing} type="number" />
                 </div>
                 </section>
            )}

            {isEditing && (
              <div className="flex justify-end pt-4">
                <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition-transform active:scale-95 shadow-lg shadow-green-200"><Save size={20} /> Simpan Perubahan</button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
