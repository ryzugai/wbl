
export type Language = 'ms' | 'en';

export const translations = {
  ms: {
    // Nav
    dashboard: "Dashboard",
    companies: "Senarai Syarikat",
    students: "Senarai Pelajar",
    staff: "Senarai Staf",
    applications: "Permohonan",
    statistics: "Statistik",
    guidebook: "Buku Panduan",
    management: "Pengurusan",
    addCompany: "Tambah Syarikat",
    uploadExcel: "Muat Naik Excel",
    systemData: "Sistem & Data",
    profile: "Profil",
    logout: "Log Keluar",
    mainMenu: "Menu Utama",
    references: "Rujukan",

    // Dashboard
    wblSession: "Sesi WBL",
    timelineTitle: "Garis Masa WBL",
    timelineDesc: "Perjalanan program mengikut fasa.",
    today: "HARI INI",
    countdownTitle: "Berbaki ke",
    laporDiri: "Lapor Diri Industri",
    days: "Hari",
    hours: "Jam",
    mins: "Min",
    secs: "Saat",
    recentStatus: "Status Terkini",
    successRate: "Kadar Kejayaan",
    averageApps: "Purata Mohon/Pelajar",

    // Companies
    searchPlaceholder: "Cari syarikat...",
    sortBy: "Susun",
    nameAZ: "Nama (A-Z)",
    latest: "Terkini",
    allStates: "Semua Negeri",
    industry: "Industri",
    location: "Lokasi",
    applicants: "Pemohon",
    actions: "Tindakan",
    apply: "Mohon",
    noCompanies: "Tiada syarikat dijumpai.",

    // Common
    save: "Simpan",
    cancel: "Batal",
    delete: "Padam",
    confirm: "Sahkan",
    loading: "Memproses...",
    back: "Kembali",
    register: "Daftar Akaun Baru",
    login: "Log Masuk",
    username: "Username",
    password: "Password",
  },
  en: {
    // Nav
    dashboard: "Dashboard",
    companies: "Company List",
    students: "Student List",
    staff: "Staff List",
    applications: "Applications",
    statistics: "Statistics",
    guidebook: "Guidebook",
    management: "Management",
    addCompany: "Add Company",
    uploadExcel: "Upload Excel",
    systemData: "System & Data",
    profile: "Profile",
    logout: "Logout",
    mainMenu: "Main Menu",
    references: "References",

    // Dashboard
    wblSession: "WBL Session",
    timelineTitle: "WBL Timeline",
    timelineDesc: "Program journey by phase.",
    today: "TODAY",
    countdownTitle: "Remaining to",
    laporDiri: "Industry Reporting",
    days: "Days",
    hours: "Hrs",
    mins: "Min",
    secs: "Sec",
    recentStatus: "Recent Status",
    successRate: "Success Rate",
    averageApps: "Avg Apps/Student",

    // Companies
    searchPlaceholder: "Search companies...",
    sortBy: "Sort By",
    nameAZ: "Name (A-Z)",
    latest: "Latest",
    allStates: "All States",
    industry: "Industry",
    location: "Location",
    applicants: "Applicants",
    actions: "Actions",
    apply: "Apply",
    noCompanies: "No companies found.",

    // Common
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    confirm: "Confirm",
    loading: "Processing...",
    back: "Back",
    register: "Register New Account",
    login: "Login",
    username: "Username",
    password: "Password",
  }
};

export const t = (lang: Language, key: keyof typeof translations['ms']) => {
  return translations[lang][key] || translations['ms'][key];
};
