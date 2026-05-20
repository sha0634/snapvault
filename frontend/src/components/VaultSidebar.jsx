import React from 'react';
import { Download, Trash2, RotateCcw, ChevronRight, ChevronLeft, FolderClosed, FolderOpen } from 'lucide-react';

export default function VaultSidebar({
  photos,
  onDeletePhoto,
  onDownloadPhoto,
  onReapplyFilter,
  isOpen,
  setIsOpen
}) {
  return (
    <div
      className={`relative h-full flex transition-all duration-500 ease-in-out z-10 ${
        isOpen ? 'w-80 md:w-96' : 'w-14'
      }`}
    >
      {/* Neo-brutalist Collapsible Side Trigger Tab */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-9 h-24 rounded-l-2xl bg-white border-4 border-r-0 border-deep-charcoal flex items-center justify-center shadow-[-4px_4px_0px_0px_rgba(58,51,53,1)] hover:bg-[#FDFBF7] cursor-pointer z-20 group transition-all"
        title={isOpen ? "Collapse Vault" : "Expand Vault"}
      >
        {isOpen ? (
          <ChevronRight className="w-5 h-5 text-deep-charcoal group-hover:translate-x-0.5 transition-transform" />
        ) : (
          <ChevronLeft className="w-5 h-5 text-deep-charcoal group-hover:-translate-x-0.5 transition-transform" />
        )}
      </button>

      {/* Sidebar Content Panel */}
      <div className="w-full h-full bg-white border-l-4 border-deep-charcoal flex flex-col overflow-hidden">
        
        {/* Title Header */}
        {isOpen ? (
          <div className="p-5 border-b-4 border-deep-charcoal flex items-center justify-between bg-matcha-green">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-deep-charcoal" />
              <h2 className="font-display font-black text-sm uppercase tracking-widest text-deep-charcoal m-0">
                Your Photo Vault
              </h2>
            </div>
            <span className="text-xs bg-white text-deep-charcoal border-2 border-deep-charcoal px-2.5 py-0.5 rounded-full font-black">
              {photos.length}
            </span>
          </div>
        ) : (
          /* Collapsed title column */
          <div className="h-full py-8 flex flex-col items-center gap-6 bg-matcha-green/20 select-none cursor-pointer" onClick={() => setIsOpen(true)}>
            <FolderClosed className="w-5 h-5 text-deep-charcoal/80" />
            <span className="writing-mode-vertical font-display font-black text-xs tracking-widest uppercase text-deep-charcoal/70 transform -rotate-180 select-none">
              EXPAND VAULT
            </span>
          </div>
        )}

        {/* Polaroid Grid list */}
        {isOpen && (
          <div className="flex-1 overflow-y-auto p-5 no-scrollbar bg-cream-bg/40">
            {photos.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-center p-4 border-4 border-dashed border-deep-charcoal/20 rounded-2xl bg-white shadow-[4px_4px_0px_0px_rgba(58,51,53,0.1)]">
                <span className="text-4xl mb-3 animate-bounce">📸</span>
                <p className="font-display font-black text-sm uppercase tracking-wider text-deep-charcoal">
                  Vault is Empty
                </p>
                <p className="font-sans text-[11px] font-bold text-deep-charcoal/40 mt-1 max-w-[180px] uppercase">
                  Click shutter to snap a photo!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 animate-fade-in">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group bg-white border-3 border-deep-charcoal p-2.5 pb-6 rounded-none shadow-[3px_3px_0px_0px_rgba(58,51,53,1)] hover:shadow-[5px_5px_0px_0px_rgba(58,51,53,1)] transition-all hover:-translate-y-1 hover:rotate-1"
                  >
                    {/* Polaroid Image Area */}
                    <div className="relative aspect-[4/3] w-full bg-stone-100 overflow-hidden border-2 border-deep-charcoal">
                      <img
                        src={photo.url}
                        alt="Vault Snapshot"
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Hover action overlay */}
                      <div className="absolute inset-0 bg-deep-charcoal/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5">
                        
                        {/* Reapply Filter Button */}
                        <button
                          onClick={() => onReapplyFilter(photo.filter)}
                          className="p-1.5 rounded-lg bg-white border-2 border-deep-charcoal hover:bg-matcha-green text-deep-charcoal cursor-pointer active:scale-90 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          title={`Reapply ${photo.filter}`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        
                        {/* Download Button */}
                        <button
                          onClick={() => onDownloadPhoto(photo)}
                          className="p-1.5 rounded-lg bg-white border-2 border-deep-charcoal hover:bg-blush-pink text-deep-charcoal cursor-pointer active:scale-90 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          title="Save Polaroid"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => onDeletePhoto(photo.id)}
                          className="p-1.5 rounded-lg bg-white border-2 border-deep-charcoal hover:bg-red-300 text-deep-charcoal cursor-pointer active:scale-90 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Small Filter tag display */}
                      {photo.filter !== 'normal' && (
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white font-mono text-[7px] uppercase tracking-widest font-black">
                          {photo.filter}
                        </div>
                      )}
                    </div>

                    {/* Polaroid Cursive Tag */}
                    <div className="font-handwriting text-center text-deep-charcoal mt-2 text-xl font-bold select-none leading-none tracking-wide text-ellipsis overflow-hidden whitespace-nowrap">
                      {photo.date}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
