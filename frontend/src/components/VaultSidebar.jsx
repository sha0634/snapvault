import React from 'react';
import { Download, Trash2, Palette, ChevronRight, ChevronLeft, FolderClosed, FolderOpen, LogIn, Sparkles } from 'lucide-react';

export default function VaultSidebar({
  photos,
  onDeletePhoto,
  onDownloadPhoto,
  onReapplyFilter,
  isOpen,
  setIsOpen,
  isLoggedIn,
  onLoginClick,
  selectedPhotoId
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
          <div className={`p-5 border-b-4 border-deep-charcoal flex items-center justify-between ${isLoggedIn ? 'bg-matcha-green' : 'bg-blush-pink'}`}>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-deep-charcoal" />
              <h2 className="font-display font-black text-sm uppercase tracking-widest text-deep-charcoal m-0">
                {isLoggedIn ? 'Your Photo Vault' : 'Guest Session'}
              </h2>
            </div>
            <span className="text-xs bg-white text-deep-charcoal border-2 border-deep-charcoal px-2.5 py-0.5 rounded-full font-black">
              {photos.length}
            </span>
          </div>
        ) : (
          /* Collapsed title column */
          <div 
            className={`h-full py-8 flex flex-col items-center gap-6 select-none cursor-pointer ${isLoggedIn ? 'bg-matcha-green/20' : 'bg-blush-pink/20'}`} 
            onClick={() => setIsOpen(true)}
          >
            <FolderClosed className="w-5 h-5 text-deep-charcoal/80" />
            <span className="writing-mode-vertical font-display font-black text-xs tracking-widest uppercase text-deep-charcoal/70 transform -rotate-180 select-none">
              {isLoggedIn ? 'EXPAND VAULT' : 'GUEST VAULT'}
            </span>
          </div>
        )}

        {/* Warning Banner inside Vault for Guest Sessions */}
        {isOpen && !isLoggedIn && (
          <div className="p-4 bg-blush-pink/30 border-b-4 border-deep-charcoal flex flex-col items-center text-center gap-2.5">
            <span className="font-display font-black text-[10px] tracking-wider uppercase text-deep-charcoal bg-white border-2 border-deep-charcoal px-2 py-0.5 rounded-md shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              ⚠️ Warning
            </span>
            <p className="text-[10px] font-bold text-deep-charcoal/70 uppercase tracking-wide leading-tight max-w-[240px]">
              Guest photos are local to this session and will be lost on page reload!
            </p>
            <button
              onClick={onLoginClick}
              className="retro-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted-lavender hover:bg-[#F7D6D0] text-[9px] font-black uppercase text-deep-charcoal cursor-pointer shadow-[2px_2px_0px_0px_rgba(58,51,53,1)]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login to Sync Vault</span>
            </button>
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
                  Click Shutter to capture your first photo!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 animate-fade-in">
                {photos.map((photo) => {
                  const isBeingEdited = selectedPhotoId === photo.id;
                  return (
                    <div
                      key={photo.id}
                      className={`relative group bg-white p-2.5 pb-6 rounded-none transition-all ${
                        isBeingEdited
                          ? 'border-4 border-blush-pink scale-102 rotate-1 ring-3 ring-deep-charcoal shadow-[5px_5px_0px_0px_rgba(58,51,53,1)]'
                          : 'border-3 border-deep-charcoal shadow-[3px_3px_0px_0px_rgba(58,51,53,1)] hover:shadow-[5px_5px_0px_0px_rgba(58,51,53,1)] hover:-translate-y-1 hover:rotate-1'
                      }`}
                    >
                      {/* Polaroid Image Area */}
                      <div className="relative aspect-[4/3] w-full bg-stone-100 overflow-hidden border-2 border-deep-charcoal">
                        <img
                          src={photo.url}
                          alt="Vault Snapshot"
                          className={`w-full h-full object-cover filter-${photo.filter}`}
                        />
                        
                        {/* Hover action overlay */}
                        <div className="absolute inset-0 bg-deep-charcoal/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5">
                          
                          {/* Customize Filter Button */}
                          <button
                            onClick={() => onReapplyFilter(photo)}
                            className={`p-1.5 rounded-lg border-2 border-deep-charcoal cursor-pointer active:scale-90 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                              isBeingEdited
                                ? 'bg-blush-pink text-deep-charcoal'
                                : 'bg-white hover:bg-matcha-green text-deep-charcoal'
                            }`}
                            title="Edit Photo Filter"
                          >
                            <Palette className="w-3.5 h-3.5" />
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

                      {/* Editing Badge */}
                      {isBeingEdited && (
                        <div className="absolute -top-2.5 -right-2 bg-deep-charcoal text-white rounded-md border border-white px-1 py-0.5 text-[6px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-md">
                          <Sparkles className="w-1.5 h-1.5 text-blush-pink" />
                          <span>Editing</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
