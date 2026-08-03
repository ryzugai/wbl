import React, { useState } from 'react';
import { FileText, Download, ExternalLink, ZoomIn, ZoomOut, RotateCw, Image as ImageIcon } from 'lucide-react';

interface DocumentViewerProps {
  fileUrl?: string;
  docTitle?: string;
  studentName?: string;
  matricNo?: string;
  downloadFileName?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  fileUrl,
  docTitle = 'Dokumen',
  studentName,
  matricNo,
  downloadFileName = 'Dokumen.pdf'
}) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-[380px] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 p-6 text-center">
        <FileText size={48} className="text-slate-300 mb-3" />
        <p className="font-bold text-slate-600 text-sm">Dokumen Belum Dimuat Naik</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Pelajar belum memuat naik sebarang fail PDF atau imej surat/borang untuk {docTitle}.
        </p>
      </div>
    );
  }

  const isImage = fileUrl.startsWith('data:image/') || fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i);
  const isPdf = fileUrl.startsWith('data:application/pdf') || fileUrl.endsWith('.pdf');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = downloadFileName;
    link.click();
  };

  const handleOpenNewTab = () => {
    if (fileUrl.startsWith('data:')) {
      const win = window.open();
      if (win) {
        win.document.write(
          `<!DOCTYPE html><html><head><title>${docTitle} - ${studentName || 'WBL'}</title></head><body style="margin:0;background:#0f172a;display:flex;justify-content:center;align-items:center;min-height:100vh;">` +
          (isImage 
            ? `<img src="${fileUrl}" style="max-width:100%;max-height:100vh;object-fit:contain;" />`
            : `<iframe src="${fileUrl}" style="width:100vw;height:100vh;border:none;"></iframe>`
          ) +
          `</body></html>`
        );
      }
    } else {
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <div className="space-y-3">
      {/* Header bar with document info and view actions */}
      <div className="flex flex-wrap items-center justify-between bg-slate-800 text-white p-2.5 rounded-xl text-xs gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          {isImage ? (
            <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-md font-extrabold text-[10px]">
              <ImageIcon size={12} /> IMEJ (JPG/PNG)
            </span>
          ) : isPdf ? (
            <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-md font-extrabold text-[10px]">
              <FileText size={12} /> DOKUMEN PDF
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-md font-extrabold text-[10px]">
              <FileText size={12} /> FAIL DOKUMEN
            </span>
          )}
          {studentName && (
            <span className="text-slate-300 text-[11px] font-medium truncate max-w-[220px]">
              {studentName} {matricNo ? `(${matricNo})` : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {isImage && (
            <>
              <button
                type="button"
                onClick={() => setZoom(prev => Math.min(prev + 25, 200))}
                className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
                title="Besarkan / Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                onClick={() => setZoom(prev => Math.max(prev - 25, 50))}
                className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
                title="Kecilkan / Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <button
                type="button"
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
                title="Putar / Rotate"
              >
                <RotateCw size={14} />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleOpenNewTab}
            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-1 transition-colors text-[11px]"
            title="Buka dalam Tab Baharu / Skrin Penuh"
          >
            <ExternalLink size={13} />
            <span>Skrin Penuh</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1 transition-colors text-[11px]"
            title="Muat Turun Fail"
          >
            <Download size={13} />
            <span>Muat Turun</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden relative h-[450px] flex items-center justify-center p-2 shadow-inner">
        {isImage ? (
          <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
            <img
              src={fileUrl}
              alt={docTitle}
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-in-out'
              }}
              className="max-w-full max-h-[430px] object-contain rounded-lg shadow-lg border border-slate-700/50 bg-white"
            />
          </div>
        ) : isPdf ? (
          <div className="w-full h-full relative">
            <iframe
              src={fileUrl}
              className="w-full h-full rounded-xl border-0 bg-white"
              title={docTitle}
            />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-6 text-center">
            <FileText size={48} className="text-slate-500 mb-2" />
            <p className="text-sm font-bold">Paparan Pratonton Fail</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Fail bersedia untuk dimuat turun atau dibuka dalam skrin penuh.</p>
            <button
              onClick={handleOpenNewTab}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow"
            >
              <ExternalLink size={14} /> Buka Fail
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
