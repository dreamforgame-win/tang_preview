'use client';
import HeroGallery from '@/components/HeroGallery';

export default function GalleryPage() {
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-bg-panel">
      {/* Header */}
      <header className="flex items-center justify-center bg-bg-panel border-b border-ink/10 p-4 sticky top-0 z-50">
        <h2 className="font-serif text-lg font-bold leading-tight uppercase tracking-widest text-ink">武将图鉴</h2>
      </header>

      <div className="flex-1 overflow-y-auto">
        <HeroGallery />
      </div>
    </div>
  );
}
