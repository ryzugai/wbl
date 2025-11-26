
import React, { useState } from 'react';
import { Application, User, UserRole, Company } from '../types';
import { Modal } from '../components/Modal';
import { generateLetter } from '../utils/letterGenerator';
import { FileCheck, FileX, Printer, UserPlus, Upload, Eye, RefreshCcw, AlertTriangle } from 'lucide-react';

interface ApplicationsProps {
  currentUser: User;
  applications: Application[];
  users: User[]; // to find lecturers
  companies: Company[];
  onUpdateApplication: (app: Application) => Promise<void>;
}

export const Applications: React.FC<ApplicationsProps> = ({ currentUser, applications, users, companies, onUpdateApplication }) => {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [modalType, setModalType] = useState<'supervisor' | 'upload' | 'viewReply' | 'letter' | 'statusConfirm' | null>(null);
  const [supervisorId, setSupervisorId] = useState('');
  
  // Status Confirmation State
  const [statusConfirmData, setStatusConfirmData] = useState<{
      app: Application;
      newStatus: 'Diluluskan' | 'Ditolak' | 'Menunggu';
  } | null>(null);
  
  // Upload Form State
  const [uploadStatus, setUploadStatus] = useState('uploaded_email');
  const [uploadNotes, setUploadNotes] = useState('');

  // Filter apps based on role
  const filteredApps = applications.filter(app => {
    if (currentUser.role === UserRole.STUDENT) return app.created_by === currentUser.username;
    if (currentUser.role === UserRole.TRAINER || currentUser.role === UserRole.SUPERVISOR) {
      return app.company_name === currentUser.company_affiliation;
    }
    return true; // Coordinator/Lecturer sees all
  });

  const lecturers = users.filter(u => u.role === UserRole.LECTURER);

  const initiateStatusChange = (app: Application, status: 'Diluluskan' | 'Ditolak' | 'Menunggu') => {
    setStatusConfirmData({ app, newStatus: status });
    setModalType('statusConfirm');
  };

  const handleConfirmStatusChange = async () => {
    if (!statusConfirmData) return;
    
    await onUpdateApplication({ 
        ...statusConfirmData.app, 
        application_status: statusConfirmData.newStatus 
    });
    
    setModalType(null);
    setStatusConfirmData(null);
  };

  const handleAssignSupervisor = async () => {
    if (!selectedApp || !supervisorId) return;
    const lecturer = lecturers.find(l => l.id === supervisorId);
    if (!lecturer) return;

    await onUpdateApplication({
      ...selectedApp,
      faculty_supervisor_id: lecturer.id,
      faculty_supervisor_name: lecturer.name,
      faculty_supervisor_staff_id: lecturer.staff_id
    });
    setModalType(null);
    setSupervisorId('');
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    const statusMap: Record<string, string> = {
      'uploaded_email': 'Email',
      'uploaded_whatsapp': 'WhatsApp',
      'uploaded_hand': 'Serahan Tangan',
      'pending_company': 'Menunggu Syarikat'
    };

    const confirmationText = `Status: ${statusMap[uploadStatus]}${uploadNotes ? '\nCatatan: ' + uploadNotes : ''}`;

    await onUpdateApplication({
      ...selectedApp,
      reply_form_image: confirmationText,
      reply_form_uploaded_at: new Date().toISOString(),
      reply_form_verified: false
    });
    setModalType(null);
  };

  const handleVerifyReply = async () => {
    if (!selectedApp) return;
    await onUpdateApplication({
      ...selectedApp,
      reply_form_verified: true,
      reply_form_verified_by: currentUser.name,
      reply_form_verified_at: new Date().toISOString()
    });
    setModalType(null);
  };

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Senarai Permohonan</h2>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="p-4 font-semibold text-sm text-slate-600">Pelajar</th>
                    <th className="p-4 font-semibold text-sm text-slate-600">Syarikat</th>
                    <th className="p-4 font-semibold text-sm text-slate-600">Status</th>
                    <th className="p-4 font-semibold text-sm text-slate-600">Penyelia Fakulti</th>
                    <th className="p-4 font-semibold text-sm text-slate-600 text-center">Tindakan</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filteredApps.length === 0 && (
                    <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">Tiada permohonan dijumpai.</td>
                    </tr>
                )}
                {filteredApps.map(app => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                        <div className="font-medium text-slate-900">{app.student_name}</div>
                        <div className="text-xs text-slate-500">{app.student_program} ({app.student_id})</div>
                    </td>
                    <td className="p-4">
                        <div className="text-slate-900">{app.company_name}</div>
                        <div className="text-xs text-slate-500">{app.company_state}</div>
                    </td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        app.application_status === 'Diluluskan' ? 'bg-green-100 text-green-700' :
                        app.application_status === 'Ditolak' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                        }`}>
                        {app.application_status}
                        </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                        {app.faculty_supervisor_name ? (
                            <div>
                                <span className="font-medium text-blue-600">{app.faculty_supervisor_name}</span>
                                <div className="text-xs text-slate-400">{app.faculty_supervisor_staff_id}</div>
                            </div>
                        ) : (
                            <span className="italic text-slate-400">Belum ditugaskan</span>
                        )}
                    </td>
                    <td className="p-4">
                        <div className="flex justify-center gap-2 flex-wrap">
                        {/* Actions based on Roles */}
                        
                        {/* Approve/Reject (Coordinator/Lecturer) */}
                        {(currentUser.role === UserRole.COORDINATOR || currentUser.role === UserRole.LECTURER) && (
                            <>
                             {app.application_status === 'Menunggu' && (
                                <>
                                <button onClick={() => initiateStatusChange(app, 'Diluluskan')} className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200" title="Luluskan">
                                    <FileCheck size={18} />
                                </button>
                                <button onClick={() => initiateStatusChange(app, 'Ditolak')} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200" title="Tolak">
                                    <FileX size={18} />
                                </button>
                                </>
                             )}
                             {/* Reopen Button for Coordinator */}
                             {app.application_status === 'Ditolak' && currentUser.role === UserRole.COORDINATOR && (
                                 <button onClick={() => initiateStatusChange(app, 'Menunggu')} className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-xs font-bold shadow-sm" title="Buka Semula Permohonan">
                                    <RefreshCcw size={14} /> Buka Semula
                                 </button>
                             )}
                            </>
                        )}

                        {/* Assign Supervisor (Coordinator only, if Approved) */}
                        {currentUser.role === UserRole.COORDINATOR && app.application_status === 'Diluluskan' && (
                            <button 
                                onClick={() => { setSelectedApp(app); setModalType('supervisor'); }}
                                className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                title="Assign Penyelia"
                            >
                                <UserPlus size={18} />
                            </button>
                        )}

                        {/* Generate Letter (Student, if Approved) */}
                        {currentUser.role === UserRole.STUDENT && app.application_status === 'Diluluskan' && (
                            <button
                                onClick={() => { setSelectedApp(app); setModalType('letter'); }}
                                className="p-2 bg-purple-100 text-purple-600 rounded hover:bg-purple-200"
                                title="Jana Surat"
                            >
                                <Printer size={18} />
                            </button>
                        )}

                        {/* Reply Form (Student) */}
                        {currentUser.role === UserRole.STUDENT && app.application_status === 'Diluluskan' && (
                             <button
                                onClick={() => { setSelectedApp(app); setModalType(app.reply_form_image ? 'viewReply' : 'upload'); }}
                                className={`p-2 rounded ${app.reply_form_verified ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}
                                title={app.reply_form_image ? "Lihat Status Borang" : "Hantar Borang Maklum Balas"}
                            >
                                {app.reply_form_image ? <Eye size={18} /> : <Upload size={18} />}
                            </button>
                        )}

                        {/* Verify Reply Form (Coordinator) */}
                        {currentUser.role === UserRole.COORDINATOR && app.reply_form_image && (
                            <button
                                onClick={() => { setSelectedApp(app); setModalType('viewReply'); }}
                                className={`p-2 rounded ${app.reply_form_verified ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}
                                title="Semak Borang"
                            >
                                <Eye size={18} />
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

        {/* Modal: Status Confirmation */}
        <Modal 
            isOpen={modalType === 'statusConfirm'} 
            onClose={() => setModalType(null)} 
            title="Pengesahan Tindakan"
        >
            <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-slate-50 border rounded-lg">
                    <AlertTriangle className={`shrink-0 mt-1 ${
                        statusConfirmData?.newStatus === 'Diluluskan' ? 'text-green-600' : 
                        statusConfirmData?.newStatus === 'Ditolak' ? 'text-red-600' : 'text-yellow-600'
                    }`} size={24} />
                    <div>
                        <h4 className="font-bold text-slate-800">
                            Tukar status kepada {statusConfirmData?.newStatus}?
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                            Pelajar: <strong>{statusConfirmData?.app.student_name}</strong><br/>
                            Syarikat: {statusConfirmData?.app.company_name}
                        </p>
                        {statusConfirmData?.newStatus === 'Diluluskan' && (
                            <p className="text-xs text-red-600 font-bold mt-2">
                                ⚠️ AMARAN: Meluluskan permohonan ini akan menolak secara automatik permohonan lain yang berstatus 'Menunggu' untuk pelajar ini.
                            </p>
                        )}
                        {statusConfirmData?.newStatus === 'Menunggu' && (
                            <p className="text-xs text-blue-600 font-bold mt-2">
                                ℹ️ Permohonan ini akan dibuka semula untuk pertimbangan.
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={() => setModalType(null)}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded text-slate-700 font-medium hover:bg-slate-50"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={handleConfirmStatusChange}
                        className={`flex-1 px-4 py-2 text-white rounded font-bold ${
                             statusConfirmData?.newStatus === 'Diluluskan' ? 'bg-green-600 hover:bg-green-700' : 
                             statusConfirmData?.newStatus === 'Ditolak' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
                        }`}
                    >
                        Sahkan
                    </button>
                </div>
            </div>
        </Modal>

        {/* Modal: Assign Supervisor */}
        <Modal 
            isOpen={modalType === 'supervisor'} 
            onClose={() => setModalType(null)} 
            title="Tugaskan Penyelia Fakulti"
        >
            <div className="space-y-4">
                <p className="text-sm text-slate-600">Pelajar: <strong>{selectedApp?.student_name}</strong></p>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Pensyarah</label>
                    <select 
                        value={supervisorId}
                        onChange={(e) => setSupervisorId(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                    >
                        <option value="">-- Pilih --</option>
                        {lecturers.length > 0 ? (
                            lecturers.map(lec => (
                                <option key={lec.id} value={lec.id}>{lec.name} ({lec.staff_id})</option>
                            ))
                        ) : (
                            <option value="" disabled>Tiada pensyarah berdaftar</option>
                        )}
                    </select>
                </div>
                <button 
                    onClick={handleAssignSupervisor}
                    disabled={!supervisorId}
                    className={`w-full py-2 rounded text-white ${!supervisorId ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    Simpan
                </button>
            </div>
        </Modal>

        {/* Modal: Upload/Status Confirmation */}
        <Modal 
             isOpen={modalType === 'upload'} 
             onClose={() => setModalType(null)} 
             title="Status Penghantaran Borang"
        >
             <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="space-y-2">
                    {[
                        {val: 'uploaded_email', label: 'Sudah dihantar melalui Email'},
                        {val: 'uploaded_whatsapp', label: 'Sudah dihantar melalui WhatsApp'},
                        {val: 'uploaded_hand', label: 'Sudah diserahkan (Tangan)'},
                        {val: 'pending_company', label: 'Menunggu Syarikat'}
                    ].map(opt => (
                        <label key={opt.val} className="flex items-center space-x-3 p-3 border rounded hover:bg-slate-50 cursor-pointer">
                            <input 
                                type="radio" 
                                name="status" 
                                value={opt.val}
                                checked={uploadStatus === opt.val}
                                onChange={(e) => setUploadStatus(e.target.value)}
                                className="h-4 w-4 text-blue-600"
                            />
                            <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                        </label>
                    ))}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
                    <textarea 
                        value={uploadNotes} 
                        onChange={e => setUploadNotes(e.target.value)}
                        className="w-full p-2 border rounded"
                        rows={3}
                    />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Sahkan</button>
             </form>
        </Modal>

        {/* Modal: View Reply Form */}
        <Modal
            isOpen={modalType === 'viewReply'}
            onClose={() => setModalType(null)}
            title="Maklumat Borang Jawapan"
        >
             <div className="space-y-4">
                 <div className="p-4 bg-slate-50 rounded border">
                     <p className="text-sm text-slate-500 mb-1">Status yang dilaporkan:</p>
                     <pre className="text-slate-800 font-medium whitespace-pre-wrap font-sans">{selectedApp?.reply_form_image}</pre>
                     <p className="text-xs text-slate-400 mt-2">Dikemaskini: {selectedApp?.reply_form_uploaded_at ? new Date(selectedApp.reply_form_uploaded_at).toLocaleDateString() : '-'}</p>
                 </div>

                 {selectedApp?.reply_form_verified ? (
                     <div className="p-3 bg-green-50 text-green-700 rounded text-center font-medium border border-green-200">
                         Telah Disahkan oleh {selectedApp.reply_form_verified_by}
                     </div>
                 ) : (
                    <div className="p-3 bg-yellow-50 text-yellow-700 rounded text-center font-medium border border-yellow-200">
                        Menunggu Pengesahan
                    </div>
                 )}

                 {currentUser.role === UserRole.COORDINATOR && !selectedApp?.reply_form_verified && (
                     <button 
                        onClick={handleVerifyReply}
                        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                     >
                         Sahkan Penerimaan Borang
                     </button>
                 )}
             </div>
        </Modal>

        {/* Modal: Generate Letter Language Selection */}
        <Modal
             isOpen={modalType === 'letter'}
             onClose={() => setModalType(null)}
             title="Pilih Bahasa Surat"
        >
            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => {
                        const company = companies.find(c => c.company_name === selectedApp?.company_name);
                        if(selectedApp) generateLetter(selectedApp, company, 'ms');
                        setModalType(null);
                    }}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
                >
                    <span className="text-2xl block mb-2">🇲🇾</span>
                    <span className="font-bold text-slate-700">Bahasa Melayu</span>
                </button>
                <button 
                    onClick={() => {
                        const company = companies.find(c => c.company_name === selectedApp?.company_name);
                        if(selectedApp) generateLetter(selectedApp, company, 'en');
                        setModalType(null);
                    }}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
                >
                     <span className="text-2xl block mb-2">🇬🇧</span>
                     <span className="font-bold text-slate-700">English</span>
                </button>
            </div>
        </Modal>
    </div>
  );
};
