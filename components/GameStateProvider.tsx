'use client';
import React, { createContext, useContext, useState } from 'react';

type Hero = {
  id: string;
  name: string;
  avatar: string;
  troops: number;
  maxTroops: number;
};

type GameState = {
  coins: number;
  tokens: number;
  heroes: Hero[];
  setCoins: (val: number) => void;
  setTokens: (val: number) => void;
  updateHeroTroops: (id: string, troops: number) => void;
  quickAssign: () => void;
};

const GameStateContext = createContext<GameState | null>(null);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [coins, setCoins] = useState(12450);
  const [tokens, setTokens] = useState(15);
  const [heroes, setHeroes] = useState<Hero[]>([
    {
      id: '1',
      name: '关羽',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALz1CfyVLR8Fe5qzsK4CF7laLiycyQBv7Zjv3YohPcs4_NzRUn9CDgxpKpRpjKvLln5hMFrwMXilmcm4AW0JIkPk6z4PQFwOTu33uaa3ZEjmrnT6cGqV4ylXAnckCRU9iEoZwDzauEcVTGwA19VLAu0LLQpyRdWL1ZUSvb88ZsW2r80PQJ9_aKitKTfE_LGbadv2XN5020fXD7UMvT6nrW-34rPHCnOwkM9cA6p_y4bSpZ6u2kvlJygsZTUXQHgJ67GUd_L5K-oRg',
      troops: 8400,
      maxTroops: 10000,
    },
    {
      id: '2',
      name: '诸葛亮',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgED7YKEAzfF63qXi2LAMRc9NirX9e_2FpRCYHCA0Sm0EztyZT8NUnkLLhbndX33CpRUSW9R2_W9lH5nI9l31-OUHpSihk6YJts8n9JUq_8SNbqdwbfhFELOTmh8oTJJvKuKbFUYy413felWvE94_08f8SbgDMTDuTrLqWxagava4-3yNQHmRf0ED4CBP4BF72Q-43Vade7DpI3egD5JEW9KLZ4t9PPszDRXrh2WgLZDzNNeDGLGsIbcuHy7nRt4lEDWgiySx3_Pc',
      troops: 5200,
      maxTroops: 10000,
    },
    {
      id: '3',
      name: '张飞',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbz0yhDlm24EfggClAs791puedzK8BOWiSNkLHTsRIi-vX31Zz-Q_QpKv8Fi1j4G6_9wqVE2W8DxwSiRZ0ZHsyt8vruTw3tsKKkU2bbED6dRhAXy-czmQVLY4ghArX1rKTF_RAqkY2CXXThIEJ7w0waB2uzTvep4HA0MUseLXUhR54CdjGwBXQ1-kYxcNWP4pRJle4qIcWkt0Rv4ZW-7c0vbygp7TfUCeqr0lyt4lyyGdFRdOHvYbd1IA3ocBXDiLl8NSTqVHTvoA',
      troops: 9100,
      maxTroops: 10000,
    }
  ]);

  const updateHeroTroops = (id: string, troops: number) => {
    setHeroes(heroes.map(h => h.id === id ? { ...h, troops } : h));
  };

  const quickAssign = () => {
    setHeroes(heroes.map(h => ({ ...h, troops: h.maxTroops })));
  };

  return (
    <GameStateContext.Provider value={{ coins, tokens, heroes, setCoins, setTokens, updateHeroTroops, quickAssign }}>
      {children}
    </GameStateContext.Provider>
  );
}

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) throw new Error('useGameState must be used within GameStateProvider');
  return context;
};
