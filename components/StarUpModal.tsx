'use client';
import { X, Star } from 'lucide-react';
import { HeroDetail } from '@/data/heroes';
import { useGameState } from './GameStateProvider';

interface StarUpModalProps {
  hero: HeroDetail;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StarUpModal({ hero, onClose, onSuccess }: StarUpModalProps) {
  const { heroes, ascendHero } = useGameState();
  const heroState = heroes.find(h => h.id === hero.id);
  const starLevel = heroState?.starLevel || 0;
  const cost = starLevel < 3 ? 1 : 2;
  const shards = heroState?.shards || 0;

  const handleAscend = () => {
    ascendHero(hero.id);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-bg-panel border border-ink/20 rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-primary/50">
          <h3 className="font-serif font-bold text-lg text-ink tracking-widest">升阶</h3>
          <X size={18} className="cursor-pointer" onClick={onClose} />
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="text-ink-light">当前星级: {starLevel}星</span>
            <span className="text-accent">目标星级: {starLevel + 1}星</span>
          </div>
          <p className="text-xs text-ink-light">升阶效果：攻击、谋略、防御各+10</p>
        </div>
        <div className="p-4 border-t border-white/10 bg-primary/50 flex flex-col gap-2">
          <div className="text-center text-xs font-bold text-ink-light">
            将魂: <span className={shards >= cost ? 'text-accent' : 'text-red-500'}>{shards}</span> / {cost}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-sm border border-white/20 text-ink font-bold text-sm">取消</button>
            <button onClick={handleAscend} disabled={shards < cost} className="flex-[2] py-2.5 rounded-sm bg-accent text-white font-bold text-sm disabled:opacity-50">升阶</button>
          </div>
        </div>
      </div>
    </div>
  );
}
