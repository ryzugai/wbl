
import React, { useState, useCallback } from 'react';
import { Company, User, UserRole, Application } from '../types';
import { 
  Search, Plus, Trash2, Edit, Loader2, FileText, Printer, 
  Download, History, SortAsc, Mail, Copy, Building2, Check 
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { MALAYSIAN_STATES } from '../constants';
import { toast } from 'react-hot-toast';
import { generateLOI, downloadLOIWord, generateInvitationLetter } from '../utils/letterGenerator';

interface CompanyFormProps {
  data: Partial<Company>;
  setData: React.Dispatch<React.SetStateAction<any>>;
}

const CompanyForm: React.FC<CompanyFormProps> = ({ data, setData }) => {
  const handleChange = (field: keyof Company, value: any) => {
    setData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Syarikat</label>
        <input 
          required 
          type="text" 
          placeholder="Nama Syarikat"
          className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 outline-none shadow-sm" 
          value={data.company_name || ''} 
          onChange={e => handleChange('company_name', e.target.value)} 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Negeri</label>
          <select 
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 outline-none" 
            value={data.company_state || 'Melaka'} 
            onChange={e => handleChange('company_state', e.target.value)}
          >
            {MALAYSIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Daerah</label>
          <input 
            required 
            type="text" 
            placeholder="Daerah"
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 outline-none" 
            value={data.company_district || ''} 
            onChange={e => handleChange('company_district', e.target.value)} 
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Penuh</label>
        <textarea 
          required 
          placeholder="Alamat Lengkap Syarikat"
          className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 outline-none resize-none" 
          rows={3} 
          value={data.company_address || ''} 
          onChange={e => handleChange('company_address', e.target.value)} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Industri</label>
          <input required type="text" className="w-full px-3 py-2 border rounded bg-white" value={data.company_industry || ''} onChange={e => handleChange('company_industry', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Pegawai PIC</label>
          <input required type="text" className="w-full px-3 py-2 border rounded bg-white" value={data.company_contact_person || ''} onChange={e => handleChange('company_contact_person', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">E-mel</label>
          <input required type="email" className="w-full px-3 py-2 border rounded bg-white" value={data.company_contact_email || ''} onChange={e => handleChange('company_contact_email', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">No. Telefon</label>
          <input required type="text" className="w-full px-3 py-2 border rounded bg-white" value={data.company_contact_phone || ''} onChange={e => handleChange('company_contact_phone', e.target.value)} />
        </div>
      </div>
    </div>
  );
};

interface CompaniesProps {
  companies: Company[];
  applications: Application[];
  currentUser: User;
  onAddCompany: (c: Omit<Company, 'id'>) => Promise<void>;
  onUpdateCompany: (c: Company) => Promise<void>;
  onDeleteCompany: (id: string) => Promise<void>;
  onApply: (company: Company) => Promise<void>;
  language: 'ms' | 'en';
}

export const Companies: React.FC<CompaniesProps> = ({ companies, applications, currentUser, onAddCompany, onUpdateCompany, onDeleteCompany, onApply, language }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [sortOrder, setSortOrder] = useState<'alphabetical' | 'latest'>('alphabetical');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedCompanyForEmail, setSelectedCompanyForEmail] = useState<Company | null>(null);
  const [newCompany, setNewCompany] = useState<Partial<Company>>({ company_state: 'Melaka' });
  const [editingCompany, setEditingCompany] = useState<any>(null);

  const isCoordinator = currentUser.role === UserRole.COORDINATOR || currentUser.is_jkwbl;

  const filteredCompanies = companies
    .filter(c => {
      const matchesSearch = c.company_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesState = filterState === 'all' || c.company_state === filterState;
      return matchesSearch && matchesState;
    })
    .sort((a, b) => {
      if (sortOrder === 'alphabetical') return a.company_name.localeCompare(b.company_name);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const getEmailBody = () => {
    const jawatan = currentUser.role === UserRole.COORDINATOR ? 'Penyelaras' : 'Ahli Jawatankuasa (JK)';
    return `Assalamualaikum dan salam sejahtera Tuan/Puan. Saya ${currentUser.name}, ${jawatan} program BTEC WBL ingin mempelawa pihak Tuan/Puan sebagai rakan Kerjasama industri seperti terkandung didalam surat yang dilampirkan.\n\nMohon jasa baik tuan untuk berikan respon pada pautan berikut https://forms.office.com/r/Z1QEaXM6RR\n\nSekian terima kasih atas perhatian dan kerjasama.`;
  };

  const handleLaunchEmail = () => {
    if (!selectedCompanyForEmail?.company_contact_email) return;
    const subject = encodeURIComponent(`Pelawaan Kerjasama Industri WBL UTeM - ${selectedCompanyForEmail.company_name}`);
    const body = encodeURIComponent(getEmailBody());
    window.location.href = `mailto:${selectedCompanyForEmail.company_contact_email}?subject=${subject}&body=${body}`;
    setIsEmailModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Senarai Syarikat</h2>
        {isCoordinator && (
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md">
            <Plus size={18} /> Tambah Syarikat
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text" placeholder="Cari syarikat..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="p-2 border rounded-lg bg-white" value={filterState} onChange={e => setFilterState(e.target.value)}>
          <option value="all">Semua Negeri</option>
          {MALAYSIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold text-sm text-slate-600">Nama Syarikat</th>
                <th className="p-4 font-bold text-sm text-slate-600">Lokasi</th>
                <th className="p-4 font-bold text-sm text-slate-600 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompanies.map(company => (
                <tr key={company.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{company.company_name}</div>
                    <div className="text-xs text-slate-500">{company.company_industry}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-slate-700">{company.company_district}</div>
                    <div className="text-xs text-slate-400">{company.company_state}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      {isCoordinator && (
                        <button 
                          onClick={() => { setSelectedCompanyForEmail(company); setIsEmailModalOpen(true); }}
                          className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                          <Mail size={14} /> <span className="text-[10px] font-bold pr-1 uppercase">Emel</span>
                        </button>
                      )}
                      {currentUser.role === UserRole.STUDENT && (
                        <button onClick={() => onApply(company)} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-indigo-700 shadow-sm">Mohon</button>
                      )}
                      {isCoordinator && (
                        <>
                          <button onClick={() => { setEditingCompany({...company}); setIsEditModalOpen(true); }} className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"><Edit size={14}/></button>
                          <button onClick={() => { if(confirm('Hapus?')) onDeleteCompany(company.id); }} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 size={14}/></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EMAIL PREPARATION MODAL */}
      <Modal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} title="Persediaan Emel Industri">
        <div className="space-y-6">
          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 relative overflow-hidden">
              <div className="relative z-10">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Rakan Industri</p>
                  <p className="font-black text-blue-900 text-xl leading-tight">{selectedCompanyForEmail?.company_name}</p>
                  <p className="text-xs text-blue-600 mt-1 font-medium italic">{selectedCompanyForEmail?.company_contact_email || 'Tiada Alamat Emel'}</p>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-10"><Building2 size={80} /></div>
          </div>

          <div className="space-y-4">
              <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-black">1</div>
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest">Muat Turun Lampiran</h5>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                  <button 
                      onClick={() => { if(selectedCompanyForEmail) generateInvitationLetter(selectedCompanyForEmail, " "); }}
                      className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all group shadow-sm"
                  >
                      <Printer size={18} className="text-red-500 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <span className="font-bold text-[10px] text-slate-700 block">Surat Pelawaan</span>
                        <span className="text-[8px] text-slate-400 uppercase">Klik untuk Jana PDF</span>
                      </div>
                  </button>
                  <button 
                      onClick={() => { if(selectedCompanyForEmail) generateLOI(selectedCompanyForEmail); }}
                      className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all group shadow-sm"
                  >
                      <FileText size={18} className="text-purple-500 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <span className="font-bold text-[10px] text-slate-700 block">Dokumen LOI</span>
                        <span className="text-[8px] text-slate-400 uppercase">Klik untuk Jana PDF</span>
                      </div>
                  </button>
              </div>
          </div>

          <div className="space-y-4">
              <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-black">2</div>
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest">Salin Draf Teks Emel</h5>
              </div>
              <div className="pl-8 space-y-2">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed italic shadow-inner">
                      {getEmailBody()}
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(getEmailBody()); toast.success('Draf disalin!'); }} className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:underline">
                      <Copy size={12} /> Salin Teks Sekarang
                  </button>
              </div>
          </div>

          <div className="pt-2">
              <button 
                  onClick={handleLaunchEmail}
                  disabled={!selectedCompanyForEmail?.company_contact_email}
                  className="w-full flex items-center justify-center gap-3 p-5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 group active:scale-95 disabled:bg-slate-300"
              >
                  <Mail size={28} className="group-hover:rotate-12 transition-transform" />
                  <div className="text-left">
                    <span className="font-black text-base block">Langkah 3: Buka Emel</span>
                    <span className="text-[10px] opacity-90 font-medium tracking-tight">Auto-fill Receiver, Subject & Body</span>
                  </div>
              </button>
              <p className="text-[9px] text-center text-slate-400 px-8 mt-4 leading-relaxed italic">
                 *PENTING: Jangan lupa untuk muat naik (attach) fail PDF dari Langkah 1 di dalam aplikasi emel anda.
              </p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Syarikat Baru">
        <form onSubmit={async (e) => { e.preventDefault(); await onAddCompany(newCompany as any); setIsAddModalOpen(false); }} className="space-y-4">
          <CompanyForm data={newCompany} setData={setNewCompany} />
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg">Simpan Syarikat</button>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Syarikat">
        {editingCompany && (
          <form onSubmit={async (e) => { e.preventDefault(); await onUpdateCompany(editingCompany); setIsEditModalOpen(false); }} className="space-y-4">
            <CompanyForm data={editingCompany} setData={setEditingCompany} />
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg">Simpan Perubahan</button>
          </form>
        )}
      </Modal>
    </div>
  );
};
