'use client';
import CanvasGrid from '@/components/CanvasGrid';
import { useGameState } from '@/components/GameStateProvider';
import { useState, useEffect } from 'react';

type Hero = {
  id: string;
  name: string;
  avatar: string;
  troops: number;
  maxTroops: number;
};

const HeroRow = ({ hero, updateHeroTroops }: { hero: Hero, updateHeroTroops: (id: string, troops: number) => void }) => {
  const [localTroops, setLocalTroops] = useState(hero.troops);

  // 同步全局状态（例如点击快速分配时）
  useEffect(() => {
    setLocalTroops(hero.troops);
  }, [hero.troops]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTroops(parseInt(e.target.value));
  };

  const handleCommit = () => {
    updateHeroTroops(hero.id, localTroops);
  };

  return (
    <div className="flex items-center gap-3 bg-white/60 px-3 h-[45px] rounded-sm border border-ink/10 shadow-sm">
      <div 
        className="w-8 h-8 rounded-sm border border-ink/20 overflow-hidden bg-bg-dark shrink-0 bg-cover bg-center" 
        style={{ backgroundImage: `url(${hero.avatar})` }}
      ></div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex justify-between items-end mb-1">
          <span className="font-serif font-bold text-ink text-sm leading-none">{hero.name}</span>
          <span className="text-[10px] text-ink-light italic font-mono leading-none">
            {localTroops.toLocaleString()} / {hero.maxTroops.toLocaleString()}
          </span>
        </div>
        <div className="relative flex items-center h-4">
          <div className="absolute left-0 right-0 h-1 bg-ink/10 rounded-full overflow-hidden pointer-events-none top-1/2 -translate-y-1/2">
            <div 
              className="bg-accent h-full" 
              style={{ width: `${(localTroops / hero.maxTroops) * 100}%` }}
            ></div>
          </div>
          <input 
            type="range" 
            min="0" 
            max={hero.maxTroops} 
            value={localTroops}
            onChange={handleChange}
            onMouseUp={handleCommit}
            onTouchEnd={handleCommit}
            className="w-full relative z-10 m-0" 
          />
        </div>
      </div>
    </div>
  );
};

export default function LineupPage() {
  const { heroes, updateHeroTroops, quickAssign } = useGameState();
  const [activeTab, setActiveTab] = useState('troops');

  const totalTroops = heroes.reduce((sum, h) => sum + h.troops, 0);
  const maxTotalTroops = heroes.reduce((sum, h) => sum + h.maxTroops, 0);

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-bg-panel">
      <div className="flex-1 overflow-y-auto">
        {/* 3D Grid Section with Canvas */}
        <section className="w-full h-64 flex items-center justify-center bg-gradient-to-b from-bg-dark to-bg-panel relative overflow-hidden border-b border-ink/5">
          <CanvasGrid />
        </section>

        {/* Tabs */}
        <nav className="flex border-b border-ink/10 bg-bg-panel sticky top-0 z-40">
          <button 
            onClick={() => setActiveTab('troops')}
            className={`flex-1 py-3 border-b-2 font-bold text-sm tracking-wider transition-colors ${activeTab === 'troops' ? 'border-accent text-accent' : 'border-transparent text-ink-light'}`}
          >
            兵力配置
          </button>
          <button 
            onClick={() => setActiveTab('heroes')}
            className={`flex-1 py-3 border-b-2 font-bold text-sm tracking-wider transition-colors ${activeTab === 'heroes' ? 'border-accent text-accent' : 'border-transparent text-ink-light'}`}
          >
            武将配置
          </button>
          <button 
            onClick={() => setActiveTab('runes')}
            className={`flex-1 py-3 border-b-2 font-bold text-sm tracking-wider transition-colors ${activeTab === 'runes' ? 'border-accent text-accent' : 'border-transparent text-ink-light'}`}
          >
            阵符配置
          </button>
        </nav>

        {/* Hero List */}
        <section className="p-3 space-y-2">
          {heroes.map(hero => (
            <HeroRow key={hero.id} hero={hero} updateHeroTroops={updateHeroTroops} />
          ))}
        </section>

        {/* Action Bar */}
        <div className="mt-[25px] mx-3 mb-28 flex gap-3 h-[45px]">
          <button 
            onClick={quickAssign}
            className="flex-1 bg-white/80 border border-ink/20 rounded-sm flex flex-col items-center justify-center active:bg-ink/5 transition-colors shadow-sm"
          >
            <span className="font-bold text-ink uppercase tracking-tighter text-sm leading-none mb-1">快速分配</span>
            <span className="text-[10px] text-ink-light font-mono leading-none">{totalTroops.toLocaleString()} / {maxTotalTroops.toLocaleString()}</span>
          </button>
          <button 
            onClick={() => alert('布阵已保存！')}
            className="flex-[1.5] bg-accent text-white font-serif font-bold text-lg rounded-sm shadow-[0_4px_10px_rgba(139,26,26,0.3)] active:scale-[0.98] transition-all flex items-center justify-center"
          >
            确认布阵
          </button>
        </div>
      </div>
    </div>
  );
}
