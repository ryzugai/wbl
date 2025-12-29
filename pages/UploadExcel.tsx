
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { StorageService } from '../services/storage';
import { Company } from '../types';
import { Upload, FileSpreadsheet, AlertCircle, ArrowRight } from 'lucide-react';
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
        if (normalizedKey === name.toLowerCase() || normalizedKey.includes(name.toLowerCase())) {
          const val = row[key];
          return val !== undefined && val !== null ? String(val).trim() : '';
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
          toast.error("Fail Excel kosong atau format tidak betul");
          setIsProcessing(false);
          return;
        }

        let successCount = 0;
        let failCount = 0;
        const newLogs: string[] = [];
        const validCompanies: Omit<Company, 'id'>[] = [];

        newLogs.push(`Menganalisis ${jsonData.length} baris data...`);

        for (let i = 0; i < jsonData.length; i++) {
          const row: any = jsonData[i];
          
          const companyName = findColumnValue(row, ['Nama Syarikat', 'Company Name', 'Syarikat', 'Name', 'Organization']);
          
          if (!companyName) {
            failCount++;
            newLogs.push(`❌ Baris ${i + 2}: Nama syarikat tidak dijumpai`);
            continue;
          }

          const state = findColumnValue(row, ['Negeri', 'State']);
          const district = findColumnValue(row, ['Daerah', 'District', 'Mukim']);
          const address = findColumnValue(row, ['Alamat', 'Address', 'Lokasi', 'Location']);
          const industry = findColumnValue(row, ['Industri', 'Industry', 'Sektor']);
          const contactPerson = findColumnValue(row, ['Pegawai', 'PIC', 'Contact Person', 'Person']);
          const email = findColumnValue(row, ['Email', 'E-mail', 'Emel']);
          const phone = findColumnValue(row, ['Telefon', 'Phone', 'Tel', 'No. Tel']);
          const mouValue = findColumnValue(row, ['MoU', 'LOI', 'Agreement']);

          let hasMou = false;
          let mouType: 'MoU' | 'LOI' | undefined = undefined;
          
          if (mouValue) {
            const mouStr = String(mouValue).trim().toUpperCase();
            if (mouStr.includes('MOU') || mouStr.includes('YA') || mouStr.includes('YES')) {
              hasMou = true;
              mouType = 'MoU';
            } else if (mouStr.includes('LOI')) {
              hasMou = true;
              mouType = 'LOI';
            }
          }

          // Bina objek yang bersih tanpa nilai undefined
          const newCompany: Omit<Company, 'id'> = {
            company_name: companyName,
            company_state: state || "",
            company_district: district || "",
            company_address: address || "",
            company_industry: industry || "",
            company_contact_person: contactPerson || "",
            company_contact_email: email || "",
            company_contact_phone: phone || "",
            has_mou: hasMou,
            mou_type: hasMou ? (mouType || 'MoU') : undefined,
            created_at: new Date().toISOString()
          };

          validCompanies.push(newCompany);
          successCount++;
        }

        if (validCompanies.length > 0) {
            newLogs.push(`⏳ Menyimpan ${validCompanies.length} rekod...`);
            await StorageService.bulkCreateCompanies(validCompanies);
            newLogs.push(`🎉 DATA BERJAYA DISIMPAN!`);
            toast.success(`${successCount} syarikat berjaya ditambah!`);
            onUploadSuccess();
        }

        setLogs(newLogs);
        setSummary({ success: successCount, failed: failCount });

      } catch (error: any) {
        console.error(error);
        toast.error(`Ralat: ${error.message}`);
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
        Upload Data Syarikat
      </h2>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-2xl">
        <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
            <AlertCircle size={18} />
            Panduan Format Excel
          </h4>
          <p className="text-sm text-blue-700">Sistem akan mengesan kolum secara automatik (Nama Syarikat, Alamat, Pegawai, dll).</p>
        </div>

        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative">
          <input 
            type="file" 
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
               {isProcessing ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div> : <Upload size={24} />}
            </div>
            <div>
              <p className="font-medium text-slate-700">Klik untuk upload fail Excel</p>
            </div>
          </div>
        </div>

        {summary && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <div className="text-2xl font-bold text-green-700">{summary.success}</div>
                    <div className="text-xs font-bold uppercase">Berjaya</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <div className="text-2xl font-bold text-red-700">{summary.failed}</div>
                    <div className="text-xs font-bold uppercase">Gagal</div>
                </div>
            </div>
            <button 
                onClick={onNavigateToCompanies}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
                Lihat Syarikat <ArrowRight size={18} />
            </button>
          </div>
        )}

        {logs.length > 0 && (
          <div className="mt-6">
            <div className="bg-slate-900 text-green-400 p-4 rounded-lg text-xs font-mono h-40 overflow-y-auto">
              {logs.map((log, idx) => <div key={idx}>{log}</div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
