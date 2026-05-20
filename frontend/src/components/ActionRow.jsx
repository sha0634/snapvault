import React from 'react';
import { Download, Camera } from 'lucide-react';

export default function ActionRow({
  onShutterClick,
  onDownloadClick,
  isCameraOn,
  latestPhoto
}) {
  return (
    <div className="w-full max-w-xl mx-auto flex items-center justify-between mt-8 px-6">
      
      {/* Visual Spacer to maintain grid alignment */}
      <div className="w-36 hidden sm:block"></div>

      {/* Shutter Button (Tactile Hardware Trigger) */}
      <div className="flex-1 flex justify-center">
        <button
          onClick={onShutterClick}
          disabled={!isCameraOn}
          className={`group flex items-center justify-center p-2 rounded-full border-4 border-deep-charcoal bg-white transition-all ${
            isCameraOn ? 'cursor-pointer hover:bg-stone-50' : 'cursor-not-allowed opacity-30'
          }`}
          title="Take Snapshot"
        >
          {/* Main Shutter circular button housing */}
          <div
            className={`w-20 h-20 rounded-full flex flex-col items-center justify-center gap-0.5 bg-blush-pink border-4 border-deep-charcoal transition-all ${
              isCameraOn
                ? 'shadow-[4px_4px_0px_0px_rgba(58,51,53,1)] group-hover:-translate-y-0.5 group-hover:shadow-[5px_5px_0px_0px_rgba(58,51,53,1)] group-active:translate-x-1 group-active:translate-y-1 group-active:shadow-none'
                : ''
            }`}
          >
            <Camera className="w-6 h-6 text-deep-charcoal" />
            <span className="font-display font-black text-[9px] tracking-wider uppercase text-deep-charcoal select-none">
              SHUTTER
            </span>
          </div>
        </button>
      </div>

      {/* Install Photo Ticket (Right side) */}
      <div className="w-36 flex justify-end">
        <button
          onClick={onDownloadClick}
          disabled={!latestPhoto}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border-3 border-deep-charcoal text-xs font-black uppercase tracking-wider transition-all duration-200 ${
            latestPhoto
              ? 'bg-muted-lavender hover:bg-blush-pink text-deep-charcoal cursor-pointer shadow-[3px_3px_0px_0px_rgba(58,51,53,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(58,51,53,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(58,51,53,1)]'
              : 'bg-[#3A3335]/5 border-deep-charcoal/20 text-deep-charcoal/30 cursor-not-allowed'
          }`}
          title={latestPhoto ? 'Save last print to device' : 'Capture print first'}
        >
          <Download className="w-4 h-4" />
          <span>Save Print</span>
        </button>
      </div>
    </div>
  );
}
