
import React, { useRef, useState } from 'react';
import { StorageService } from '../services/storage';
import { Download, Upload, AlertTriangle, Database, Copy, ClipboardCheck, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SystemDataProps {
  onDataRestored: () => void;
}

export const SystemData: React.FC<SystemDataProps> = ({ onDataRestored }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteData, setPasteData] = useState('');

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

  const handleCopyClipboard = async () => {
    const data = StorageService.getFullSystemBackup();
    const jsonString = JSON.stringify(data);
    try {
        await navigator.clipboard.writeText(jsonString);
        toast.success('Data disalin ke clipboard! Sila paste di browser lain.');
    } catch (err) {
        toast.error('Gagal menyalin. Sila guna butang Muat Turun.');
    }
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

  const handlePasteRestore = () => {
      if(!pasteData) return;
      try {
        const json = JSON.parse(pasteData);
        if (window.confirm('AMARAN: Data dari text area akan menggantikan data semasa. Teruskan?')) {
            StorageService.restoreFullSystem(json);
            toast.success('Sync berjaya!');
            setPasteData('');
            onDataRestored();
        }
      } catch (e) {
          toast.error('Format data tidak sah.');
      }
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center text-blue-600 mb-4">
            <Download size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">1. Eksport Data (Simpan)</h3>
          <p className="text-sm text-slate-600 mb-6">
            Pilih cara untuk menyimpan data anda dari browser ini.
          </p>
          <div className="space-y-3">
            <button 
                onClick={handleBackup}
                className="w-full py-3 bg-white border border-blue-200 text-blue-700 rounded-lg font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
                <Download size={18} /> Muat Turun Fail (.json)
            </button>
            <button 
                onClick={handleCopyClipboard}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
                <Copy size={18} /> Copy Data ke Clipboard
            </button>
          </div>
        </div>

        {/* Restore Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center text-green-600 mb-4">
            <RefreshCw size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">2. Import Data (Sync)</h3>
          <p className="text-sm text-slate-600 mb-6">
            Masukkan data dari browser lain ke sini. <span className="text-red-500 font-bold">Data semasa akan diganti.</span>
          </p>
          
          <div className="space-y-4">
            <button 
                onClick={handleRestoreClick}
                className="w-full py-3 bg-white border border-green-200 text-green-700 rounded-lg font-bold hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
            >
                <Upload size={18} /> Upload Fail Sandaran
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
            />
            
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500">ATAU PASTE MANUAL</span>
                </div>
            </div>

            <div className="flex gap-2">
                <textarea 
                    className="flex-1 p-2 border rounded text-xs font-mono h-12 resize-none"
                    placeholder="Paste kod JSON di sini..."
                    value={pasteData}
                    onChange={(e) => setPasteData(e.target.value)}
                />
                <button 
                    onClick={handlePasteRestore}
                    disabled={!pasteData}
                    className="px-4 bg-green-600 text-white rounded font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Sync
                </button>
            </div>
          </div>
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
