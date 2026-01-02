
import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { User } from '../types';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Language, t } from '../translations';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onGoToRegister: () => void;
  language: Language;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onGoToRegister, language }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const user = await StorageService.login(username, password);
        if (user) {
            onLoginSuccess(user);
        } else {
            toast.error(language === 'ms' ? 'Username atau password salah' : 'Invalid username or password');
        }
    } catch (e: any) {
        toast.error(e.message || 'Error logging in');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md animate-fadeIn">
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t(language, 'password')}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white pr-10"
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
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            {t(language, 'login')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onGoToRegister}
            className="text-sm text-blue-600 font-medium hover:underline"
          >
            {t(language, 'register')}
          </button>
        </div>
      </div>
    </div>
  );
};
