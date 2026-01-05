
import React, { useState, useMemo, useEffect } from 'react';
import { Company, User, UserRole, Application } from '../types';
import { 
  Search, Plus, Trash2, Edit, Mail, Building2, CheckCircle2, AlertTriangle, Clock, Copy, Printer, FileText, Check
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { MALAYSIAN_STATES } from '../constants';
import { toast } from 'react-hot-toast';
import { StorageService } from '../services/storage';
import { generateLOI, generateInvitationLetter } from '../utils/letterGenerator';

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
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  
  const [newCompany, setNewCompany] = useState<Partial<Company>>({ company_name: '', company_state: 'Melaka' });
  const [editingCompany, setEditingCompany] = useState<any>(null);

  const isCoordinator = currentUser.role === UserRole.COORDINATOR || currentUser.is_jkwbl;

  const handleApproveAll = async () => {
    if (!confirm('Tindakan ini akan mengaktifkan SEMUA syarikat di dalam pangkalan data. Teruskan?')) return;
    setIsApprovingAll(true);
    const loading = toast.loading('Meluluskan semua syarikat...');
    try {
        await StorageService.bulkApproveCompanies();
        toast.success('Berjaya meluluskan semua syarikat!', { id: loading });
        setActiveTab('approved');
    } catch (e: any) {
        toast.error(e.message, { id: loading });
    } finally {
        setIsApprovingAll(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
        // Logik: Lulus jika is_approved adalah boolean true, string "true", atau nombor 1
        const isCurrentlyApproved = c.is_approved === true || String(c.is_approved) === 'true' || Number(c.is_approved) === 1;
        
        const matchesApproval = isCoordinator 
            ? (activeTab === 'approved' ? isCurrentlyApproved : !isCurrentlyApproved)
            : isCurrentlyApproved;
        
        const matchesSearch = c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (c.company_district?.toLowerCase() || '').includes(searchTerm.toLowerCase());
                             
        return matchesApproval && matchesSearch;
    });
  }, [companies, activeTab, searchTerm, isCoordinator]);

  const pendingCount = useMemo(() => {
      return companies.filter(c => {
          const isApproved = c.is_approved === true || String(c.is_approved) === 'true' || Number(c.is_approved) === 1;
          return !isApproved;
      }).length;
  }, [companies]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Senarai Syarikat</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)} 
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95"
        >
          <Plus size={18} /> Tambah Syarikat Baru
        </button>
      </div>

      {isCoordinator && (
          <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-slate-200">
              <div className="flex gap-2">
                <button 
                    onClick={() => setActiveTab('approved')}
                    className={`px-6 py-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'approved' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Senarai Aktif
                </button>
                <button 
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 relative ${activeTab === 'pending' ? 'border-orange-600 text-orange-600 bg-orange-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Syarikat Menunggu {pendingCount > 0 && <span className="ml-1 bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px]">{pendingCount}</span>}
                </button>
              </div>

              {activeTab === 'pending' && pendingCount > 0 && (
                  <button 
                    disabled={isApprovingAll}
                    onClick={handleApproveAll}
                    className="mb-2 px-4 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center gap-2 shadow-sm self-end md:self-center transition-all active:scale-95"
                  >
                      <CheckCircle2 size={16} /> Luluskan Semua Syarikat Menunggu
                  </button>
              )}
          </div>
      )}

      <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text" placeholder="Cari syarikat atau lokasi..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold text-sm text-slate-600">Syarikat</th>
                <th className="p-4 font-bold text-sm text-slate-600">Lokasi</th>
                <th className="p-4 font-bold text-sm text-slate-600 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompanies.length === 0 && (
                  <tr>
                      <td colSpan={3} className="p-12 text-center text-slate-400 italic">Tiada syarikat dalam senarai ini.</td>
                  </tr>
              )}
              {filteredCompanies.map(company => (
                <tr key={company.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{company.company_name}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{company.company_industry}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {company.company_district}, {company.company_state}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                        {isCoordinator && !(company.is_approved === true || String(company.is_approved) === 'true' || Number(company.is_approved) === 1) && (
                            <button 
                                onClick={async () => {
                                    try {
                                        await onUpdateCompany({...company, is_approved: true});
                                        toast.success("Syarikat diluluskan!");
                                    } catch(e) {}
                                }} 
                                className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 shadow-sm active:scale-95"
                            >
                                <Check size={14} />
                                <span className="text-[10px] font-bold">LULUS</span>
                            </button>
                        )}
                        {currentUser.role === UserRole.STUDENT && (company.is_approved === true || String(company.is_approved) === 'true' || Number(company.is_approved) === 1) && (
                            <button onClick={() => onApply(company)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold shadow-sm active:scale-95">Mohon</button>
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

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Syarikat">
        <form onSubmit={async (e) => { e.preventDefault(); await onAddCompany(newCompany as any); setIsAddModalOpen(false); }} className="space-y-4">
          <CompanyForm data={newCompany} setData={setNewCompany} />
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg active:scale-[0.98]">Simpan Syarikat</button>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Syarikat">
        {editingCompany && (
          <form onSubmit={async (e) => { e.preventDefault(); await onUpdateCompany(editingCompany); setIsEditModalOpen(false); }} className="space-y-4">
            <CompanyForm data={editingCompany} setData={setEditingCompany} />
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg active:scale-[0.98]">Simpan Perubahan</button>
          </form>
        )}
      </Modal>
    </div>
  );
};
