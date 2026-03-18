'use client';
import { X, Star, ArrowRight } from 'lucide-react';
import { HeroDetail } from '@/data/heroes';
import { useGameState } from './GameStateProvider';
import { getHeroFrame } from '@/lib/utils';
import { useState } from 'react';

interface StarUpModalProps {
  hero: HeroDetail;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StarUpModal({ hero, onClose, onSuccess }: StarUpModalProps) {
  const { heroes, ascendHero } = useGameState();
  const [isSuccess, setIsSuccess] = useState(false);
  
  const heroState = heroes.find(h => h.id === hero.id);
  const starLevel = heroState?.starLevel || 0;
  const cost = starLevel < 3 ? 1 : 2;
  const shards = heroState?.shards || 0;

  const handleAscend = () => {
    ascendHero(hero.id);
    setIsSuccess(true);
  };

  const handleClose = () => {
    if (isSuccess) {
      onSuccess();
    } else {
      onClose();
    }
  };

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

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={handleClose}>
        <div className="w-full max-w-sm bg-bg-panel border border-accent/50 rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-white/10 flex justify-center items-center bg-gradient-to-r from-transparent via-accent/30 to-transparent relative">
            <h3 className="font-serif font-bold text-2xl text-accent tracking-widest drop-shadow-md">升阶成功</h3>
            <X size={18} className="cursor-pointer absolute right-4 text-ink-light hover:text-ink" onClick={handleClose} />
          </div>
          
          <div className="p-6 flex flex-col items-center">
            <div className="w-[100px] h-[150px] rounded-sm overflow-hidden bg-bg-dark shadow-lg relative mb-6">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${hero.avatar})` }} />
              <img src={getHeroFrame(hero.quality)} className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10" alt="frame" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 pt-4 z-20">
                <div className="flex justify-center mb-0.5">
                  {[1, 2, 3, 4, 5].slice(0, starLevel + 1).map(i => (
                    <Star key={i} size={10} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <div className="flex items-center justify-center gap-1 w-full">
                  <span className={`text-[9px] font-bold px-1 rounded-sm bg-black/60 text-white whitespace-nowrap`}>{hero.type[0]}</span>
                  <span className="text-sm font-serif font-bold text-white truncate drop-shadow-md">{hero.name}</span>
                </div>
              </div>
            </div>

            <div className="w-full flex justify-between items-center bg-primary/30 p-4 rounded-sm border border-white/5">
              <div className="flex flex-col items-center gap-2 flex-1">
                <span className="text-xs text-ink-light font-bold">升阶前</span>
                <div className="flex items-center gap-1 text-ink font-mono text-sm">
                  <span className="text-yellow-500">{starLevel - 1}星</span>
                </div>
                <div className="flex flex-col items-center text-xs text-ink-light gap-1">
                  <span>武力: {heroState?.attack ? heroState.attack - 10 : hero.attack}</span>
                  <span>谋略: {heroState?.magic ? heroState.magic - 10 : hero.magic}</span>
                  <span>防御: {heroState?.defense ? heroState.defense - 10 : hero.defense}</span>
                </div>
              </div>

              <ArrowRight className="text-accent mx-2" size={24} />

              <div className="flex flex-col items-center gap-2 flex-1">
                <span className="text-xs text-accent font-bold">升阶后</span>
                <div className="flex items-center gap-1 text-accent font-mono text-sm font-bold">
                  <span className="text-yellow-500">{starLevel}星</span>
                </div>
                <div className="flex flex-col items-center text-xs text-accent font-bold gap-1">
                  <span>武力: {heroState?.attack || hero.attack + 10}</span>
                  <span>谋略: {heroState?.magic || hero.magic + 10}</span>
                  <span>防御: {heroState?.defense || hero.defense + 10}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-white/10 bg-primary/50 flex justify-center">
            <button onClick={handleClose} className="w-full py-2.5 rounded-sm bg-accent text-white font-bold text-sm">确定</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={handleClose}>
      <div className="w-full max-w-sm bg-bg-panel border border-ink/20 rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-primary/50">
          <h3 className="font-serif font-bold text-lg text-ink tracking-widest">升阶</h3>
          <X size={18} className="cursor-pointer" onClick={handleClose} />
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="text-ink-light">当前星级: {starLevel}星</span>
            <span className="text-accent">目标星级: {starLevel + 1}星</span>
          </div>
          <p className="text-xs text-ink-light">升阶效果：武力、谋略、防御各+10</p>
        </div>
        <div className="p-4 border-t border-white/10 bg-primary/50 flex flex-col gap-2">
          <div className="text-center text-xs font-bold text-ink-light">
            将魂: <span className={shards >= cost ? 'text-accent' : 'text-red-500'}>{shards}</span> / {cost}
          </div>
          <div className="flex gap-3">
            <button onClick={handleClose} className="flex-1 py-2.5 rounded-sm border border-white/20 text-ink font-bold text-sm">取消</button>
            <button onClick={handleAscend} disabled={shards < cost} className="flex-[2] py-2.5 rounded-sm bg-accent text-white font-bold text-sm disabled:opacity-50">升阶</button>
          </div>
        </div>
      </div>
    </div>
  );
}
