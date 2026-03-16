'use client';
import { useGameState } from '@/components/GameStateProvider';
import { Sparkles, Users, Swords, BookOpen, Hexagon } from 'lucide-react';

export default function BottomNav() {
  const { activeTab, setActiveTab } = useGameState();

  return (
    <div className="absolute bottom-0 left-0 w-full z-50">
      <div className="flex gap-2 border-t border-white/10 bg-bg-panel/95 backdrop-blur-xl px-2 pb-6 pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
        <button onClick={() => setActiveTab('summon')} className={`flex flex-1 flex-col items-center justify-center gap-1 ${activeTab === 'summon' ? 'text-accent' : 'text-ink-light hover:text-ink'} transition-colors`}>
          <div className={`flex h-8 items-center justify-center`}>
            <Sparkles size={24} />
          </div>
          <p className="font-serif text-[10px] font-bold leading-normal tracking-widest">寻访</p>
        </button>
        <button onClick={() => setActiveTab('gallery')} className={`flex flex-1 flex-col items-center justify-center gap-1 ${activeTab === 'gallery' ? 'text-accent' : 'text-ink-light hover:text-ink'} transition-colors relative overflow-hidden`}>
          {activeTab === 'gallery' && <div className="absolute inset-0 ink-splash opacity-60 pointer-events-none"></div>}
          <div className="flex h-8 items-center justify-center relative z-10">
            <BookOpen size={24} />
          </div>
          <p className="font-serif text-[10px] font-bold leading-normal tracking-widest relative z-10">图鉴</p>
        </button>
        <button onClick={() => setActiveTab('talisman')} className={`flex flex-1 flex-col items-center justify-center gap-1 ${activeTab === 'talisman' ? 'text-accent' : 'text-ink-light hover:text-ink'} transition-colors relative overflow-hidden`}>
          {activeTab === 'talisman' && <div className="absolute inset-0 ink-splash opacity-60 pointer-events-none"></div>}
          <div className="flex h-8 items-center justify-center relative z-10">
            <Hexagon size={24} />
          </div>
          <p className="font-serif text-[10px] font-bold leading-normal tracking-widest relative z-10">阵符</p>
        </button>
        <button onClick={() => setActiveTab('lineup')} className={`flex flex-1 flex-col items-center justify-center gap-1 ${activeTab === 'lineup' ? 'text-accent' : 'text-ink-light hover:text-ink'} transition-colors relative overflow-hidden`}>
          {activeTab === 'lineup' && <div className="absolute inset-0 ink-splash opacity-60 pointer-events-none"></div>}
          <div className="flex h-8 items-center justify-center relative z-10">
            <Users size={24} />
          </div>
          <p className="font-serif text-[10px] font-bold leading-normal tracking-widest relative z-10">布阵</p>
        </button>
        <button onClick={() => setActiveTab('battle')} className={`flex flex-1 flex-col items-center justify-center gap-1 ${activeTab === 'battle' ? 'text-accent' : 'text-ink-light hover:text-ink'} transition-colors`}>
          <div className="flex h-8 items-center justify-center">
            <Swords size={24} />
          </div>
          <p className="font-serif text-[10px] font-bold leading-normal tracking-widest">出征</p>
        </button>
      </div>
    </div>
  );
}
