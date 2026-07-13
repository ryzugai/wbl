
import React, { useState, useRef } from 'react';
import { Application, User, UserRole, Company } from '../types';
import { Modal } from '../components/Modal';
import { generateLetter } from '../utils/letterGenerator';
import { FileCheck, FileX, Printer, UserPlus, Upload, Eye, RefreshCcw, AlertTriangle, FileText, CheckCircle, Clock, Trash2, X, CheckCircle2, CheckSquare, Square, Star, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Language, t } from '../translations';

interface ApplicationsProps {
  currentUser: User;
  applications: Application[];
  users: User[];
  companies: Company[];
  onUpdateApplication: (app: Application) => Promise<void>;
  onDeleteApplication?: (id: string) => Promise<void>;
  language: Language;
}

export const Applications: React.FC<ApplicationsProps> = ({ currentUser, applications, users, companies, onUpdateApplication, onDeleteApplication, language }) => {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [modalType, setModalType] = useState<'supervisor' | 'upload' | 'viewReply' | 'letter' | 'statusConfirm' | 'viewPdf' | 'cancelConfirm' | null>(null);
  const [statusConfirmData, setStatusConfirmData] = useState<{ app: Application; newStatus: any } | null>(null);
  
  // States and refs for dual upload/tick functionality
  const replyFormInputRef = useRef<HTMLInputElement>(null);
  const offerLetterInputRef = useRef<HTMLInputElement>(null);
  const [tempReplyFormImage, setTempReplyFormImage] = useState<string | undefined>('');
  const [tempOfferLetterImage, setTempOfferLetterImage] = useState<string | undefined>('');
  const [replyFormTick, setReplyFormTick] = useState(false);
  const [offerLetterTick, setOfferLetterTick] = useState(false);
  const [isUploadingReply, setIsUploadingReply] = useState(false);
  const [isUploadingOffer, setIsUploadingOffer] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<'reply' | 'offer'>('reply');

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

  const handleCancelApplication = async () => {
    if (!selectedApp || !onDeleteApplication) return;
    await onDeleteApplication(selectedApp.id);
    setModalType(null);
    setSelectedApp(null);
  };

  const openUploadModal = (app: Application) => {
    setSelectedApp(app);
    setTempReplyFormImage(app.reply_form_image || '');
    setTempOfferLetterImage(app.offer_letter_image || '');
    setReplyFormTick(!!app.reply_form_uploaded_tick);
    setOfferLetterTick(!!app.offer_letter_uploaded_tick);
    setModalType('upload');
  };

  const handleReplyFormFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      toast.error(t(language, 'appFileTooLarge'));
      return;
    }

    if (file.type !== 'application/pdf') {
      toast.error(t(language, 'appInvalidFormat'));
      return;
    }

    setIsUploadingReply(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const base64String = evt.target?.result as string;
        setTempReplyFormImage(base64String);
        setReplyFormTick(true);
        toast.success(language === 'ms' ? 'Borang jawapan sedia disimpan.' : 'Reply form ready to save.');
      } catch (err) {
        toast.error("Gagal membaca fail.");
      } finally {
        setIsUploadingReply(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOfferLetterFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      toast.error(t(language, 'appFileTooLarge'));
      return;
    }

    if (file.type !== 'application/pdf') {
      toast.error(t(language, 'appInvalidFormat'));
      return;
    }

    setIsUploadingOffer(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const base64String = evt.target?.result as string;
        setTempOfferLetterImage(base64String);
        setOfferLetterTick(true);
        toast.success(language === 'ms' ? 'Surat tawaran sedia disimpan.' : 'Offer letter ready to save.');
      } catch (err) {
        toast.error("Gagal membaca fail.");
      } finally {
        setIsUploadingOffer(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUploadsAndTicks = async () => {
    if (!selectedApp) return;

    try {
      setIsUploading(true);
      
      const updatedApp: Application = {
        ...selectedApp,
        reply_form_image: tempReplyFormImage || undefined,
        reply_form_uploaded_at: tempReplyFormImage && tempReplyFormImage !== selectedApp.reply_form_image ? new Date().toISOString() : selectedApp.reply_form_uploaded_at,
        reply_form_uploaded_tick: replyFormTick,
        reply_form_verified: replyFormTick ? selectedApp.reply_form_verified : false,

        offer_letter_image: tempOfferLetterImage || undefined,
        offer_letter_uploaded_at: tempOfferLetterImage && tempOfferLetterImage !== selectedApp.offer_letter_image ? new Date().toISOString() : selectedApp.offer_letter_uploaded_at,
        offer_letter_uploaded_tick: offerLetterTick,
        offer_letter_verified: offerLetterTick ? selectedApp.offer_letter_verified : false
      };

      await onUpdateApplication(updatedApp);
      toast.success(language === 'ms' ? 'Dokumen & pengesahan berjaya disimpan!' : 'Documents & verification saved successfully!');
      setModalType(null);
    } catch (err) {
      toast.error("Gagal menyimpan fail & status.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerifyBorang = async (app: Application) => {
    try {
      const updated: Application = {
        ...app,
        reply_form_verified: true,
        reply_form_verified_by: currentUser.name,
        reply_form_verified_at: new Date().toISOString()
      };
      await onUpdateApplication(updated);
      setSelectedApp(updated);
      toast.success(language === 'ms' ? "Borang disahkan!" : "Form verified!");
    } catch (err) {
      toast.error("Gagal mengesahkan borang.");
    }
  };

  const handleVerifyOfferLetter = async (app: Application) => {
    try {
      const updated: Application = {
        ...app,
        offer_letter_verified: true,
        offer_letter_verified_by: currentUser.name,
        offer_letter_verified_at: new Date().toISOString()
      };
      await onUpdateApplication(updated);
      setSelectedApp(updated);
      toast.success(language === 'ms' ? "Surat tawaran disahkan!" : "Offer letter verified!");
    } catch (err) {
      toast.error("Gagal mengesahkan surat tawaran.");
    }
  };

  const handleTogglePreferred = async (app: Application) => {
    try {
      const updated: Application = {
        ...app,
        student_preferred: !app.student_preferred
      };
      await onUpdateApplication(updated);
      toast.success(updated.student_preferred 
        ? (language === 'ms' ? 'Ditandakan sebagai pilihan utama!' : 'Marked as preferred!')
        : (language === 'ms' ? 'Nyahpilih pilihan utama' : 'Removed from preferred')
      );
    } catch (err) {
      toast.error(language === 'ms' ? "Gagal mengemaskini pilihan." : "Failed to update preference.");
    }
  };

  const handleToggleHasOffer = async (app: Application) => {
    try {
      const updated: Application = {
        ...app,
        student_has_offer: !app.student_has_offer
      };
      await onUpdateApplication(updated);
      toast.success(updated.student_has_offer 
        ? (language === 'ms' ? 'Ditandakan sebagai mendapat tawaran!' : 'Marked as received offer!')
        : (language === 'ms' ? 'Nyahpilih status tawaran' : 'Removed from received offer')
      );
    } catch (err) {
      toast.error(language === 'ms' ? "Gagal mengemaskini status tawaran." : "Failed to update offer status.");
    }
  };

  const groupedStudents = filteredApps.reduce((acc, app) => {
    const studentKey = app.student_id || app.student_name;
    if (!acc[studentKey]) {
      acc[studentKey] = {
        student_name: app.student_name,
        student_id: app.student_id,
        created_by: app.created_by,
        apps: []
      };
    }
    acc[studentKey].apps.push(app);
    return acc;
  }, {} as Record<string, { student_name: string; student_id: string; created_by: string; apps: Application[] }>);

  const groupedList = Object.values(groupedStudents);

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">{t(language, 'appTitle')}</h2>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="p-4 font-semibold text-sm text-slate-600 w-1/4">{t(language, 'appStudent')}</th>
                    <th className="p-4 font-semibold text-sm text-slate-600">Syarikat & Status Permohonan</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {groupedList.length === 0 && (
                    <tr><td colSpan={2} className="p-8 text-center text-slate-500">{t(language, 'noRecords')}</td></tr>
                )}
                {groupedList.map(group => {
                    const studentUser = users.find(u => u.matric_no === group.student_id || u.username === group.created_by);
                    
                    return (
                        <tr key={group.student_id || group.student_name} className="hover:bg-slate-50/40 transition-colors">
                            <td className="p-4 align-top border-r border-slate-100 bg-slate-50/20">
                                <div className="flex flex-col gap-1 sticky top-4">
                                    <div className="font-bold text-slate-900 text-sm">{group.student_name}</div>
                                    <div className="text-xs text-slate-500 font-mono">{group.student_id}</div>
                                    
                                    {(() => {
                                      const activeNames = [
                                        "nor afizzi aqimi bin norihsan",
                                        "nurul izzati binti yusri",
                                        "yap yan zi",
                                        "ahmad rifa'at bin rosdi rifaa'at",
                                        "muhammad arif izzuddin bin mad nasir",
                                        "auni haziqah binti haswadi",
                                        "irsyad bin ahmad nizam",
                                        "joviar khor jian h’ng",
                                        "joviar khor jian h'ng",
                                        "muhammad nor hafiz ahmad saidi",
                                        "muhammad fikri bin hamzah",
                                        "intan natasha binti mohd farino",
                                        "wong wen hui",
                                        "teoh yi xian",
                                        "muhammad alif bin md farid",
                                        "laila suraya bt adnan",
                                        "laila suraya binti adnan",
                                        "nur syahirah binti mohd nor radzief",
                                        "putri zainab binti dzainuddin",
                                        "noor suhaila binti mohamed",
                                        "ker guo fuk",
                                        "siti nurnazura binti mohd nahar",
                                        "danial haikal bin abdul latif"
                                      ];
                                      const normalizedName = group.student_name.toLowerCase().trim();
                                      const matchedActiveStatic = activeNames.some(activeName => {
                                        const cleanActive = activeName.replace(/[^a-z0-9]/g, '');
                                        const cleanInput = normalizedName.replace(/[^a-z0-9]/g, '');
                                        return cleanInput === cleanActive || cleanInput.includes(cleanActive) || cleanActive.includes(cleanInput);
                                      });
                                      const isActive = studentUser?.is_active !== undefined ? studentUser.is_active : matchedActiveStatic;
                                      return isActive ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 w-fit mt-1">
                                          AKTIF
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-200 w-fit mt-1">
                                          TIDAK AKTIF
                                        </span>
                                      );
                                    })()}
                                </div>
                            </td>
                            
                            <td className="p-4 align-top">
                                <div className="space-y-4">
                                    {group.apps.map(app => {
                                        const isPreferred = !!app.student_preferred;
                                        const hasOffer = !!app.student_has_offer;
                                        const isTicked = isPreferred || hasOffer;
                                        
                                        const cardClass = isTicked
                                            ? "bg-emerald-50/80 border border-emerald-300 rounded-xl p-4 shadow-sm transition-all"
                                            : "bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-all";
                                        
                                        return (
                                            <div key={app.id} className={cardClass}>
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <Building2 size={16} className={isTicked ? 'text-emerald-600' : 'text-slate-400'} />
                                                            <h4 className="font-bold text-slate-900 text-sm">{app.company_name}</h4>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-0.5 ml-6">{app.company_state}</p>
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap items-center gap-2 ml-6 md:ml-0">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                            app.application_status === 'Diluluskan' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                            app.application_status === 'Ditolak' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                            'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                                        }`}>
                                                            {app.application_status}
                                                        </span>
                                                        
                                                        <div className="flex gap-1.5">
                                                            {currentUser.role === UserRole.STUDENT ? (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleTogglePreferred(app)}
                                                                        className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-black transition-all ${
                                                                            app.student_preferred 
                                                                                ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-sm' 
                                                                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                                                        }`}
                                                                        title="Tanda sebagai syarikat pilihan utama anda"
                                                                    >
                                                                        <Star size={10} className={app.student_preferred ? 'fill-amber-500 text-amber-500' : ''} />
                                                                        <span>PILIHAN</span>
                                                                    </button>
                                                                    
                                                                    <button 
                                                                        onClick={() => handleToggleHasOffer(app)}
                                                                        className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-black transition-all ${
                                                                            app.student_has_offer 
                                                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm' 
                                                                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                                                        }`}
                                                                        title="Tanda jika mendapat tawaran daripada syarikat"
                                                                    >
                                                                        <CheckCircle2 size={10} className={app.student_has_offer ? 'text-emerald-600 fill-emerald-50' : ''} />
                                                                        <span>TAWARAN</span>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <div className="flex gap-1">
                                                                    {app.student_preferred && (
                                                                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                                            <Star size={10} className="fill-amber-500 text-amber-500" /> PILIHAN
                                                                        </span>
                                                                    )}
                                                                    {app.student_has_offer && (
                                                                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                                            <CheckCircle2 size={10} className="text-emerald-600" /> TAWARAN
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ml-6">
                                                    <div className="flex flex-col gap-1 text-[11px]">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-slate-500 w-24">Borang Jawapan:</span>
                                                            {app.reply_form_image || app.reply_form_uploaded_tick ? (
                                                                app.reply_form_verified ? (
                                                                    <span className="inline-flex items-center gap-1 font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded text-[9px] border border-green-100">
                                                                        <CheckCircle size={8} /> DISAHKAN
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded text-[9px] border border-orange-100">
                                                                        <Clock size={8} /> MENUNGGU VERIFIKASI
                                                                    </span>
                                                                )
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-slate-400">BELUM DIHANTAR</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-slate-500 w-24">Surat Tawaran:</span>
                                                            {app.offer_letter_image || app.offer_letter_uploaded_tick ? (
                                                                app.offer_letter_verified ? (
                                                                    <span className="inline-flex items-center gap-1 font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded text-[9px] border border-green-100">
                                                                        <CheckCircle size={8} /> DISAHKAN
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded text-[9px] border border-orange-100">
                                                                        <Clock size={8} /> MENUNGGU VERIFIKASI
                                                                    </span>
                                                                )
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-slate-400">BELUM DIHANTAR</span>
                                                            )}
                                                        </div>
                                                        {(app.reply_form_image || app.offer_letter_image || app.reply_form_uploaded_tick || app.offer_letter_uploaded_tick) && (
                                                            <button 
                                                                onClick={() => { setSelectedApp(app); setActiveDocTab(app.reply_form_image || app.reply_form_uploaded_tick ? 'reply' : 'offer'); setModalType('viewPdf'); }}
                                                                className="mt-1.5 text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1 w-fit hover:underline"
                                                            >
                                                                <Eye size={12} /> Lihat Dokumen / Status
                                                            </button>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                                        {hasSystemAccess && (
                                                            <>
                                                                {(((app.reply_form_image || app.reply_form_uploaded_tick) && !app.reply_form_verified) || ((app.offer_letter_image || app.offer_letter_uploaded_tick) && !app.offer_letter_verified)) && (
                                                                    <button 
                                                                        onClick={() => { setSelectedApp(app); setActiveDocTab(app.reply_form_image || app.reply_form_uploaded_tick ? 'reply' : 'offer'); setModalType('viewPdf'); }}
                                                                        className="px-2.5 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-green-200 shadow-sm"
                                                                        title="Sahkan Dokumen Penempatan"
                                                                    >
                                                                        <FileCheck size={12} />
                                                                        <span>Sahkan Dokumen</span>
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                        
                                                        {(hasSystemAccess || currentUser.role === UserRole.LECTURER) && app.application_status === 'Menunggu' && (
                                                            <>
                                                                <button 
                                                                    onClick={() => { setStatusConfirmData({app, newStatus: 'Diluluskan'}); setModalType('statusConfirm'); }} 
                                                                    className="px-2 py-1 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1 text-[11px] font-bold border border-green-200"
                                                                    title={language === 'ms' ? "Luluskan Permohonan" : "Approve Application"}
                                                                >
                                                                    <FileCheck size={12} />
                                                                    <span>Lulus</span>
                                                                </button>
                                                                <button 
                                                                    onClick={() => { setStatusConfirmData({app, newStatus: 'Ditolak'}); setModalType('statusConfirm'); }} 
                                                                    className="px-2 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1 text-[11px] font-bold border border-red-200"
                                                                    title={language === 'ms' ? "Tolak Permohonan" : "Reject Application"}
                                                                >
                                                                    <FileX size={12} />
                                                                    <span>Tolak</span>
                                                                </button>
                                                            </>
                                                        )}
                                                        
                                                        {currentUser.role === UserRole.STUDENT && (
                                                            <>
                                                                <button 
                                                                    onClick={() => { setSelectedApp(app); setModalType('letter'); }} 
                                                                    className="p-1.5 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors border border-purple-200" 
                                                                    title={t(language, 'appJanaSurat')}
                                                                >
                                                                    <Printer size={14} />
                                                                </button>
                                                                
                                                                {app.application_status === 'Diluluskan' && (
                                                                    <button 
                                                                        onClick={() => openUploadModal(app)}
                                                                        className="px-2.5 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg flex items-center gap-1 text-[11px] font-bold border border-blue-200 shadow-sm"
                                                                        title="Hantar Borang & Surat"
                                                                    >
                                                                        <Upload size={12} />
                                                                        <span>Hantar Dokumen</span>
                                                                    </button>
                                                                )}
                                                                
                                                                {app.application_status === 'Menunggu' && (
                                                                    <button 
                                                                        onClick={() => { setSelectedApp(app); setModalType('cancelConfirm'); }}
                                                                        className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors border border-red-200"
                                                                        title={language === 'ms' ? "Batal Permohonan" : "Cancel Application"}
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                        
                                                        {hasSystemAccess && (
                                                            <button 
                                                                onClick={() => { if(confirm(language === 'ms' ? 'Padam rekod ini secara kekal?' : 'Delete this record permanently?')) onDeleteApplication?.(app.id); }}
                                                                className="p-1.5 bg-slate-100 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors border border-slate-200"
                                                                title="Maintenance: Padam Rekod"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </td>
                        </tr>
                    );
                })}
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

        {/* MODAL: BATAL PERMOHONAN */}
        <Modal isOpen={modalType === 'cancelConfirm'} onClose={() => setModalType(null)} title={language === 'ms' ? 'Batal Permohonan' : 'Cancel Application'}>
            <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{language === 'ms' ? 'Adakah anda pasti?' : 'Are you sure?'}</h3>
                <p className="text-sm text-slate-500">{language === 'ms' ? `Permohonan anda ke syarikat ${selectedApp?.company_name} akan dipadam secara kekal dari sistem.` : `Your application to ${selectedApp?.company_name} will be permanently removed from the system.`}</p>
                <div className="flex gap-2 mt-6">
                    <button onClick={() => setModalType(null)} className="flex-1 p-3 border rounded-xl font-bold">{t(language, 'cancel')}</button>
                    <button onClick={handleCancelApplication} className="flex-1 p-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">{language === 'ms' ? 'Ya, Batalkan' : 'Yes, Cancel'}</button>
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

        {/* MODAL: MUAT NAIK DOKUMEN & TICK STATUS */}
        <Modal isOpen={modalType === 'upload'} onClose={() => setModalType(null)} title="Hantar Borang Jawapan & Surat Tawaran">
            <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-xs text-indigo-800">
                    <p className="font-bold mb-1">💡 Arahan Pengesahan Pelajar:</p>
                    <p>Sila tandakan (tick) pilihan di bawah untuk memaklumkan penyelaras, dan muat naik dokumen PDF sokongan sekiranya ada untuk memudahkan proses kelulusan.</p>
                </div>

                {/* SECTION 1: BORANG JAWAPAN INDUSTRI */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <div className="flex items-start gap-2.5">
                        <button 
                            type="button"
                            onClick={() => setReplyFormTick(!replyFormTick)}
                            className="mt-0.5 text-indigo-600 hover:scale-105 transition-transform"
                        >
                            {replyFormTick ? <CheckSquare size={20} className="fill-indigo-50" /> : <Square size={20} />}
                        </button>
                        <div>
                            <label className="text-sm font-bold text-slate-800 block cursor-pointer" onClick={() => setReplyFormTick(!replyFormTick)}>
                                Saya mengesahkan telah menerima & menghantar Borang Jawapan Industri
                            </label>
                            <p className="text-xs text-slate-500 mt-0.5">Tandakan ini jika syarikat telah bersetuju menerima anda dan borang maklum balas lengkap telah dihantar.</p>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-600">Fail PDF Borang Jawapan:</span>
                            {tempReplyFormImage ? (
                                <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle size={10} /> Telah Dipilih
                                </span>
                            ) : (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                                    Tiada Fail PDF
                                </span>
                            )}
                        </div>

                        <input 
                            type="file" 
                            ref={replyFormInputRef} 
                            onChange={handleReplyFormFileChange} 
                            accept="application/pdf" 
                            className="hidden" 
                        />
                        
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => replyFormInputRef.current?.click()}
                                className="flex-1 py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <Upload size={14} /> {tempReplyFormImage ? "Tukar PDF" : "Muat Naik PDF"}
                            </button>
                            {tempReplyFormImage && (
                                <button
                                    type="button"
                                    onClick={() => { setTempReplyFormImage(''); setReplyFormTick(false); }}
                                    className="px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
                                >
                                    Padam
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* SECTION 2: SURAT TAWARAN SYARIKAT */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <div className="flex items-start gap-2.5">
                        <button 
                            type="button"
                            onClick={() => setOfferLetterTick(!offerLetterTick)}
                            className="mt-0.5 text-indigo-600 hover:scale-105 transition-transform"
                        >
                            {offerLetterTick ? <CheckSquare size={20} className="fill-indigo-50" /> : <Square size={20} />}
                        </button>
                        <div>
                            <label className="text-sm font-bold text-slate-800 block cursor-pointer" onClick={() => setOfferLetterTick(!offerLetterTick)}>
                                Saya mengesahkan telah menerima Surat Tawaran rasmi dari syarikat
                            </label>
                            <p className="text-xs text-slate-500 mt-0.5">Tandakan ini setelah menerima surat tawaran (offer letter) dari pihak industri.</p>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-600">Fail PDF Surat Tawaran Syarikat:</span>
                            {tempOfferLetterImage ? (
                                <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle size={10} /> Telah Dipilih
                                </span>
                            ) : (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                                    Tiada Fail PDF
                                </span>
                            )}
                        </div>

                        <input 
                            type="file" 
                            ref={offerLetterInputRef} 
                            onChange={handleOfferLetterFileChange} 
                            accept="application/pdf" 
                            className="hidden" 
                        />
                        
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => offerLetterInputRef.current?.click()}
                                className="flex-1 py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <Upload size={14} /> {tempOfferLetterImage ? "Tukar PDF" : "Muat Naik PDF"}
                            </button>
                            {tempOfferLetterImage && (
                                <button
                                    type="button"
                                    onClick={() => { setTempOfferLetterImage(''); setOfferLetterTick(false); }}
                                    className="px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
                                >
                                    Padam
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {isUploading && (
                    <div className="text-center py-2">
                        <RefreshCcw className="animate-spin mx-auto text-blue-600 mb-1" size={20} />
                        <p className="text-[10px] font-bold text-blue-600 animate-pulse">Sedang mengemas kini dokumen...</p>
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button 
                        type="button"
                        onClick={() => setModalType(null)} 
                        className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl text-sm border border-slate-200"
                    >
                        {t(language, 'cancel')}
                    </button>
                    <button 
                        type="button"
                        onClick={handleSaveUploadsAndTicks}
                        className="flex-1 py-3 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl text-sm shadow-md transition-all active:scale-95"
                    >
                        Simpan & Hantar
                    </button>
                </div>
            </div>
        </Modal>

        {/* MODAL: LIHAT & SAHKAN PDF */}
        <Modal isOpen={modalType === 'viewPdf'} onClose={() => setModalType(null)} title="Semakan Dokumen & Pengesahan Pelajar">
            <div className="space-y-4">
                {/* Tabs to select which doc to look at */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveDocTab('reply')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                            activeDocTab === 'reply' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Borang Jawapan Industri
                    </button>
                    <button
                        onClick={() => setActiveDocTab('offer')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                            activeDocTab === 'offer' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Surat Tawaran Syarikat
                    </button>
                </div>

                {activeDocTab === 'reply' ? (
                    <div className="space-y-4">
                        {/* Information & Ticked State */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                            <div>
                                <span className="text-[11px] text-slate-500 font-bold block uppercase">Pengesahan Penghantaran (Tick Pelajar)</span>
                                <span className="text-xs text-slate-800 font-medium">
                                    {selectedApp?.reply_form_uploaded_tick ? '✅ Pelajar telah tick "Borang Dihantar"' : '❌ Belum ditandakan oleh pelajar'}
                                </span>
                            </div>
                            {selectedApp?.reply_form_uploaded_at && (
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-400 block">Tarikh Kemas Kini</span>
                                    <span className="text-xs font-semibold text-slate-600">{new Date(selectedApp.reply_form_uploaded_at).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>

                        {/* PDF View */}
                        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative" style={{ height: '400px' }}>
                            {selectedApp?.reply_form_image ? (
                                <iframe 
                                    src={selectedApp.reply_form_image} 
                                    className="w-full h-full"
                                    title="PDF Preview Borang Jawapan"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 italic gap-2">
                                    <span>Fail PDF Borang Jawapan tidak ditemui.</span>
                                    <span className="text-xs font-normal text-slate-400">(Pelajar tidak memuat naik fail)</span>
                                </div>
                            )}
                        </div>

                        {/* Actions & Verification */}
                        <div className="flex flex-col md:flex-row gap-3">
                            {hasSystemAccess && !selectedApp?.reply_form_verified && (
                                <button 
                                    onClick={() => selectedApp && handleVerifyBorang(selectedApp)}
                                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg shadow-green-100 transition-transform active:scale-95"
                                >
                                    <FileCheck size={18} /> Lulus / Sahkan Borang Jawapan
                                </button>
                            )}
                            {selectedApp?.reply_form_image && (
                                <button 
                                    onClick={() => {
                                        if (selectedApp?.reply_form_image) {
                                            const link = document.createElement('a');
                                            link.href = selectedApp.reply_form_image;
                                            link.download = `Borang_Jawapan_${selectedApp.student_id}.pdf`;
                                            link.click();
                                        }
                                    }}
                                    className="py-3 px-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-transform active:scale-95 text-xs text-center"
                                >
                                    <Printer size={16} /> Muat Turun
                                </button>
                            )}
                        </div>

                        {selectedApp?.reply_form_verified && (
                            <div className="p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3">
                                <CheckCircle size={20} className="text-green-600" />
                                <div>
                                    <p className="text-[11px] font-bold text-green-800 uppercase">Borang Jawapan Telah Disahkan</p>
                                    <p className="text-[10px] text-green-600 italic">Disahkan oleh: {selectedApp.reply_form_verified_by} pada {selectedApp.reply_form_verified_at ? new Date(selectedApp.reply_form_verified_at).toLocaleString() : '-'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Information & Ticked State */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                            <div>
                                <span className="text-[11px] text-slate-500 font-bold block uppercase">Pengesahan Penerimaan (Tick Pelajar)</span>
                                <span className="text-xs text-slate-800 font-medium">
                                    {selectedApp?.offer_letter_uploaded_tick ? '✅ Pelajar telah tick "Surat Tawaran Diterima"' : '❌ Belum ditandakan oleh pelajar'}
                                </span>
                            </div>
                            {selectedApp?.offer_letter_uploaded_at && (
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-400 block">Tarikh Kemas Kini</span>
                                    <span className="text-xs font-semibold text-slate-600">{new Date(selectedApp.offer_letter_uploaded_at).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>

                        {/* PDF View */}
                        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative" style={{ height: '400px' }}>
                            {selectedApp?.offer_letter_image ? (
                                <iframe 
                                    src={selectedApp.offer_letter_image} 
                                    className="w-full h-full"
                                    title="PDF Preview Surat Tawaran"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 italic gap-2">
                                    <span>Fail PDF Surat Tawaran tidak ditemui.</span>
                                    <span className="text-xs font-normal text-slate-400">(Pelajar tidak memuat naik fail)</span>
                                </div>
                            )}
                        </div>

                        {/* Actions & Verification */}
                        <div className="flex flex-col md:flex-row gap-3">
                            {hasSystemAccess && !selectedApp?.offer_letter_verified && (
                                <button 
                                    onClick={() => selectedApp && handleVerifyOfferLetter(selectedApp)}
                                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg shadow-green-100 transition-transform active:scale-95"
                                >
                                    <FileCheck size={18} /> Lulus / Sahkan Surat Tawaran
                                </button>
                            )}
                            {selectedApp?.offer_letter_image && (
                                <button 
                                    onClick={() => {
                                        if (selectedApp?.offer_letter_image) {
                                            const link = document.createElement('a');
                                            link.href = selectedApp.offer_letter_image;
                                            link.download = `Surat_Tawaran_${selectedApp.student_id}.pdf`;
                                            link.click();
                                        }
                                    }}
                                    className="py-3 px-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-transform active:scale-95 text-xs text-center"
                                >
                                    <Printer size={16} /> Muat Turun
                                </button>
                            )}
                        </div>

                        {selectedApp?.offer_letter_verified && (
                            <div className="p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3">
                                <CheckCircle size={20} className="text-green-600" />
                                <div>
                                    <p className="text-[11px] font-bold text-green-800 uppercase">Surat Tawaran Telah Disahkan</p>
                                    <p className="text-[10px] text-green-600 italic">Disahkan oleh: {selectedApp.offer_letter_verified_by} pada {selectedApp.offer_letter_verified_at ? new Date(selectedApp.offer_letter_verified_at).toLocaleString() : '-'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    </div>
  );
};
