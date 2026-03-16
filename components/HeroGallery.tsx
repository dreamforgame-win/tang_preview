'use client';
import { useState } from 'react';
import { HERO_GALLERY, HeroDetail } from '@/data/heroes';
import HeroDetailModal from './HeroDetailModal';
import { useGameState } from './GameStateProvider';
import { Star } from 'lucide-react';

export default function HeroGallery() {
  const [selectedHero, setSelectedHero] = useState<HeroDetail | null>(null);
  const { heroes, markHeroAsSeen } = useGameState();

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
        {[...HERO_GALLERY].sort((a, b) => {
          const aLocked = heroes.find(h => h.id === a.id)?.locked;
          const bLocked = heroes.find(h => h.id === b.id)?.locked;
          if (aLocked && !bLocked) return 1;
          if (!aLocked && bLocked) return -1;
          return 0;
        }).map(hero => {
          const heroState = heroes.find(h => h.id === hero.id);
          const starLevel = heroState?.starLevel || 0;
          const isNew = heroState?.isNew;
          const canUpgrade = !heroState?.locked && heroState && heroState.starLevel < 5 && heroState.shards >= (heroState.starLevel < 3 ? 1 : 2);
          
          return (
            <div 
              key={hero.id} 
              onClick={() => {
                setSelectedHero(hero);
                if (isNew) markHeroAsSeen(hero.id);
              }}
              className="flex flex-col items-center cursor-pointer group relative"
            >
              <div className={`w-[80px] h-[120px] rounded-sm border-2 ${getQualityColor(hero.quality).split(' ')[1]} overflow-hidden bg-bg-dark bg-cover bg-center shadow-sm group-active:scale-95 transition-transform relative`}
                   style={{ backgroundImage: `url(${hero.avatar})` }}>
                {heroState?.level && !heroState?.locked && (
                  <div className="absolute top-0 left-0 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br-md z-30">
                    Lv.{heroState.level}
                  </div>
                )}
                {isNew && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-md z-30 shadow-md">
                    新
                  </div>
                )}
                {canUpgrade && !isNew && (
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full z-30 shadow-sm border border-white/50 animate-pulse"></div>
                )}
                {heroState?.locked && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
                    <div className="text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 pt-4">
                  {starLevel > 0 && (
                    <div className="flex justify-center mb-0.5">
                      {[1, 2, 3, 4, 5].slice(0, starLevel).map(i => (
                        <Star key={i} size={8} className="text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-1 w-full">
                    <span className="text-[9px] font-bold px-1 rounded-sm bg-black/60 text-white whitespace-nowrap">{hero.type[0]}</span>
                    <span className="text-xs font-serif font-bold text-white truncate drop-shadow-md">{hero.name}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hero Detail Modal */}
      {selectedHero && (
        <HeroDetailModal hero={selectedHero} onClose={() => setSelectedHero(null)} />
      )}
    </div>
  );
}
