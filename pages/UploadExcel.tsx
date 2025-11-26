
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { StorageService } from '../services/storage';
import { Company } from '../types';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
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
        // Strict check or Includes check
        if (normalizedKey === name.toLowerCase() || normalizedKey.includes(name.toLowerCase())) {
          const val = row[key];
          return val ? String(val).trim() : '';
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
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast.error("Fail Excel kosong atau format tidak betul");
          setIsProcessing(false);
          return;
        }

        let successCount = 0;
        let failCount = 0;
        const newLogs: string[] = [];

        newLogs.push(`Dijumpai ${data.length} baris data...`);

        // We process sequentially to avoid race conditions with LocalStorage
        for (let i = 0; i < data.length; i++) {
          const row: any = data[i];
          
          const companyName = findColumnValue(row, ['Nama Syarikat', 'Company Name', 'Syarikat', 'Name', 'Nama Organisasi', 'Organization']);
          
          if (!companyName) {
            failCount++;
            newLogs.push(`❌ Baris ${i + 2}: Nama syarikat tidak dijumpai`);
            continue;
          }

          // Enhanced matching for requested fields with broader keywords
          const state = findColumnValue(row, ['Negeri', 'State']);
          const district = findColumnValue(row, ['Daerah', 'District', 'Mukim', 'Wilayah']);
          
          // Capturing Full Address
          const address = findColumnValue(row, [
              'Alamat Penuh', 'Alamat Syarikat', 'Alamat', 'Address', 
              'Lokasi', 'Location', 'Premis', 'Pejabat', 'Postal Address', 'Tempat'
          ]);
          
          const industry = findColumnValue(row, ['Industri', 'Industry', 'Sektor', 'Bidang']);
          
          // Capturing Responsible Officer (Pegawai)
          const contactPerson = findColumnValue(row, [
              'Nama Pegawai', 'Pegawai', 'Contact Person', 'Person In Charge', 'PIC', 
              'Officer', 'Penyelia', 'Supervisor', 'Coordinator', 'Staff', 'Hubungi', 'Person'
          ]);
          
          // Capturing Email
          const email = findColumnValue(row, [
              'Email', 'E-mail', 'Emel', 'Mel', 'Alamat Email', 'Email Address', 'Mail'
          ]);
          
          // Capturing Phone
          const phone = findColumnValue(row, [
              'Telefon', 'Phone', 'Tel', 'No Tel', 'No. Tel', 'Mobile', 
              'Bimbit', 'Handphone', 'H/P', 'Office', 'Pejabat', 'Call'
          ]);
          
          const mouValue = findColumnValue(row, [
              'MoU', 'LOI', 'MoA', 'Status', 'Perjanjian', 'Agreement', 'Kerjasama', 'Jenis'
          ]);

          let hasMou = false;
          let mouType: 'MoU' | 'LOI' | undefined = undefined;
          
          if (mouValue) {
            const mouStr = String(mouValue).trim().toUpperCase();
            if (mouStr.includes('MOU') || mouStr.includes('MEMORANDUM') || mouStr.includes('MOA')) {
              hasMou = true;
              mouType = 'MoU';
            } else if (mouStr.includes('LOI') || mouStr.includes('INTENT') || mouStr.includes('LETTER')) {
              hasMou = true;
              mouType = 'LOI';
            } else if (['YA', 'YES', 'ADA', 'TRUE', '1', 'AKTIF', 'ACTIVE'].includes(mouStr)) {
              hasMou = true;
              mouType = 'MoU';
            }
          }

          const newCompany: Omit<Company, 'id'> = {
            company_name: companyName,
            company_state: state,
            company_district: district,
            company_address: address, // Full address captured
            company_industry: industry,
            company_contact_person: contactPerson, // Officer captured
            company_contact_email: email, // Email captured
            company_contact_phone: phone, // Phone captured
            has_mou: hasMou,
            mou_type: mouType,
            created_at: new Date().toISOString()
          };

          try {
             await StorageService.createCompany(newCompany);
             successCount++;
             const details = [
                 address ? 'Alamat' : '', 
                 contactPerson ? 'PIC' : '', 
                 email ? 'Email' : '', 
                 phone ? 'Tel' : ''
             ].filter(Boolean).join(', ');
             
             newLogs.push(`✅ Berjaya: ${newCompany.company_name} [${details || 'Nama shj'}]`);
          } catch (error) {
             failCount++;
             newLogs.push(`⚠️ Gagal (${newCompany.company_name}): ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        setLogs(newLogs);
        setSummary({ success: successCount, failed: failCount });
        
        if (successCount > 0) {
          toast.success(`${successCount} syarikat berjaya ditambah!`);
          // Trigger data refresh in parent
          onUploadSuccess();
        } else {
          toast.error("Tiada syarikat berjaya ditambah.");
        }

      } catch (error) {
        console.error(error);
        toast.error("Ralat memproses fail Excel");
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
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
          <p className="text-sm text-blue-700 mb-2">Pastikan fail Excel anda mempunyai header yang jelas. Sistem akan cuba mengesan kolum berikut secara automatik:</p>
          <ul className="list-disc list-inside text-sm text-blue-600 space-y-1 ml-2">
            <li><strong>Nama Syarikat</strong> (Wajib)</li>
            <li><strong>Alamat Penuh</strong> (Alamat / Lokasi)</li>
            <li><strong>Nama Pegawai</strong> (PIC / Penyelia / Officer)</li>
            <li><strong>Email</strong> (Emel / Mel)</li>
            <li><strong>Telefon</strong> (No. Tel / Bimbit / Pejabat)</li>
            <li><strong>Status MoU/MoA</strong> (Ya/Tidak atau MoU/LOI)</li>
          </ul>
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
              <p className="text-xs text-slate-500 mt-1">Format .xlsx atau .xls sahaja</p>
            </div>
          </div>
        </div>

        {summary && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
                    <div className="text-2xl font-bold text-green-700">{summary.success}</div>
                    <div className="text-xs font-bold text-green-600 uppercase">Berjaya</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
                    <div className="text-2xl font-bold text-red-700">{summary.failed}</div>
                    <div className="text-xs font-bold text-red-600 uppercase">Gagal</div>
                </div>
            </div>

            {summary.success > 0 && (
                <button 
                    onClick={onNavigateToCompanies}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    Lihat Senarai Syarikat <ArrowRight size={18} />
                </button>
            )}
          </div>
        )}

        {logs.length > 0 && (
          <div className="mt-6">
            <h4 className="font-bold text-slate-700 mb-2 text-sm">Log Proses:</h4>
            <div className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs font-mono h-48 overflow-y-auto space-y-1">
              {logs.map((log, idx) => (
                <div key={idx} className={log.includes('❌') || log.includes('⚠️') ? 'text-red-400' : 'text-green-400'}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
