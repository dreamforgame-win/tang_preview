'use client';
import { useState } from 'react';
import { useGameState } from '@/components/GameStateProvider';
import SummonTab from '@/components/tabs/SummonTab';
import GalleryTab from '@/components/tabs/GalleryTab';
import LineupTab from '@/components/tabs/LineupTab';
import BattleTab from '@/components/tabs/BattleTab';
import LoadingScreen from '@/components/LoadingScreen';

export default function App() {
  const { activeTab } = useGameState();
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      <div className={activeTab === 'summon' ? 'flex-1 flex flex-col overflow-hidden' : 'hidden'}>
        <SummonTab />
      </div>
      <div className={activeTab === 'gallery' ? 'flex-1 flex flex-col overflow-hidden' : 'hidden'}>
        <GalleryTab />
      </div>
      <div className={activeTab === 'lineup' ? 'flex-1 flex flex-col overflow-hidden' : 'hidden'}>
        <LineupTab />
      </div>
      <div className={activeTab === 'battle' ? 'flex-1 flex flex-col overflow-hidden' : 'hidden'}>
        <BattleTab />
      </div>
    </div>
  );
}
