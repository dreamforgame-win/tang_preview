'use client';
import HeroGallery from '@/components/HeroGallery';
import { useGameState } from '@/components/GameStateProvider';
import { ArrowLeft } from 'lucide-react';

export default function GalleryTab() {
  const { setActiveTab } = useGameState();

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-bg-panel bg-[url('https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/bg/card_bg.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-bg-dark/60 backdrop-blur-[2px] pointer-events-none z-0"></div>
      {/* Header */}
      <header className="flex items-center justify-center bg-bg-panel/80 backdrop-blur-md border-b border-ink/10 p-4 sticky top-0 z-50">
        <h2 className="font-serif text-lg font-bold leading-tight uppercase tracking-widest text-ink">武将</h2>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        <HeroGallery />
      </div>

      {/* Fixed Bottom Bar */}
      <div className="absolute bottom-0 left-0 w-full h-16 bg-bg-panel/95 backdrop-blur-md border-t border-white/10 flex items-center px-4 z-50">
        <button 
          onClick={() => setActiveTab('battle')}
          className="w-10 h-10 rounded-full bg-primary/80 border border-white/10 flex items-center justify-center shadow-sm active:scale-95 transition-transform text-ink"
        >
          <ArrowLeft size={20} />
        </button>
      </div>
    </div>
  );
}
