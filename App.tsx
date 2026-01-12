
import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import { User, Company, Application } from './types';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Companies } from './pages/Companies';
import { Students } from './pages/Students';
import { SupervisedStudents } from './pages/SupervisedStudents';
import { StudentSupervision } from './pages/StudentSupervision';
import { Applications } from './pages/Applications';
import { UploadExcel } from './pages/UploadExcel';
import { Profile } from './pages/Profile';
import { StaffList } from './pages/StaffList';
import { Guidebook } from './pages/Guidebook';
import { SystemData } from './pages/SystemData';
import { Statistics } from './pages/Statistics';
import { Analysis } from './pages/Analysis';
import { PosterFlipbook } from './pages/PosterFlipbook';
import { Toaster, toast } from 'react-hot-toast';
import { Language } from './translations';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('wbl_lang') as Language) || 'ms';
  });

  // Data State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    localStorage.setItem('wbl_lang', language);
  }, [language]);

  const refreshData = () => {
    const latestUsers = StorageService.getUsers();
    const latestCompanies = StorageService.getCompanies();
    const latestApps = StorageService.getApplications();

    setCompanies(latestCompanies);
    setApplications(latestApps);
    setUsers(latestUsers);

    // Kemaskini sesi currentUser jika data profilnya berubah di storage
    if (currentUser) {
        const updatedMe = latestUsers.find(u => u.id === currentUser.id);
        if (updatedMe) {
            const hasChanged = JSON.stringify(updatedMe) !== JSON.stringify(currentUser);
            if (hasChanged) {
                setCurrentUser(updatedMe);
            }
        }
    }
  };

  useEffect(() => {
    const user = StorageService.getCurrentUser();
    if (user) setCurrentUser(user);
    
    refreshData();
    setIsAuthChecking(false);

    const unsubscribe = StorageService.subscribe(() => {
        refreshData();
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
    refreshData(); 
    toast.success(language === 'ms' ? `Selamat datang, ${user.name}!` : `Welcome, ${user.name}!`);
  };

  const handleLogout = () => {
    StorageService.logout();
    setCurrentUser(null);
    setCurrentView('login');
    toast(language === 'ms' ? 'Telah log keluar' : 'Logged out');
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
        const savedUser = await StorageService.updateUser(updatedUser);
        refreshData(); // Panggil segera selepas simpan
        toast.success(language === 'ms' ? 'Profil berjaya dikemaskini' : 'Profile updated');
    } catch (error: any) {
        toast.error(`${language === 'ms' ? 'Gagal mengemaskini' : 'Update failed'}: ${error.message}`);
        throw error;
    }
  };

  const handleDeleteUser = async (id: string) => {
      try {
        await StorageService.deleteUser(id);
        refreshData();
        toast.success(language === 'ms' ? 'Pengguna berjaya dipadam' : 'User deleted');
      } catch(e) {
        toast.error(language === 'ms' ? 'Gagal memadam' : 'Delete failed');
      }
  };

  const handleAddCompany = async (companyData: Omit<Company, 'id'>) => {
      try {
          await StorageService.createCompany(companyData);
          refreshData();
          toast.success(language === 'ms' ? 'Syarikat berjaya ditambah' : 'Company added');
      } catch (e: any) {
          toast.error(`${language === 'ms' ? 'Gagal menambah' : 'Add failed'}: ${e.message}`);
          throw e;
      }
  };

  const handleUpdateCompany = async (company: Company) => {
      try {
          await StorageService.updateCompany(company);
          refreshData();
          toast.success(language === 'ms' ? 'Maklumat syarikat dikemaskini' : 'Company info updated');
      } catch (e: any) {
          toast.error(`${language === 'ms' ? 'Gagal mengemaskini' : 'Update failed'}: ${e.message}`);
          throw e;
      }
  };

  const handleDeleteCompany = async (id: string) => {
      try {
          await StorageService.deleteCompany(id);
          refreshData();
          toast.success(language === 'ms' ? 'Syarikat dipadam' : 'Company deleted');
      } catch (e: any) {
          toast.error(`${language === 'ms' ? 'Gagal memadam' : 'Delete failed'}: ${e.message}`);
      }
  };

  const handleApplyInternship = async (company: Company) => {
      if(!currentUser) return;
      
      const currentApps = StorageService.getApplications();
      const myApps = currentApps.filter(a => a.created_by === currentUser.username);
      
      if(myApps.length >= 4) {
          toast.error(language === 'ms' ? 'Anda telah mencapai had maksimum 4 permohonan.' : 'You have reached the maximum limit of 4 applications.');
          return;
      }
      
      if(myApps.find(a => a.company_name === company.company_name)) {
          toast.error(language === 'ms' ? 'Anda sudah memohon ke syarikat ini.' : 'You have already applied to this company.');
          return;
      }

      const newApp: Omit<Application, 'id'> = {
          student_name: currentUser.name,
          student_id: currentUser.matric_no || '',
          student_email: currentUser.email,
          student_program: currentUser.program || '',
          company_name: company.company_name,
          company_state: company.company_state,
          company_district: company.company_district,
          application_status: 'Menunggu',
          start_date: new Date().toISOString().split('T')[0],
          created_by: currentUser.username,
          created_at: new Date().toISOString(),
          reply_form_verified: false,
          // Bawa bersama info penyelia sedia ada (jika ada)
          faculty_supervisor_id: currentUser.faculty_supervisor_id,
          faculty_supervisor_name: currentUser.faculty_supervisor_name,
          faculty_supervisor_staff_id: currentUser.faculty_supervisor_staff_id
      };

      try {
        await StorageService.createApplication(newApp);
        refreshData();
        toast.success(language === 'ms' ? 'Permohonan berjaya dihantar!' : 'Application sent successfully!');
      } catch (error: any) {
        console.error(error);
        toast.error(`${language === 'ms' ? 'Ralat menghantar permohonan' : 'Error sending application'}: ${error.message}`);
      }
  };

  const handleUpdateApplication = async (app: Application) => {
      try {
        await StorageService.updateApplication(app);
        
        if(app.application_status === 'Diluluskan') {
            const allApps = StorageService.getApplications();
            const otherPendingApps = allApps.filter(a => 
                a.created_by === app.created_by && 
                a.id !== app.id && 
                a.application_status === 'Menunggu'
            );

            for(const other of otherPendingApps) {
                await StorageService.updateApplication({
                    ...other, 
                    application_status: 'Ditolak'
                });
            }
        }

        refreshData();
        toast.success(language === 'ms' ? 'Status dikemaskini' : 'Status updated');
      } catch (error: any) {
        console.error(error);
        toast.error(`${language === 'ms' ? 'Gagal mengemaskini' : 'Update failed'}: ${error.message}`);
        throw error;
      }
  };

  const handleDeleteApplication = async (id: string) => {
      try {
        await StorageService.deleteApplication(id);
        refreshData();
        toast.success(language === 'ms' ? 'Permohonan telah dibatalkan.' : 'Application has been cancelled.');
      } catch (error: any) {
        toast.error(`${language === 'ms' ? 'Gagal membatalkan' : 'Cancellation failed'}: ${error.message}`);
      }
  };

  if (isAuthChecking) return <div className="flex justify-center items-center h-screen font-bold text-blue-600 animate-pulse">Sila tunggu...</div>;

  if (!currentUser) {
    return (
      <>
        <Toaster position="top-right" />
        {currentView === 'register' 
          ? <Register language={language} onLanguageChange={setLanguage} onRegisterSuccess={() => setCurrentView('login')} onBack={() => setCurrentView('login')} /> 
          : <Login language={language} onLanguageChange={setLanguage} onLoginSuccess={handleLogin} onGoToRegister={() => setCurrentView('register')} />
        }
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Layout 
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        language={language}
        onLanguageChange={setLanguage}
      >
        {currentView === 'dashboard' && <Dashboard language={language} applications={applications} companies={companies} users={users} />}
        
        {(currentView === 'companies' || currentView === 'addCompany') && (
            <Companies 
                language={language}
                companies={companies} 
                applications={applications}
                currentUser={currentUser}
                onAddCompany={handleAddCompany}
                onUpdateCompany={handleUpdateCompany}
                onDeleteCompany={handleDeleteCompany}
                onApply={handleApplyInternship}
            />
        )}

        {currentView === 'students' && (
            <Students 
                language={language}
                users={users} 
                applications={applications} 
                currentUser={currentUser}
                onUpdateApplication={handleUpdateApplication}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
            />
        )}

        {currentView === 'supervised' && (
            <SupervisedStudents 
                language={language}
                currentUser={currentUser}
                users={users}
                applications={applications}
                onUpdateApplication={handleUpdateApplication}
            />
        )}

        {currentView === 'studentSupervision' && (
            <StudentSupervision 
                language={language}
                currentUser={currentUser}
                applications={applications}
                users={users}
            />
        )}

        {currentView === 'applications' && (
            <Applications 
                language={language}
                currentUser={currentUser}
                applications={applications}
                users={users}
                companies={companies}
                onUpdateApplication={handleUpdateApplication}
                onDeleteApplication={handleDeleteApplication}
            />
        )}

        {currentView === 'profile' && <Profile language={language} user={currentUser} onUpdateUser={handleUpdateUser} />}
        
        {currentView === 'staff' && (
            <StaffList 
                language={language}
                users={users} 
                currentUser={currentUser}
                applications={applications}
                onUpdateApplication={handleUpdateApplication}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
            />
        )}

        {currentView === 'statistics' && (
          <Statistics 
            language={language}
            applications={applications} 
            companies={companies} 
            users={users} 
          />
        )}

        {currentView === 'analysis' && (
          <Analysis 
            language={language}
            applications={applications} 
            users={users} 
            companies={companies}
            currentUser={currentUser}
          />
        )}

        {currentView === 'poster' && (
          <PosterFlipbook language={language} />
        )}
        
        {currentView === 'uploadExcel' && <UploadExcel language={language} onUploadSuccess={refreshData} onNavigateToCompanies={() => setCurrentView('companies')} />}
        
        {currentView === 'systemData' && <SystemData language={language} onDataRestored={refreshData} />}
        
        {currentView === 'guidebook' && <Guidebook language={language} />}
      </Layout>
    </>
  );
}

export default App;
