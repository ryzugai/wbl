import React from 'react';
import { Printer, Book, ChevronRight } from 'lucide-react';

const SectionTitle = ({ children }: { children?: React.ReactNode }) => (
  <h3 className="text-xl font-bold text-blue-900 mb-4 mt-8 uppercase border-b-2 border-blue-100 pb-2 print:break-after-avoid">
    {children}
  </h3>
);

const SubSectionTitle = ({ children }: { children?: React.ReactNode }) => (
  <h4 className="text-lg font-bold text-slate-800 mb-3 mt-6 print:break-after-avoid">
    {children}
  </h4>
);

const Paragraph = ({ children }: { children?: React.ReactNode }) => (
  <p className="mb-4 text-justify leading-relaxed text-slate-700">
    {children}
  </p>
);

const ListItem = ({ children }: { children?: React.ReactNode }) => (
  <li className="mb-2 text-justify text-slate-700 leading-relaxed pl-2">
    <span className="mr-2">•</span> {children}
  </li>
);

export const Guidebook: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Book className="text-blue-600" />
          Buku Panduan WBL
        </h2>
        <button 
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Printer size={18} />
          Cetak / Simpan PDF
        </button>
      </div>

      <div className="bg-white p-8 md:p-16 rounded-xl shadow-lg border border-slate-200 max-w-5xl mx-auto print:shadow-none print:border-none print:w-full print:p-0">
        
        {/* === PAGE 1: COVER === */}
        <div className="min-h-[1000px] flex flex-col justify-center text-center border-b-2 border-slate-100 pb-12 mb-12 print:break-after-page print:min-h-screen">
            <div className="mb-12">
                <img src="https://www.utem.edu.my/templates/yootheme/cache/a4/utem-25300x-a44e3a0d.png" alt="Logo UTeM" className="h-32 mx-auto mb-8" />
            </div>
            <h1 className="text-5xl font-extrabold text-blue-900 mb-6 tracking-tight">BUKU PANDUAN</h1>
            <h2 className="text-3xl font-bold text-slate-700 mb-4">PEMBELAJARAN BERASASKAN KERJA</h2>
            <h3 className="text-2xl text-slate-600 mb-12">(WORK BASED LEARNING, WBL)</h3>
            
            <div className="bg-slate-50 p-8 rounded-xl inline-block text-center mx-auto mb-12 border border-slate-200 shadow-sm">
                <p className="font-bold text-xl text-slate-800 mb-2">Ijazah Sarjana Muda Teknousahawanan dengan Kepujian</p>
                <p className="text-lg text-slate-600">Fakulti Pengurusan Teknologi dan Teknousahawanan</p>
                <p className="text-lg text-slate-600">Universiti Teknikal Malaysia Melaka</p>
            </div>
            
            <div className="text-white bg-blue-900 py-4 px-12 rounded-full mx-auto font-bold text-xl">EDISI 2025</div>
        </div>

        {/* === PAGE 2: DEAN'S MESSAGE === */}
        <div className="mb-12 print:break-after-page">
            <SectionTitle>Kata Alu-aluan Dekan</SectionTitle>
            <Paragraph>Assalamualaikum warahmatullahi wabarakatuh dan salam sejahtera.</Paragraph>
            <Paragraph>
                Saya dengan sukacitanya mengalu-alukan para pelajar Program Ijazah Sarjana Muda Teknousahawanan ke program Work-Based Learning (WBL). Buku panduan ini telah dirangka dengan teliti untuk menjadi panduan komprehensif kepada pelajar sepanjang penglibatan mereka dalam program WBL.
            </Paragraph>
            <Paragraph>
                Program WBL ini merupakan satu platform penting yang direka untuk menyediakan pelajar dengan pengalaman dunia sebenar dalam bidang keusahawanan. Melalui penempatan di organisasi yang berkaitan, pelajar akan dapat mengintegrasikan pengetahuan akademik dengan amalan industri, seterusnya meningkatkan kebolehpasaran dan kecekapan mereka sebagai teknousahawan.
            </Paragraph>
            <Paragraph>
                Saya percaya bahawa program WBL ini akan memberi manfaat yang besar kepada pelajar. Pengalaman yang diperolehi melalui penempatan industri akan melengkapkan pelajar dengan kemahiran praktikal, rangkaian profesional, dan keyakinan diri yang diperlukan untuk berjaya dalam dunia pekerjaan dan keusahawanan.
            </Paragraph>
            <Paragraph>
                Saya ingin mengucapkan selamat maju jaya kepada semua pelajar yang akan menjalani program WBL ini. Manfaatkanlah peluang ini sebaik mungkin untuk menimba ilmu, mengasah bakat, dan membina kerjaya yang cemerlang.
            </Paragraph>
            <Paragraph>Sekian, terima kasih.</Paragraph>
            
            <div className="mt-8 pt-4 border-t border-slate-200">
                <p className="font-bold text-lg">PROF. DR. MOHD SYAIFUL RIZAL BIN ABDUL HAMID</p>
                <p className="text-slate-600">Dekan<br/>Fakulti Pengurusan Teknologi dan Teknousahawanan</p>
            </div>
        </div>

        {/* === PAGE 3: COORDINATOR'S MESSAGE === */}
        <div className="mb-12 print:break-after-page">
             <SectionTitle>Kata Alu-aluan Penyelaras BTEC Mod Industri</SectionTitle>
             <Paragraph>Salam sejahtera dan salam WBL.</Paragraph>
             <Paragraph>
                Selaku Penyelaras WBL bagi Program Ijazah Sarjana Muda Teknousahawanan Mod Industri, mengalu-alukan semua pelajar ke program yang direka khas untuk mempersiapkan pelajar menghadapi cabaran dunia pekerjaan dan keusahawanan.
             </Paragraph>
             <Paragraph>
                Buku panduan ini merupakan rujukan utama pelajar sepanjang program WBL. Ia mengandungi maklumat penting mengenai objektif program, struktur pelaksanaan, tanggungjawab pelajar, dan proses penilaian. Saya menggalakkan pelajar untuk membaca dan memahami isi kandungan buku panduan ini dengan teliti.
             </Paragraph>
             <Paragraph>
                Program WBL ini menawarkan peluang yang unik untuk pelajar mengaplikasikan pengetahuan akademik dalam persekitaran kerja yang sebenar. Manfaatkanlah peluang ini untuk membina rangkaian profesional, mengasah kemahiran insaniah, dan meneroka pelbagai peluang kerjaya dalam bidang teknousahawanan.
             </Paragraph>
             <Paragraph>
                Saya dan pasukan WBL sentiasa bersedia untuk membantu pelajar sepanjang program ini. Jangan ragu untuk menghubungi kami jika pelajar mempunyai sebarang pertanyaan atau memerlukan bantuan.
             </Paragraph>
             <Paragraph>
                Semoga program WBL ini menjadi pengalaman yang bermakna dan bermanfaat untuk pelajar semua.
             </Paragraph>
             <Paragraph>Selamat maju jaya!</Paragraph>

             <div className="mt-8 pt-4 border-t border-slate-200">
                <p className="font-bold text-lg">Dr. Mohd Guzairy bin Abd Ghani</p>
                <p className="text-slate-600">Penyelaras BTEC Mod Industri<br/>Fakulti Pengurusan Teknologi dan Teknousahawanan</p>
            </div>
        </div>

        {/* === PAGE 4: TABLE OF CONTENTS === */}
        <div className="mb-12 print:break-after-page">
            <h3 className="text-2xl font-bold text-center mb-8 uppercase">Isi Kandungan</h3>
            <div className="space-y-2 text-slate-700 max-w-2xl mx-auto">
                <div className="flex justify-between border-b border-slate-100 py-1"><span>1. Pengenalan WBL</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1 pl-4"><span>1.1 Latar Belakang</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1 pl-4"><span>1.2 Objektif WBL</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1 pl-4"><span>1.3 Definisi WBL</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1 pl-4"><span>1.4 Kepentingan WBL</span></div>
                
                <div className="flex justify-between border-b border-slate-100 py-1 pt-4"><span>2. Struktur WBL</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1 pl-4"><span>2.1 Kursus-kursus Terlibat</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1 pl-4"><span>2.2 Tempoh WBL</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1 pl-4"><span>2.3 Penempatan Industri</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1 pl-4"><span>2.4 Jenis Penempatan</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1 pl-4"><span>2.5 Lokasi Penempatan</span></div>

                <div className="flex justify-between border-b border-slate-100 py-1 pt-4"><span>3. Tanggungjawab Pelajar</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1 pl-4"><span>3.1 Sebelum WBL</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1 pl-4"><span>3.2 Semasa WBL</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1 pl-4"><span>3.3 Selepas WBL</span></div>

                <div className="flex justify-between border-b border-slate-100 py-1 pt-4"><span>4. Tanggungjawab Pengajar dan Jurulatih</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1 pl-4"><span>4.1 Tenaga Pengajar Fakulti</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1 pl-4"><span>4.2 Jurulatih Industri</span></div>

                <div className="flex justify-between border-b border-slate-100 py-1 pt-4"><span>5. Penilaian WBL</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1 pt-4"><span>6. Etika dan Peraturan</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1 pt-4"><span>7. Peranan Penyelaras WBL</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1 pt-4"><span>8. Peranan Fakulti</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1 pt-4"><span>9. Manfaat WBL</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1 pt-4"><span>10. Penutup</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1 pt-4"><span>11. Lampiran</span></div>
            </div>
        </div>

        {/* === CHAPTER 1: PENGENALAN === */}
        <div className="mb-12">
            <SectionTitle>1. Pengenalan WBL</SectionTitle>
            
            <SubSectionTitle>1.1 Latar Belakang</SubSectionTitle>
            <Paragraph>
                Dalam era globalisasi dan persaingan yang semakin sengit, graduan perlu dilengkapi dengan pengetahuan, kemahiran, dan pengalaman yang relevan untuk berjaya dalam dunia pekerjaan. Program Pembelajaran Berasaskan Kerja (Work-Based Learning-WBL) bagi Ijazah Sarjana Muda Teknousahawanan direka bentuk khusus untuk memenuhi keperluan ini. Program ini menggabungkan pembelajaran akademik dengan pengalaman kerja di organisasi yang berkaitan, menyediakan pelajar dengan peluang untuk mengaplikasikan teori yang dipelajari di dalam kuliah dalam persekitaran dunia sebenar.
            </Paragraph>
            <Paragraph>
                Fakulti Pengurusan Teknologi dan Teknousahawanan (FPTT) komited untuk melahirkan graduan yang bukan sahaja cemerlang dalam bidang akademik, tetapi juga mempunyai kemahiran praktikal, kecekapan profesional, dan rangkaian industri yang kukuh. Program WBL ini merupakan salah satu inisiatif strategik fakulti untuk mencapai matlamat tersebut.
            </Paragraph>

            <SubSectionTitle>1.2 Objektif WBL</SubSectionTitle>
            <Paragraph>Program WBL ini mempunyai beberapa objektif utama:</Paragraph>
            <ul className="list-none space-y-2 mb-4">
                <ListItem><strong>Mengaplikasikan Teori:</strong> Memberi peluang kepada pelajar untuk mengaplikasikan teori, konsep, dan model yang dipelajari di dalam kelas dalam persekitaran kerja yang sebenar.</ListItem>
                <ListItem><strong>Meningkatkan Kemahiran:</strong> Meningkatkan kemahiran profesional dan kecekapan pelajar dalam bidang teknousahawanan, seperti analisis perniagaan, pengurusan penjenamaan, keusahawanan digital, dan pengurusan projek.</ListItem>
                <ListItem><strong>Membina Rangkaian:</strong> Membina rangkaian profesional dengan pakar industri, bakal majikan, dan usahawan yang berjaya.</ListItem>
                <ListItem><strong>Memupuk Sikap Profesional:</strong> Memupuk sikap berdikari, bertanggungjawab, berdaya saing, dan beretika dalam diri pelajar.</ListItem>
                <ListItem><strong>Menyediakan untuk Kerjaya:</strong> Menyediakan pelajar untuk menghadapi cabaran dunia pekerjaan dan keusahawanan, serta meningkatkan kebolehpasaran mereka.</ListItem>
            </ul>

            <SubSectionTitle>1.3 Definisi WBL</SubSectionTitle>
            <Paragraph>
                Pembelajaran Berasaskan Kerja atau WBL (Work Based Learning) merupakan satu pendekatan pembelajaran yang menggabungkan pengalaman kerja dengan kurikulum akademik. Dalam konteks program ini, WBL merujuk kepada penempatan pelajar di syarikat atau organisasi yang berkaitan dengan bidang teknousahawanan untuk tempoh masa tertentu. Semasa penempatan, pelajar akan terlibat secara aktif dalam operasi harian organisasi, melaksanakan tugasan yang diberikan, dan mempelajari amalan terbaik industri.
            </Paragraph>
            <Paragraph>
                WBL bukan sekadar latihan praktikal atau internship. Ia merupakan satu pengalaman pembelajaran yang terancang dan terstruktur, di mana pelajar akan dibimbing oleh Tenaga Pengajar Fakulti (TPF) dan Jurulatih Industri (JI) untuk mencapai objektif pembelajaran yang spesifik.
            </Paragraph>

            <SubSectionTitle>1.4 Kepentingan WBL</SubSectionTitle>
            <Paragraph>Program WBL menawarkan pelbagai manfaat kepada pelajar, termasuk:</Paragraph>
            <ul className="list-none space-y-2">
                <ListItem><strong>Meningkatkan Kemahiran Praktikal:</strong> Mengaplikasikan pengetahuan teori dalam situasi dunia sebenar.</ListItem>
                <ListItem><strong>Membina Rangkaian Profesional:</strong> Interaksi dengan pakar industri dan bakal majikan.</ListItem>
                <ListItem><strong>Meningkatkan Kebolehpasaran:</strong> Pengalaman kerja yang relevan meningkatkan nilai graduan.</ListItem>
                <ListItem><strong>Membangunkan Kemahiran Insaniah:</strong> Komunikasi, kerja berpasukan, dan penyelesaian masalah.</ListItem>
                <ListItem><strong>Meneroka Peluang Kerjaya:</strong> Membolehkan pelajar membuat keputusan tepat mengenai hala tuju kerjaya.</ListItem>
                <ListItem><strong>Membina Keyakinan Diri:</strong> Meningkatkan keupayaan untuk berdikari dan menghadapi cabaran.</ListItem>
                <ListItem><strong>Memahami Budaya Kerja:</strong> Pendedahan kepada etika profesional dan amalan terbaik industri.</ListItem>
                <ListItem><strong>Mengukuhkan Pembelajaran Akademik:</strong> Menghubungkan teori dengan amalan.</ListItem>
                <ListItem><strong>Meningkatkan Motivasi:</strong> Meningkatkan semangat belajar untuk kejayaan akademik dan kerjaya.</ListItem>
            </ul>
        </div>

        {/* === CHAPTER 2: STRUKTUR === */}
        <div className="mb-12">
            <SectionTitle>2. Struktur WBL</SectionTitle>

            <SubSectionTitle>2.1 Kursus-kursus Terlibat</SubSectionTitle>
            <Paragraph>
                Program WBL ini direka bentuk untuk melengkapkan pelajar dengan kemahiran dan pengetahuan yang diperlukan dalam bidang teknousahawanan. Oleh itu, program ini melibatkan empat kursus teras yang saling melengkapi:
            </Paragraph>

            <div className="space-y-6 ml-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h5 className="font-bold text-blue-800">i. BTMT 3283(i) Analitik Perniagaan</h5>
                    <p className="text-sm mb-2">Tumpuan kepada analisis data, mengenal pasti trend, dan membuat keputusan strategik. Pelajar mempelajari teknik analisis data dan penggunaan perisian statistik.</p>
                    <p className="text-xs font-semibold text-slate-600">Kemahiran: Analisis data, Pemikiran kritis, Penyelesaian masalah, Penyelidikan pasaran, Peramalan perniagaan.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h5 className="font-bold text-blue-800">ii. BTMT 2113(i) Pengurusan Penjenamaan</h5>
                    <p className="text-sm mb-2">Mendedahkan pelajar kepada strategi membina dan mengurus jenama yang kukuh. Mempelajari konsep penjenamaan, strategi pemasaran, dan pengurusan reputasi.</p>
                    <p className="text-xs font-semibold text-slate-600">Kemahiran: Strategi penjenamaan, Pemasaran, Komunikasi, Kreativiti, Pengurusan jenama.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h5 className="font-bold text-blue-800">iii. BTMT 3273(i) Keusahawanan Digital</h5>
                    <p className="text-sm mb-2">Meneroka peluang perniagaan dalam talian, pemasaran digital, dan e-dagang.</p>
                    <p className="text-xs font-semibold text-slate-600">Kemahiran: Pemasaran digital, E-dagang, Media sosial, Pembangunan web, Perniagaan dalam talian.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h5 className="font-bold text-blue-800">iv. BTMU 4084(i) Projek Sarjana Muda 2</h5>
                    <p className="text-sm mb-2">Melibatkan projek penyelidikan berkaitan teknologi keusahawanan. Membangunkan kerangka teori, laporan kajian dan pembentangan.</p>
                    <p className="text-xs font-semibold text-slate-600">Kemahiran: Pengurusan kajian, Keusahawanan, Kepimpinan, Kerja berpasukan, Komunikasi.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h5 className="font-bold text-blue-800">v. BTMU 4056(i) Latihan Industri / BTMU 4066(i) Portfolio Latihan Industri</h5>
                    <p className="text-sm mb-2">Projek perantis/latihan keusahawanan. Membangunkan idea perniagaan, menulis pelan perniagaan, dan strategi pemasaran.</p>
                    <p className="text-xs font-semibold text-slate-600">Kemahiran: Keusahawanan, Kepimpinan, Kerja berpasukan, Komunikasi.</p>
                </div>
            </div>

            <SubSectionTitle>2.2 Tempoh WBL</SubSectionTitle>
            <Paragraph>
                Program WBL ini dijalankan selama <strong>satu tahun (52 minggu)</strong> bermula pada semester ketujuh pengajian. Tempoh ini memberi masa yang mencukupi kepada pelajar untuk mendalami operasi organisasi.
            </Paragraph>

            <SubSectionTitle>2.3 Penempatan Industri</SubSectionTitle>
            <Paragraph>
                Pelajar akan ditempatkan di syarikat-syarikat atau organisasi yang berkaitan dengan bidang teknousahawanan. Penempatan diuruskan oleh fakulti dengan kerjasama rakan industri.
            </Paragraph>

            <SubSectionTitle>2.4 Jenis Penempatan</SubSectionTitle>
            <ul className="list-none space-y-2 mb-4">
                <ListItem><strong>Penempatan Berstruktur:</strong> Organisasi dengan program WBL mantap dan bimbingan terancang.</ListItem>
                <ListItem><strong>Penempatan Bebas:</strong> Pelajar mencari sendiri peluang di organisasi relevan dengan kelulusan fakulti.</ListItem>
            </ul>

            <SubSectionTitle>2.5 Lokasi Penempatan</SubSectionTitle>
            <Paragraph>
                Boleh dijalankan di seluruh negara, bergantung kepada peluang tersedia dan persetujuan fakulti.
            </Paragraph>
        </div>

        {/* === CHAPTER 3: TANGGUNGJAWAB PELAJAR === */}
        <div className="mb-12">
            <SectionTitle>3. Tanggungjawab Pelajar</SectionTitle>

            <SubSectionTitle>3.1 Sebelum WBL</SubSectionTitle>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li><strong>Menghadiri Taklimat WBL:</strong> Wajib dihadiri untuk memahami objektif dan prosedur.</li>
                <li><strong>Memohon Penempatan Industri:</strong> Melalui platform fakulti, disertakan resume dan transkrip.</li>
                <li><strong>Menyediakan Dokumen:</strong> Resume profesional, surat permohonan khusus, dan transkrip akademik.</li>
                <li><strong>Mengikuti Etika:</strong> Mematuhi etika berpakaian, kehadiran, dan komunikasi.</li>
            </ul>

            <SubSectionTitle>3.2 Semasa WBL</SubSectionTitle>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li><strong>Melaksanakan Tugasan:</strong> Dengan dedikasi dan profesionalisme.</li>
                <li><strong>Mengikuti aktiviti P&P:</strong> Mengikuti aktiviti kursus yang diberikan oleh Tenaga Pengajar Fakulti.</li>
                <li><strong>Menepati Masa:</strong> Patuhi jadual kerja organisasi.</li>
                <li><strong>Menunjukkan Sikap Positif:</strong> Proaktif dan terbuka kepada maklum balas.</li>
                <li><strong>Mendokumentasikan Pengalaman:</strong> Catat dalam Laporan Harian WBL.</li>
                <li><strong>Menghadiri Sesi Pemantauan:</strong> Bersama Tenaga Pengajar Fakulti dan Jurulatih Industri.</li>
            </ul>

            <SubSectionTitle>3.3 Selepas WBL</SubSectionTitle>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li><strong>Menyiapkan Laporan WBL:</strong> Dokumentasi komprehensif mengikut format ditetapkan.</li>
                <li><strong>Membuat Pembentangan WBL:</strong> Di hadapan panel penilai.</li>
                <li><strong>Sesi Refleksi:</strong> Berkongsi pengalaman dan cadangan penambahbaikan.</li>
            </ul>
        </div>

        {/* === CHAPTER 4: TANGGUNGJAWAB PENGAJAR === */}
        <div className="mb-12">
            <SectionTitle>4. Tanggungjawab Pengajar dan Jurulatih</SectionTitle>
            
            <SubSectionTitle>4.1 Tenaga Pengajar Fakulti</SubSectionTitle>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Memberi taklimat dan bimbingan WBL.</li>
                <li>Melaksanakan PnP Kursus (kuliah, penilaian, pemantauan).</li>
                <li>Menilai Pembelajaran (tugasan, prestasi, maklum balas).</li>
                <li>Memantau Perkembangan melalui komunikasi berkala.</li>
                <li>Memberi Maklum Balas yang membina.</li>
            </ul>

            <SubSectionTitle>4.2 Jurulatih Industri</SubSectionTitle>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Memberi tugasan yang relevan dan mencabar.</li>
                <li>Menilai prestasi secara berkala (kualiti kerja, komitmen).</li>
                <li>Memberi maklum balas tentang kekuatan dan kelemahan.</li>
                <li>Mengisi Borang Penilaian prestasi pelajar.</li>
            </ul>
        </div>

        {/* === CHAPTER 5: PENILAIAN === */}
        <div className="mb-12">
            <SectionTitle>5. Penilaian WBL</SectionTitle>
            <Paragraph>Penilaian adalah komprehensif dan mengambil kira pelbagai aspek:</Paragraph>

            <div className="space-y-4">
                <div className="bg-white border border-slate-200 p-4 rounded shadow-sm">
                    <h5 className="font-bold text-blue-800">i. Penilaian Jurulatih Industri (40%)</h5>
                    <p className="text-sm">Berdasarkan pemerhatian prestasi, komitmen, dan profesionalisme di tempat kerja (Kualiti Kerja, Ketepatan Masa, Kehadiran, Inisiatif, Komunikasi, Kerja Berpasukan, Etika).</p>
                </div>
                
                <div className="bg-white border border-slate-200 p-4 rounded shadow-sm">
                    <h5 className="font-bold text-blue-800">ii. Buku Laporan Mingguan WBL (20%)</h5>
                    <p className="text-sm">Catatan harian tentang pengalaman, pembelajaran, dan refleksi. Dinilai oleh Tenaga Pengajar Fakulti (Konsistensi, Refleksi, Penulisan).</p>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded shadow-sm">
                    <h5 className="font-bold text-blue-800">iii. Laporan Akhir WBL (20%)</h5>
                    <p className="text-sm">Dokumentasi komprehensif tugasan dan projek. Dinilai berdasarkan kejelasan, analisis data, dan penulisan.</p>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded shadow-sm">
                    <h5 className="font-bold text-blue-800">iv. Pembentangan WBL (20%)</h5>
                    <p className="text-sm">Persembahan lisan tentang hasil pembelajaran. Dinilai dari segi komunikasi, visual, dan keyakinan.</p>
                </div>
            </div>
            
            <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200 text-sm text-yellow-800">
                <strong>Nota:</strong> Pelajar perlu memperoleh markah lulus dalam semua komponen untuk lulus program WBL.
            </div>
        </div>

        {/* === CHAPTER 6: PERLAKSANAAN === */}
        <div className="mb-12">
            <SectionTitle>6. Perlaksanaan WBL</SectionTitle>
            
            <SubSectionTitle>6.1 Takwim Pelaksanaan</SubSectionTitle>
            
            <div className="overflow-x-auto mb-6">
                <h5 className="font-bold text-center mb-2">Jadual 6.1: Takwim WBL Semester 7 (Minggu 1 - 20)</h5>
                <table className="w-full text-xs border border-slate-300">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="border p-1">Aktiviti / Minggu</th>
                            {[...Array(20)].map((_, i) => <th key={i} className="border p-1">{i+1}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border p-1 font-semibold">Lapor diri / Orientasi</td>
                            <td className="border p-1 bg-slate-300" colSpan={2}></td>
                            <td className="border p-1" colSpan={18}></td>
                        </tr>
                        <tr>
                            <td className="border p-1 font-semibold">Lawatan Pertama</td>
                            <td className="border p-1 bg-slate-300" colSpan={2}></td>
                            <td className="border p-1" colSpan={18}></td>
                        </tr>
                        <tr>
                            <td className="border p-1">BTMT 3283(i) Analitik</td>
                            <td className="border p-1 bg-slate-300" colSpan={5}></td>
                            <td className="border p-1" colSpan={15}></td>
                        </tr>
                        <tr>
                            <td className="border p-1">BTMU 2103(i) Operasi</td>
                            <td className="border p-1" colSpan={5}></td>
                            <td className="border p-1 bg-slate-300" colSpan={5}></td>
                            <td className="border p-1" colSpan={10}></td>
                        </tr>
                        <tr>
                            <td className="border p-1">BTMT 3273(i) Digital</td>
                            <td className="border p-1" colSpan={10}></td>
                            <td className="border p-1 bg-slate-300" colSpan={5}></td>
                            <td className="border p-1" colSpan={5}></td>
                        </tr>
                         <tr>
                            <td className="border p-1">BTMT 2113(i) Jenama</td>
                            <td className="border p-1" colSpan={15}></td>
                            <td className="border p-1 bg-slate-300" colSpan={5}></td>
                        </tr>
                         <tr>
                            <td className="border p-1">Lawatan 2</td>
                            <td className="border p-1" colSpan={10}></td>
                            <td className="border p-1 bg-slate-300" colSpan={2}></td>
                            <td className="border p-1" colSpan={8}></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="overflow-x-auto mb-6">
                 <h5 className="font-bold text-center mb-2">Jadual 6.2: Takwim WBL Semester 8 (Minggu 21 - 52)</h5>
                 <table className="w-full text-xs border border-slate-300 text-center">
                    <thead className="bg-slate-100">
                        <tr>
                             <th className="border p-2">Minggu 21-23</th>
                             <th className="border p-2">Minggu 24 - 49 (Latihan Industri Penuh)</th>
                             <th className="border p-2">Minggu 50-52</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                             <td className="border p-2">Lawatan 3</td>
                             <td className="border p-2 bg-slate-50" rowSpan={3}>Pelaksanaan Latihan Industri Penuh (24 Minggu)</td>
                             <td className="border p-2"></td>
                        </tr>
                        <tr>
                             <td className="border p-2"></td>
                             <td className="border p-2">Penyerahan Laporan Akhir</td>
                        </tr>
                         <tr>
                             <td className="border p-2"></td>
                             <td className="border p-2 bg-slate-300">Lawatan 4</td>
                        </tr>
                    </tbody>
                 </table>
            </div>

            <SubSectionTitle>6.3 Penilaian dan Pentaksiran</SubSectionTitle>
            <Paragraph>Jenis penilaian mengikut kursus adalah seperti berikut:</Paragraph>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm border border-slate-300 mb-6">
                    <thead className="bg-blue-50">
                        <tr>
                            <th className="border p-2 text-left">Kursus</th>
                            <th className="border p-2 text-left">Penilaian Industri</th>
                            <th className="border p-2 text-left">Penilaian UTeM</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border p-2 font-medium">BTMT 3283(i) Analitik Perniagaan<br/>BTMU 2103(i) Pengurusan Operasi<br/>BTMT 3273(i) Keusahawanan Digital<br/>BTMT 2113(i) Pengurusan Jenama</td>
                            <td className="border p-2">
                                <ul className="list-disc pl-4">
                                    <li>Laporan Mingguan (20%)</li>
                                    <li>Kemahiran Insaniah (20%)</li>
                                </ul>
                            </td>
                            <td className="border p-2">
                                <ul className="list-disc pl-4">
                                    <li>Pembentangan (20%)</li>
                                    <li>Laporan Kajian Kes (40%)</li>
                                </ul>
                            </td>
                        </tr>
                        <tr>
                            <td className="border p-2 font-medium">BTMU 4084(i) Projek Sarjana Muda II</td>
                            <td className="border p-2">
                                <ul className="list-disc pl-4">
                                    <li>Laporan Mingguan (20%)</li>
                                    <li>Kemajuan Kajian (10%)</li>
                                    <li>Pembentangan (10%)</li>
                                </ul>
                            </td>
                            <td className="border p-2">
                                <ul className="list-disc pl-4">
                                    <li>Laporan (50%)</li>
                                    <li>Pembentangan (10%)</li>
                                </ul>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <SubSectionTitle>6.4 Lawatan Pensyarah ke Tempat Industri</SubSectionTitle>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li><strong>Lawatan Pertama:</strong> Pengenalan dan taklimat awal. Pertemuan dengan wakil industri.</li>
                <li><strong>Lawatan Kedua:</strong> Maklum balas awal, perbincangan kemajuan PSM 2.</li>
                <li><strong>Lawatan Ketiga:</strong> Fokus kepada pelaksanaan aktiviti latihan industri sepenuhnya.</li>
                <li><strong>Lawatan Keempat:</strong> Penilaian pencapaian pelajar, penglibatan, dan pemantapan kemahiran.</li>
            </ul>
        </div>
      </div>
    </div>
  );
};