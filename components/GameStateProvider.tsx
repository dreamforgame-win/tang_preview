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
  attack: number;
  magic: number;
  defense: number;
  isNew?: boolean;
};

export type TabType = 'summon' | 'gallery' | 'lineup' | 'battle';
export type LineupSubTabType = 'troops' | 'heroes' | 'runes';

export type March = {
  id: string;
  lineupIndex: number;
  from: { col: number, row: number };
  to: { col: number, row: number };
  startTime: number;
  duration: number;
  status: 'marching' | 'returning' | 'arrived';
  type: 'attack' | 'move';
};

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
  formationId: number;
  setFormationId: (id: number) => void;
  lineupSubTab: LineupSubTabType;
  setLineupSubTab: (tab: LineupSubTabType) => void;
  setCoins: (val: number) => void;
  setTokens: (val: number) => void;
  updateHeroTroops: (id: string, troops: number) => void;
  quickAssign: () => void;
  setLineupSlot: (index: number, heroId: string | null) => void;
  setFullLineup: (newLineup: (string | null)[]) => void;
  addHeroToRoster: (heroId: string) => { status: 'new' | 'converted', quality: string };
  ascendHero: (heroId: string) => void;
  markHeroAsSeen: (heroId: string) => void;
  pityCounter: number;
  marches: March[];
  addMarch: (march: March) => void;
  removeMarch: (id: string) => void;
  hasRedDot: boolean;
  resetGame: () => void;
};

const GameStateContext = createContext<GameState | null>(null);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
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
    locked: ['libai', 'xuerengui', 'wuzetian', 'luocheng', 'wangbo', 'direnjie'].includes(h.id),
    attack: h.attack,
    magic: h.magic,
    defense: h.defense,
    isNew: false
  })));
  
  const [lineups, setLineups] = useState<(string | null)[][]>(
    Array.from({ length: 5 }, () => Array(9).fill(null))
  );
  const [formationId, setFormationId] = useState(0);
  const [currentLineupIndex, setCurrentLineupIndex] = useState(0);
  const [lineupSubTab, setLineupSubTab] = useState<LineupSubTabType>('troops');
  const [marches, setMarches] = useState<March[]>([]);
  
  const lineup = lineups[currentLineupIndex];

  // Load state from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('slg_save_v1');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.heroes) {
          // Merge saved heroes with gallery to ensure new heroes are added
          setHeroes(HERO_GALLERY.map(h => {
            const savedHero = data.heroes.find((sh: Hero) => sh.id === h.id);
            return savedHero ? { ...savedHero, name: h.name, avatar: h.avatar } : {
              id: h.id,
              name: h.name,
              avatar: h.avatar,
              troops: 10000,
              maxTroops: 10000,
              starLevel: 0,
              shards: 0,
              locked: ['libai', 'xuerengui', 'wuzetian', 'luocheng', 'wangbo', 'direnjie'].includes(h.id),
              attack: h.attack,
              magic: h.magic,
              defense: h.defense,
              isNew: false
            };
          }));
        }
        if (data.lineups) setLineups(data.lineups);
        if (data.formationId !== undefined) setFormationId(data.formationId);
        if (data.coins !== undefined) setCoins(data.coins);
        if (data.tokens !== undefined) setTokens(data.tokens);
        if (data.pityCounter !== undefined) setPityCounter(data.pityCounter);
      } catch (e) {
        console.error('Failed to load save', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save state to localStorage
  React.useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('slg_save_v1', JSON.stringify({
        heroes,
        lineups,
        formationId,
        coins,
        tokens,
        pityCounter
      }));
    }
  }, [heroes, lineups, formationId, coins, tokens, pityCounter, isLoaded]);

  const hasRedDot = React.useMemo(() => {
    return heroes.some(h => !h.locked && (h.isNew || (h.starLevel < 5 && h.shards >= (h.starLevel < 3 ? 1 : 2))));
  }, [heroes]);

  const addMarch = (march: March) => {
    setMarches(prev => [...prev, march]);
  };

  const removeMarch = (id: string) => {
    setMarches(prev => prev.filter(m => m.id !== id));
  };

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
          return { ...h, locked: false, isNew: true };
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
            attack: h.attack + 10,
            magic: h.magic + 10,
            defense: h.defense + 10
          };
        }
      }
      return h;
    }));
  };

  const markHeroAsSeen = (heroId: string) => {
    setHeroes(prev => prev.map(h => {
      if (h.id === heroId && h.isNew) {
        return { ...h, isNew: false };
      }
      return h;
    }));
  };

  const resetGame = () => {
    localStorage.removeItem('slg_save_v1');
    window.location.reload();
  };

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <GameStateContext.Provider value={{ 
      activeTab, setActiveTab, coins, tokens, heroes, 
      lineups, currentLineupIndex, setCurrentLineupIndex, lineup, 
      formationId, setFormationId,
      lineupSubTab, setLineupSubTab,
      setCoins, setTokens, updateHeroTroops, quickAssign, setLineupSlot, setFullLineup, addHeroToRoster, ascendHero, markHeroAsSeen, pityCounter,
      marches, addMarch, removeMarch, hasRedDot, resetGame
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
