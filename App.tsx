
import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import { User, Company, Application } from './types';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Companies } from './pages/Companies';
import { Students } from './pages/Students';
import { Applications } from './pages/Applications';
import { UploadExcel } from './pages/UploadExcel';
import { Profile } from './pages/Profile';
import { StaffList } from './pages/StaffList';
import { Guidebook } from './pages/Guidebook';
import { SystemData } from './pages/SystemData';
import { Toaster, toast } from 'react-hot-toast';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Data State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const refreshData = () => {
    setCompanies(StorageService.getCompanies());
    setApplications(StorageService.getApplications());
    setUsers(StorageService.getUsers());
  };

  // Load Initial Data & Subscribe to changes
  useEffect(() => {
    const user = StorageService.getCurrentUser();
    if (user) setCurrentUser(user);
    
    refreshData();
    setIsAuthChecking(false);

    // Subscribe to cross-tab updates
    const unsubscribe = StorageService.subscribe(() => {
        refreshData();
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
    refreshData(); // Refresh data on login to get latest registered users
    toast.success(`Selamat datang, ${user.name}!`);
  };

  const handleLogout = () => {
    StorageService.logout();
    setCurrentUser(null);
    setCurrentView('login');
    toast('Telah log keluar');
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
        const savedUser = await StorageService.updateUser(updatedUser);
        if (currentUser && currentUser.id === savedUser.id) {
            setCurrentUser(savedUser); // Update session state if updating self
        }
        refreshData();
        toast.success('Profil berjaya dikemaskini');
    } catch (error: any) {
        toast.error(`Gagal mengemaskini profil: ${error.message}`);
        throw error; // Re-throw so modal stays open
    }
  };

  const handleDeleteUser = async (id: string) => {
      try {
        await StorageService.deleteUser(id);
        refreshData();
        toast.success('Pengguna berjaya dipadam');
      } catch(e) {
        toast.error('Gagal memadam pengguna');
      }
  };

  const handleAddCompany = async (companyData: Omit<Company, 'id'>) => {
      try {
          await StorageService.createCompany(companyData);
          refreshData();
          toast.success('Syarikat berjaya ditambah');
      } catch (e: any) {
          toast.error(`Gagal menambah syarikat: ${e.message}`);
          throw e;
      }
  };

  const handleUpdateCompany = async (company: Company) => {
      try {
          await StorageService.updateCompany(company);
          refreshData();
          toast.success('Maklumat syarikat dikemaskini');
      } catch (e: any) {
          toast.error(`Gagal mengemaskini syarikat: ${e.message}`);
          throw e; // PENTING: Melempar ralat semula supaya modal tidak tutup
      }
  };

  const handleDeleteCompany = async (id: string) => {
      try {
          await StorageService.deleteCompany(id);
          refreshData();
          toast.success('Syarikat dipadam');
      } catch (e: any) {
          toast.error(`Gagal memadam: ${e.message}`);
      }
  };

  const handleApplyInternship = async (company: Company) => {
      if(!currentUser) return;
      
      const currentApps = StorageService.getApplications();
      const myApps = currentApps.filter(a => a.created_by === currentUser.username);
      
      if(myApps.length >= 3) {
          toast.error('Anda telah mencapai had maksimum 3 permohonan.');
          return;
      }
      
      if(myApps.find(a => a.company_name === company.company_name)) {
          toast.error('Anda sudah memohon ke syarikat ini.');
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
          reply_form_verified: false
      };

      try {
        await StorageService.createApplication(newApp);
        refreshData();
        toast.success('Permohonan berjaya dihantar!');
      } catch (error: any) {
        console.error(error);
        toast.error(`Ralat menghantar permohonan: ${error.message}`);
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
            if (otherPendingApps.length > 0) {
                toast(`${otherPendingApps.length} permohonan lain telah ditolak secara automatik.`);
            }
        }

        refreshData();
        toast.success('Status permohonan dikemaskini');
      } catch (error: any) {
        console.error(error);
        toast.error(`Gagal mengemaskini permohonan: ${error.message}`);
        throw error;
      }
  };

  if (isAuthChecking) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  if (!currentUser) {
    return (
      <>
        <Toaster position="top-right" />
        {currentView === 'register' 
          ? <Register onRegisterSuccess={() => setCurrentView('login')} onBack={() => setCurrentView('login')} /> 
          : <Login onLoginSuccess={handleLogin} onGoToRegister={() => setCurrentView('register')} />
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
      >
        {currentView === 'dashboard' && <Dashboard applications={applications} companies={companies} users={users} />}
        
        {(currentView === 'companies' || currentView === 'addCompany') && (
            <Companies 
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
                users={users} 
                applications={applications} 
                currentUser={currentUser}
                onUpdateApplication={handleUpdateApplication}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
            />
        )}

        {currentView === 'applications' && (
            <Applications 
                currentUser={currentUser}
                applications={applications}
                users={users}
                companies={companies}
                onUpdateApplication={handleUpdateApplication}
            />
        )}

        {currentView === 'profile' && <Profile user={currentUser} onUpdateUser={handleUpdateUser} />}
        
        {currentView === 'staff' && (
            <StaffList 
                users={users} 
                currentUser={currentUser}
                applications={applications}
                onUpdateApplication={handleUpdateApplication}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
            />
        )}
        
        {currentView === 'uploadExcel' && <UploadExcel onUploadSuccess={refreshData} onNavigateToCompanies={() => setCurrentView('companies')} />}
        
        {currentView === 'systemData' && <SystemData onDataRestored={refreshData} />}
        
        {currentView === 'guidebook' && <Guidebook />}
      </Layout>
    </>
  );
}

export default App;
