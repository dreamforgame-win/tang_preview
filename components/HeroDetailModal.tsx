'use client';
import { X, Shield, Sword, Zap, Heart, Wind, Star } from 'lucide-react';
import { HeroDetail } from '@/data/heroes';
import { useGameState } from './GameStateProvider';
import { useState } from 'react';
import StarUpModal from './StarUpModal';

interface HeroDetailModalProps {
  hero: HeroDetail;
  onClose: () => void;
}

export default function HeroDetailModal({ hero, onClose }: HeroDetailModalProps) {
  const { heroes } = useGameState();
  const [showStarUp, setShowStarUp] = useState(false);
  const heroState = heroes.find(h => h.id === hero.id);
  const starLevel = heroState?.starLevel || 0;

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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-bg-dark/80 backdrop-blur-sm" onClick={onClose}>
      {showStarUp && (
        <StarUpModal hero={hero} onClose={() => setShowStarUp(false)} onSuccess={() => setShowStarUp(false)} />
      )}
      <div className="w-full max-w-sm bg-bg-panel border border-ink/20 rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-64 bg-bg-dark flex items-end p-4">
          <div className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-full cursor-pointer text-white/80 hover:text-white z-20 transition-colors" onClick={onClose}>
            <X size={18} />
          </div>
          <div className="absolute inset-0 bg-cover bg-top" style={{ backgroundImage: `url(${hero.avatar})` }}></div>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg-panel via-bg-panel/60 to-transparent"></div>
          
          <div className="relative z-10 flex flex-col gap-2 w-full pb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-serif font-bold text-white tracking-widest drop-shadow-md">{hero.name}</h2>
              <div className="flex">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={16} className={i <= starLevel ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${getQualityColor(hero.quality)}`}>{hero.quality}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${getTypeColor(hero.type)}`}>{hero.type}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-bg-dark/60 text-white border border-white/30 backdrop-blur-sm">{hero.role}</span>
            </div>
          </div>
        </div>

        <div className="p-5 overflow-y-auto flex-1 bg-bg-panel text-ink">
          <div className="flex justify-between items-center mb-6 p-4 bg-primary/60 border border-white/10 rounded-sm shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
              <Shield size={100} />
            </div>
            <div className="flex flex-col items-center gap-1 relative z-10">
              <div className="flex items-center gap-1 text-ink-light"><Heart size={12} /> <span className="text-[10px] font-bold">生命</span></div>
              <span className="font-mono font-bold text-ink text-sm">{hero.hp}</span>
            </div>
            <div className="flex flex-col items-center gap-1 relative z-10">
              <div className="flex items-center gap-1 text-ink-light"><Sword size={12} /> <span className="text-[10px] font-bold">攻击</span></div>
              <span className="font-mono font-bold text-ink text-sm">{hero.attack}</span>
            </div>
            <div className="flex flex-col items-center gap-1 relative z-10">
              <div className="flex items-center gap-1 text-ink-light"><Zap size={12} /> <span className="text-[10px] font-bold">谋略</span></div>
              <span className="font-mono font-bold text-ink text-sm">{hero.magic}</span>
            </div>
            <div className="flex flex-col items-center gap-1 relative z-10">
              <div className="flex items-center gap-1 text-ink-light"><Shield size={12} /> <span className="text-[10px] font-bold">防御</span></div>
              <span className="font-mono font-bold text-ink text-sm">{hero.defense}</span>
            </div>
            <div className="flex flex-col items-center gap-1 relative z-10">
              <div className="flex items-center gap-1 text-ink-light"><Wind size={12} /> <span className="text-[10px] font-bold">攻速</span></div>
              <span className="font-mono font-bold text-ink text-sm">{hero.speed}</span>
            </div>
          </div>
          
          {/* Star-up Section */}
          {starLevel < 5 && (
            <div className="mb-6 p-4 bg-primary/40 border border-accent/30 rounded-sm flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-ink-light mb-1">将魂: {heroState?.shards || 0}</h4>
                <p className="text-xs text-ink">升星需要 {starLevel < 3 ? 1 : 2} 个将魂</p>
              </div>
              <button 
                onClick={() => setShowStarUp(true)}
                disabled={(heroState?.shards || 0) < (starLevel < 3 ? 1 : 2)}
                className="px-4 py-2 bg-accent text-white font-bold text-xs rounded-sm disabled:opacity-50"
              >
                升阶
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-ink-light mb-1">主动技能：{hero.active.name}</h4>
              <p className="text-sm text-ink">{hero.active.description}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-ink-light mb-1">被动技能：{hero.passive.name}</h4>
              <p className="text-sm text-ink">{hero.passive.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
