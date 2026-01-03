
import React, { useState, useRef } from 'react';
import { Application, User, UserRole, Company } from '../types';
import { Modal } from '../components/Modal';
import { generateLetter } from '../utils/letterGenerator';
import { FileCheck, FileX, Printer, UserPlus, Upload, Eye, RefreshCcw, AlertTriangle, FileText, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Language, t } from '../translations';

interface ApplicationsProps {
  currentUser: User;
  applications: Application[];
  users: User[];
  companies: Company[];
  onUpdateApplication: (app: Application) => Promise<void>;
  language: Language;
}

export const Applications: React.FC<ApplicationsProps> = ({ currentUser, applications, users, companies, onUpdateApplication, language }) => {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [modalType, setModalType] = useState<'supervisor' | 'upload' | 'viewReply' | 'letter' | 'statusConfirm' | 'viewPdf' | null>(null);
  const [statusConfirmData, setStatusConfirmData] = useState<{ app: Application; newStatus: any } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const hasSystemAccess = currentUser.role === UserRole.COORDINATOR || currentUser.is_jkwbl;

  const filteredApps = applications.filter(app => {
    if (currentUser.role === UserRole.STUDENT) return app.created_by === currentUser.username;
    if (currentUser.role === UserRole.TRAINER || currentUser.role === UserRole.SUPERVISOR) return app.company_name === currentUser.company_affiliation;
    return true;
  });

  const handleConfirmStatusChange = async () => {
    if (!statusConfirmData) return;
    await onUpdateApplication({ ...statusConfirmData.app, application_status: statusConfirmData.newStatus });
    setModalType(null);
    setStatusConfirmData(null);
    toast.success(language === 'ms' ? 'Status dikemaskini' : 'Status updated');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedApp) return;

    // Validation: Saiz tidak lebih 20MB
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      toast.error(t(language, 'appFileTooLarge'));
      return;
    }

    // Validation: Mesti PDF
    if (file.type !== 'application/pdf') {
      toast.error(t(language, 'appInvalidFormat'));
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const base64String = evt.target?.result as string;
        
        // Simpan data dalam application object
        await onUpdateApplication({
          ...selectedApp,
          reply_form_image: base64String, // Kita guna field sedia ada untuk simpan PDF data
          reply_form_uploaded_at: new Date().toISOString(),
          reply_form_verified: false
        });

        toast.success(t(language, 'appUploadSuccess'));
        setModalType(null);
      } catch (err) {
        toast.error("Gagal menyimpan fail.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVerifyBorang = async (app: Application) => {
    try {
      await onUpdateApplication({
        ...app,
        reply_form_verified: true,
        reply_form_verified_by: currentUser.name,
        reply_form_verified_at: new Date().toISOString()
      });
      toast.success(language === 'ms' ? "Borang disahkan!" : "Form verified!");
      setModalType(null);
    } catch (err) {
      toast.error("Gagal mengesahkan borang.");
    }
  };

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">{t(language, 'appTitle')}</h2>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="p-4 font-semibold text-sm text-slate-600">{t(language, 'appStudent')}</th>
                    <th className="p-4 font-semibold text-sm text-slate-600">{t(language, 'appCompany')}</th>
                    <th className="p-4 font-semibold text-sm text-slate-600">{t(language, 'status')}</th>
                    <th className="p-4 font-semibold text-sm text-slate-600">Borang Jawapan</th>
                    <th className="p-4 font-semibold text-sm text-slate-600 text-center">{t(language, 'actions')}</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filteredApps.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">{t(language, 'noRecords')}</td></tr>
                )}
                {filteredApps.map(app => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                        <div className="font-medium text-slate-900">{app.student_name}</div>
                        <div className="text-xs text-slate-500">{app.student_id}</div>
                    </td>
                    <td className="p-4">
                        <div className="text-slate-900">{app.company_name}</div>
                        <div className="text-xs text-slate-500">{app.company_state}</div>
                    </td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        app.application_status === 'Diluluskan' ? 'bg-green-100 text-green-700' :
                        app.application_status === 'Ditolak' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {app.application_status}
                        </span>
                    </td>
                    <td className="p-4">
                        {app.reply_form_image ? (
                            <div className="flex items-center gap-2">
                                {app.reply_form_verified ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                        <CheckCircle size={10} /> DISAHKAN
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                        <Clock size={10} /> MENUNGGU
                                    </span>
                                )}
                                <button 
                                    onClick={() => { setSelectedApp(app); setModalType('viewPdf'); }}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                    title="Lihat PDF"
                                >
                                    <Eye size={16} />
                                </button>
                            </div>
                        ) : (
                            <span className="text-[10px] font-bold text-slate-400 uppercase">TIADA FAIL</span>
                        )}
                    </td>
                    <td className="p-4">
                        <div className="flex justify-center gap-2">
                        {/* Lulus/Tolak Permohonan (Coordinator Only) */}
                        {(hasSystemAccess || currentUser.role === UserRole.LECTURER) && app.application_status === 'Menunggu' && (
                            <>
                                <button 
                                  onClick={() => { setStatusConfirmData({app, newStatus: 'Diluluskan'}); setModalType('statusConfirm'); }} 
                                  className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                                  title={language === 'ms' ? "Luluskan Permohonan" : "Approve Application"}
                                >
                                  <FileCheck size={18} />
                                </button>
                                <button 
                                  onClick={() => { setStatusConfirmData({app, newStatus: 'Ditolak'}); setModalType('statusConfirm'); }} 
                                  className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                  title={language === 'ms' ? "Tolak Permohonan" : "Reject Application"}
                                >
                                  <FileX size={18} />
                                </button>
                            </>
                        )}
                        
                        {/* Student Actions */}
                        {currentUser.role === UserRole.STUDENT && (
                            <>
                                <button 
                                  onClick={() => { setSelectedApp(app); setModalType('letter'); }} 
                                  className="p-2 bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition-colors" 
                                  title={t(language, 'appJanaSurat')}
                                >
                                    <Printer size={18} />
                                </button>
                                {app.application_status === 'Diluluskan' && (
                                    <button 
                                        onClick={() => { setSelectedApp(app); setModalType('upload'); }}
                                        className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                        title={t(language, 'appHantarBorang')}
                                    >
                                        <Upload size={18} />
                                    </button>
                                )}
                            </>
                        )}

                        {/* Coordinator Verification Action */}
                        {hasSystemAccess && app.reply_form_image && !app.reply_form_verified && (
                             <button 
                                onClick={() => { setSelectedApp(app); setModalType('viewPdf'); }}
                                className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                                title="Sahkan Borang Jawapan"
                            >
                                <FileCheck size={18} />
                            </button>
                        )}
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>

        {/* MODAL: PENGESAHAN STATUS */}
        <Modal isOpen={modalType === 'statusConfirm'} onClose={() => setModalType(null)} title={language === 'ms' ? 'Pengesahan Status' : 'Status Confirmation'}>
            <div className="space-y-4">
                <p>{language === 'ms' ? `Tukar status permohonan kepada ${statusConfirmData?.newStatus}?` : `Change application status to ${statusConfirmData?.newStatus}?`}</p>
                <div className="flex gap-2">
                    <button onClick={() => setModalType(null)} className="flex-1 p-2 border rounded">{t(language, 'cancel')}</button>
                    <button onClick={handleConfirmStatusChange} className="flex-1 p-2 bg-blue-600 text-white rounded font-bold">{t(language, 'confirm')}</button>
                </div>
            </div>
        </Modal>

        {/* MODAL: JANA SURAT */}
        <Modal isOpen={modalType === 'letter'} onClose={() => setModalType(null)} title={t(language, 'appJanaSurat')}>
            <div className="space-y-4 text-center">
                <p>{language === 'ms' ? 'Jana surat rasmi untuk penempatan ini?' : 'Generate official letter for this placement?'}</p>
                <button onClick={() => { 
                    const comp = companies.find(c => c.company_name === selectedApp?.company_name);
                    if(selectedApp) generateLetter(selectedApp, comp, currentUser, language); 
                    setModalType(null); 
                }} className="w-full p-2 bg-blue-600 text-white rounded font-bold">{t(language, 'confirm')}</button>
            </div>
        </Modal>

        {/* MODAL: MUAT NAIK PDF */}
        <Modal isOpen={modalType === 'upload'} onClose={() => setModalType(null)} title={t(language, 'appHantarBorang')}>
            <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-blue-800 text-sm mb-1">Arahan Muat Naik</h4>
                    <ul className="text-xs text-blue-600 space-y-1 list-disc pl-4">
                        <li>Pastikan fail dalam format **PDF**.</li>
                        <li>Saiz fail tidak melebihi **20MB**.</li>
                        <li>Pastikan tandatangan dan cop industri jelas dalam dokumen.</li>
                    </ul>
                </div>

                <div 
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                        isUploading ? 'bg-slate-50 border-slate-200 opacity-50' : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="application/pdf" 
                        className="hidden" 
                    />
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-white rounded-full shadow-sm text-blue-600">
                            <Upload size={32} />
                        </div>
                        <div>
                            <p className="font-bold text-slate-700">Pilih Fail PDF</p>
                            <p className="text-xs text-slate-400 mt-1">Atau tarik fail ke sini (Maks 20MB)</p>
                        </div>
                    </div>
                </div>

                {isUploading && (
                    <div className="text-center">
                        <RefreshCcw className="animate-spin mx-auto text-blue-600 mb-2" />
                        <p className="text-xs font-bold text-blue-600 animate-pulse">Sedang memuat naik...</p>
                    </div>
                )}

                <button 
                    onClick={() => setModalType(null)} 
                    className="w-full py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"
                >
                    {t(language, 'cancel')}
                </button>
            </div>
        </Modal>

        {/* MODAL: LIHAT & SAHKAN PDF */}
        <Modal isOpen={modalType === 'viewPdf'} onClose={() => setModalType(null)} title="Semakan Borang Jawapan PDF">
            <div className="space-y-6">
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative" style={{ height: '500px' }}>
                    {selectedApp?.reply_form_image ? (
                        <iframe 
                            src={selectedApp.reply_form_image} 
                            className="w-full h-full"
                            title="PDF Preview"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 italic">Fail tidak ditemui.</div>
                    )}
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                    {hasSystemAccess && !selectedApp?.reply_form_verified && (
                        <button 
                            onClick={() => selectedApp && handleVerifyBorang(selectedApp)}
                            className="flex-1 py-4 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg shadow-green-100"
                        >
                            <FileCheck size={20} /> Sahkan Borang Pelajar
                        </button>
                    )}
                    <button 
                        onClick={() => {
                            if (selectedApp?.reply_form_image) {
                                const link = document.createElement('a');
                                link.href = selectedApp.reply_form_image;
                                link.download = `Borang_Jawapan_${selectedApp.student_id}.pdf`;
                                link.click();
                            }
                        }}
                        className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100"
                    >
                        <Printer size={20} /> Simpan / Cetak
                    </button>
                </div>
                
                {selectedApp?.reply_form_verified && (
                    <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-3">
                        <CheckCircle size={20} className="text-green-600" />
                        <div>
                            <p className="text-[11px] font-bold text-green-800 uppercase">Dokumen Telah Disahkan</p>
                            <p className="text-[10px] text-green-600 italic">Disahkan oleh: {selectedApp.reply_form_verified_by} pada {selectedApp.reply_form_verified_at ? new Date(selectedApp.reply_form_verified_at).toLocaleString() : '-'}</p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    </div>
  );
};
