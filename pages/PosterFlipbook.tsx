
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { AdConfig } from '../types';
import { Language, t } from '../translations';
import { ChevronLeft, ChevronRight, ExternalLink, BookOpen, Search } from 'lucide-react';

interface PosterFlipbookProps {
  language: Language;
}

export const PosterFlipbook: React.FC<PosterFlipbookProps> = ({ language }) => {
  const [adConfig, setAdConfig] = useState<AdConfig>(StorageService.getAdConfig());
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

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
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <BookOpen size={64} className="mb-4 opacity-20" />
        <p className="text-lg italic">{t(language, 'flipEmpty')}</p>
      </div>
    );
  }

  const activePoster = posters[currentPage];

  return (
    <div className="space-y-8 pb-12">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{t(language, 'flipTitle')}</h2>
        <p className="text-slate-500 mt-2">{t(language, 'flipDesc')}</p>
      </div>

      <div className="relative flex flex-col items-center">
        {/* Flipbook Container */}
        <div className="relative w-full max-w-3xl aspect-[3/4] md:aspect-[4/3] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Page (Visual decoration for "open book" feel on desktop) */}
          <div className="hidden md:block w-1/2 bg-slate-50 border-r border-slate-200 relative overflow-hidden">
             {currentPage > 0 ? (
               <div className="absolute inset-0 opacity-20 blur-sm scale-110">
                 <img src={posters[currentPage - 1].imageUrl} className="w-full h-full object-cover" alt="prev" />
               </div>
             ) : (
               <div className="absolute inset-0 flex items-center justify-center bg-blue-600">
                  <div className="text-white text-center p-8">
                     <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                     <h3 className="text-xl font-bold uppercase tracking-widest">WBL CATALOG</h3>
                     <p className="text-[10px] mt-2 opacity-70">EDISI 2025/2026</p>
                  </div>
               </div>
             )}
             <div className="absolute inset-0 bg-gradient-to-l from-black/5 to-transparent"></div>
          </div>

          {/* Right Page (Active Poster) */}
          <div className={`w-full md:w-1/2 relative bg-white flex flex-col transition-all duration-300 ${isFlipping ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="flex-1 relative group cursor-zoom-in overflow-hidden">
               <img 
                 src={activePoster.imageUrl} 
                 alt={`Poster ${currentPage + 1}`} 
                 className="w-full h-full object-contain"
                 onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x800?text=Imej+Tidak+Sah'; }}
               />
               
               {/* Overlay Link */}
               {activePoster.destinationUrl && (
                 <a 
                   href={activePoster.destinationUrl} 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]"
                 >
                    <div className="bg-white text-blue-600 px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                       <ExternalLink size={20} />
                       {t(language, 'flipViewOffer')}
                    </div>
                 </a>
               )}
            </div>

            {/* Page Info Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PAGE {currentPage + 1} / {totalPosters}</span>
               {activePoster.destinationUrl && (
                 <a href={activePoster.destinationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                   <ExternalLink size={16} />
                 </a>
               )}
            </div>
          </div>

          {/* Spine shadow for "open book" feel */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 bg-gradient-to-r from-black/10 via-transparent to-black/10 pointer-events-none z-10"></div>
        </div>

        {/* Navigation Controls */}
        <div className="flex gap-4 mt-8">
          <button 
            onClick={handlePrev}
            disabled={currentPage === 0}
            className={`p-4 rounded-full shadow-lg transition-all ${currentPage === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50 hover:-translate-x-1 active:scale-90'}`}
          >
            <ChevronLeft size={28} />
          </button>
          
          <div className="flex items-center gap-2">
             {posters.map((_, idx) => (
               <button 
                 key={idx} 
                 onClick={() => setCurrentPage(idx)}
                 className={`h-2 rounded-full transition-all ${idx === currentPage ? 'w-8 bg-blue-600' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
               />
             ))}
          </div>

          <button 
            onClick={handleNext}
            disabled={currentPage === totalPosters - 1}
            className={`p-4 rounded-full shadow-lg transition-all ${currentPage === totalPosters - 1 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50 hover:translate-x-1 active:scale-90'}`}
          >
            <ChevronRight size={28} />
          </button>
        </div>
      </div>

      {/* Helpful Hint */}
      <div className="max-w-md mx-auto bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-700 text-xs">
        <Search className="shrink-0" size={16} />
        <p>{language === 'ms' ? 'Klik pada poster untuk melihat butang pautan ke laman web rasmi syarikat.' : 'Click on the poster to reveal the link button to the company\'s official website.'}</p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pageFlip {
          from { transform: rotateY(0deg); opacity: 1; }
          to { transform: rotateY(-90deg); opacity: 0; }
        }
        .flip-anim { animation: pageFlip 0.3s ease-in-out forwards; }
      `}} />
    </div>
  );
};
