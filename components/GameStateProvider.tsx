'use client';
import React, { createContext, useContext, useState } from 'react';
import { HERO_GALLERY } from '@/data/heroes';

type Hero = {
  id: string;
  name: string;
  avatar: string;
  troops: number;
  maxTroops: number;
  starLevel: number;
  shards: number;
  locked: boolean;
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
  addHeroToRoster: (heroId: string) => { status: 'new' | 'converted', quality: string };
  ascendHero: (heroId: string) => void;
  pityCounter: number;
};

const GameStateContext = createContext<GameState | null>(null);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabType>('battle');
  const [coins, setCoins] = useState(12450);
  const [tokens, setTokens] = useState(15);
  const [pityCounter, setPityCounter] = useState(0);
  const [heroes, setHeroes] = useState<Hero[]>(HERO_GALLERY.map(h => ({
    id: h.id,
    name: h.name,
    avatar: h.avatar,
    troops: 10000,
    maxTroops: 10000,
    starLevel: 0,
    shards: 0,
    locked: ['libai', 'xuerengui', 'wuzetian', 'luocheng', 'wangbo', 'direnjie'].includes(h.id)
  })));
  
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

  const addHeroToRoster = (heroId: string): { status: 'new' | 'converted', quality: string } => {
    let status: 'new' | 'converted' = 'converted';
    const hero = HERO_GALLERY.find(h => h.id === heroId);
    const quality = hero?.quality || '裨将';

    if (quality === '名将') {
      setPityCounter(0);
    } else {
      setPityCounter(prev => prev + 1);
    }

    setHeroes(prev => prev.map(h => {
      if (h.id === heroId) {
        if (h.locked) {
          status = 'new';
          return { ...h, locked: false };
        } else {
          status = 'converted';
          return { ...h, shards: h.shards + 1 };
        }
      }
      return h;
    }));
    return { status, quality };
  };

  const ascendHero = (heroId: string) => {
    setHeroes(prev => prev.map(h => {
      if (h.id === heroId && h.starLevel < 5) {
        const cost = h.starLevel < 3 ? 1 : 2;
        if (h.shards >= cost) {
          return { 
            ...h, 
            starLevel: h.starLevel + 1, 
            shards: h.shards - cost,
            attack: (h.attack || 0) + 10,
            magic: (h.magic || 0) + 10,
            defense: (h.defense || 0) + 10
          };
        }
      }
      return h;
    }));
  };

  return (
    <GameStateContext.Provider value={{ 
      activeTab, setActiveTab, coins, tokens, heroes, 
      lineups, currentLineupIndex, setCurrentLineupIndex, lineup, 
      setCoins, setTokens, updateHeroTroops, quickAssign, setLineupSlot, setFullLineup, addHeroToRoster, ascendHero, pityCounter
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
