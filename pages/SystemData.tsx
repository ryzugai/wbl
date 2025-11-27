
import React, { useRef, useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Download, Upload, AlertTriangle, Database, Cloud, Wifi, WifiOff, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SystemDataProps {
  onDataRestored: () => void;
}

export const SystemData: React.FC<SystemDataProps> = ({ onDataRestored }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCloudMode, setIsCloudMode] = useState(false);
  const [firebaseConfig, setFirebaseConfig] = useState('');

  useEffect(() => {
    setIsCloudMode(StorageService.isCloudEnabled());
  }, []);

  const handleSaveConfig = () => {
    try {
      // Allow user to paste the full JS object "const firebaseConfig = {...}" or just the JSON
      let jsonStr = firebaseConfig;
      if (jsonStr.includes('=')) {
        jsonStr = jsonStr.substring(jsonStr.indexOf('=') + 1);
        if (jsonStr.trim().endsWith(';')) jsonStr = jsonStr.trim().slice(0, -1);
      }
      
      // Fix common JS object notation to JSON (keys without quotes)
      // This is a simple heuristic
      const config = JSON.parse(jsonStr.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ').replace(/'/g, '"'));
      
      if (!config.apiKey || !config.projectId) {
        throw new Error('Config tidak lengkap');
      }

      StorageService.saveFirebaseConfig(config);
      toast.success('Konfigurasi disimpan! Refreshing...');
    } catch (e) {
      toast.error('Format konfigurasi tidak sah. Sila paste objek JSON yang betul.');
    }
  };

  const handleDisconnectCloud = () => {
    if (confirm('Adakah anda pasti mahu memutuskan sambungan Cloud?')) {
      StorageService.removeFirebaseConfig();
    }
  };

  const handleCloudMigration = async () => {
    if (!isCloudMode) return;
    if (!confirm('Ini akan memuat naik semua data Local Storage semasa ke Firebase Cloud. Teruskan?')) return;
    
    const loadingToast = toast.loading('Sedang memuat naik data...');
    try {
      await StorageService.uploadLocalToCloud();
      toast.success('Data berjaya dimuat naik ke Cloud!', { id: loadingToast });
    } catch (e) {
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
          toast.success('Data berjaya dipulihkan!');
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
      if(window.confirm('AMARAN: Memadam semua data local storage. Aplikasi akan reset.')) {
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
            <p className="text-slate-500">Uruskan sambungan Cloud dan sandaran data.</p>
        </div>
      </div>

      {/* CLOUD SYNC SECTION */}
      <div className={`p-6 rounded-xl border ${isCloudMode ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-lg ${isCloudMode ? 'bg-green-200 text-green-800' : 'bg-slate-100 text-slate-500'}`}>
            <Cloud size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Cloud Sync (Live Update)
              {isCloudMode && <span className="ml-3 text-xs bg-green-600 text-white px-2 py-1 rounded-full">AKTIF</span>}
            </h3>
            <p className="text-sm text-slate-600">
              Sambungkan ke Google Firebase untuk membolehkan live update antara semua peranti (Telefon ↔ Laptop).
            </p>
          </div>
        </div>

        {isCloudMode ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-700 font-medium p-3 bg-white rounded border border-green-100">
              <Wifi size={20} />
              Sistem bersambung ke Cloud Database.
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleCloudMigration}
                className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-bold"
              >
                Sync Data Tempatan ke Cloud
              </button>
              <button 
                onClick={handleDisconnectCloud}
                className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm font-bold"
              >
                Putuskan Sambungan
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 text-slate-600 text-sm rounded border border-slate-200">
              <p className="font-bold mb-1">Cara Mengaktifkan:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Buka <a href="https://console.firebase.google.com/" target="_blank" className="text-blue-600 underline">Firebase Console</a> dan buat projek baru (Percuma).</li>
                <li>Buat database <strong>Cloud Firestore</strong> (pilih Test Mode).</li>
                <li>Pergi ke Project Settings &gt; General &gt; "Your apps" &gt; Web app.</li>
                <li>Copy kod <code>firebaseConfig</code> dan paste di bawah.</li>
              </ol>
            </div>
            <textarea 
              value={firebaseConfig}
              onChange={(e) => setFirebaseConfig(e.target.value)}
              placeholder={`const firebaseConfig = {\n  apiKey: "...",\n  authDomain: "...",\n  projectId: "...",\n  ...\n};`}
              className="w-full h-32 p-3 font-mono text-xs border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={handleSaveConfig}
              className="w-full py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-bold flex items-center justify-center gap-2"
            >
              <Save size={18} /> Simpan & Sambung
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 my-6"></div>

      {/* OFFLINE BACKUP SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-75">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
            <Download size={18} /> Backup Manual (JSON)
          </h4>
          <p className="text-xs text-slate-500 mb-4">Simpan data sebagai fail backup fizikal.</p>
          <button onClick={handleBackup} className="w-full py-2 border border-blue-200 text-blue-700 rounded hover:bg-blue-50 text-sm font-bold">
            Muat Turun Backup
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
            <Upload size={18} /> Restore Manual
          </h4>
          <p className="text-xs text-slate-500 mb-4">Pulihkan data dari fail JSON.</p>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
          <button onClick={handleRestoreClick} className="w-full py-2 border border-green-200 text-green-700 rounded hover:bg-green-50 text-sm font-bold">
            Upload Fail Backup
          </button>
        </div>
      </div>

      <div className="mt-8 text-right">
        <button onClick={handleResetSystem} className="text-red-500 text-sm hover:underline flex items-center gap-1 ml-auto">
          <AlertTriangle size={14} /> Reset Sistem Sepenuhnya
        </button>
      </div>
    </div>
  );
};
