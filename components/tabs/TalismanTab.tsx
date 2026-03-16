'use client';
import { useGameState } from '@/components/GameStateProvider';
import { TALISMANS, TalismanQuality, Talisman } from '@/data/talismans';
import { ArrowLeft, X } from 'lucide-react';
import { useState, useMemo } from 'react';

const getQualityColor = (quality: TalismanQuality) => {
  switch (quality) {
    case '蓝品': return 'border-blue-400 bg-blue-900/20 text-blue-300';
    case '紫品': return 'border-purple-400 bg-purple-900/20 text-purple-300';
    case '橙品': return 'border-orange-400 bg-orange-900/20 text-orange-300';
    default: return 'border-gray-400 bg-gray-900/20 text-gray-300';
  }
};

const qualityOrder = { '橙品': 3, '紫品': 2, '蓝品': 1 };

export default function TalismanTab() {
  const { talismans, setActiveTab } = useGameState();
  const [selectedTalisman, setSelectedTalisman] = useState<Talisman | null>(null);

  const sortedTalismans = useMemo(() => {
    return [...TALISMANS].sort((a, b) => qualityOrder[b.quality] - qualityOrder[a.quality]);
  }, []);

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-bg-panel bg-[url('https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/bg/card_bg.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-bg-dark/60 backdrop-blur-[2px] pointer-events-none z-0"></div>
      
      <header className="flex items-center justify-center bg-bg-panel/80 backdrop-blur-md border-b border-ink/10 p-4 sticky top-0 z-50 shrink-0">
        <h2 className="font-serif text-lg font-bold leading-tight uppercase tracking-widest text-ink">阵符图鉴</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4 z-10">
        {sortedTalismans.map(talisman => {
          const ownedCount = talismans[talisman.id] || 1; // Default 1 for now
          const qualityStyle = getQualityColor(talisman.quality);
          
          return (
            <div 
              key={talisman.id} 
              className={`flex gap-4 p-4 rounded-lg border-2 ${qualityStyle} bg-bg-dark/80 backdrop-blur-sm relative overflow-hidden shadow-lg cursor-pointer active:scale-[0.98] transition-transform`}
              onClick={() => setSelectedTalisman(talisman)}
            >
              <div className="absolute top-0 right-0 bg-black/40 px-3 py-1 rounded-bl-lg text-xs font-bold border-b border-l border-white/10">
                拥有: {ownedCount}
              </div>
              
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-end gap-2">
                  <h3 className="font-serif text-lg font-bold tracking-wider">{talisman.name}</h3>
                  <span className="text-xs opacity-80 pb-0.5">{talisman.quality}</span>
                </div>
                
                <p className="text-sm font-bold opacity-90">{talisman.longDesc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedTalisman && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-dark/80 backdrop-blur-sm" onClick={() => setSelectedTalisman(null)}>
          <div className="bg-bg-panel border border-ink/20 rounded-sm shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-xl font-bold tracking-wider">{selectedTalisman.name}</h3>
              <button onClick={() => setSelectedTalisman(null)} className="p-1 text-ink-light hover:text-ink">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="text-sm font-bold opacity-90">{selectedTalisman.quality}</div>
              <p className="text-sm leading-relaxed">{selectedTalisman.longDesc}</p>
              <div className="grid grid-cols-2 gap-2 text-xs opacity-70">
                <div className="bg-black/10 p-2 rounded">
                  <span className="font-bold">生效条件:</span> {selectedTalisman.spatialCondition}
                </div>
                <div className="bg-black/10 p-2 rounded">
                  <span className="font-bold">生效目标:</span> {selectedTalisman.targetCondition}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
