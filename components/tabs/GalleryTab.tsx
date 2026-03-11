'use client';
import HeroGallery from '@/components/HeroGallery';
import { useGameState } from '@/components/GameStateProvider';
import { ArrowLeft } from 'lucide-react';

export default function GalleryTab() {
  const { setActiveTab } = useGameState();

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-bg-panel">
      {/* Header */}
      <header className="flex items-center justify-center bg-bg-panel border-b border-ink/10 p-4 sticky top-0 z-50">
        <h2 className="font-serif text-lg font-bold leading-tight uppercase tracking-widest text-ink">武将</h2>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        <HeroGallery />
      </div>

      {/* Floating Back Button */}
      <div className="absolute bottom-6 left-4 z-50">
        <button 
          onClick={() => setActiveTab('battle')}
          className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md border border-ink/20 flex items-center justify-center shadow-lg active:scale-95 transition-transform text-ink"
        >
          <ArrowLeft size={24} />
        </button>
      </div>
    </div>
  );
}
