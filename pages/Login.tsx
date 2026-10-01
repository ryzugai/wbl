
import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { User } from '../types';
import { Building2, Eye, EyeOff, Languages, HelpCircle, Mail, Send, CheckCircle2, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Language, t } from '../translations';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onGoToRegister: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onGoToRegister, language, onLanguageChange }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Forgot password modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotNote, setForgotNote] = useState('');
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      toast.error(language === 'ms' ? 'Sila masukkan maklumat log masuk anda.' : 'Please enter your login credentials.');
      return;
    }

    setIsLoggingIn(true);
    try {
        const user = await StorageService.login(cleanUser, cleanPass);
        if (user) {
            onLoginSuccess(user);
        } else {
            toast.error(
              language === 'ms' 
                ? 'Akaun tidak ditemui. Sila semak Username, No. Matrik atau Emel anda.' 
                : 'Account not found. Please verify your Username, Matric No or Email.'
            );
        }
    } catch (e: any) {
        toast.error(e.message || (language === 'ms' ? 'Ralat semasa log masuk' : 'Error logging in'));
    } finally {
        setIsLoggingIn(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      toast.error(language === 'ms' ? 'Sila masukkan Username, No. Matrik atau Emel anda.' : 'Please enter your Username, Matric No or Email.');
      return;
    }

    setIsSubmittingForgot(true);
    try {
      await StorageService.requestPasswordReset(forgotIdentifier.trim(), forgotNote.trim());
      setForgotSubmitted(true);
      toast.success(language === 'ms' ? 'Permohonan reset kata laluan berjaya dihantar kepada Penyelaras WBL!' : 'Password reset request sent to WBL Coordinator!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghantar permohonan.');
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md animate-fadeIn relative">
        
        {/* Inline Language Switcher */}
        <div className="absolute top-4 right-4 flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
           <button 
                onClick={() => onLanguageChange('ms')}
                className={`px-2 py-1 text-[10px] font-bold rounded ${language === 'ms' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
                MS
           </button>
           <button 
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-1 text-[10px] font-bold rounded ${language === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
                EN
           </button>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg shadow-blue-200">
            <Building2 size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">WBL System</h1>
          <p className="text-slate-500">{language === 'ms' ? 'Sistem Latihan Industri' : 'Industry Training System'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(language, 'username')}</label>
            <input
              type="text"
              required
              autoCapitalize="none"
              autoComplete="username"
              placeholder={language === 'ms' ? 'cth: B062310215 / aaron / emel' : 'e.g. B062310215 / aaron / email'}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white placeholder:text-slate-400 placeholder:text-xs text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">{t(language, 'password')}</label>
              <button
                type="button"
                onClick={() => {
                  setForgotIdentifier(username);
                  setForgotSubmitted(false);
                  setIsForgotModalOpen(true);
                }}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                {language === 'ms' ? 'Lupa Kata Laluan?' : 'Forgot Password?'}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white pr-10 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoggingIn ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{language === 'ms' ? 'Sedang Log Masuk...' : 'Logging in...'}</span>
              </>
            ) : (
              <span>{t(language, 'login')}</span>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => {
              setForgotIdentifier(username);
              setForgotSubmitted(false);
              setIsForgotModalOpen(true);
            }}
            className="text-amber-700 font-bold hover:underline flex items-center gap-1"
          >
            <HelpCircle size={14} />
            <span>{language === 'ms' ? 'Bantuan Lupa Kata Laluan' : 'Password Help'}</span>
          </button>

          <button
            onClick={onGoToRegister}
            className="text-blue-600 font-bold hover:underline"
          >
            {t(language, 'register')}
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {language === 'ms' ? 'Bantuan Pengguna' : 'User Assistance'}
                </span>
                <h3 className="text-lg font-black mt-1">
                  {language === 'ms' ? 'Lupa Kata Laluan Akaun' : 'Reset Account Password'}
                </h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  {language === 'ms' 
                    ? 'Penyelaras WBL boleh menetapkan semula kata laluan bagi semua akaun (Pelajar, Pensyarah & Jurulatih).' 
                    : 'WBL Coordinator can reset passwords for all accounts.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {forgotSubmitted ? (
                <div className="space-y-4 py-2">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                    <CheckCircle2 size={24} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-emerald-900 text-sm">
                        {language === 'ms' ? 'Permohonan Berjaya Dihantar!' : 'Request Sent Successfully!'}
                      </h4>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        {language === 'ms'
                          ? `Makluman telah dihantar ke papan pemuka Penyelaras WBL bagi akaun "${forgotIdentifier}". Penyelaras akan menetapkan semula kata laluan anda.`
                          : `Notice sent to WBL Coordinator for account "${forgotIdentifier}".`}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2 text-slate-700">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Mail size={14} className="text-blue-600" />
                      <span>{language === 'ms' ? 'Hubungi Penyelaras Secara Terus:' : 'Direct Coordinator Contact:'}</span>
                    </div>
                    <div className="font-semibold text-slate-900">Dr. Mohd Guzairy bin Abd Ghani</div>
                    <div className="text-slate-500 font-mono">guzairy@utem.edu.my</div>
                    <div className="text-slate-500">Penyelaras WBL Fakulti Pengurusan Teknologi & Teknousahawanan (FPTT)</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    {language === 'ms' ? 'Tutup & Kembali ke Log Masuk' : 'Close'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'ms' ? 'Username / No. Matrik / No. Kad Pengenalan / Emel:' : 'Username / Matric No / IC / Email:'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="cth: B062310215 atau username anda"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {language === 'ms' ? 'Sistem akan memadankan akaun anda secara automatik.' : 'System will automatically match your account.'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'ms' ? 'Catatan / Alasan Permohonan (Pilihan):' : 'Note / Reason (Optional):'}
                    </label>
                    <textarea
                      rows={2}
                      placeholder={language === 'ms' ? 'cth: Terlupa kata laluan, mohon reset ke lalai Utem@2026' : 'e.g. Forgot password, please reset'}
                      value={forgotNote}
                      onChange={(e) => setForgotNote(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 leading-relaxed">
                    ℹ️ {language === 'ms' 
                      ? 'Setelah menghantar borang ini, Penyelaras WBL akan menerima notifikasi segera untuk mereset kata laluan akaun anda kepada kata laluan piawai universiti (cth: Utem@2026).' 
                      : 'WBL Coordinator will receive immediate notification to reset your password.'}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(false)}
                      className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                    >
                      {language === 'ms' ? 'Batal' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingForgot}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Send size={13} />
                      <span>{isSubmittingForgot ? (language === 'ms' ? 'Menghantar...' : 'Sending...') : (language === 'ms' ? 'Hantar Permohonan' : 'Submit Request')}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

