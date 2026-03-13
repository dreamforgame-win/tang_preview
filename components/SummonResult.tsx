import { useState, useEffect } from 'react';
import { HeroDetail } from '@/data/heroes';
import HeroDetailModal from './HeroDetailModal';
import { useGameState } from './GameStateProvider';
import { Star } from 'lucide-react';

interface SummonResultProps {
  results: { hero: HeroDetail, status: 'new' | 'converted' }[];
  onClose: () => void;
}

export default function SummonResult({ results, onClose }: SummonResultProps) {
  const [canClose, setCanClose] = useState(false);
  const [selectedHero, setSelectedHero] = useState<HeroDetail | null>(null);
  const { heroes } = useGameState();

  useEffect(() => {
    const timer = setTimeout(() => setCanClose(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const getQualityColor = (quality: string) => {
    switch(quality) {
      case '神将': return 'border-red-600';
      case '名将': return 'border-orange-500';
      case '良将': return 'border-purple-600';
      case '裨将': return 'border-blue-500';
      default: return 'border-gray-500';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={(e) => {
        if (canClose && e.target === e.currentTarget) onClose();
      }}
    >
      {selectedHero && (
        <HeroDetailModal hero={selectedHero} onClose={() => setSelectedHero(null)} />
      )}

      <h2 className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 mb-8 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">恭喜获得</h2>
      
      <div className="flex flex-col items-center gap-4 mb-4">
        <div className="grid grid-cols-3 gap-4 max-w-[300px]">
          {results.map((item, i) => {
            const heroState = heroes.find(h => h.id === item.hero.id);
            const starLevel = heroState?.starLevel || 0;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-[80px] h-[120px] rounded-sm border-2 ${getQualityColor(item.hero.quality)} overflow-hidden bg-bg-dark bg-cover bg-center shadow-sm relative cursor-pointer`} onClick={() => setSelectedHero(item.hero)}>
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${item.hero.avatar})` }}></div>
                  {item.status === 'new' && (
                    <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-1 rounded-bl-sm z-30">新</div>
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
                      <span className="text-[9px] font-bold px-1 rounded-sm bg-black/60 text-white whitespace-nowrap">{item.hero.type[0]}</span>
                      <span className="text-xs font-serif font-bold text-white truncate drop-shadow-md">{item.hero.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-ink-light text-xs mt-8">点击任意位置退出</p>
    </div>
  );
}
