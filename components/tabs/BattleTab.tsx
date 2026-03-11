'use client';
import { useGameState } from '@/components/GameStateProvider';
import { Sparkles, Users, BookOpen } from 'lucide-react';

export default function BattleTab() {
  const { setActiveTab } = useGameState();

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-bg-dark text-ink-light">
      <div className="flex-1 flex flex-col items-center justify-center">
        <h1 className="font-serif text-2xl mb-4 text-ink font-bold tracking-widest">出征界面</h1>
        <p className="font-serif">水墨画卷，敬请期待...</p>
      </div>

      {/* Navigation Overlay */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none flex flex-col items-end p-4 pb-6 gap-4">
        {/* Summon Button (Circular, bottom right) */}
        <button 
          onClick={() => setActiveTab('summon')}
          className="pointer-events-auto w-14 h-14 rounded-full bg-accent text-white flex flex-col items-center justify-center shadow-[0_4px_15px_rgba(139,26,26,0.4)] active:scale-95 transition-transform border-2 border-white/20"
        >
          <Sparkles size={20} className="mb-0.5" />
          <span className="text-[10px] font-bold tracking-widest">寻访</span>
        </button>

        {/* Bottom Bar (Heroes & Formation) */}
        <div className="pointer-events-auto w-full flex gap-3 mt-2">
          <button 
            onClick={() => setActiveTab('gallery')}
            className="flex-1 bg-white/90 backdrop-blur-md border border-ink/20 rounded-sm py-3 flex items-center justify-center gap-2 active:bg-ink/5 transition-colors shadow-sm"
          >
            <BookOpen size={18} className="text-ink" />
            <span className="font-serif font-bold text-ink tracking-widest text-sm">武将</span>
          </button>
          <button 
            onClick={() => setActiveTab('lineup')}
            className="flex-1 bg-white/90 backdrop-blur-md border border-ink/20 rounded-sm py-3 flex items-center justify-center gap-2 active:bg-ink/5 transition-colors shadow-sm"
          >
            <Users size={18} className="text-ink" />
            <span className="font-serif font-bold text-ink tracking-widest text-sm">编队</span>
          </button>
        </div>
      </div>
    </div>
  );
}
