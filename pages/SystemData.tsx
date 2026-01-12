
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { Download, Upload, AlertTriangle, Database, Cloud, Wifi, Save, Globe, Smartphone, Image, ToggleLeft, ToggleRight, Loader2, Plus, Trash2, HardDrive, FileWarning, Activity, CheckCircle, RefreshCcw, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AdConfig, AdItem, User, Company, Application } from '../types';

interface SystemDataProps {
  onDataRestored: () => void;
  language: 'ms' | 'en';
}

export const SystemData: React.FC<SystemDataProps> = ({ onDataRestored, language }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCloudMode, setIsCloudMode] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  const [adConfig, setAdConfig] = useState<AdConfig>(StorageService.getAdConfig());
  const [isUpdatingAd, setIsUpdatingAd] = useState(false);

  useEffect(() => {
    setIsCloudMode(StorageService.isCloudEnabled());
    setUsers(StorageService.getUsers());
    setCompanies(StorageService.getCompanies());
    setApplications(StorageService.getApplications());

    const unsub = StorageService.subscribe(() => {
      setAdConfig(StorageService.getAdConfig());
      setUsers(StorageService.getUsers());
      setCompanies(StorageService.getCompanies());
      setApplications(StorageService.getApplications());
    });
    return () => unsub();
  }, []);

  const quotaStats = useMemo(() => {
    const totalRecords = users.length + companies.length + applications.length;
    const rawData = JSON.stringify({ users, companies, applications });
    const sizeInMB = (rawData.length / (1024 * 1024)).toFixed(2);
    
    const largeApps = applications.filter(app => {
        if (!app.reply_form_image) return false;
        return app.reply_form_image.length > 800000; 
    });

    return {
        totalRecords,
        sizeInMB,
        largeAppsCount: largeApps.length,
        status: parseFloat(sizeInMB) > 50 ? 'Amaran' : 'Sihat'
    };
  }, [users, companies, applications]);

  const handleRepairData = async () => {
    if (!confirm('Tindakan ini akan memaksa SEMUA syarikat di pangkalan data untuk menjadi "Aktif" secara pukal. Gunakan ini jika anda mendapati senarai syarikat tidak berpindah ke Senarai Aktif. Teruskan?')) return;
    setIsRepairing(true);
    const loadingToast = toast.loading('Memulihkan status syarikat...');
    try {
        await StorageService.repairCompanyData();
        toast.success('Selesai! Semua syarikat kini diletakkan dalam status Aktif.', { id: loadingToast });
        onDataRestored(); 
    } catch (e: any) {
        toast.error(`Ralat: ${e.message}`, { id: loadingToast });
    } finally {
        setIsRepairing(false);
    }
  };

  const handleResetToSamples = async () => {
    if (!confirm('Tindakan ini akan memadam pautan iklan semasa dan menggantikannya dengan Iklan Contoh yang sah dari server UTeM. Teruskan?')) return;
    
    const sampleItems: AdItem[] = [
        {
            id: 'sample-1',
            imageUrl: 'https://www.utem.edu.my/templates/yootheme/cache/a4/utem-25300x-a44e3a0d.png',
            destinationUrl: 'https://www.utem.edu.my'
        },
        {
            id: 'sample-2',
            imageUrl: 'https://www.utem.edu.my/images/utem/2024/Jan/WBL_Logo.png',
            destinationUrl: 'https://fptt.utem.edu.my'
        }
    ];

    const newConfig = {
        items: sampleItems,
        isEnabled: true
    };

    setIsUpdatingAd(true);
    try {
        await StorageService.updateAdConfig(newConfig);
        setAdConfig(newConfig);
        toast.success('Paparan iklan telah dipulihkan dengan contoh sah!');
    } catch (e: any) {
        toast.error(e.message);
    } finally {
        setIsUpdatingAd(false);
    }
  };

  const handleCloudMigration = async () => {
    if (!isCloudMode) {
        toast.error("Sistem tidak dapat berhubung ke Cloud");
        return;
    }
    if (!confirm('AMARAN: Ini akan menulis semula data di Cloud dengan data yang ada dalam browser ini sekarang. Pastikan data browser ini adalah yang terkini. Teruskan?')) return;
    
    const loadingToast = toast.loading('Sedang memuat naik data...');
    try {
      await StorageService.uploadLocalToCloud();
      toast.success('Sinkronisasi berjaya! Semua peranti kini dikemaskini.', { id: loadingToast });
    } catch (e) {
      console.error(e);
      toast.error('Gagal memuat naik data.', { id: loadingToast });
    }
  };

  const handleUpdateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingAd(true);
    try {
      const cleanItems = adConfig.items.filter(item => item.imageUrl.trim() !== '');
      await StorageService.updateAdConfig({ ...adConfig, items: cleanItems });
      toast.success('Sistem Iklan berjaya dikemaskini!');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsUpdatingAd(false);
    }
  };

  const addNewAdRow = () => {
    if (adConfig.items.length >= 50) {
      toast.error('Had maksimum 50 iklan sahaja.');
      return;
    }
    const newItem: AdItem = {
      id: Math.random().toString(36).substr(2, 9),
      imageUrl: '',
      destinationUrl: ''
    };
    setAdConfig({ ...adConfig, items: [...adConfig.items, newItem] });
  };

  const removeAdRow = (id: string) => {
    setAdConfig({ ...adConfig, items: adConfig.items.filter(item => item.id !== id) });
  };

  const updateAdItem = (id: string, field: keyof AdItem, value: string) => {
    const newItems = adConfig.items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setAdConfig({ ...adConfig, items: newItems });
  };

  const handleBackup = () => {
    const data = StorageService.getFullSystemBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wbl_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Fail sandaran berjaya dimuat turun');
  };

  const handleRestoreClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (window.confirm('Tindakan ini akan menggantikan data TEMPATAN. Teruskan?')) {
          StorageService.restoreFullSystem(json);
          toast.success('Data tempatan berjaya dipulihkan!');
          onDataRestored();
        }
      } catch (error) {
        toast.error('Format fail tidak sah.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetSystem = () => {
      if(window.confirm('AMARAN: Memadam semua data local storage (Cache). Data di Cloud tidak akan terpadam, tetapi anda perlu refresh untuk sync semula.')) {
          localStorage.clear();
          window.location.reload();
      }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Database className="text-blue-600" size={32} />
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Sistem & Data</h2>
            <p className="text-slate-500">Pengurusan pangkalan data dan sinkronisasi.</p>
        </div>
      </div>

      <div className="p-6 rounded-xl border bg-white border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Image size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Pengurusan Iklan Karusel & Poster</h3>
              <p className="text-xs text-slate-500">Iklan akan bertukar secara automatik setiap 10 saat (Maks 50).</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
              <button 
                onClick={handleResetToSamples}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 flex items-center gap-2 border border-indigo-200 transition-all active:scale-95"
              >
                  <Sparkles size={16} /> Aktifkan Poster Contoh
              </button>
              <div className={`flex items-center gap-4 p-2 rounded-xl border transition-all ${adConfig.isEnabled ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[10px] font-black ml-2 uppercase ${adConfig.isEnabled ? 'text-green-700' : 'text-slate-500'}`}>STATUS: {adConfig.isEnabled ? 'AKTIF' : 'MATI'}</span>
                  <button 
                    type="button"
                    onClick={() => setAdConfig({...adConfig, isEnabled: !adConfig.isEnabled})}
                    className={`p-1 rounded-full transition-colors ${adConfig.isEnabled ? 'text-green-600' : 'text-slate-400'}`}
                  >
                    {adConfig.isEnabled ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                  </button>
              </div>
          </div>
        </div>

        <form onSubmit={handleUpdateAd} className="space-y-6">
          <div className="space-y-4">
            {adConfig.items.length === 0 && (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <p className="text-sm text-slate-400 italic">Tiada iklan/poster disenaraikan.</p>
                </div>
            )}
            {adConfig.items.map((item, index) => (
              <div key={item.id} className="group relative grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_auto] items-end gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">URL Gambar (Mesti Pautan Terus Imej)</label>
                  <input 
                    type="url" 
                    placeholder="https://...image.jpg"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white outline-none text-sm"
                    value={item.imageUrl}
                    onChange={e => updateAdItem(item.id, 'imageUrl', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Pautan Destinasi (Tawaran Laman Web)</label>
                  <input 
                    type="url" 
                    placeholder="https://..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white outline-none text-sm"
                    value={item.destinationUrl}
                    onChange={e => updateAdItem(item.id, 'destinationUrl', e.target.value)}
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => removeAdRow(item.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <button type="button" onClick={addNewAdRow} className="px-6 py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg font-bold hover:bg-blue-50 flex items-center justify-center gap-2 transition-all"><Plus size={18} /> Tambah Slot Iklan</button>
            <button disabled={isUpdatingAd} type="submit" className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all disabled:bg-slate-400">{isUpdatingAd ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Simpan Tetapan Iklan</button>
          </div>
        </form>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                  <RefreshCcw size={24} className={isRepairing ? 'animate-spin' : ''} />
              </div>
              <div>
                  <h3 className="font-bold text-red-800">Pemulihan Data Syarikat (Pukal)</h3>
                  <p className="text-xs text-red-600">Klik butang ini jika syarikat yang diupload tidak muncul di "Senarai Aktif" atau butang lulus tidak memberi kesan.</p>
              </div>
          </div>
          <button 
            disabled={isRepairing}
            onClick={handleRepairData}
            className="w-full md:w-auto px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-md transition-all active:scale-95 disabled:bg-red-300 flex items-center justify-center gap-2"
          >
            {isRepairing ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
            Baiki & Aktifkan Semua Syarikat Sekarang
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl border bg-white border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Activity size={20} />
                </div>
                <h3 className="font-bold text-slate-800">Semakan Kuota & Kesihatan Sistem</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jumlah Rekod</p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-black text-slate-800">{quotaStats.totalRecords}</span>
                        <span className="text-[10px] text-slate-400 pb-1">entri</span>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saiz Pangkalan Data</p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-black text-slate-800">{quotaStats.sizeInMB}</span>
                        <span className="text-[10px] text-slate-400 pb-1">MB</span>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Kesihatan</p>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${quotaStats.status === 'Sihat' ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                        <span className={`text-sm font-bold ${quotaStats.status === 'Sihat' ? 'text-green-600' : 'text-yellow-600'}`}>{quotaStats.status}</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-6 rounded-2xl border bg-white border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <FileWarning size={20} />
                </div>
                <h3 className="font-bold text-slate-800">Amaran Saiz Fail</h3>
            </div>
            
            <div className="flex-1">
                {quotaStats.largeAppsCount > 0 ? (
                    <div className="space-y-3">
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-bold flex items-center gap-2">
                            <AlertTriangle size={14} />
                            {quotaStats.largeAppsCount} permohonan hampir mencapai had saiz!
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <CheckCircle size={32} className="text-green-500 mx-auto mb-2 opacity-20" />
                        <p className="text-xs text-slate-400">Semua saiz dokumen berada dalam julat selamat.</p>
                    </div>
                )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
                <button onClick={handleBackup} className="w-full py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                    <Download size={14} /> Backup Data Sekarang
                </button>
            </div>
        </div>
      </div>

      <div className="p-6 rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-white rounded-full shadow-sm text-blue-600">
            <Cloud size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              WBL Cloud Database
              {isCloudMode ? (
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full flex items-center gap-1">
                      <Wifi size={12} /> ONLINE
                  </span>
              ) : (
                  <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full flex items-center gap-1">
                      <Wifi size={12} /> OFFLINE
                  </span>
              )}
            </h3>
          </div>
        </div>

        {isCloudMode && (
          <div className="bg-white p-6 rounded-lg border border-blue-100">
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Upload size={18} className="text-blue-600" /> Migrasi Data Tempatan ke Cloud</h4>
            <p className="text-sm text-slate-600 mb-4">Gunakan butang ini jika anda baru selesai membaiki data secara tempatan dan ingin menolak data tersebut ke Cloud untuk pengguna lain.</p>
            <button onClick={handleCloudMigration} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95"><Globe size={18} /> Sync Sekarang</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80 hover:opacity-100 transition-opacity">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><Download size={18} /> Simpan Fail Backup</h4>
          <button onClick={handleBackup} className="w-full py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 text-sm font-medium">Muat Turun</button>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><Upload size={18} /> Import Fail Backup</h4>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
          <button onClick={handleRestoreClick} className="w-full py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 text-sm font-medium">Pilih Fail</button>
        </div>
      </div>

      <div className="mt-8 text-right">
        <button onClick={handleResetSystem} className="text-red-500 text-sm hover:underline flex items-center gap-1 ml-auto"><AlertTriangle size={14} /> Kosongkan Cache Browser</button>
      </div>
    </div>
  );
};
