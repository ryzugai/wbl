
import React, { useRef } from 'react';
import { StorageService } from '../services/storage';
import { Download, Upload, AlertTriangle, Database } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SystemDataProps {
  onDataRestored: () => void;
}

export const SystemData: React.FC<SystemDataProps> = ({ onDataRestored }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (window.confirm('AMARAN: Tindakan ini akan menggantikan SEMUA data semasa dengan data dari fail sandaran. Teruskan?')) {
          StorageService.restoreFullSystem(json);
          toast.success('Data berjaya dipulihkan!');
          onDataRestored();
        }
      } catch (error) {
        toast.error('Gagal memulihkan data. Format fail tidak sah.');
        console.error(error);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleResetSystem = () => {
      if(window.confirm('ADAKAH ANDA PASTI? Ini akan memadam SEMUA data (Syarikat, Pelajar, Permohonan) dari browser ini. Tindakan ini tidak boleh dikembalikan.')) {
          localStorage.clear();
          window.location.reload();
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Database className="text-blue-600" size={32} />
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Sistem & Data</h2>
            <p className="text-slate-500">Uruskan pemindahan data antara browser (Chrome ↔ Firefox) dan sandaran.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center text-blue-600 mb-4">
            <Download size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">1. Buat Sandaran (Backup)</h3>
          <p className="text-sm text-slate-600 mb-6">
            Muat turun semua data sistem (Syarikat, Pelajar, Permohonan) ke dalam satu fail JSON. 
            Gunakan fail ini untuk memindahkan data ke komputer atau browser lain (contoh: Chrome ke Firefox).
          </p>
          <button 
            onClick={handleBackup}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download size={18} /> Muat Turun Data
          </button>
        </div>

        {/* Restore Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center text-green-600 mb-4">
            <Upload size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">2. Pulihkan Data (Restore)</h3>
          <p className="text-sm text-slate-600 mb-6">
            Muat naik fail sandaran (.json) untuk menyegerakkan data di browser ini. 
            <span className="text-red-500 font-bold block mt-1">Amaran: Data semasa akan digantikan.</span>
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />
          <button 
            onClick={handleRestoreClick}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Upload size={18} /> Upload Fail Sandaran
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-8 border-t border-slate-200 pt-8">
        <h3 className="text-red-600 font-bold flex items-center gap-2 mb-4">
            <AlertTriangle size={20} />
            Zon Bahaya
        </h3>
        <div className="bg-red-50 border border-red-100 p-6 rounded-xl flex items-center justify-between">
            <div>
                <h4 className="font-bold text-red-800">Reset Sistem Sepenuhnya</h4>
                <p className="text-sm text-red-600 mt-1">Memadam semua data local storage. Aplikasi akan kembali seperti baru.</p>
            </div>
            <button 
                onClick={handleResetSystem}
                className="px-4 py-2 bg-white border border-red-200 text-red-600 font-bold rounded hover:bg-red-100 transition-colors"
            >
                Reset Data
            </button>
        </div>
      </div>
    </div>
  );
};
