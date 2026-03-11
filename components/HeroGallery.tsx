'use client';
import { useState } from 'react';
import { HERO_GALLERY, HeroDetail } from '@/data/heroes';
import { X, Shield, Sword, Zap, Heart, Wind } from 'lucide-react';

export default function HeroGallery() {
  const [selectedHero, setSelectedHero] = useState<HeroDetail | null>(null);

  const getTypeColor = (type: string) => {
    switch(type) {
      case '步兵': return 'text-amber-700 bg-amber-100 border-amber-200';
      case '骑兵': return 'text-blue-700 bg-blue-100 border-blue-200';
      case '弓兵': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
      case '盾兵': return 'text-slate-700 bg-slate-200 border-slate-300';
      case '枪兵': return 'text-red-700 bg-red-100 border-red-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getQualityColor = (quality: string) => {
    switch(quality) {
      case '神将': return 'text-red-600 border-red-600 bg-red-50';
      case '名将': return 'text-orange-500 border-orange-500 bg-orange-50';
      case '良将': return 'text-purple-600 border-purple-600 bg-purple-50';
      case '裨将': return 'text-blue-500 border-blue-500 bg-blue-50';
      default: return 'text-gray-500 border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="p-4 pb-32">
      {/* Grid of Heroes */}
      <div className="grid grid-cols-4 gap-x-2 gap-y-4">
        {HERO_GALLERY.map(hero => (
          <div 
            key={hero.id} 
            onClick={() => setSelectedHero(hero)}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div className={`w-16 h-16 rounded-sm border-2 ${getQualityColor(hero.quality).split(' ')[1]} overflow-hidden bg-bg-dark bg-cover bg-center shadow-sm group-active:scale-95 transition-transform`}
                 style={{ backgroundImage: `url(${hero.avatar})` }}>
            </div>
            <div className="mt-1.5 flex items-center justify-center gap-1 w-full px-1">
              <span className="text-[9px] font-bold px-1 rounded-sm bg-ink/10 text-ink-light whitespace-nowrap">{hero.type[0]}</span>
              <span className="text-xs font-serif font-bold text-ink truncate">{hero.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Hero Detail Modal */}
      {selectedHero && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-dark/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-bg-panel border border-ink/20 rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="relative h-36 bg-ink flex items-end p-4">
              <div className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-full cursor-pointer text-white/80 hover:text-white z-20 transition-colors" onClick={() => setSelectedHero(null)}>
                <X size={18} />
              </div>
              <div className="absolute inset-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: `url(${selectedHero.avatar})` }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent"></div>
              
              <div className="relative z-10 flex items-end gap-4 w-full">
                <div className={`w-20 h-20 rounded-sm border-2 ${getQualityColor(selectedHero.quality).split(' ')[1]} bg-bg-dark bg-cover bg-center shadow-lg`}
                     style={{ backgroundImage: `url(${selectedHero.avatar})` }}></div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${getQualityColor(selectedHero.quality)}`}>{selectedHero.quality}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${getTypeColor(selectedHero.type)}`}>{selectedHero.type}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-white/20 text-white border border-white/30">{selectedHero.role}</span>
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-white tracking-widest">{selectedHero.name}</h2>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 bg-bg-panel text-ink">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-6 p-4 bg-white/60 border border-ink/10 rounded-sm shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                  <Shield size={100} />
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-1.5 text-ink-light"><Heart size={14} /> <span className="text-xs font-bold">生命</span></div>
                  <span className="font-mono font-bold text-ink">{selectedHero.hp}</span>
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-1.5 text-ink-light"><Sword size={14} /> <span className="text-xs font-bold">攻击</span></div>
                  <span className="font-mono font-bold text-ink">{selectedHero.attack}</span>
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-1.5 text-ink-light"><Zap size={14} /> <span className="text-xs font-bold">谋略</span></div>
                  <span className="font-mono font-bold text-ink">{selectedHero.magic}</span>
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-1.5 text-ink-light"><Shield size={14} /> <span className="text-xs font-bold">防御</span></div>
                  <span className="font-mono font-bold text-ink">{selectedHero.defense}</span>
                </div>
                <div className="flex items-center justify-between col-span-2 relative z-10 pt-2 border-t border-ink/5 mt-1">
                  <div className="flex items-center gap-1.5 text-ink-light"><Wind size={14} /> <span className="text-xs font-bold">攻速</span></div>
                  <span className="font-mono font-bold text-ink">{selectedHero.speed}</span>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-5">
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-ink text-white text-[10px] px-1.5 py-0.5 rounded-sm font-bold tracking-widest">被动</span>
                    <h3 className="font-serif font-bold text-sm text-ink">{selectedHero.passive.name}</h3>
                  </div>
                  <p className="text-xs text-ink-light leading-relaxed pl-1">{selectedHero.passive.description}</p>
                </div>
                
                <div className="w-full flex items-center justify-center opacity-20 py-1">
                  <div className="h-px bg-ink flex-1"></div>
                  <div className="w-1.5 h-1.5 rotate-45 bg-ink mx-2"></div>
                  <div className="h-px bg-ink flex-1"></div>
                </div>

                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-sm font-bold tracking-widest">主动</span>
                    <h3 className="font-serif font-bold text-sm text-accent">{selectedHero.active.name}</h3>
                  </div>
                  <p className="text-xs text-ink-light leading-relaxed pl-1">{selectedHero.active.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
