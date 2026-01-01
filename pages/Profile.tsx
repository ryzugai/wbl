
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import { User as UserIcon, Mail, Phone, Lock, Save, Building2, BookOpen, Fingerprint, CreditCard, Briefcase, MapPin, GraduationCap, Clock, FileText, Sparkles, Plus, Trash2, Award, Book, Camera, Link as LinkIcon, Star, Languages, BrainCircuit, Monitor, Loader2, Palette, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ROLE_LABELS } from '../constants';
import { generateResume, ResumeTheme } from '../utils/resumeGenerator';
import { Modal } from '../components/Modal';

const PREDEFINED_PROGRAM = "Ijazah Sarjana Muda Teknousahawanan dengan Kepujian";

interface StarRatingProps {
  level: number;
  onChange?: (level: number) => void;
  disabled?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ level, onChange, disabled }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button
        key={s}
        type="button"
        disabled={disabled}
        onClick={() => onChange && onChange(s)}
        className={`transition-colors ${s <= level ? 'text-yellow-400' : 'text-slate-300'} ${!disabled ? 'hover:scale-110 active:scale-90' : ''}`}
      >
        <Star size={14} fill={s <= level ? "currentColor" : "none"} />
      </button>
    ))}
  </div>
);

interface InputFieldProps {
  label: string;
  icon: any;
  value: string | undefined;
  onChange?: (val: string) => void;
  disabled?: boolean;
  type?: string;
  isEditing: boolean;
  placeholder?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, icon: Icon, value, onChange, disabled = false, type = "text", isEditing, placeholder }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <Icon size={18} />
      </div>
      <input
        type={type}
        placeholder={placeholder}
        disabled={disabled || !isEditing}
        className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-colors ${
          disabled ? 'bg-slate-100 text-slate-500 border-slate-200' : 
          isEditing ? 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500 text-slate-900 shadow-sm' : 'bg-slate-50 border-transparent text-slate-600'
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
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'ms' | 'en'>('ms');
  const [selectedTheme, setSelectedTheme] = useState<ResumeTheme>('modern-blue');
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Structured Resume State
  const [eduHistory, setEduHistory] = useState<any[]>([]);
  const [projHistory, setProjHistory] = useState<any[]>([]);
  const [workHistory, setWorkHistory] = useState<any[]>([]);
  const [softSkillsList, setSoftSkillsList] = useState<any[]>([]);
  const [techSkillsList, setTechSkillsList] = useState<any[]>([]);
  const [langsList, setLangsList] = useState<any[]>([]);

  useEffect(() => {
    setFormData({ ...user });
    setPassword(user.password || '');
    
    if (user.role === UserRole.STUDENT) {
      if (user.program === PREDEFINED_PROGRAM || !user.program) {
        setProgramOption('default');
      } else {
        setProgramOption('custom');
        setCustomProgram(user.program || '');
      }
      
      try {
        setEduHistory(user.resume_education ? JSON.parse(user.resume_education) : []);
        setProjHistory(user.resume_projects ? JSON.parse(user.resume_projects) : []);
        setWorkHistory(user.resume_work_experience ? JSON.parse(user.resume_work_experience) : []);
        
        const parseSkills = (val: string | undefined) => {
            if (!val) return [];
            try { return JSON.parse(val); } catch(e) { return []; }
        };

        setSoftSkillsList(parseSkills(user.resume_skills_soft));
        setTechSkillsList(parseSkills(user.resume_skills_tech));
        setLangsList(parseSkills(user.resume_languages));

      } catch (e) {
        setEduHistory([]); setProjHistory([]); setWorkHistory([]); setSoftSkillsList([]); setTechSkillsList([]); setLangsList([]);
      }
    }
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profile_image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let updatedUser = { 
        ...formData, 
        password,
        resume_education: JSON.stringify(eduHistory),
        resume_projects: JSON.stringify(projHistory),
        resume_work_experience: JSON.stringify(workHistory),
        resume_skills_soft: JSON.stringify(softSkillsList),
        resume_skills_tech: JSON.stringify(techSkillsList),
        resume_languages: JSON.stringify(langsList)
      };
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

  const addItem = (setter: any, list: any[], template: any) => setter([...list, template]);
  const removeItem = (setter: any, list: any[], index: number) => setter(list.filter((_, i) => i !== index));
  const updateItem = (setter: any, list: any[], index: number, field: string, val: any) => {
    const newList = [...list];
    newList[index] = { ...newList[index], [field]: val };
    setter(newList);
  };

  const handleGenerateResume = async () => {
    setIsGenerating(true);
    setIsConfigModalOpen(false);
    const loadingToast = toast.loading(selectedLang === 'en' ? 'Translating & generating resume...' : 'Menjana resume...');
    
    try {
      await generateResume(user, selectedLang, selectedTheme);
      toast.success('Resume berjaya dijana!', { id: loadingToast });
    } catch (error) {
      toast.error('Ralat semasa menjana resume.', { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  const themeOptions: { id: ResumeTheme; name: string; color: string }[] = [
    { id: 'modern-blue', name: 'Biru Moden', color: 'bg-slate-800' },
    { id: 'emerald-green', name: 'Emerald', color: 'bg-emerald-900' },
    { id: 'royal-purple', name: 'Ungu Diraja', color: 'bg-violet-900' },
    { id: 'professional-slate', name: 'Arang', color: 'bg-slate-900' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Profil Pengguna</h2>
        <div className="flex gap-3">
            {user.role === UserRole.STUDENT && !isEditing && (
                <button 
                    disabled={isGenerating}
                    onClick={() => setIsConfigModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm disabled:bg-slate-400"
                >
                    {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />} 
                    Jana Resume Infografik
                </button>
            )}
            {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">Kemaskini Profil</button>
            ) : (
            <button onClick={() => { setFormData({...user}); setPassword(user.password || ''); setIsEditing(false); }} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium transition-colors">Batal</button>
            )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="flex items-end gap-6">
              <div className="relative group">
                <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg overflow-hidden">
                  {formData.profile_image ? (
                    <img src={formData.profile_image} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                      <UserIcon size={40} />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera size={20} />
                  </button>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              </div>
              <div className="mb-1">
                <h3 className="text-2xl font-bold text-slate-800">{formData.name}</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{ROLE_LABELS[formData.role]}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {isEditing && (
              <section className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3">
                <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2"><LinkIcon size={16} /> Pautan Gambar Profil</h4>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Atau masukkan pautan gambar (https://...)" 
                    className="flex-1 p-2 text-sm border border-blue-200 rounded-lg bg-white shadow-sm"
                    value={formData.profile_image || ''}
                    onChange={e => setFormData({ ...formData, profile_image: e.target.value })}
                  />
                  {formData.profile_image && (
                    <button type="button" onClick={() => setFormData({ ...formData, profile_image: '' })} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                  )}
                </div>
              </section>
            )}

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
                <>
                <section className="space-y-4">
                    <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">Maklumat Pelajar</h4>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Program</label>
                        {isEditing ? (
                            <div className="space-y-2">
                                <select className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 shadow-sm" value={programOption} onChange={(e) => setProgramOption(e.target.value as 'default' | 'custom')}>
                                    <option value="default">{PREDEFINED_PROGRAM}</option>
                                    <option value="custom">Lain-lain (Custom)</option>
                                </select>
                                {programOption === 'custom' && (
                                    <input type="text" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 shadow-sm" placeholder="Masukkan nama program..." value={customProgram} onChange={(e) => setCustomProgram(e.target.value)} />
                                )}
                            </div>
                        ) : (
                            <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><BookOpen size={18} /></div><input disabled className="w-full pl-10 pr-4 py-2 border border-transparent bg-slate-50 rounded-lg text-slate-600" value={formData.program} /></div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InputField label="No. Matrik" icon={CreditCard} value={formData.matric_no} onChange={(v: string) => setFormData({...formData, matric_no: v})} isEditing={isEditing} />
                        <InputField label="No. Kad Pengenalan" icon={Fingerprint} value={formData.ic_no} onChange={(v: string) => setFormData({...formData, ic_no: v})} isEditing={isEditing} />
                        <InputField label="CGPA Semasa" icon={Award} value={formData.resume_cgpa} placeholder="Contoh: 3.85" onChange={(v: string) => setFormData({...formData, resume_cgpa: v})} isEditing={isEditing} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Alamat Tempat Tinggal</label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 text-slate-400"><MapPin size={18} /></div>
                            <textarea disabled={!isEditing} className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-colors ${!isEditing ? 'bg-slate-100 text-slate-600 border-transparent' : 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500 text-slate-900 shadow-sm'}`} rows={3} value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                        </div>
                    </div>
                </section>

                <section className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-2 text-indigo-700">
                        <Sparkles size={20} />
                        <h4 className="text-lg font-bold uppercase tracking-wide">Butiran Resume Infografik</h4>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tentang Saya (Ringkasan Profil)</label>
                            <textarea 
                                disabled={!isEditing}
                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${isEditing ? 'bg-white border-slate-300 text-slate-900 shadow-sm' : 'bg-slate-100 border-transparent text-slate-600'}`}
                                rows={4}
                                placeholder="Tuliskan sedikit tentang diri anda, kekuatan, and aspirasi kerjaya..."
                                value={formData.resume_about || ''}
                                onChange={e => setFormData({...formData, resume_about: e.target.value})}
                            />
                        </div>

                        {/* Kemahiran Insaniah */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <BrainCircuit size={16} /> Kemahiran Insaniah (Soft Skills)
                                </label>
                                {isEditing && (
                                    <button type="button" onClick={() => addItem(setSoftSkillsList, softSkillsList, {name: '', level: 3})} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold">
                                        <Plus size={14} /> Tambah
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {softSkillsList.map((skill, idx) => (
                                    <div key={idx} className={`flex items-center gap-2 p-2 rounded border shadow-sm transition-colors ${isEditing ? 'bg-white border-slate-300' : 'bg-slate-100 border-transparent'}`}>
                                        <input 
                                          disabled={!isEditing}
                                          className="flex-1 p-1 text-xs border-none outline-none focus:ring-0 bg-transparent" 
                                          placeholder="Contoh: Kepimpinan" 
                                          value={skill.name} 
                                          onChange={e => updateItem(setSoftSkillsList, softSkillsList, idx, 'name', e.target.value)} 
                                        />
                                        <StarRating 
                                          level={skill.level} 
                                          onChange={(l) => updateItem(setSoftSkillsList, softSkillsList, idx, 'level', l)} 
                                          disabled={!isEditing} 
                                        />
                                        {isEditing && (
                                            <button type="button" onClick={() => removeItem(setSoftSkillsList, softSkillsList, idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Kemahiran Teknologi */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Monitor size={16} /> Kemahiran Teknologi (Technical Skills)
                                </label>
                                {isEditing && (
                                    <button type="button" onClick={() => addItem(setTechSkillsList, techSkillsList, {name: '', level: 3})} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold">
                                        <Plus size={14} /> Tambah
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {techSkillsList.map((skill, idx) => (
                                    <div key={idx} className={`flex items-center gap-2 p-2 rounded border shadow-sm transition-colors ${isEditing ? 'bg-white border-slate-300' : 'bg-slate-100 border-transparent'}`}>
                                        <input 
                                          disabled={!isEditing}
                                          className="flex-1 p-1 text-xs border-none outline-none focus:ring-0 bg-transparent" 
                                          placeholder="Contoh: Canva, SQL, Python" 
                                          value={skill.name} 
                                          onChange={e => updateItem(setTechSkillsList, techSkillsList, idx, 'name', e.target.value)} 
                                        />
                                        <StarRating 
                                          level={skill.level} 
                                          onChange={(l) => updateItem(setTechSkillsList, techSkillsList, idx, 'level', l)} 
                                          disabled={!isEditing} 
                                        />
                                        {isEditing && (
                                            <button type="button" onClick={() => removeItem(setTechSkillsList, techSkillsList, idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Languages size={16} /> Bahasa
                                </label>
                                {isEditing && (
                                    <button type="button" onClick={() => addItem(setLangsList, langsList, {name: '', level: 3})} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold">
                                        <Plus size={14} /> Tambah Bahasa
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {langsList.map((lang, idx) => (
                                    <div key={idx} className={`flex items-center gap-2 p-2 rounded border shadow-sm transition-colors ${isEditing ? 'bg-white border-slate-300' : 'bg-slate-100 border-transparent'}`}>
                                        <input 
                                          disabled={!isEditing}
                                          className="flex-1 p-1 text-xs border-none outline-none focus:ring-0 bg-transparent" 
                                          placeholder="Nama Bahasa" 
                                          value={lang.name} 
                                          onChange={e => updateItem(setLangsList, langsList, idx, 'name', e.target.value)} 
                                        />
                                        <StarRating 
                                          level={lang.level} 
                                          onChange={(l) => updateItem(setLangsList, langsList, idx, 'level', l)} 
                                          disabled={!isEditing} 
                                        />
                                        {isEditing && (
                                            <button type="button" onClick={() => removeItem(setLangsList, langsList, idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                <Book size={16} /> Kursus Utama Diambil (Asingkan dengan koma)
                            </label>
                            <textarea 
                                disabled={!isEditing}
                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${isEditing ? 'bg-white border-slate-300 text-slate-900 shadow-sm' : 'bg-slate-100 border-transparent text-slate-600'}`}
                                rows={2}
                                placeholder="Contoh: Analitik Perniagaan, Pengurusan Penjenamaan, Keusahawanan Digital"
                                value={formData.resume_courses || ''}
                                onChange={e => setFormData({...formData, resume_courses: e.target.value})}
                            />
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-bold text-slate-700">Pengalaman Kerja (Pilihan)</label>
                                {isEditing && (
                                    <button type="button" onClick={() => addItem(setWorkHistory, workHistory, {company: '', position: '', duration: '', desc: ''})} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold">
                                        <Plus size={14} /> Tambah Pengalaman
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {workHistory.map((work, idx) => (
                                    <div key={idx} className={`p-4 rounded-lg border shadow-sm transition-colors ${isEditing ? 'bg-white border-slate-300' : 'bg-slate-100 border-transparent'} space-y-2`}>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                            <input disabled={!isEditing} placeholder="Syarikat" className="p-2 text-xs border rounded font-bold bg-white" value={work.company} onChange={e => updateItem(setWorkHistory, workHistory, idx, 'company', e.target.value)} />
                                            <input disabled={!isEditing} placeholder="Jawatan" className="p-2 text-xs border rounded bg-white" value={work.position} onChange={e => updateItem(setWorkHistory, workHistory, idx, 'position', e.target.value)} />
                                            <input disabled={!isEditing} placeholder="Tempoh" className="p-2 text-xs border rounded bg-white" value={work.duration} onChange={e => updateItem(setWorkHistory, workHistory, idx, 'duration', e.target.value)} />
                                        </div>
                                        <textarea disabled={!isEditing} placeholder="Tanggungjawab utama..." className="w-full p-2 text-xs border rounded bg-white" rows={2} value={work.desc} onChange={e => updateItem(setWorkHistory, workHistory, idx, 'desc', e.target.value)} />
                                        {isEditing && (
                                            <button type="button" onClick={() => removeItem(setWorkHistory, workHistory, idx)} className="text-red-500 text-xs flex items-center gap-1 font-bold"><Trash2 size={12}/> Padam</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-bold text-slate-700">Sejarah Pendidikan</label>
                                {isEditing && (
                                    <button type="button" onClick={() => addItem(setEduHistory, eduHistory, {school: '', year: '', level: '', cgpa: ''})} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold">
                                        <Plus size={14} /> Tambah Pendidikan
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {eduHistory.map((edu, idx) => (
                                    <div key={idx} className={`flex gap-2 items-start p-3 rounded-lg border shadow-sm transition-colors ${isEditing ? 'bg-white border-slate-300' : 'bg-slate-100 border-transparent'}`}>
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                            <input disabled={!isEditing} placeholder="Tahap" className="p-2 text-xs border rounded bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none" value={edu.level} onChange={e => updateItem(setEduHistory, eduHistory, idx, 'level', e.target.value)} />
                                            <input disabled={!isEditing} placeholder="Institusi" className="p-2 text-xs border rounded bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none" value={edu.school} onChange={e => updateItem(setEduHistory, eduHistory, idx, 'school', e.target.value)} />
                                            <input disabled={!isEditing} placeholder="Tahun" className="p-2 text-xs border rounded bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none" value={edu.year} onChange={e => updateItem(setEduHistory, eduHistory, idx, 'year', e.target.value)} />
                                            <input disabled={!isEditing} placeholder="CGPA" className="p-2 text-xs border rounded bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none" value={edu.cgpa} onChange={e => updateItem(setEduHistory, eduHistory, idx, 'cgpa', e.target.value)} />
                                        </div>
                                        {isEditing && (
                                            <button type="button" onClick={() => removeItem(setEduHistory, eduHistory, idx)} className="text-red-500 p-2"><Trash2 size={16} /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-bold text-slate-700">Projek & Pencapaian</label>
                                {isEditing && (
                                    <button type="button" onClick={() => addItem(setProjHistory, projHistory, {title: '', desc: ''})} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold">
                                        <Plus size={14} /> Tambah Projek
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {projHistory.map((p, idx) => (
                                    <div key={idx} className={`flex gap-2 items-start p-3 rounded-lg border shadow-sm transition-colors ${isEditing ? 'bg-white border-slate-300' : 'bg-slate-100 border-transparent'}`}>
                                        <div className="flex-1 space-y-2">
                                            <input disabled={!isEditing} placeholder="Nama Projek" className="w-full p-2 text-xs border rounded bg-white text-slate-900 font-bold focus:ring-1 focus:ring-indigo-500 outline-none" value={p.title} onChange={e => updateItem(setProjHistory, projHistory, idx, 'title', e.target.value)} />
                                            <textarea disabled={!isEditing} placeholder="Penerangan ringkas..." className="w-full p-2 text-xs border rounded bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none" rows={2} value={p.desc} onChange={e => updateItem(setProjHistory, projHistory, idx, 'desc', e.target.value)} />
                                        </div>
                                        {isEditing && (
                                            <button type="button" onClick={() => removeItem(setProjHistory, projHistory, idx)} className="text-red-500 p-2"><Trash2 size={16} /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
                </>
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

      <Modal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} title="Konfigurasi Resume Infografik">
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Languages size={18} className="text-blue-600" /> Pilih Bahasa
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setSelectedLang('ms')}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${selectedLang === 'ms' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                    >
                        <span className="font-bold text-slate-800">B. Melayu</span>
                        <span className="text-[10px] text-slate-500">Asal</span>
                    </button>
                    <button 
                        onClick={() => setSelectedLang('en')}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${selectedLang === 'en' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                    >
                        <span className="font-bold text-slate-800">English</span>
                        <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold">
                            <Sparkles size={10} /> AI Translated
                        </div>
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Palette size={18} className="text-blue-600" /> Pilih Tema Warna
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {themeOptions.map((theme) => (
                        <button 
                            key={theme.id}
                            onClick={() => setSelectedTheme(theme.id)}
                            className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${selectedTheme === theme.id ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                        >
                            <div className={`w-10 h-10 rounded-full ${theme.color} border-4 border-white shadow-sm flex items-center justify-center`}>
                                {selectedTheme === theme.id && <Check size={20} className="text-white" />}
                            </div>
                            <span className="font-bold text-sm text-slate-700">{theme.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-4">
                <button 
                    onClick={handleGenerateResume}
                    disabled={isGenerating}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
                >
                    {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <FileText size={24} />}
                    Jana Resume Sekarang
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-3">
                    *Warna akan dikekalkan sepenuhnya dalam versi PDF/Cetak.
                </p>
            </div>
        </div>
      </Modal>
    </div>
  );
};
