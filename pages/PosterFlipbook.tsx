
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { AdConfig, UserRole } from '../types';
import { Language, t } from '../translations';
import { ChevronLeft, ChevronRight, ExternalLink, BookOpen, Search, AlertCircle, Settings } from 'lucide-react';

interface PosterFlipbookProps {
  language: Language;
}

export const PosterFlipbook: React.FC<PosterFlipbookProps> = ({ language }) => {
  const [adConfig, setAdConfig] = useState<AdConfig>(StorageService.getAdConfig());
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  
  const currentUser = StorageService.getCurrentUser();
  const isCoordinator = currentUser?.role === UserRole.COORDINATOR || currentUser?.is_jkwbl;

  useEffect(() => {
    const unsubscribe = StorageService.subscribe(() => {
      setAdConfig(StorageService.getAdConfig());
    });
    return () => unsubscribe();
  }, []);

  const posters = adConfig.isEnabled ? adConfig.items : [];
  const totalPosters = posters.length;

  const handleNext = () => {
    if (currentPage < totalPosters - 1) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsFlipping(false);
      }, 300);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(prev => prev - 1);
        setIsFlipping(false);
      }, 300);
    }
  };

  if (totalPosters === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <BookOpen size={48} className="text-slate-200" />
        </div>
        <h3 className="text-xl font-bold text-slate-700">{t(language, 'flipEmpty')}</h3>
        <p className="text-slate-400 text-sm mt-2 max-w-xs text-center">
            Poster tawaran daripada industri belum dimasukkan atau paparan dinyahaktifkan oleh Penyelaras.
        </p>
        
        {isCoordinator && (
            <button 
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'systemData' }))}
                className="mt-8 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
                <Settings size={18} /> Aktifkan Paparan Iklan
            </button>
        )}
      </div>
    );
  }

  const activePoster = posters[currentPage];

  return (
    <div className="space-y-8 pb-12">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center justify-center gap-3">
            <BookOpen className="text-blue-600" size={32} />
            {t(language, 'flipTitle')}
        </h2>
        <p className="text-slate-500 mt-2">{t(language, 'flipDesc')}</p>
      </div>

      <div className="relative flex flex-col items-center">
        {/* Flipbook Container */}
        <div className="relative w-full max-w-4xl aspect-[4/3] bg-white rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden flex">
          
          {/* Left Page (Visual decoration for "open book" feel on desktop) */}
          <div className="hidden md:block w-1/2 bg-slate-100 border-r border-slate-200 relative overflow-hidden">
             {currentPage > 0 ? (
               <div className="absolute inset-0 opacity-10 blur-md scale-110">
                 <img src={posters[currentPage - 1].imageUrl} className="w-full h-full object-cover" alt="prev" />
               </div>
             ) : (
               <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-700 to-indigo-900">
                  <div className="text-white text-center p-8">
                     <BookOpen size={64} className="mx-auto mb-6 opacity-30" />
                     <h3 className="text-2xl font-black uppercase tracking-[0.2em] leading-tight">CATALOG<br/>OFFERS</h3>
                     <div className="mt-4 w-12 h-1 bg-white/30 mx-auto rounded-full"></div>
                     <p className="text-[10px] mt-4 font-black tracking-widest opacity-60">EDISI 2026/2027</p>
                  </div>
               </div>
             )}
             <div className="absolute inset-0 bg-gradient-to-l from-black/10 to-transparent"></div>
          </div>

          {/* Right Page (Active Poster) */}
          <div className={`w-full md:w-1/2 relative bg-white flex flex-col transition-all duration-500 ${isFlipping ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
            <div className="flex-1 relative group overflow-hidden bg-slate-50 flex items-center justify-center">
               <img 
                 src={activePoster.imageUrl} 
                 alt={`Poster ${currentPage + 1}`} 
                 className="max-w-full max-h-full object-contain"
                 onError={(e) => { 
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = 'https://www.utem.edu.my/templates/yootheme/cache/a4/utem-25300x-a44e3a0d.png';
                    target.className = "max-w-full h-auto p-20 opacity-20 grayscale";
                 }}
               />
               
               {/* Overlay Link */}
               {activePoster.destinationUrl && (
                 <a 
                   href={activePoster.destinationUrl} 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]"
                 >
                    <div className="bg-white text-blue-700 px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-2xl transform translate-y-8 group-hover:translate-y-0 transition-all active:scale-95">
                       <ExternalLink size={20} />
                       {t(language, 'flipViewOffer')}
                    </div>
                 </a>
               )}
            </div>

            {/* Page Info Footer */}
            <div className="p-4 bg-slate-50/80 backdrop-blur-sm border-t border-slate-100 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-[10px]">{currentPage + 1}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DARI {totalPosters} HALAMAN</span>
               </div>
               {activePoster.destinationUrl && (
                 <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-blue-600 hidden sm:block">Klik gambar untuk pautan</span>
                    <a href={activePoster.destinationUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-white text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl shadow-sm transition-all border border-blue-100">
                        <ExternalLink size={18} />
                    </a>
                 </div>
               )}
            </div>
          </div>

          {/* Spine shadow for "open book" feel */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-12 -translate-x-1/2 bg-gradient-to-r from-black/15 via-transparent to-black/15 pointer-events-none z-10"></div>
        </div>

        {/* Navigation Controls */}
        <div className="flex gap-6 mt-12 items-center">
          <button 
            onClick={handlePrev}
            disabled={currentPage === 0}
            className={`w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all ${currentPage === 0 ? 'bg-slate-50 text-slate-200 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50 hover:-translate-x-1 active:scale-90 border border-slate-100'}`}
          >
            <ChevronLeft size={32} />
          </button>
          
          <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-100 rounded-full border border-slate-200">
             {posters.slice(0, 10).map((_, idx) => (
               <button 
                 key={idx} 
                 onClick={() => setCurrentPage(idx)}
                 className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentPage ? 'w-10 bg-blue-600' : 'w-2.5 bg-slate-300 hover:bg-slate-400'}`}
               />
             ))}
             {totalPosters > 10 && <span className="text-[10px] font-black text-slate-400 px-1">...</span>}
          </div>

          <button 
            onClick={handleNext}
            disabled={currentPage === totalPosters - 1}
            className={`w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all ${currentPage === totalPosters - 1 ? 'bg-slate-50 text-slate-200 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50 hover:translate-x-1 active:scale-90 border border-slate-100'}`}
          >
            <ChevronRight size={32} />
          </button>
        </div>
      </div>

      {/* Helpful Hint */}
      <div className="max-w-md mx-auto bg-blue-50 border border-blue-100 p-5 rounded-2xl flex gap-4 text-blue-700">
        <div className="p-2 bg-white rounded-xl h-fit shadow-sm text-blue-600">
            <Search size={18} />
        </div>
        <p className="text-xs font-medium leading-relaxed">
            {language === 'ms' 
                ? 'Gunakan butang anak panah atau klik terus pada halaman untuk melihat tawaran poster daripada rakan industri kami. Klik gambar untuk membuka pautan tawaran rasmi.' 
                : 'Use the arrow buttons or click directly on the page to view poster offers from our industry partners. Click the image to open the official offer link.'}
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pageFlip {
          from { transform: rotateY(0deg); opacity: 1; }
          to { transform: rotateY(-90deg); opacity: 0; }
        }
        .flip-anim { animation: pageFlip 0.4s ease-in-out forwards; }
      `}} />
    </div>
  );
};
