import React from 'react';
import { Camera, LogIn, LogOut, User, Sparkles } from 'lucide-react';

export default function Header({ isLoggedIn, setIsLoggedIn }) {
  return (
    <header className="mx-4 md:mx-8 mt-5 mb-3 bg-white border-4 border-deep-charcoal rounded-2xl py-4 px-6 flex items-center justify-between shadow-[6px_6px_0px_0px_rgba(58,51,53,1)] z-10 transition-all duration-300">
      
      {/* Brand Logo with 3D retro badge */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-blush-pink flex items-center justify-center border-3 border-deep-charcoal shadow-[2px_2px_0px_0px_rgba(58,51,53,1)] hover:rotate-6 transition-transform">
          <Camera className="w-6 h-6 text-deep-charcoal" />
        </div>
        <div className="flex flex-col">
          <span className="font-display font-black text-2xl tracking-tight text-deep-charcoal leading-none flex items-center gap-1">
            Snap<span className="text-muted-lavender bg-deep-charcoal px-2 py-0.5 rounded-lg text-sm font-bold uppercase tracking-wider font-sans border-2 border-deep-charcoal">VAULT</span>
          </span>
          <span className="text-[10px] font-bold text-deep-charcoal/50 uppercase tracking-widest mt-0.5">
            Instant Photobooth
          </span>
        </div>
      </div>

      {/* Dynamic login states */}
      <div className="flex items-center gap-4">
        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            {/* Logged In Username Badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-matcha-green border-3 border-deep-charcoal shadow-[3px_3px_0px_0px_rgba(58,51,53,1)]">
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border-2 border-deep-charcoal">
                <User className="w-3 h-3 text-deep-charcoal" />
              </div>
              <span className="font-display font-extrabold text-xs text-deep-charcoal tracking-wide">
                Hi, Developer
              </span>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={() => setIsLoggedIn(false)}
              className="retro-btn flex items-center justify-center w-10 h-10 rounded-xl bg-white hover:bg-blush-pink text-deep-charcoal cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Login Trigger */
          <button
            onClick={() => setIsLoggedIn(true)}
            className="retro-btn flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider text-deep-charcoal bg-muted-lavender hover:bg-blush-pink cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Login to Save</span>
          </button>
        )}
      </div>
    </header>
  );
}
