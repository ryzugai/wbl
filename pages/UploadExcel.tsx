
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { StorageService } from '../services/storage';
import { Company } from '../types';
import { Upload, FileSpreadsheet, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UploadExcelProps {
  onUploadSuccess: () => void;
  onNavigateToCompanies: () => void;
}

export const UploadExcel: React.FC<UploadExcelProps> = ({ onUploadSuccess, onNavigateToCompanies }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [summary, setSummary] = useState<{ success: number; failed: number } | null>(null);

  const findColumnValue = (row: any, possibleNames: string[]) => {
    for (let key in row) {
      const normalizedKey = key.trim().toLowerCase();
      for (let name of possibleNames) {
        const normalizedName = name.trim().toLowerCase();
        if (normalizedKey === normalizedName || normalizedKey.includes(normalizedName)) {
          const val = row[key];
          return (val !== undefined && val !== null) ? String(val).trim() : '';
        }
      }
    }
    return '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setLogs([]);
    setSummary(null);

    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const arrayBuffer = evt.target?.result as ArrayBuffer;
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        if (jsonData.length === 0) {
          toast.error("Fail Excel kosong.");
          setIsProcessing(false);
          return;
        }

        let successCount = 0;
        let failCount = 0;
        const newLogs: string[] = [];
        const validCompanies: Omit<Company, 'id'>[] = [];

        newLogs.push(`🚀 Menganalisis ${jsonData.length} baris...`);

        for (let i = 0; i < jsonData.length; i++) {
          const row: any = jsonData[i];
          const companyName = findColumnValue(row, ['Nama Syarikat', 'Company Name', 'Syarikat', 'Name']);
          
          if (!companyName) {
            failCount++;
            newLogs.push(`❌ Baris ${i + 2}: Nama syarikat tidak ditemui.`);
            continue;
          }

          const state = findColumnValue(row, ['Negeri', 'State', 'Region']);
          const district = findColumnValue(row, ['Daerah', 'District', 'Mukim']);
          const address = findColumnValue(row, ['Alamat', 'Address', 'Location']);
          const industry = findColumnValue(row, ['Industri', 'Industry', 'Sektor']);
          const contactPerson = findColumnValue(row, ['Pegawai', 'PIC', 'Contact Person']);
          const email = findColumnValue(row, ['Email', 'E-mail', 'Emel']);
          const phone = findColumnValue(row, ['Telefon', 'Phone', 'Tel', 'No. Tel']);
          const mouValue = findColumnValue(row, ['MoU', 'LOI', 'Agreement']);
          const historyValue = findColumnValue(row, ['Sejarah', 'History', 'Pernah', 'Previous', 'Alumni']);

          let hasMou = false;
          let mouType: 'MoU' | 'LOI' | undefined = undefined;
          
          if (mouValue) {
            const mouStr = String(mouValue).trim().toUpperCase();
            if (mouStr.includes('MOU') || mouStr === 'YA' || mouStr === 'YES') {
              hasMou = true;
              mouType = 'MoU';
            } else if (mouStr.includes('LOI')) {
              hasMou = true;
              mouType = 'LOI';
            }
          }

          let hasPrevious = false;
          if (historyValue) {
            const histStr = String(historyValue).trim().toUpperCase();
            if (histStr === 'YA' || histStr === 'YES' || histStr === 'TRUE' || histStr === 'PERNAH') {
              hasPrevious = true;
            }
          }

          // Fix: Added missing required property 'is_approved' to satisfy Omit<Company, 'id'> type definition
          const newCompany: Omit<Company, 'id'> = {
            company_name: companyName,
            company_state: state || "Melaka",
            company_district: district || "",
            company_address: address || "",
            company_industry: industry || "Perkhidmatan",
            company_contact_person: contactPerson || "",
            company_contact_email: email || "",
            company_contact_phone: phone || "",
            has_mou: hasMou,
            mou_type: hasMou ? (mouType || 'MoU') : null as any,
            has_previous_wbl_students: hasPrevious,
            is_approved: true,
            created_at: new Date().toISOString()
          };

          validCompanies.push(newCompany);
          successCount++;
        }

        if (validCompanies.length > 0) {
            newLogs.push(`⏳ Menyimpan ke Cloud...`);
            await StorageService.bulkCreateCompanies(validCompanies);
            newLogs.push(`✅ BERJAYA: ${successCount} syarikat disimpan.`);
            toast.success(`${successCount} syarikat berjaya ditambah!`);
            onUploadSuccess();
        } else {
            newLogs.push(`⚠️ Tiada data sah.`);
        }

        setLogs(newLogs);
        setSummary({ success: successCount, failed: failCount });

      } catch (error: any) {
        toast.error(`Ralat: ${error.message}`);
        setLogs(prev => [...prev, `🔴 RALAT: ${error.message}`]);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <FileSpreadsheet className="text-green-600" />
        Upload Excel Syarikat
      </h2>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-2xl">
        <div className="mb-6 bg-red-50 p-4 rounded-lg border border-red-100">
          <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
            <AlertCircle size={18} />
            PENTING: Masalah Kebenaran Firestore?
          </h4>
          <p className="text-sm text-red-700">
            Sila pastikan anda telah menetapkan peraturan pada tab Rules di pangkalan data Firestore kepada kod di bawah (Salin dan Tampal):
            <code className="block mt-2 bg-white p-2 rounded border font-mono text-xs">allow read, write: if true;</code>
          </p>
        </div>

        <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors relative ${isProcessing ? 'border-blue-300 bg-blue-50' : 'border-slate-300 hover:bg-slate-50'}`}>
          {!isProcessing && (
            <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          )}
          <div className="flex flex-col items-center gap-3">
            {isProcessing ? <Loader2 className="animate-spin text-blue-600" size={32} /> : <Upload size={32} className="text-slate-400" />}
            <div>
              <p className="font-bold text-slate-700">Pilih Fail Excel</p>
              <p className="text-xs text-slate-400 mt-1">Sistem menyokong .xlsx dan .xls</p>
            </div>
          </div>
        </div>

        {summary && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
                    <div className="text-2xl font-bold text-green-700">{summary.success}</div>
                    <div className="text-xs text-green-600">BERJAYA</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
                    <div className="text-2xl font-bold text-red-700">{summary.failed}</div>
                    <div className="text-xs text-green-600">GAGAL</div>
                </div>
            </div>
            <button 
                onClick={onNavigateToCompanies}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
                Lihat Senarai Syarikat <ArrowRight size={18} />
            </button>
          </div>
        )}

        {logs.length > 0 && (
          <div className="mt-6">
            <div className="bg-slate-900 text-green-400 p-4 rounded-lg text-[10px] font-mono h-40 overflow-y-auto">
              {logs.map((log, idx) => <div key={idx} className="mb-1">{log}</div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
