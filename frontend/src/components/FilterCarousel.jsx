import React from 'react';

const FILTER_PRESETS = [
  { id: 'normal', name: 'Normal', gradient: 'from-[#FDFBF7] to-[#E2DCF0]', description: 'Default Clean' },
  { id: 'mono', name: 'Mono', gradient: 'from-stone-700 to-stone-200', description: 'Retro B&W' },
  { id: 'cyber', name: 'Cyber', gradient: 'from-[#aa3bff] via-pink-400 to-cyan-300', description: 'Neon Glitch' },
  { id: 'sunset', name: 'Sunset', gradient: 'from-amber-500 via-[#F7D6D0] to-yellow-200', description: 'Warm Golden' },
  { id: 'vintage', name: 'Vintage', gradient: 'from-orange-800 via-stone-400 to-yellow-100', description: 'Faded Grain' },
  { id: 'sweet', name: 'Sweet', gradient: 'from-[#F7D6D0] to-purple-300', description: 'Bubblegum' },
];

export default function FilterCarousel({ activeFilter, setActiveFilter, isCameraOn }) {
  return (
    <div
      className={`w-full max-w-xl mx-auto mt-6 bg-white border-4 border-deep-charcoal rounded-2xl p-4 shadow-[5px_5px_0px_0px_rgba(58,51,53,1)] transition-all duration-300 ${
        !isCameraOn ? 'opacity-40 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Title Label */}
      <div className="text-center mb-3">
        <span className="font-display font-black text-xs tracking-widest uppercase text-deep-charcoal/40 bg-deep-charcoal/5 px-3 py-1 rounded-md border border-deep-charcoal/10">
          🎛️ SELECT FILM TYPE
        </span>
      </div>

      {/* Horizontal Swatch Row */}
      <div className="flex items-center gap-4 py-2 overflow-x-auto no-scrollbar scroll-smooth snap-x justify-start md:justify-center">
        {FILTER_PRESETS.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className="flex flex-col items-center gap-2 focus:outline-none snap-center group cursor-pointer"
            >
              {/* Tactical Swatch Button */}
              <div
                className={`relative w-12 h-12 rounded-full bg-gradient-to-tr ${
                  filter.gradient
                } border-3 border-deep-charcoal transition-all duration-200 ${
                  isActive
                    ? 'scale-110 -translate-y-1 shadow-[4px_4px_0px_0px_rgba(58,51,53,1)] ring-3 ring-blush-pink'
                    : 'shadow-[2px_2px_0px_0px_rgba(58,51,53,1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(58,51,53,1)]'
                }`}
              >
                {isActive && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-deep-charcoal opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-deep-charcoal border-2 border-white"></span>
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`font-display text-[11px] font-black uppercase tracking-wider transition-colors duration-200 ${
                  isActive ? 'text-deep-charcoal underline underline-offset-4 decoration-2' : 'text-deep-charcoal/60 group-hover:text-deep-charcoal'
                }`}
              >
                {filter.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
