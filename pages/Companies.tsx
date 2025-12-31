
import React, { useState, useCallback } from 'react';
import { Company, User, UserRole, Application } from '../types';
import { Search, Plus, Trash2, Edit, Loader2, Users } from 'lucide-react';
import { Modal } from '../components/Modal';
import { MALAYSIAN_STATES } from '../constants';
import { toast } from 'react-hot-toast';

interface CompanyFormProps {
  data: Partial<Company>;
  setData: React.Dispatch<React.SetStateAction<any>>;
}

/**
 * Komponen Borang diletakkan di luar supaya tidak hilang fokus (re-mount) semasa menaip.
 */
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
          className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 outline-none" 
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

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Industri</label>
        <input 
          required 
          type="text" 
          placeholder="Sektor Industri"
          className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 outline-none" 
          value={data.company_industry || ''} 
          onChange={e => handleChange('company_industry', e.target.value)} 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Pegawai Dihubungi</label>
          <input 
            required 
            type="text" 
            placeholder="Nama PIC"
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 outline-none" 
            value={data.company_contact_person || ''} 
            onChange={e => handleChange('company_contact_person', e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
          <input 
            required 
            type="text" 
            placeholder="No. Telefon"
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 outline-none" 
            value={data.company_contact_phone || ''} 
            onChange={e => handleChange('company_contact_phone', e.target.value)} 
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
        <input 
          required 
          type="email" 
          placeholder="email@syarikat.com"
          className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 outline-none" 
          value={data.company_contact_email || ''} 
          onChange={e => handleChange('company_contact_email', e.target.value)} 
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input 
            type="checkbox" 
            className="w-4 h-4 text-blue-600 rounded cursor-pointer" 
            checked={data.has_mou || false} 
            onChange={e => handleChange('has_mou', e.target.checked)} 
          />
          <span className="text-sm font-medium text-slate-700">Ada MoU / LOI?</span>
        </label>
        
        {data.has_mou && (
          <select 
            className="px-2 py-1 border border-slate-300 rounded text-sm bg-white text-slate-900 outline-none" 
            value={data.mou_type || 'MoU'} 
            onChange={e => handleChange('mou_type', e.target.value)}
          >
            <option value="MoU">MoU</option>
            <option value="LOI">LOI</option>
          </select>
        )}
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
}

export const Companies: React.FC<CompaniesProps> = ({ companies, applications, currentUser, onAddCompany, onUpdateCompany, onDeleteCompany, onApply }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmingCompany, setConfirmingCompany] = useState<Company | null>(null);
  
  const [newCompany, setNewCompany] = useState<Partial<Company>>({
      company_state: 'Melaka',
      has_mou: false,
      mou_type: 'MoU'
  });
  const [editingCompany, setEditingCompany] = useState<any>(null);

  const isCoordinator = currentUser.role === UserRole.COORDINATOR || currentUser.username === 'guzairy' || currentUser.is_jkwbl;
  const myApplications = applications.filter(a => a.created_by === currentUser.username);
  const isLimitReached = myApplications.length >= 3;

  const filteredAndSortedCompanies = companies
    .filter(c => {
      const matchesSearch = c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.company_district.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesState = filterState === 'all' || c.company_state === filterState;
      return matchesSearch && matchesState;
    })
    .sort((a, b) => a.company_name.localeCompare(b.company_name));

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) setSelectedIds(filteredAndSortedCompanies.map(c => c.id));
      else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
      if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(sid => sid !== id));
      else setSelectedIds([...selectedIds, id]);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isCoordinator || !newCompany.company_name || isSubmitting) return;
      setIsSubmitting(true);
      try {
        await onAddCompany({
          company_name: newCompany.company_name!,
          company_state: newCompany.company_state || 'Melaka',
          company_district: newCompany.company_district || '',
          company_address: newCompany.company_address || '',
          company_industry: newCompany.company_industry || '',
          company_contact_person: newCompany.company_contact_person || '',
          company_contact_email: newCompany.company_contact_email || '',
          company_contact_phone: newCompany.company_contact_phone || '',
          has_mou: !!newCompany.has_mou,
          mou_type: newCompany.has_mou ? (newCompany.mou_type || 'MoU') : null as any,
          created_at: new Date().toISOString()
        });
        setIsAddModalOpen(false);
        setNewCompany({ company_state: 'Melaka', has_mou: false, mou_type: 'MoU' });
      } catch (err: any) {
          // Toast diuruskan oleh App.tsx
      } finally {
        setIsSubmitting(false);
      }
  };

  const handleEditClick = (company: Company) => {
      setEditingCompany({ ...company });
      setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isCoordinator || !editingCompany || isSubmitting) return;
      setIsSubmitting(true);
      
      try {
        await onUpdateCompany(editingCompany);
        setIsEditModalOpen(false);
        setEditingCompany(null);
      } catch (err: any) {
          console.error('Update error in component:', err);
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleConfirmApply = async () => {
      if (confirmingCompany) {
          await onApply(confirmingCompany);
          setConfirmingCompany(null);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Senarai Syarikat</h2>
            {currentUser.role === UserRole.STUDENT && (
                <p className="text-sm text-slate-500 mt-1">
                    Had Permohonan: <span className={`font-bold ${isLimitReached ? 'text-red-600' : 'text-blue-600'}`}>{myApplications.length}/3</span>
                </p>
            )}
        </div>
        
        {isCoordinator && (
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-all"
            >
                <Plus size={20} /> Tambah Syarikat
            </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari syarikat..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
            className="p-2 border border-slate-300 rounded-lg bg-white w-full md:w-auto text-slate-800 outline-none"
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
        >
            <option value="all">Semua Negeri</option>
            {MALAYSIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {isCoordinator && <th className="p-4 w-10 text-center"><input type="checkbox" onChange={handleSelectAll} /></th>}
                <th className="p-4 font-semibold text-sm text-slate-600">Syarikat</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Lokasi</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Pemohon</th>
                <th className="p-4 font-semibold text-sm text-slate-600 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedCompanies.length === 0 ? (
                <tr><td colSpan={isCoordinator ? 5 : 4} className="p-8 text-center text-slate-500 italic">Tiada syarikat dijumpai.</td></tr>
              ) : (
                filteredAndSortedCompanies.map(company => {
                  // Tapis permohonan untuk syarikat ini
                  const companyApps = applications.filter(a => a.company_name === company.company_name);

                  return (
                    <tr key={company.id} className="hover:bg-slate-50 transition-colors group">
                      {isCoordinator && <td className="p-4 text-center"><input type="checkbox" checked={selectedIds.includes(company.id)} onChange={() => handleSelectOne(company.id)} /></td>}
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{company.company_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          {company.company_industry} {company.has_mou && <span className="bg-blue-100 text-blue-700 px-1 rounded text-[10px] font-bold">{company.mou_type}</span>}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-700">
                        <div className="font-medium">{company.company_district}</div>
                        <div className="text-xs text-slate-400">{company.company_state}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {companyApps.length > 0 ? (
                            companyApps.map(app => (
                              <span 
                                key={app.id} 
                                title={app.application_status}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${
                                  app.application_status === 'Diluluskan' 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : app.application_status === 'Ditolak'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {app.student_name}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-xs italic">Tiada pemohon</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                            {currentUser.role === UserRole.STUDENT && !myApplications.some(a => a.company_name === company.company_name) && !isLimitReached && (
                                <button onClick={() => setConfirmingCompany(company)} className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 shadow-sm transition-all active:scale-95">Mohon</button>
                            )}
                            {isCoordinator && (
                                <>
                                  <button onClick={() => handleEditClick(company)} className="p-1.5 bg-blue-50 text-blue-600 rounded border border-blue-100 hover:bg-blue-100 transition-colors" title="Edit"><Edit size={16} /></button>
                                  <button onClick={() => { if(confirm('Adakah anda pasti mahu memadam syarikat ini?')) onDeleteCompany(company.id); }} className="p-1.5 bg-red-50 text-red-600 rounded border border-red-100 hover:bg-red-100 transition-colors" title="Padam"><Trash2 size={16} /></button>
                                </>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Syarikat */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Syarikat Baru">
          <form onSubmit={handleAddSubmit} className="space-y-6">
            <CompanyForm data={newCompany} setData={setNewCompany} />
            <button disabled={isSubmitting} type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Tambah Syarikat'}
            </button>
          </form>
      </Modal>

      {/* Modal Kemaskini Syarikat */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Kemaskini Maklumat Syarikat">
          {editingCompany && (
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <CompanyForm data={editingCompany} setData={setEditingCompany} />
                <button disabled={isSubmitting} type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Simpan Perubahan'}
                </button>
              </form>
          )}
      </Modal>

      <Modal isOpen={!!confirmingCompany} onClose={() => setConfirmingCompany(null)} title="Pengesahan Permohonan">
        <div className="space-y-4">
            <p className="text-slate-600 text-center">Anda pasti mahu memohon ke <strong>{confirmingCompany?.company_name}</strong>?</p>
            <div className="flex gap-3">
                <button onClick={() => setConfirmingCompany(null)} className="flex-1 px-4 py-2 border border-slate-300 rounded text-slate-700 font-medium hover:bg-slate-50 transition-all">Batal</button>
                <button onClick={handleConfirmApply} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-all shadow-md">Ya, Mohon</button>
            </div>
        </div>
      </Modal>
    </div>
  );
};
