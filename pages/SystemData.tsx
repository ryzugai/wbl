
import React, { useRef, useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Download, Upload, AlertTriangle, Database, Cloud, Wifi, Save, Globe, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SystemDataProps {
  onDataRestored: () => void;
}

export const SystemData: React.FC<SystemDataProps> = ({ onDataRestored }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCloudMode, setIsCloudMode] = useState(false);

  useEffect(() => {
    setIsCloudMode(StorageService.isCloudEnabled());
  }, []);

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

  // Backup/Restore Logic
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
          toast.success('Data tempatan berjaya dipulihkan! Sila klik "Sync ke Cloud" untuk update server.');
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

      {/* CLOUD STATUS SECTION */}
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
            <p className="text-sm text-slate-600 mt-1">
              {isCloudMode 
                ? "Sistem terhubung secara langsung. Data disegerakkan secara automatik antara semua peranti (Telefon & Komputer)." 
                : "Sistem sedang berjalan dalam mod offline. Sila periksa sambungan internet anda."}
            </p>
          </div>
        </div>

        {isCloudMode && (
          <div className="bg-white p-6 rounded-lg border border-blue-100">
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Upload size={18} className="text-blue-600" />
                Migrasi Data Tempatan
            </h4>
            <p className="text-sm text-slate-600 mb-4">
                Jika anda baru mengimport data melalui Excel atau fail Backup, data tersebut masih berada di browser ini sahaja. 
                Tekan butang di bawah untuk memuat naik data tersebut ke Cloud supaya ia boleh dilihat oleh pengguna lain.
            </p>
            
            <div className="flex gap-4 items-center">
                <button 
                    onClick={handleCloudMigration}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95"
                >
                    <Globe size={18} /> Sync Data Tempatan ke Cloud
                </button>
                <div className="text-xs text-slate-400 hidden md:block">
                    <Smartphone size={14} className="inline mr-1" /> 
                    Data akan tersedia di semua peranti
                </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 my-6"></div>

      {/* BACKUP SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80 hover:opacity-100 transition-opacity">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
            <Download size={18} /> Simpan Fail Backup
          </h4>
          <p className="text-xs text-slate-500 mb-4">Muat turun salinan data sebagai fail JSON untuk simpanan peribadi.</p>
          <button onClick={handleBackup} className="w-full py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 text-sm font-medium">
            Muat Turun
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
            <Upload size={18} /> Import Fail Backup
          </h4>
          <p className="text-xs text-slate-500 mb-4">Masukkan data lama dari fail JSON ke dalam sistem ini.</p>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
          <button onClick={handleRestoreClick} className="w-full py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 text-sm font-medium">
            Pilih Fail
          </button>
        </div>
      </div>

      <div className="mt-8 text-right">
        <button onClick={handleResetSystem} className="text-red-500 text-sm hover:underline flex items-center gap-1 ml-auto">
          <AlertTriangle size={14} /> Kosongkan Cache Browser
        </button>
      </div>
    </div>
  );
};
