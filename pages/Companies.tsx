
import React, { useState, useEffect } from 'react';
import { Company, User, UserRole, Application } from '../types';
import { Search, Plus, Trash2, Briefcase, MapPin, User as UserIcon, Mail, Phone, FileText, Sparkles, HelpCircle, Edit, FileDown, ArrowUpDown } from 'lucide-react';
import { Modal } from '../components/Modal';
import { MALAYSIAN_STATES } from '../constants';
import { generateLOI, downloadLOIWord } from '../utils/letterGenerator';
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
  const [sortOption, setSortOption] = useState('name_asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [confirmingCompany, setConfirmingCompany] = useState<Company | null>(null);
  const [suggestedCompanies, setSuggestedCompanies] = useState<Company[]>([]);

  const [newCompany, setNewCompany] = useState<Partial<Company>>({
      company_state: 'Melaka',
      has_mou: false,
      mou_type: 'MoU'
  });

  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const canEditOrDelete = currentUser.role === UserRole.COORDINATOR || currentUser.role === UserRole.LECTURER;
  const canBulkDelete = currentUser.role === UserRole.COORDINATOR;

  const myApplications = applications.filter(a => a.created_by === currentUser.username);
  const applicationCount = myApplications.length;
  const isLimitReached = applicationCount >= 3;

  useEffect(() => {
    if (currentUser.role === UserRole.STUDENT && currentUser.address && currentUser.address.length > 3) {
      const addressLower = currentUser.address.toLowerCase();
      const matches = companies.filter(c => {
        const stateMatch = c.company_state && addressLower.includes(c.company_state.toLowerCase());
        const districtMatch = c.company_district && addressLower.includes(c.company_district.toLowerCase());
        const addressMatch = c.company_address && addressLower.includes(c.company_address.split(',')[0].toLowerCase());
        const alreadyApplied = myApplications.some(app => app.company_name === c.company_name);
        return (stateMatch || districtMatch || addressMatch) && !alreadyApplied;
      });
      setSuggestedCompanies(matches.slice(0, 3));
    } else {
      setSuggestedCompanies([]);
    }
  }, [currentUser, companies, myApplications]);

  const filteredAndSortedCompanies = companies
    .filter(c => {
      const matchesSearch = c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.company_district.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.company_industry.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesState = filterState === 'all' || c.company_state === filterState;
      return matchesSearch && matchesState;
    })
    .sort((a, b) => {
        switch (sortOption) {
            case 'name_asc': return a.company_name.localeCompare(b.company_name);
            case 'name_desc': return b.company_name.localeCompare(a.company_name);
            case 'state_asc': return a.company_state.localeCompare(b.company_state);
            case 'state_desc': return b.company_state.localeCompare(a.company_state);
            default: return 0;
        }
    });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          setSelectedIds(filteredAndSortedCompanies.map(c => c.id));
      } else {
          setSelectedIds([]);
      }
  };

  const handleSelectOne = (id: string) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter(sid => sid !== id));
      } else {
          setSelectedIds([...selectedIds, id]);
      }
  };

  const handleBulkDelete = async () => {
      if (confirm(`Adakah anda pasti mahu memadam ${selectedIds.length} syarikat terpilih?`)) {
          const toastId = toast.loading(`Sedang memadam ${selectedIds.length} syarikat...`);
          try {
              for (const id of selectedIds) {
                  await onDeleteCompany(id);
              }
              setSelectedIds([]);
              toast.success(`${selectedIds.length} syarikat berjaya dipadam.`, { id: toastId });
          } catch (e) {
              toast.error('Ralat berlaku semasa pemadaman pukal.', { id: toastId });
          }
      }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCompany.company_name) return;
      
      const companyToSave: Omit<Company, 'id'> = {
          company_name: newCompany.company_name!,
          company_state: newCompany.company_state || '',
          company_district: newCompany.company_district || '',
          company_address: newCompany.company_address || '',
          company_industry: newCompany.company_industry || '',
          company_contact_person: newCompany.company_contact_person || '',
          company_contact_email: newCompany.company_contact_email || '',
          company_contact_phone: newCompany.company_contact_phone || '',
          has_mou: !!newCompany.has_mou,
          created_at: new Date().toISOString()
      };

      if (newCompany.has_mou) {
          companyToSave.mou_type = newCompany.mou_type || 'MoU';
      }
      
      await onAddCompany(companyToSave);
      setIsAddModalOpen(false);
      setNewCompany({ company_state: 'Melaka', has_mou: false, mou_type: 'MoU' });
  };

  const handleEditClick = (company: Company) => {
      // Create a deep copy to avoid direct state mutation
      setEditingCompany(JSON.parse(JSON.stringify(company)));
      setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingCompany) return;
      
      // Sanitization: Ensure no undefined values are sent to Firebase
      const updatedData: any = { ...editingCompany };
      
      if (!updatedData.has_mou) {
          // If has_mou is false, remove the mou_type key entirely
          delete updatedData.mou_type;
      } else if (!updatedData.mou_type) {
          // Default if checked but no type selected
          updatedData.mou_type = 'MoU';
      }

      // Convert any remaining undefined to null or empty strings
      Object.keys(updatedData).forEach(key => {
          if (updatedData[key] === undefined) {
              updatedData[key] = "";
          }
      });
      
      await onUpdateCompany(updatedData as Company);
      setIsEditModalOpen(false);
      setEditingCompany(null);
  };

  const handleConfirmApply = async () => {
      if (confirmingCompany) {
          await onApply(confirmingCompany);
          setConfirmingCompany(null);
      }
  };

  const renderApplyButton = (company: Company) => {
      if (currentUser.role !== UserRole.STUDENT) return null;
      const hasApplied = myApplications.some(app => app.company_name === company.company_name);
      if (hasApplied) {
          return (
            <button disabled className="bg-green-100 text-green-700 px-3 py-1.5 rounded text-sm font-bold border border-green-200 cursor-not-allowed">
                Telah Memohon
            </button>
          );
      }
      if (isLimitReached) {
          return (
            <button disabled className="bg-slate-100 text-slate-400 px-3 py-1.5 rounded text-sm font-medium border border-slate-200 cursor-not-allowed" title="Had maksimum 3 permohonan dicapai">
                Had Penuh
            </button>
          );
      }
      return (
        <button 
            onClick={() => setConfirmingCompany(company)}
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
        >
            Mohon
        </button>
      );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Senarai Syarikat</h2>
            {currentUser.role === UserRole.STUDENT && (
                <p className="text-sm text-slate-500 mt-1">
                    Permohonan Anda: <span className={`font-bold ${isLimitReached ? 'text-red-600' : 'text-blue-600'}`}>{applicationCount}/3</span>
                </p>
            )}
        </div>
        
        <div className="flex gap-2">
            {selectedIds.length > 0 && canBulkDelete && (
                <button 
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm animate-fadeIn"
                >
                    <Trash2 size={18} /> Padam ({selectedIds.length})
                </button>
            )}
            
            {(currentUser.role === UserRole.COORDINATOR || currentUser.role === UserRole.LECTURER) && (
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={20} /> Tambah Syarikat
                </button>
            )}
        </div>
      </div>

      {suggestedCompanies.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 animate-fadeIn">
              <div className="flex items-center gap-2 mb-4">
                  <div className="bg-blue-600 text-white p-2 rounded-lg">
                      <Sparkles size={20} />
                  </div>
                  <div>
                      <h3 className="font-bold text-blue-900">Cadangan Syarikat Berhampiran</h3>
                      <p className="text-sm text-blue-700">Berdasarkan alamat anda: <span className="font-medium italic">{currentUser.address}</span></p>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {suggestedCompanies.map(company => (
                      <div key={company.id} className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
                          <h4 className="font-bold text-slate-800 mb-1 truncate">{company.company_name}</h4>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                              <MapPin size={12} />
                              {company.company_district}, {company.company_state}
                          </div>
                          <div className="flex justify-between items-center mt-2">
                              <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 truncate max-w-[120px]">
                                  {company.company_industry || 'Pelbagai'}
                              </span>
                              {renderApplyButton(company)}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari syarikat, industri, atau daerah..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
            <select 
                className="p-2 border border-slate-300 rounded-lg bg-white flex-1 md:w-40"
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
            >
                <option value="all">Semua Negeri</option>
                {MALAYSIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
            </select>

            <div className="relative">
                <ArrowUpDown className="absolute left-2 top-2.5 text-slate-400" size={16} />
                <select 
                    className="pl-8 p-2 border border-slate-300 rounded-lg bg-white flex-1 md:w-48 appearance-none"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                >
                    <option value="name_asc">Nama (A-Z)</option>
                    <option value="name_desc">Nama (Z-A)</option>
                    <option value="state_asc">Negeri (A-Z)</option>
                    <option value="state_desc">Negeri (Z-A)</option>
                </select>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {canBulkDelete && (
                    <th className="p-4 w-10 text-center">
                        <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={filteredAndSortedCompanies.length > 0 && selectedIds.length === filteredAndSortedCompanies.length}
                            onChange={handleSelectAll}
                        />
                    </th>
                )}
                <th className="p-4 font-semibold text-sm text-slate-600 w-1/4">Syarikat & Industri</th>
                <th className="p-4 font-semibold text-sm text-slate-600 w-1/4">Lokasi & Alamat</th>
                <th className="p-4 font-semibold text-sm text-slate-600 w-1/4">Hubungi</th>
                <th className="p-4 font-semibold text-sm text-slate-600 w-1/12 text-center">MoU/LOI</th>
                <th className="p-4 font-semibold text-sm text-slate-600 w-1/6 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedCompanies.length === 0 && (
                <tr>
                   <td colSpan={canBulkDelete ? 6 : 5} className="p-8 text-center text-slate-500">Tiada syarikat dijumpai.</td>
                </tr>
              )}
              {filteredAndSortedCompanies.map(company => (
                <tr key={company.id} className={`hover:bg-slate-50 transition-colors group ${selectedIds.includes(company.id) ? 'bg-blue-50' : ''}`}>
                  {canBulkDelete && (
                      <td className="p-4 align-top text-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedIds.includes(company.id)}
                            onChange={() => handleSelectOne(company.id)}
                          />
                      </td>
                  )}
                  <td className="p-4 align-top">
                    <div className="font-bold text-slate-800 text-base mb-1">{company.company_name}</div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit">
                      <Briefcase size={14} className="text-slate-500" />
                      {company.company_industry || 'Tidak dinyatakan'}
                    </div>
                  </td>
                  
                  <td className="p-4 align-top">
                    <div className="flex gap-2 mb-1">
                      <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                      <div className="text-sm text-slate-700">
                         {company.company_address ? (
                             <span className="whitespace-pre-line">{company.company_address}</span>
                         ) : (
                             <span className="italic text-red-400">Alamat tidak lengkap</span>
                         )}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-slate-500 pl-6 mt-1">
                        {company.company_district}, {company.company_state}
                    </div>
                  </td>

                  <td className="p-4 align-top">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                            <UserIcon size={14} className="text-blue-500" />
                            <span className="font-medium">{company.company_contact_person || <span className="text-slate-400 italic">Tiada Nama</span>}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail size={14} className="text-orange-500" />
                            <span className="truncate max-w-[150px]">{company.company_contact_email || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone size={14} className="text-green-500" />
                            <span>{company.company_contact_phone || '-'}</span>
                        </div>
                    </div>
                  </td>

                  <td className="p-4 align-top text-center">
                    {company.has_mou ? (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded border border-green-200">
                            ✓ {company.mou_type || 'MoU'}
                        </span>
                    ) : (
                        <span className="inline-block px-2 py-1 bg-slate-100 text-slate-400 text-xs rounded border border-slate-200">
                            Tiada
                        </span>
                    )}
                  </td>

                  <td className="p-4 align-top text-center">
                    <div className="flex justify-center gap-2 flex-wrap">
                        {renderApplyButton(company)}
                        
                         {canEditOrDelete && (
                            <>
                              <button 
                                  onClick={() => handleEditClick(company)}
                                  className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 border border-blue-100 transition-colors"
                                  title="Kemaskini Syarikat"
                              >
                                  <Edit size={16} />
                              </button>
                              <button 
                                  onClick={() => { if(confirm('Padam syarikat?')) onDeleteCompany(company.id); }}
                                  className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 border border-red-100 transition-colors"
                                  title="Padam Syarikat"
                              >
                                  <Trash2 size={16} />
                              </button>
                            </>
                        )}
                        {(currentUser.role === UserRole.COORDINATOR || currentUser.role === UserRole.LECTURER) && (
                            <>
                                <button
                                    onClick={() => generateLOI(company)}
                                    className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 border border-indigo-100 transition-colors"
                                    title="Papar/Cetak LOI"
                                >
                                    <FileText size={16} />
                                </button>
                                <button
                                    onClick={() => downloadLOIWord(company)}
                                    className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 border border-green-100 transition-colors"
                                    title="Export Word"
                                >
                                    <FileDown size={16} />
                                </button>
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

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Syarikat Baru">
          <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Syarikat</label>
                  <input required type="text" className="w-full p-2 border rounded" value={newCompany.company_name || ''} onChange={e => setNewCompany({...newCompany, company_name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Negeri</label>
                    <select className="w-full p-2 border rounded bg-white" value={newCompany.company_state} onChange={e => setNewCompany({...newCompany, company_state: e.target.value})}>
                        {MALAYSIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Daerah</label>
                    <input required type="text" className="w-full p-2 border rounded" value={newCompany.company_district || ''} onChange={e => setNewCompany({...newCompany, company_district: e.target.value})} />
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Penuh</label>
                  <textarea required className="w-full p-2 border rounded" rows={2} value={newCompany.company_address || ''} onChange={e => setNewCompany({...newCompany, company_address: e.target.value})} />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Industri</label>
                  <input required type="text" className="w-full p-2 border rounded" value={newCompany.company_industry || ''} onChange={e => setNewCompany({...newCompany, company_industry: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pegawai Dihubungi</label>
                    <input required type="text" className="w-full p-2 border rounded" value={newCompany.company_contact_person || ''} onChange={e => setNewCompany({...newCompany, company_contact_person: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                    <input required type="text" className="w-full p-2 border rounded" value={newCompany.company_contact_phone || ''} onChange={e => setNewCompany({...newCompany, company_contact_phone: e.target.value})} />
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input required type="email" className="w-full p-2 border rounded" value={newCompany.company_contact_email || ''} onChange={e => setNewCompany({...newCompany, company_contact_email: e.target.value})} />
              </div>
              <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="h-4 w-4 text-blue-600" checked={newCompany.has_mou} onChange={e => setNewCompany({...newCompany, has_mou: e.target.checked})} />
                      <span className="text-sm font-medium">Ada MoU / LOI?</span>
                  </label>
                  {newCompany.has_mou && (
                      <select className="p-1 border rounded text-sm bg-white" value={newCompany.mou_type} onChange={e => setNewCompany({...newCompany, mou_type: e.target.value as any})}>
                          <option value="MoU">MoU</option>
                          <option value="LOI">LOI</option>
                      </select>
                  )}
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 mt-4 transition-colors">Simpan</button>
          </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Kemaskini Syarikat">
          {editingCompany && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Syarikat</label>
                    <input required type="text" className="w-full p-2 border rounded bg-white text-slate-900" value={editingCompany.company_name} onChange={e => setEditingCompany({...editingCompany, company_name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Negeri</label>
                        <select className="w-full p-2 border rounded bg-white text-slate-900" value={editingCompany.company_state} onChange={e => setEditingCompany({...editingCompany, company_state: e.target.value})}>
                            {MALAYSIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Daerah</label>
                        <input required type="text" className="w-full p-2 border rounded bg-white text-slate-900" value={editingCompany.company_district} onChange={e => setEditingCompany({...editingCompany, company_district: e.target.value})} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Penuh</label>
                    <textarea required className="w-full p-2 border rounded bg-white text-slate-900" rows={2} value={editingCompany.company_address} onChange={e => setEditingCompany({...editingCompany, company_address: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Industri</label>
                    <input required type="text" className="w-full p-2 border rounded bg-white text-slate-900" value={editingCompany.company_industry} onChange={e => setEditingCompany({...editingCompany, company_industry: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pegawai Dihubungi</label>
                        <input required type="text" className="w-full p-2 border rounded bg-white text-slate-900" value={editingCompany.company_contact_person} onChange={e => setEditingCompany({...editingCompany, company_contact_person: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                        <input required type="text" className="w-full p-2 border rounded bg-white text-slate-900" value={editingCompany.company_contact_phone} onChange={e => setEditingCompany({...editingCompany, company_contact_phone: e.target.value})} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input required type="email" className="w-full p-2 border rounded bg-white text-slate-900" value={editingCompany.company_contact_email} onChange={e => setEditingCompany({...editingCompany, company_contact_email: e.target.value})} />
                </div>
                <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4 text-blue-600" checked={editingCompany.has_mou} onChange={e => setEditingCompany({...editingCompany, has_mou: e.target.checked})} />
                        <span className="text-sm font-medium text-slate-700">Ada MoU / LOI?</span>
                    </label>
                    {editingCompany.has_mou && (
                        <select className="p-1 border rounded text-sm bg-white text-slate-900" value={editingCompany.mou_type || 'MoU'} onChange={e => setEditingCompany({...editingCompany, mou_type: e.target.value as any})}>
                            <option value="MoU">MoU</option>
                            <option value="LOI">LOI</option>
                        </select>
                    )}
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 mt-4 transition-colors">Simpan Perubahan</button>
              </form>
          )}
      </Modal>

      <Modal 
        isOpen={!!confirmingCompany} 
        onClose={() => setConfirmingCompany(null)} 
        title="Pengesahan Permohonan"
      >
        <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <HelpCircle className="text-blue-600 shrink-0 mt-1" size={24} />
                <div>
                    <h4 className="font-bold text-slate-800">Mohon ke {confirmingCompany?.company_name}?</h4>
                    <p className="text-sm text-slate-600 mt-1">Permohonan anda akan dihantar kepada Penyelaras WBL untuk kelulusan.</p>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                    onClick={() => setConfirmingCompany(null)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                    Batal
                </button>
                <button 
                    onClick={handleConfirmApply}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                    Ya, Mohon
                </button>
            </div>
        </div>
      </Modal>
    </div>
  );
};
