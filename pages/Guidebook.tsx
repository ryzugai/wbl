
import React from 'react';
import { Download, Printer, Book } from 'lucide-react';

export const Guidebook: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Book className="text-blue-600" />
          Buku Panduan WBL (Edisi 2025)
        </h2>
        <button 
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Printer size={18} />
          Cetak / Simpan PDF
        </button>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-xl shadow-lg border border-slate-200 max-w-4xl mx-auto print:shadow-none print:border-none print:w-full">
        
        {/* Page 1: Cover */}
        <div className="text-center border-b-2 border-slate-100 pb-12 mb-12">
            <h1 className="text-4xl font-extrabold text-blue-900 mb-4 tracking-tight">BUKU PANDUAN</h1>
            <h2 className="text-2xl font-bold text-slate-700 mb-2">PEMBELAJARAN BERASASKAN KERJA</h2>
            <h3 className="text-xl text-slate-600 mb-8">(WORK BASED LEARNING, WBL)</h3>
            
            <div className="bg-slate-50 p-6 rounded-lg inline-block text-left mb-8">
                <p className="font-semibold text-slate-800">Ijazah Sarjana Muda Teknousahawanan dengan Kepujian</p>
                <p className="text-slate-600">Fakulti Pengurusan Teknologi dan Teknousahawanan</p>
                <p className="text-slate-600">Universiti Teknikal Malaysia Melaka</p>
            </div>
            
            <div className="text-slate-400 font-bold">EDISI 2025</div>
        </div>

        {/* Page 2: Dean's Message */}
        <div className="mb-12 print:break-after-page">
            <h3 className="text-xl font-bold text-slate-800 mb-4 border-l-4 border-blue-600 pl-3">Kata Alu-aluan Dekan</h3>
            <div className="prose prose-slate text-justify text-slate-700">
                <p className="mb-4">Assalamualaikum warahmatullahi wabarakatuh dan salam sejahtera.</p>
                <p className="mb-4">Saya dengan sukacitanya mengalu-alukan para pelajar Program Ijazah Sarjana Muda Teknousahawanan ke program Work-Based Learning (WBL). Buku panduan ini telah dirangka dengan teliti untuk menjadi panduan komprehensif kepada pelajar sepanjang penglibatan mereka dalam program WBL.</p>
                <p className="mb-4">Program WBL ini merupakan satu platform penting yang direka untuk menyediakan pelajar dengan pengalaman dunia sebenar dalam bidang keusahawanan. Melalui penempatan di organisasi yang berkaitan, pelajar akan dapat mengintegrasikan pengetahuan akademik dengan amalan industri, seterusnya meningkatkan kebolehpasaran dan kecekapan mereka sebagai teknousahawan.</p>
                <p className="mb-4">Saya percaya bahawa program WBL ini akan memberi manfaat yang besar kepada pelajar. Pengalaman yang diperolehi melalui penempatan industri akan melengkapkan pelajar dengan kemahiran praktikal, rangkaian profesional, dan keyakinan diri yang diperlukan untuk berjaya dalam dunia pekerjaan dan keusahawanan.</p>
                <div className="mt-8 pt-4 border-t border-slate-200">
                    <p className="font-bold">Profesor Dr. Mohd Syaiful Rizal bin Abdul Hamid</p>
                    <p className="text-sm">Dekan<br/>Fakulti Pengurusan Teknologi dan Teknousahawanan</p>
                </div>
            </div>
        </div>

        {/* Page 3: Coordinator's Message */}
        <div className="mb-12 print:break-after-page">
             <h3 className="text-xl font-bold text-slate-800 mb-4 border-l-4 border-blue-600 pl-3">Kata Alu-aluan Penyelaras BTEC Mod Industri</h3>
             <div className="prose prose-slate text-justify text-slate-700">
                 <p className="mb-4">Salam sejahtera dan salam WBL.</p>
                 <p className="mb-4">Selaku Penyelaras WBL bagi Program Ijazah Sarjana Muda Teknousahawanan Mod Industri, saya mengalu-alukan semua pelajar ke program yang direka khas untuk mempersiapkan pelajar menghadapi cabaran dunia pekerjaan dan keusahawanan.</p>
                 <p className="mb-4">Buku panduan ini merupakan rujukan utama pelajar sepanjang program WBL. Ia mengandungi maklumat penting mengenai objektif program, struktur pelaksanaan, tanggungjawab pelajar, dan proses penilaian. Saya menggalakkan pelajar untuk membaca dan memahami isi kandungan buku panduan ini dengan teliti.</p>
                 <div className="mt-8 pt-4 border-t border-slate-200">
                    <p className="font-bold">Dr. Mohd Guzairy bin Abd Ghani</p>
                    <p className="text-sm">Penyelaras BTEC Mod Industri<br/>FPTT</p>
                </div>
             </div>
        </div>

        {/* 1. Pengenalan WBL */}
        <div className="mb-8">
            <h3 className="text-lg font-bold text-blue-900 mb-3 uppercase">1. Pengenalan WBL</h3>
            <div className="pl-4 space-y-4 text-slate-700 text-justify">
                <div>
                    <h4 className="font-bold text-slate-800">1.1 Latar Belakang</h4>
                    <p>Program Pembelajaran Berasaskan Kerja (WBL) bagi Ijazah Sarjana Muda Teknousahawanan direka bentuk khusus untuk menggabungkan pembelajaran akademik dengan pengalaman kerja di organisasi yang berkaitan. Ia merupakan inisiatif strategik FPTT untuk melahirkan graduan yang cemerlang dalam akademik dan mempunyai kemahiran praktikal.</p>
                </div>
                <div>
                    <h4 className="font-bold text-slate-800">1.2 Objektif WBL</h4>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Mengaplikasikan Teori:</strong> Dalam situasi dunia sebenar.</li>
                        <li><strong>Meningkatkan Kemahiran:</strong> Profesional, analisis perniagaan, dan digital.</li>
                        <li><strong>Membina Rangkaian:</strong> Dengan pakar industri dan usahawan.</li>
                        <li><strong>Memupuk Sikap Profesional:</strong> Berdikari, bertanggungjawab dan beretika.</li>
                    </ul>
                </div>
            </div>
        </div>

        {/* 2. Struktur WBL */}
        <div className="mb-8">
            <h3 className="text-lg font-bold text-blue-900 mb-3 uppercase">2. Struktur WBL</h3>
            <div className="pl-4 space-y-4 text-slate-700 text-justify">
                <p><strong>2.1 Kursus Terlibat:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>BTMT 3283(i) Analitik Perniagaan</li>
                    <li>BTMT 2113(i) Pengurusan Penjenamaan</li>
                    <li>BTMT 3273(i) Keusahawanan Digital</li>
                    <li>BTMU 4084(i) Projek Sarjana Muda 2</li>
                    <li>BTMU 4056(i) Latihan Industri & Portfolio</li>
                </ul>
                <p><strong>2.2 Tempoh:</strong> Satu tahun (52 minggu) bermula pada semester 7.</p>
            </div>
        </div>

        {/* 3. Tanggungjawab Pelajar */}
        <div className="mb-8">
             <h3 className="text-lg font-bold text-blue-900 mb-3 uppercase">3. Tanggungjawab Pelajar</h3>
             <div className="pl-4 space-y-4 text-slate-700 text-justify">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="bg-slate-50 p-4 rounded border">
                         <h5 className="font-bold text-blue-700 mb-2">Sebelum WBL</h5>
                         <ul className="list-disc pl-4 text-sm">
                             <li>Hadir taklimat wajib</li>
                             <li>Mohon penempatan</li>
                             <li>Sediakan Resume & Transkrip</li>
                         </ul>
                     </div>
                     <div className="bg-slate-50 p-4 rounded border">
                         <h5 className="font-bold text-blue-700 mb-2">Semasa WBL</h5>
                         <ul className="list-disc pl-4 text-sm">
                             <li>Laksana tugasan</li>
                             <li>Patuhi etika kerja</li>
                             <li>Isi Laporan Harian/Log</li>
                             <li>Hadir sesi pemantauan</li>
                         </ul>
                     </div>
                     <div className="bg-slate-50 p-4 rounded border">
                         <h5 className="font-bold text-blue-700 mb-2">Selepas WBL</h5>
                         <ul className="list-disc pl-4 text-sm">
                             <li>Hantar Laporan Akhir</li>
                             <li>Buat Pembentangan</li>
                             <li>Sesi Refleksi</li>
                         </ul>
                     </div>
                 </div>
             </div>
        </div>

        {/* 5. Penilaian */}
        <div className="mb-8 print:break-inside-avoid">
            <h3 className="text-lg font-bold text-blue-900 mb-3 uppercase">5. Penilaian WBL</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border border-slate-300">
                    <thead className="bg-blue-50 text-blue-900 uppercase">
                        <tr>
                            <th className="px-4 py-3 border border-slate-300">Komponen</th>
                            <th className="px-4 py-3 border border-slate-300">Pemberatan</th>
                            <th className="px-4 py-3 border border-slate-300">Penilai</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="px-4 py-2 border border-slate-300 font-medium">Penilaian Jurulatih Industri</td>
                            <td className="px-4 py-2 border border-slate-300 text-center">40%</td>
                            <td className="px-4 py-2 border border-slate-300">Jurulatih Industri (Prestasi, Kualiti Kerja, Etika)</td>
                        </tr>
                        <tr className="bg-slate-50">
                            <td className="px-4 py-2 border border-slate-300 font-medium">Buku Laporan Mingguan</td>
                            <td className="px-4 py-2 border border-slate-300 text-center">20%</td>
                            <td className="px-4 py-2 border border-slate-300">Pensyarah Fakulti</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-2 border border-slate-300 font-medium">Laporan Akhir WBL</td>
                            <td className="px-4 py-2 border border-slate-300 text-center">20%</td>
                            <td className="px-4 py-2 border border-slate-300">Pensyarah Fakulti</td>
                        </tr>
                        <tr className="bg-slate-50">
                            <td className="px-4 py-2 border border-slate-300 font-medium">Pembentangan</td>
                            <td className="px-4 py-2 border border-slate-300 text-center">20%</td>
                            <td className="px-4 py-2 border border-slate-300">Panel Penilai</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        {/* Jadual Takwim Ringkas */}
        <div className="mb-8 print:break-inside-avoid">
             <h3 className="text-lg font-bold text-blue-900 mb-3 uppercase">6. Takwim Pelaksanaan (Ringkasan)</h3>
             <div className="space-y-2 text-sm text-slate-700">
                 <div className="flex gap-4 p-2 bg-slate-50 border border-slate-200 rounded">
                     <span className="font-bold w-32">Minggu 1-2:</span>
                     <span>Lapor diri dan Orientasi di Industri. Lawatan Pertama Pensyarah.</span>
                 </div>
                 <div className="flex gap-4 p-2 bg-white border border-slate-200 rounded">
                     <span className="font-bold w-32">Minggu 3-10:</span>
                     <span>Fokus Kursus: Analitik Perniagaan & Pengurusan Operasi.</span>
                 </div>
                 <div className="flex gap-4 p-2 bg-slate-50 border border-slate-200 rounded">
                     <span className="font-bold w-32">Minggu 11-16:</span>
                     <span>Fokus Kursus: Keusahawanan Digital & Pengurusan Jenama. Lawatan Kedua.</span>
                 </div>
                 <div className="flex gap-4 p-2 bg-white border border-slate-200 rounded">
                     <span className="font-bold w-32">Minggu 24-49:</span>
                     <span>Latihan Industri Penuh (BTMU 4056). Lawatan Ketiga.</span>
                 </div>
                 <div className="flex gap-4 p-2 bg-slate-50 border border-slate-200 rounded">
                     <span className="font-bold w-32">Minggu 50-52:</span>
                     <span>Penyerahan Laporan Akhir & Pembentangan. Lawatan Akhir.</span>
                 </div>
             </div>
        </div>

        <div className="text-center text-xs text-slate-400 mt-12 pt-8 border-t border-slate-100 no-print">
            Dokumen ini dijanakan secara digital daripada Buku Panduan Asal.
        </div>
      </div>
    </div>
  );
};
