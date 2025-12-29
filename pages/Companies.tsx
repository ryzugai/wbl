
import React, { useState, useEffect } from 'react';
import { Company, User, UserRole, Application } from '../types';
import { Search, Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { MALAYSIAN_STATES } from '../constants';
import { toast } from 'react-hot-toast';

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
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const isCoordinator = currentUser.role === UserRole.COORDINATOR;
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
          toast.error(err.message);
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
          toast.error(err.message);
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
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm"
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
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
            className="p-2 border border-slate-300 rounded-lg bg-white w-full md:w-auto"
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
                <th className="p-4 font-semibold text-sm text-slate-600 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedCompanies.map(company => (
                <tr key={company.id} className="hover:bg-slate-50 transition-colors">
                  {isCoordinator && <td className="p-4 text-center"><input type="checkbox" checked={selectedIds.includes(company.id)} onChange={() => handleSelectOne(company.id)} /></td>}
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{company.company_name}</div>
                    <div className="text-xs text-slate-500">{company.company_industry}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-700">{company.company_district}, {company.company_state}</td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                        {currentUser.role === UserRole.STUDENT && !myApplications.some(a => a.company_name === company.company_name) && !isLimitReached && (
                            <button onClick={() => setConfirmingCompany(company)} className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700">Mohon</button>
                        )}
                        {isCoordinator && (
                            <>
                              <button onClick={() => handleEditClick(company)} className="p-1.5 bg-blue-50 text-blue-600 rounded border hover:bg-blue-100"><Edit size={16} /></button>
                              <button onClick={() => { if(confirm('Padam?')) onDeleteCompany(company.id); }} className="p-1.5 bg-red-50 text-red-600 rounded border hover:bg-red-100"><Trash2 size={16} /></button>
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

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Kemaskini Syarikat">
          {editingCompany && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Syarikat</label>
                    <input required type="text" className="w-full p-2 border rounded" value={editingCompany.company_name} onChange={e => setEditingCompany({...editingCompany, company_name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Negeri</label>
                    <select className="w-full p-2 border rounded" value={editingCompany.company_state} onChange={e => setEditingCompany({...editingCompany, company_state: e.target.value})}>
                      {MALAYSIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Daerah</label>
                    <input required type="text" className="w-full p-2 border rounded" value={editingCompany.company_district} onChange={e => setEditingCompany({...editingCompany, company_district: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Penuh</label>
                  <textarea required className="w-full p-2 border rounded" rows={2} value={editingCompany.company_address} onChange={e => setEditingCompany({...editingCompany, company_address: e.target.value})} />
                </div>
                <button disabled={isSubmitting} type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Simpan Perubahan'}
                </button>
              </form>
          )}
      </Modal>

      <Modal isOpen={!!confirmingCompany} onClose={() => setConfirmingCompany(null)} title="Pengesahan">
        <div className="space-y-4">
            <p className="text-slate-600 text-center">Anda pasti mahu memohon ke <strong>{confirmingCompany?.company_name}</strong>?</p>
            <div className="flex gap-3">
                <button onClick={() => setConfirmingCompany(null)} className="flex-1 px-4 py-2 border rounded">Batal</button>
                <button onClick={handleConfirmApply} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-bold">Ya, Mohon</button>
            </div>
        </div>
      </Modal>
    </div>
  );
};
