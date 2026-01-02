
import React, { useState } from 'react';
import { Application, User, UserRole, Company } from '../types';
import { Modal } from '../components/Modal';
import { generateLetter } from '../utils/letterGenerator';
import { FileCheck, FileX, Printer, UserPlus, Upload, Eye, RefreshCcw, AlertTriangle } from 'lucide-react';
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
  const [modalType, setModalType] = useState<'supervisor' | 'upload' | 'viewReply' | 'letter' | 'statusConfirm' | null>(null);
  const [supervisorId, setSupervisorId] = useState('');
  const [statusConfirmData, setStatusConfirmData] = useState<{ app: Application; newStatus: any } | null>(null);
  
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
                    <th className="p-4 font-semibold text-sm text-slate-600">{t(language, 'appFacultySup')}</th>
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
                    <td className="p-4 text-sm text-slate-600">
                        {app.faculty_supervisor_name || (language === 'ms' ? 'Belum ditugaskan' : 'Not assigned')}
                    </td>
                    <td className="p-4">
                        <div className="flex justify-center gap-2">
                        {(hasSystemAccess || currentUser.role === UserRole.LECTURER) && app.application_status === 'Menunggu' && (
                            <>
                                <button onClick={() => { setStatusConfirmData({app, newStatus: 'Diluluskan'}); setModalType('statusConfirm'); }} className="p-2 bg-green-100 text-green-600 rounded"><FileCheck size={18} /></button>
                                <button onClick={() => { setStatusConfirmData({app, newStatus: 'Ditolak'}); setModalType('statusConfirm'); }} className="p-2 bg-red-100 text-red-600 rounded"><FileX size={18} /></button>
                            </>
                        )}
                        {currentUser.role === UserRole.STUDENT && (
                            <button onClick={() => { setSelectedApp(app); setModalType('letter'); }} className="p-2 bg-purple-100 text-purple-600 rounded" title={t(language, 'appJanaSurat')}>
                                <Printer size={18} />
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

        <Modal isOpen={modalType === 'statusConfirm'} onClose={() => setModalType(null)} title={language === 'ms' ? 'Pengesahan Status' : 'Status Confirmation'}>
            <div className="space-y-4">
                <p>{language === 'ms' ? `Tukar status permohonan kepada ${statusConfirmData?.newStatus}?` : `Change application status to ${statusConfirmData?.newStatus}?`}</p>
                <div className="flex gap-2">
                    <button onClick={() => setModalType(null)} className="flex-1 p-2 border rounded">{t(language, 'cancel')}</button>
                    <button onClick={handleConfirmStatusChange} className="flex-1 p-2 bg-blue-600 text-white rounded font-bold">{t(language, 'confirm')}</button>
                </div>
            </div>
        </Modal>

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
    </div>
  );
};
