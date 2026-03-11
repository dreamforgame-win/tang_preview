'use client';
import React, { createContext, useContext, useState } from 'react';
import { HERO_GALLERY } from '@/data/heroes';

type Hero = {
  id: string;
  name: string;
  avatar: string;
  troops: number;
  maxTroops: number;
};

export type TabType = 'summon' | 'gallery' | 'lineup' | 'battle';

type GameState = {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  coins: number;
  tokens: number;
  heroes: Hero[];
  lineups: (string | null)[][];
  currentLineupIndex: number;
  setCurrentLineupIndex: (index: number) => void;
  lineup: (string | null)[];
  setCoins: (val: number) => void;
  setTokens: (val: number) => void;
  updateHeroTroops: (id: string, troops: number) => void;
  quickAssign: () => void;
  setLineupSlot: (index: number, heroId: string | null) => void;
  setFullLineup: (newLineup: (string | null)[]) => void;
  addHeroToRoster: (heroId: string) => void;
};

const GameStateContext = createContext<GameState | null>(null);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabType>('battle');
  const [coins, setCoins] = useState(12450);
  const [tokens, setTokens] = useState(15);
  const [heroes, setHeroes] = useState<Hero[]>([
    {
      id: 'lishimin',
      name: '李世民',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lishimin',
      troops: 8400,
      maxTroops: 10000,
    },
    {
      id: 'lijing',
      name: '李靖',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lijing',
      troops: 5200,
      maxTroops: 10000,
    },
    {
      id: 'xuerengui',
      name: '薛仁贵',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xuerengui',
      troops: 9100,
      maxTroops: 10000,
    }
  ]);
  
  const [lineups, setLineups] = useState<(string | null)[][]>(
    Array.from({ length: 5 }, () => Array(9).fill(null))
  );
  const [currentLineupIndex, setCurrentLineupIndex] = useState(0);
  
  const lineup = lineups[currentLineupIndex];

  const updateHeroTroops = (id: string, troops: number) => {
    setHeroes(heroes.map(h => h.id === id ? { ...h, troops } : h));
  };

  const quickAssign = () => {
    setHeroes(heroes.map(h => ({ ...h, troops: h.maxTroops })));
  };

  const setLineupSlot = (index: number, heroId: string | null) => {
    setLineups(prev => {
      const newLineups = [...prev];
      const newLineup = [...newLineups[currentLineupIndex]];
      newLineup[index] = heroId;
      newLineups[currentLineupIndex] = newLineup;
      return newLineups;
    });
  };

  const setFullLineup = (newLineup: (string | null)[]) => {
    setLineups(prev => {
      const newLineups = [...prev];
      newLineups[currentLineupIndex] = newLineup;
      return newLineups;
    });
  };

  const addHeroToRoster = (heroId: string) => {
    if (!heroes.find(h => h.id === heroId)) {
      const heroData = HERO_GALLERY.find(h => h.id === heroId);
      if (heroData) {
        setHeroes(prev => [...prev, {
          id: heroData.id,
          name: heroData.name,
          avatar: heroData.avatar,
          troops: 10000,
          maxTroops: 10000,
        }]);
      }
    }
  };

  return (
    <GameStateContext.Provider value={{ 
      activeTab, setActiveTab, coins, tokens, heroes, 
      lineups, currentLineupIndex, setCurrentLineupIndex, lineup, 
      setCoins, setTokens, updateHeroTroops, quickAssign, setLineupSlot, setFullLineup, addHeroToRoster 
    }}>
      {children}
    </GameStateContext.Provider>
  );
}

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) throw new Error('useGameState must be used within GameStateProvider');
  return context;
};
