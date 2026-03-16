'use client';
import { useGameState, March, calculateHeroStats } from '@/components/GameStateProvider';
import { Sparkles, Users, BookOpen, Map as MapIcon, X, Home, Sword, Navigation, Settings, Plus, Minus, Battery, Trees, Anvil, Mountain, Wheat } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { HERO_GALLERY } from '@/data/heroes';
import BattleScreen from '@/components/BattleScreen';
import { CombatHero } from '@/lib/battleEngine';
import { useDragScroll } from '@/hooks/useDragScroll';

export type TileType = 'plains' | 'city' | 'mountain' | 'lake' | 'village' | 'forest' | 'iron' | 'town';

export interface TileData {
  col: number;
  row: number;
  type: TileType;
  level?: number;
  occupied?: boolean;
  abandonEndTime?: number;
}

export const MAP_WIDTH = 15;
export const MAP_HEIGHT = 15;
export const HEX_WIDTH = 80;
export const HEX_HEIGHT = 92;

// Hex coordinate conversion
function cube_to_axial(q: number, r: number, s: number) {
  return { col: q + Math.floor(r / 2), row: r };
}

function axial_to_cube(col: number, row: number) {
  const q = col - Math.floor(row / 2);
  const r = row;
  const s = -q - r;
  return { q, r, s };
}

function cube_lerp(a: any, b: any, t: number) {
  return {
    q: a.q + (b.q - a.q) * t,
    r: a.r + (b.r - a.r) * t,
    s: a.s + (b.s - a.s) * t
  };
}

function cube_round(cube: any) {
  let q = Math.round(cube.q);
  let r = Math.round(cube.r);
  let s = Math.round(cube.s);

  const q_diff = Math.abs(q - cube.q);
  const r_diff = Math.abs(r - cube.r);
  const s_diff = Math.abs(s - cube.s);

  if (q_diff > r_diff && q_diff > s_diff) {
    q = -r - s;
  } else if (r_diff > s_diff) {
    r = -q - s;
  } else {
    s = -q - r;
  }

  return { q, r, s };
}

function getNeighbors(col: number, row: number) {
  const isOdd = row % 2 === 1;
  const dirs = isOdd ? [
    [1, 0], [1, 1], [0, 1], [-1, 0], [0, -1], [1, -1]
  ] : [
    [1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]
  ];
  return dirs.map(d => ({ col: col + d[0], row: row + d[1] }));
}

export function getHexPath(col1: number, row1: number, col2: number, row2: number, mapData: TileData[]) {
  const startNode = mapData.find(t => t.col === col1 && t.row === row1);
  const endNode = mapData.find(t => t.col === col2 && t.row === row2);
  
  if (!startNode || !endNode) return [];
  
  const openSet = [startNode];
  const cameFrom = new Map<TileData, TileData>();
  const gScore = new Map<TileData, number>();
  const fScore = new Map<TileData, number>();
  
  mapData.forEach(t => {
    gScore.set(t, Infinity);
    fScore.set(t, Infinity);
  });
  
  gScore.set(startNode, 0);
  fScore.set(startNode, hexDistance(col1, row1, col2, row2));
  
  while (openSet.length > 0) {
    openSet.sort((a, b) => fScore.get(a)! - fScore.get(b)!);
    const current = openSet.shift()!;
    
    if (current === endNode) {
      const path = [current];
      let curr = current;
      while (cameFrom.has(curr)) {
        curr = cameFrom.get(curr)!;
        path.unshift(curr);
      }
      return path.map(t => ({ col: t.col, row: t.row }));
    }
    
    const neighbors = getNeighbors(current.col, current.row)
      .map(n => mapData.find(t => t.col === n.col && t.row === n.row))
      .filter((t): t is TileData => t !== undefined && (t === endNode || (t.type !== 'mountain' && t.type !== 'lake' && t.type !== 'city')));
      
    for (const neighbor of neighbors) {
      const tentativeGScore = gScore.get(current)! + 1;
      
      if (tentativeGScore < gScore.get(neighbor)!) {
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeGScore);
        fScore.set(neighbor, tentativeGScore + hexDistance(neighbor.col, neighbor.row, endNode.col, endNode.row));
        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        }
      }
    }
  }
  
  return []; // No path found
}

export function hexDistance(col1: number, row1: number, col2: number, row2: number) {
  const a = axial_to_cube(col1, row1);
  const b = axial_to_cube(col2, row2);
  return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.s - b.s));
}

export const generateMap = () => {
  const tiles: TileData[] = [];
  for (let row = 0; row < MAP_HEIGHT; row++) {
    for (let col = 0; col < MAP_WIDTH; col++) {
      tiles.push({ col, row, type: 'plains' });
    }
  }

  const getTile = (c: number, r: number) => tiles.find(t => t.col === c && t.row === r);

  // Set Main City
  const cityCol = 7;
  const cityRow = 7;
  const cityTile = getTile(cityCol, cityRow);
  if (cityTile) cityTile.type = 'city';

  // Generate obstacles around city (distance 1 or 2)
  let obstaclesPlaced = 0;
  let attempts = 0;
  while (obstaclesPlaced < 12 && attempts < 200) {
    attempts++;
    const c = Math.floor(Math.random() * MAP_WIDTH);
    const r = Math.floor(Math.random() * MAP_HEIGHT);
    const dist = hexDistance(cityCol, cityRow, c, r);
    if (dist > 0 && dist <= 4) {
      const t = getTile(c, r);
      if (t && t.type === 'plains') {
        t.type = Math.random() > 0.5 ? 'mountain' : 'lake';
        obstaclesPlaced++;
      }
    }
  }

  // Generate resource tiles
  const resourceTypes: TileType[] = ['village', 'forest', 'iron', 'town'];
  const resourceTiles: TileData[] = [];
  
  attempts = 0;
  while (resourceTiles.length < 25 && attempts < 500) {
    attempts++;
    const c = Math.floor(Math.random() * MAP_WIDTH);
    const r = Math.floor(Math.random() * MAP_HEIGHT);
    
    const t = getTile(c, r);
    if (!t || t.type !== 'plains') continue;
    
    // Check distance to other resource tiles and city
    let tooClose = false;
    if (hexDistance(c, r, cityCol, cityRow) < 2) tooClose = true;
    
    for (const rt of resourceTiles) {
      if (hexDistance(c, r, rt.col, rt.row) < 3) {
        tooClose = true;
        break;
      }
    }
    
    if (!tooClose) {
      t.type = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
      t.level = Math.floor(Math.random() * 6) + 1;
      resourceTiles.push(t);
    }
  }

  return tiles;
};

const getTileColor = (type: TileType) => {
  switch (type) {
    case 'plains': return 'fill-[#e3d5c8] stroke-[#c2b2a1]';
    case 'city': return 'fill-[#d4af37] stroke-[#b3922e]';
    case 'mountain': return 'fill-[#8b7355] stroke-[#6b5840]';
    case 'lake': return 'fill-[#4a90e2] stroke-[#357abd]';
    case 'village': return 'fill-[#e6a8d7] stroke-[#c98cb9]';
    case 'forest': return 'fill-[#2d5a27] stroke-[#1e3f1b]';
    case 'iron': return 'fill-[#71797E] stroke-[#555b5f]';
    case 'town': return 'fill-[#9b59b6] stroke-[#8e44ad]';
    default: return 'fill-gray-300 stroke-gray-400';
  }
};

const getTileName = (type: TileType) => {
  switch (type) {
    case 'plains': return '平地';
    case 'city': return '主城';
    case 'mountain': return '山脉';
    case 'lake': return '湖泊';
    case 'village': return '村庄';
    case 'forest': return '林地';
    case 'iron': return '铁矿';
    case 'town': return '城镇';
    default: return '未知';
  }
};

const MarchPawn = ({ 
  m, 
  mapData, 
  lineups, 
  selectedMarchId, 
  setSelectedMarchId, 
  setSelectedTile, 
  rotateX 
}: { 
  m: March, 
  mapData: TileData[], 
  lineups: (string | null)[][], 
  selectedMarchId: string | null, 
  setSelectedMarchId: (id: string | null) => void, 
  setSelectedTile: (tile: TileData | null) => void, 
  rotateX: number 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const path = useMemo(() => getHexPath(m.from.col, m.from.row, m.to.col, m.to.row, mapData), [m, mapData]);
  
  useEffect(() => {
    let frameId: number;
    const update = () => {
      const now = Date.now();
      const elapsed = now - m.startTime;
      const progress = Math.max(0, Math.min(1, elapsed / m.duration));
      
      let curX, curY;
      if (path.length <= 1) {
        curX = m.from.col * HEX_WIDTH + (m.from.row % 2 === 1 ? HEX_WIDTH / 2 : 0) + HEX_WIDTH / 2;
        curY = m.from.row * HEX_HEIGHT * 0.75 + HEX_HEIGHT / 2;
      } else {
        const segmentCount = path.length - 1;
        const segmentProgress = progress * segmentCount;
        const segmentIndex = Math.min(Math.floor(segmentProgress), segmentCount - 1);
        const t = segmentProgress - segmentIndex;
        
        const p1 = path[segmentIndex];
        const p2 = path[segmentIndex + 1];
        
        const x1 = p1.col * HEX_WIDTH + (p1.row % 2 === 1 ? HEX_WIDTH / 2 : 0) + HEX_WIDTH / 2;
        const y1 = p1.row * HEX_HEIGHT * 0.75 + HEX_HEIGHT / 2;
        const x2 = p2.col * HEX_WIDTH + (p2.row % 2 === 1 ? HEX_WIDTH / 2 : 0) + HEX_WIDTH / 2;
        const y2 = p2.row * HEX_HEIGHT * 0.75 + HEX_HEIGHT / 2;
        
        curX = x1 + (x2 - x1) * t;
        curY = y1 + (y2 - y1) * t;
      }
      
      if (ref.current) {
        ref.current.style.left = `${curX}px`;
        ref.current.style.top = `${curY}px`;
      }
      
      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      }
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [m, path]);

  const lineup = lineups[m.lineupIndex];
  const firstHeroId = lineup.find(id => id !== null);
  const isSelected = selectedMarchId === m.id;

  return (
    <div 
      ref={ref}
      className={`absolute z-[60] ${isSelected ? 'brightness-125' : ''}`}
      style={{ 
        transform: `translate(-50%, -80%) rotateX(${-rotateX}deg)`,
        transformStyle: 'preserve-3d'
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedMarchId(m.id);
        setSelectedTile(null);
      }}
    >
      <div className="relative flex flex-col items-center cursor-pointer pointer-events-auto">
        <div className={`mb-1 bg-black/60 px-1.5 py-0.5 rounded-sm border transition-colors ${isSelected ? 'border-accent bg-accent/40' : 'border-white/20'}`}>
          <span className="text-[8px] font-bold text-white whitespace-nowrap">阵容{['一', '二', '三', '四', '五'][m.lineupIndex]}</span>
        </div>
        {firstHeroId ? (
          <img 
            src={`https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/hero-chess/${firstHeroId}.png`}
            alt="march"
            className={`w-16 h-16 object-contain drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] transition-transform ${isSelected ? 'scale-110' : ''}`}
          />
        ) : (
          <div className="bg-accent w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <Navigation size={12} className="text-white rotate-45" />
          </div>
        )}
      </div>
    </div>
  );
};

const getTileExp = (level?: number) => {
  switch (level) {
    case 1: return 150;
    case 2: return 450;
    case 3: return 1500;
    case 4: return 4500;
    case 5: return 15000;
    case 6: return 35000;
    case 7: return 80000;
    case 8: return 180000;
    case 9: return 400000;
    default: return 150; // Plains or undefined level
  }
};

const getEnemyLevelByTileLevel = (tileLevel: number) => {
  switch (tileLevel) {
    case 1: return 1;
    case 2: return 3;
    case 3: return 8;
    case 4: return 13;
    case 5: return 20;
    case 6: return 28;
    case 7: return 35;
    case 8: return 40;
    case 9: return 45;
    default: return 1;
  }
};

export default function BattleTab() {
  const { setActiveTab, lineups, heroes, addMarch, removeMarch, marches, setCurrentLineupIndex, setLineupSubTab, hasRedDot, resetGame, avatarId, setAvatarId, addHeroExp, mapData, setMapData } = useGameState();
  const [selectedTile, setSelectedTile] = useState<TileData | null>(null);
  const [selectedMarchId, setSelectedMarchId] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isAvatarSelectOpen, setIsAvatarSelectOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setNow(d.getTime());
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const currentAvatarHero = heroes.find(h => h.id === avatarId) || heroes.find(h => h.id === 'libai') || heroes[0];
  
  // March Selection State
  const [isMarchOpen, setIsMarchOpen] = useState(false);
  const [marchType, setMarchType] = useState<'attack' | 'move'>('move');
  const [selectedLineupIdx, setSelectedLineupIdx] = useState(0);
  const [isViewLocked, setIsViewLocked] = useState(true);
  
  // Battle State
  const [activeBattle, setActiveBattle] = useState<{ player: CombatHero[], enemy: CombatHero[], tileCol: number, tileRow: number } | null>(null);
  const marchScrollRef = useDragScroll<HTMLDivElement>({ direction: 'horizontal' });

  // Abandon timer loop
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      let changed = false;
      setMapData(prev => {
        const next = prev.map(t => {
          if (t.abandonEndTime && now >= t.abandonEndTime) {
            changed = true;
            return { ...t, occupied: false, abandonEndTime: undefined };
          }
          return t;
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [setMapData]);

  // Territory and Road logic
  const territoryLimit = 40;
  const roadLimit = 30;
  const occupiedTilesCount = mapData.filter(t => t.occupied).length;
  const territoryCount = Math.min(occupiedTilesCount, territoryLimit);
  const roadCount = Math.max(0, occupiedTilesCount - territoryLimit);

  // Animation loop
  useEffect(() => {
    if (marches.length === 0) return;
    let frameId: number;
    const update = () => {
      const now = Date.now();
      
      // Check for arrived marches
      marches.forEach(m => {
        if (now - m.startTime >= m.duration && m.status === 'marching') {
          if (m.type === 'attack') {
            // Generate enemy lineup
            const targetTile = mapData.find(t => t.col === m.to.col && t.row === m.to.row);
            const tileLevel = targetTile?.level || 1;
            const enemyLevel = getEnemyLevelByTileLevel(tileLevel);
            
            const enemyLineup: CombatHero[] = [];
            const availableHeroes = [...HERO_GALLERY].sort(() => Math.random() - 0.5);
            const positions = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5);
            
            for (let i = 0; i < 3; i++) {
              const h = availableHeroes[i];
              const stats = calculateHeroStats(h.id, enemyLevel, 0); // 0 star for enemies
              enemyLineup.push({
                id: h.id,
                instanceId: `enemy-${i}`,
                name: h.name,
                avatar: h.avatar,
                team: 'enemy',
                position: positions[i],
                max_hp: stats.maxTroops,
                hp: stats.maxTroops,
                atk: stats.attack,
                int_stat: stats.magic,
                def_stat: stats.defense,
                spd: stats.speed,
                energy: 0,
                attack_cooldown: 0,
                shield: 0,
                buffs: [],
                stats: {
                  damageDealt: 0,
                  damageTaken: 0,
                  healingDone: 0,
                  skillsCast: 0
                }
              });
            }

            // Generate player lineup
            const playerLineup: CombatHero[] = [];
            const lineup = lineups[m.lineupIndex];
            lineup.forEach((heroId, idx) => {
              if (heroId) {
                const h = heroes.find(x => x.id === heroId);
                const baseHero = HERO_GALLERY.find(x => x.id === heroId);
                if (h && baseHero) {
                  playerLineup.push({
                    id: h.id,
                    instanceId: `player-${idx}`,
                    name: baseHero.name,
                    avatar: baseHero.avatar,
                    team: 'player',
                    position: idx,
                    max_hp: h.maxTroops,
                    hp: h.troops,
                    atk: h.attack,
                    int_stat: h.magic,
                    def_stat: h.defense,
                    spd: h.speed,
                    energy: 0,
                    attack_cooldown: 0,
                    shield: 0,
                    buffs: [],
                    stats: {
                      damageDealt: 0,
                      damageTaken: 0,
                      healingDone: 0,
                      skillsCast: 0
                    }
                  });
                }
              }
            });

            setActiveBattle({ player: playerLineup, enemy: enemyLineup, tileCol: m.to.col, tileRow: m.to.row });
          }
          removeMarch(m.id);
        }
      });

      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [marches, removeMarch, heroes, lineups, mapData]);

  // Viewport state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef<number | null>(null);
  const dragDistance = useRef(0);

  // Clamp pan when zoom changes
  useEffect(() => {
    if (!containerRef.current) return;
    const mapWidth = MAP_WIDTH * HEX_WIDTH + HEX_WIDTH / 2;
    const mapHeight = MAP_HEIGHT * HEX_HEIGHT * 0.75 + HEX_HEIGHT / 4;
    const currentRotateX = ((zoom - 1.0) / 1.0) * 45;
    const rotateXRad = currentRotateX * Math.PI / 180;
    const W = mapWidth * zoom;
    const H = mapHeight * zoom * Math.cos(rotateXRad);
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const maxPanX = Math.max(100, (W - cw) / 2 + 150);
    const maxPanY = Math.max(100, (H - ch) / 2 + 150);
    
    setPan(p => {
      const newX = Math.max(-maxPanX, Math.min(maxPanX, p.x));
      const newY = Math.max(-maxPanY, Math.min(maxPanY, p.y));
      if (newX !== p.x || newY !== p.y) return { x: newX, y: newY };
      return p;
    });
  }, [zoom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(z => Math.max(1.0, Math.min(2.0, z + zoomDelta)));
      setSelectedTile(null);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    dragDistance.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    if (isMarchOpen && isViewLocked) return;
    
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    dragDistance.current += Math.hypot(dx, dy);
    
    if (dragDistance.current > 5 && selectedTile) {
      setSelectedTile(null);
    }
    
    let maxPanX = (MAP_WIDTH * HEX_WIDTH) / 2;
    let maxPanY = (MAP_HEIGHT * HEX_HEIGHT * 0.75) / 2;
    
    if (containerRef.current) {
      const mapWidth = MAP_WIDTH * HEX_WIDTH + HEX_WIDTH / 2;
      const mapHeight = MAP_HEIGHT * HEX_HEIGHT * 0.75 + HEX_HEIGHT / 4;
      const currentRotateX = ((zoom - 1.0) / 1.0) * 45;
      const rotateXRad = currentRotateX * Math.PI / 180;
      const W = mapWidth * zoom;
      const H = mapHeight * zoom * Math.cos(rotateXRad);
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      maxPanX = Math.max(100, (W - cw) / 2 + 150);
      maxPanY = Math.max(100, (H - ch) / 2 + 150);
    }
    
    setPan(p => ({ 
      x: Math.max(-maxPanX, Math.min(maxPanX, p.x + dx)), 
      y: Math.max(-maxPanY, Math.min(maxPanY, p.y + dy)) 
    }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for pinch-to-zoom
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      
      if (lastTouchDist.current !== null) {
        const delta = dist - lastTouchDist.current;
        setZoom(z => Math.max(1.0, Math.min(2.0, z + delta * 0.01)));
        setSelectedTile(null);
      }
      lastTouchDist.current = dist;
    }
  };

  const handleTouchEnd = () => {
    lastTouchDist.current = null;
  };

  const handleTileClick = (tile: TileData) => {
    if (dragDistance.current > 5) return;
    
    // Deselect march if clicking a tile
    setSelectedMarchId(null);

    if (isMarchOpen) {
      if (isViewLocked) {
        setIsMarchOpen(false);
      }
      return;
    }
    setSelectedTile(prev => prev?.col === tile.col && prev?.row === tile.row ? null : tile);
  };

  const centerOnTile = (col: number, row: number) => {
    const tileX = col * HEX_WIDTH + (row % 2 === 1 ? HEX_WIDTH / 2 : 0) + HEX_WIDTH / 2;
    const tileY = row * HEX_HEIGHT * 0.75 + HEX_HEIGHT / 2;
    const mapCenterX = (MAP_WIDTH * HEX_WIDTH + HEX_WIDTH / 2) / 2;
    const mapCenterY = (MAP_HEIGHT * HEX_HEIGHT * 0.75 + HEX_HEIGHT / 4) / 2;
    setPan({ x: mapCenterX - tileX, y: mapCenterY - tileY });
  };

  const handleGoHome = () => {
    const city = mapData.find(t => t.type === 'city');
    if (city) centerOnTile(city.col, city.row);
  };

  const cityTile = useMemo(() => mapData.find(t => t.type === 'city')!, [mapData]);

  const marchPath = useMemo(() => {
    if (!selectedTile || !isMarchOpen) return [];
    return getHexPath(cityTile.col, cityTile.row, selectedTile.col, selectedTile.row, mapData);
  }, [selectedTile, isMarchOpen, cityTile, mapData]);

  const handleStartMarch = () => {
    if (!selectedTile) return;
    
    const selectedLineup = lineups[selectedLineupIdx];
    if (!selectedLineup.some(id => id !== null)) return;

    const path = getHexPath(cityTile.col, cityTile.row, selectedTile.col, selectedTile.row, mapData);
    const dist = path.length > 0 ? path.length - 1 : hexDistance(cityTile.col, cityTile.row, selectedTile.col, selectedTile.row);
    const march: March = {
      id: Math.random().toString(36).substr(2, 9),
      lineupIndex: selectedLineupIdx,
      from: { col: cityTile.col, row: cityTile.row },
      to: { col: selectedTile.col, row: selectedTile.row },
      startTime: Date.now(),
      duration: dist * 5000, // 5 seconds per hex
      status: 'marching',
      type: marchType
    };
    addMarch(march);
    setIsMarchOpen(false);
    setSelectedTile(null);
  };

  const handleGoToLineupSettings = (idx: number) => {
    setCurrentLineupIndex(idx);
    setLineupSubTab('heroes');
    setActiveTab('lineup');
    setIsMarchOpen(false);
  };

  // Calculate rotateX based on zoom
  const rotateX = ((zoom - 1.0) / 1.0) * 45;

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-[#c2b2a1] select-none">
      {/* Map Container */}
      <div 
        ref={containerRef}
        className="absolute inset-0 touch-none"
        style={{ perspective: '1000px' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (dragDistance.current < 5) {
            setSelectedMarchId(null);
          }
        }}
      >
        <div 
          className="absolute top-1/2 left-1/2"
          style={{ 
            transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) rotateX(${rotateX}deg) scale(${zoom})`,
            transformStyle: 'preserve-3d',
            width: MAP_WIDTH * HEX_WIDTH + HEX_WIDTH / 2,
            height: MAP_HEIGHT * HEX_HEIGHT * 0.75 + HEX_HEIGHT / 4,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          {/* Tiles */}
          {mapData.map((tile, i) => {
            const x = tile.col * HEX_WIDTH + (tile.row % 2 === 1 ? HEX_WIDTH / 2 : 0);
            const y = tile.row * HEX_HEIGHT * 0.75;
            const isSelected = selectedTile?.col === tile.col && selectedTile?.row === tile.row;
            
            return (
              <div
                key={`${tile.col}-${tile.row}`}
                className={`absolute ${isSelected ? 'z-50' : 'z-10'} pointer-events-none`}
                style={{
                  width: HEX_WIDTH,
                  height: HEX_HEIGHT,
                  left: x,
                  top: y,
                  transformStyle: 'preserve-3d',
                }}
              >
                <svg
                  width={HEX_WIDTH}
                  height={HEX_HEIGHT}
                  viewBox={`0 0 ${HEX_WIDTH} ${HEX_HEIGHT}`}
                  className="absolute inset-0 overflow-visible pointer-events-none"
                >
                  <polygon
                    points="40,0 80,23 80,69 40,92 0,69 0,23"
                    className={`pointer-events-auto cursor-pointer transition-all ${getTileColor(tile.type)} hover:stroke-white hover:stroke-[3]`}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    onClick={() => handleTileClick(tile)}
                  />
                  {isSelected && (
                    <polygon
                      points="40,0 80,23 80,69 40,92 0,69 0,23"
                      className="fill-white opacity-30 animate-breathing pointer-events-none"
                    />
                  )}
                  {tile.occupied && (
                    <polygon
                      points="40,0 80,23 80,69 40,92 0,69 0,23"
                      className="fill-green-500/30 stroke-green-700 stroke-[3] pointer-events-none"
                    />
                  )}
                </svg>

                <div 
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                  style={{ transform: `rotateX(${-rotateX}deg)` }}
                >
                  {tile.type !== 'plains' && (
                    <>
                      <span className="text-xs font-bold text-white drop-shadow-md">
                        {getTileName(tile.type)}
                      </span>
                      {tile.level && (
                        <span className="text-[10px] font-mono text-white/90 bg-black/30 px-1 rounded-sm mt-0.5">
                          Lv.{tile.level}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Path Line */}
          {(marchPath.length > 1 || selectedMarchId) && (
            <svg 
              className="absolute inset-0 pointer-events-none overflow-visible z-40"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Target Selection Path */}
              {marchPath.length > 1 && (
                <polyline
                  points={marchPath.map(p => {
                    const x = p.col * HEX_WIDTH + (p.row % 2 === 1 ? HEX_WIDTH / 2 : 0) + HEX_WIDTH / 2;
                    const y = p.row * HEX_HEIGHT * 0.75 + HEX_HEIGHT / 2;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="4"
                  strokeDasharray="8,8"
                  className="opacity-80 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
                />
              )}

              {/* Selected March Path */}
              {marches.filter(m => m.id === selectedMarchId).map(m => {
                const path = getHexPath(m.from.col, m.from.row, m.to.col, m.to.row, mapData);
                return (
                  <polyline
                    key={`path-${m.id}`}
                    points={path.map(p => {
                      const x = p.col * HEX_WIDTH + (p.row % 2 === 1 ? HEX_WIDTH / 2 : 0) + HEX_WIDTH / 2;
                      const y = p.row * HEX_HEIGHT * 0.75 + HEX_HEIGHT / 2;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#4ade80"
                    strokeWidth="3"
                    strokeDasharray="6,6"
                    className="opacity-60"
                  />
                );
              })}
            </svg>
          )}

          {/* Active Marches */}
          {marches.map(m => (
            <MarchPawn
              key={m.id}
              m={m}
              mapData={mapData}
              lineups={lineups}
              selectedMarchId={selectedMarchId}
              setSelectedMarchId={setSelectedMarchId}
              setSelectedTile={setSelectedTile}
              rotateX={rotateX}
            />
          ))}

          {/* Selected Tile UI Overlay */}
          {selectedTile && !isMarchOpen && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: selectedTile.col * HEX_WIDTH + (selectedTile.row % 2 === 1 ? HEX_WIDTH / 2 : 0) + HEX_WIDTH / 2,
                top: selectedTile.row * HEX_HEIGHT * 0.75 + HEX_HEIGHT / 2,
                transform: `translate(-50%, -50%) translateZ(100px) rotateX(${-rotateX}deg)`,
                transformStyle: 'preserve-3d',
                zIndex: 1000,
              }}
            >
              <div className="absolute bottom-[40px] left-1/2 -translate-x-1/2 mb-2 bg-black/70 text-white px-3 py-1 rounded-sm text-xs font-bold whitespace-nowrap pointer-events-auto border border-white/20 shadow-lg">
                {getTileName(selectedTile.type)} {selectedTile.level ? `Lv.${selectedTile.level}` : ''}
              </div>
              <div className="absolute top-[40px] left-1/2 -translate-x-1/2 mt-2 bg-black/70 text-white px-3 py-1 rounded-sm text-xs font-mono whitespace-nowrap pointer-events-auto border border-white/20 shadow-lg flex items-center gap-2">
                <span>({selectedTile.col}, {selectedTile.row})</span>
                {selectedTile.occupied && (
                  <button 
                    onClick={() => {
                      setMapData(prev => prev.map(t => 
                        t.col === selectedTile.col && t.row === selectedTile.row 
                          ? { ...t, abandonEndTime: Date.now() + 30000 } 
                          : t
                      ));
                    }}
                    disabled={!!selectedTile.abandonEndTime}
                    className="bg-red-900/80 text-white px-2 py-0.5 rounded-sm text-[10px] font-bold border border-red-500/50 hover:bg-red-800 disabled:opacity-50"
                  >
                    放弃
                  </button>
                )}
              </div>
              
              {selectedTile.abandonEndTime && (
                <div className="absolute top-[70px] left-1/2 -translate-x-1/2 mt-1 bg-red-900/80 text-white px-2 py-0.5 rounded-sm text-[10px] font-bold whitespace-nowrap pointer-events-auto border border-red-500/50 shadow-lg">
                  放弃倒计时: {Math.max(0, Math.ceil((selectedTile.abandonEndTime - now) / 1000))}s
                </div>
              )}

              {selectedTile.type !== 'mountain' && selectedTile.type !== 'lake' && selectedTile.type !== 'city' && (
                <div className="absolute left-[40px] top-1/2 -translate-y-1/2 ml-3 flex flex-col gap-2 pointer-events-auto">
                  <button 
                    onClick={() => { setMarchType('attack'); setIsMarchOpen(true); }}
                    className="bg-black/70 text-white px-4 py-1.5 rounded-sm text-xs font-bold hover:bg-black/90 active:scale-95 whitespace-nowrap border border-white/20 shadow-lg transition-transform"
                  >
                    {selectedTile.occupied ? '扫荡' : '攻占'}
                  </button>
                  <button 
                    onClick={() => { setMarchType('move'); setIsMarchOpen(true); }}
                    className="bg-black/70 text-white px-4 py-1.5 rounded-sm text-xs font-bold hover:bg-black/90 active:scale-95 whitespace-nowrap border border-white/20 shadow-lg transition-transform"
                  >
                    行军
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* March Selection Bottom Sheet */}
      {isMarchOpen && (
        <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center pointer-events-none">
          <div className="w-full max-w-md bg-bg-panel/95 backdrop-blur-md border-t border-white/20 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col h-[35vh] animate-in slide-in-from-bottom-full duration-300 pointer-events-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-4">
                <h3 className="font-serif font-bold text-lg text-ink tracking-widest">选择部队</h3>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={isViewLocked}
                      onChange={(e) => setIsViewLocked(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-4 h-4 border border-white/30 rounded-sm bg-black/20 peer-checked:bg-accent peer-checked:border-accent transition-colors"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 transition-opacity">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-ink-light group-hover:text-ink transition-colors">锁定视角</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsMarchOpen(false)} className="p-1 text-ink-light hover:text-ink">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div ref={marchScrollRef} className="flex-1 overflow-x-scroll show-scrollbar p-4 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-primary/20 [&::-webkit-scrollbar-thumb]:bg-accent [&::-webkit-scrollbar-thumb]:rounded-full cursor-grab active:cursor-grabbing">
              <div className="flex gap-3 h-full pb-2">
                {lineups.map((lu, idx) => {
                  const firstHeroId = lu.find(id => id !== null);
                  const firstHero = firstHeroId ? heroes.find(h => h.id === firstHeroId) : null;
                  const totalTroops = lu.reduce((sum, id) => {
                    const h = id ? heroes.find(hero => hero.id === id) : null;
                    return sum + (h?.troops || 0);
                  }, 0);
                  const isSelected = selectedLineupIdx === idx;
                  const isEmpty = !firstHero;

                  return (
                    <div key={idx} className="relative h-full flex-shrink-0">
                      <button
                        onClick={() => !isEmpty && setSelectedLineupIdx(idx)}
                        disabled={isEmpty}
                        className={`w-24 h-full rounded-lg border-2 transition-all relative overflow-hidden flex flex-col ${isSelected ? 'border-accent shadow-[0_0_15px_rgba(139,26,26,0.4)] scale-105 z-10' : 'border-white/10 bg-primary/20'} ${isEmpty ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                      >
                        {firstHero ? (
                          <>
                            {/* Full Box Avatar */}
                            <div 
                              className="absolute inset-0 bg-cover bg-top transition-transform duration-500 hover:scale-110"
                              style={{ backgroundImage: `url(${firstHero.avatar})` }}
                            ></div>
                            {/* Overlay Gradients */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80"></div>
                            
                            {/* Content */}
                            <div className="relative h-full flex flex-col p-2 justify-between">
                              <div className="text-[10px] font-bold text-white/90 uppercase drop-shadow-md">阵容 {['一', '二', '三', '四', '五'][idx]}</div>
                              <div className="flex flex-col items-center">
                                <span className="text-xs font-bold text-white drop-shadow-md truncate w-full text-center">{firstHero.name}</span>
                                <div className="mt-1 text-[9px] font-bold text-white bg-accent/80 px-1.5 py-0.5 rounded-full border border-white/20 backdrop-blur-sm">
                                  兵力: {totalTroops.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center p-2 gap-2">
                            <div className="text-[10px] font-bold text-ink-light uppercase">阵容 {['一', '二', '三', '四', '五'][idx]}</div>
                            <div className="flex-1 flex items-center justify-center text-ink-light/40 font-serif text-xs text-center">
                              未配置阵容
                            </div>
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute bottom-1 right-1 bg-accent text-white rounded-full p-0.5 shadow-md">
                            <Sword size={10} />
                          </div>
                        )}
                      </button>
                      
                      {/* Settings Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGoToLineupSettings(idx);
                        }}
                        className="absolute top-1 right-1 z-20 p-1.5 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-white/80 hover:text-white hover:bg-black/60 transition-all shadow-lg active:scale-90"
                      >
                        <Settings size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 pt-0 shrink-0">
              <button 
                onClick={handleStartMarch}
                disabled={!lineups[selectedLineupIdx]?.some(id => id !== null)}
                className="w-full bg-accent disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-serif font-bold text-lg py-3 rounded-sm shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Sword size={20} />
                {marchType === 'attack' ? '出征' : '行军'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Overlay */}
      <div className={`absolute bottom-0 left-0 right-0 pointer-events-none flex flex-col p-4 pb-6 gap-4 z-40 transition-transform duration-300 ${isMarchOpen ? 'translate-y-full' : ''}`}>
        <div className="flex justify-between items-end w-full">
          <div className="flex flex-col gap-3 items-center">
            <div className="pointer-events-auto flex flex-col bg-primary/90 rounded-full border border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.4)] overflow-hidden">
              <button 
                onClick={() => setZoom(z => Math.max(1.0, z - 0.2))}
                disabled={zoom <= 1.0}
                className="w-10 h-10 flex items-center justify-center text-ink hover:bg-white/10 active:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Minus size={18} />
              </button>
              <div className="w-full h-[1px] bg-ink/10"></div>
              <button 
                onClick={() => setZoom(z => Math.min(2.0, z + 0.2))}
                disabled={zoom >= 2.0}
                className="w-10 h-10 flex items-center justify-center text-ink hover:bg-white/10 active:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            <button 
              onClick={handleGoHome}
              className="pointer-events-auto w-14 h-14 rounded-full bg-primary/90 text-ink flex flex-col items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.4)] active:scale-95 transition-transform border border-white/10"
            >
              <Home size={20} className="mb-0.5" />
              <span className="text-[10px] font-bold tracking-widest">主城</span>
            </button>
          </div>

          <button 
            onClick={() => setActiveTab('summon')}
            className="pointer-events-auto w-14 h-14 rounded-full bg-accent text-white flex flex-col items-center justify-center shadow-[0_4px_15px_rgba(139,26,26,0.4)] active:scale-95 transition-transform border-2 border-white/20"
          >
            <Sparkles size={20} className="mb-0.5" />
            <span className="text-[10px] font-bold tracking-widest">寻访</span>
          </button>
        </div>

        <div className="pointer-events-auto w-full flex gap-3 mt-2">
          <button 
            onClick={() => setActiveTab('gallery')}
            className="flex-1 bg-primary/80 backdrop-blur-md border border-white/10 rounded-sm py-3 flex items-center justify-center gap-2 active:bg-white/5 transition-colors shadow-sm relative"
          >
            <BookOpen size={18} className="text-ink" />
            <span className="font-serif font-bold text-ink tracking-widest text-sm">武将</span>
            {hasRedDot && <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-sm border border-white/50"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('talisman')}
            className="flex-1 bg-primary/80 backdrop-blur-md border border-white/10 rounded-sm py-3 flex items-center justify-center gap-2 active:bg-white/5 transition-colors shadow-sm"
          >
            <Sparkles size={18} className="text-ink" />
            <span className="font-serif font-bold text-ink tracking-widest text-sm">阵符</span>
          </button>
          <button 
            onClick={() => setActiveTab('lineup')}
            className="flex-1 bg-primary/80 backdrop-blur-md border border-white/10 rounded-sm py-3 flex items-center justify-center gap-2 active:bg-white/5 transition-colors shadow-sm"
          >
            <Users size={18} className="text-ink" />
            <span className="font-serif font-bold text-ink tracking-widest text-sm">编队</span>
          </button>
        </div>
      </div>

      {/* Battle Screen */}
      {activeBattle && (
        <BattleScreen 
          playerLineup={activeBattle.player}
          enemyLineup={activeBattle.enemy}
          onClose={(result, consumedPercentage) => {
            if (result) {
              const tile = mapData.find(t => t.col === activeBattle.tileCol && t.row === activeBattle.tileRow);
              const baseExp = getTileExp(tile?.level);
              const actualExp = result === 'victory' ? baseExp : Math.floor(baseExp * consumedPercentage);
              
              const heroIds = activeBattle.player.map(h => h.id);
              addHeroExp(heroIds, actualExp);
            }
            setActiveBattle(null);
          }}
          onVictory={() => {
            if (activeBattle) {
              setMapData(prev => prev.map(t => {
                if (t.col === activeBattle.tileCol && t.row === activeBattle.tileRow && !t.occupied) {
                  const currentOccupied = prev.filter(pt => pt.occupied).length;
                  if (currentOccupied < territoryLimit + roadLimit) {
                    return { ...t, occupied: true };
                  }
                }
                return t;
              }));
            }
          }}
        />
      )}

      {/* Top Information Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none flex flex-col pt-1">
        {/* Gradient Overlay */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/90 via-black/60 to-transparent -z-10 pointer-events-none"></div>
        
        {/* Top Row: System Info & Resources */}
        <div className="flex items-start justify-between px-2 w-full">
          {/* System Info */}
          <div className="flex flex-col gap-1 text-[10px] text-white/90 font-mono mt-1">
            <div className="flex items-center gap-1">
              <Battery size={12} className="opacity-90" />
              <span>{currentTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>54ms</span>
              <span>30fps</span>
            </div>
          </div>

          {/* Resources */}
          <div className="flex items-center gap-4 pr-2">
            {/* Wood */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-[#d4b483] font-bold text-xs">
                <Trees size={12} className="text-[#a67c52]" />
                <span>+30310</span>
              </div>
              <span className="text-[#e28b8b] text-[10px] scale-90">450万/450万</span>
            </div>
            {/* Iron */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-[#d4b483] font-bold text-xs">
                <Anvil size={12} className="text-[#8a929e]" />
                <span>+31055</span>
              </div>
              <span className="text-[#e28b8b] text-[10px] scale-90">450万/450万</span>
            </div>
            {/* Stone */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-[#d4b483] font-bold text-xs">
                <Mountain size={12} className="text-[#b0b0b0]" />
                <span>+24135</span>
              </div>
              <span className="text-[#e28b8b] text-[10px] scale-90">450万/450万</span>
            </div>
            {/* Grain */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-[#d4b483] font-bold text-xs">
                <Wheat size={12} className="text-[#e6c229]" />
                <span>+38335</span>
              </div>
              <span className="text-[#e28b8b] text-[10px] scale-90">450万/450万</span>
            </div>
          </div>
        </div>

        {/* Bottom Row: Avatar, Prosperity, Territory, Currencies */}
        <div className="flex items-center justify-between px-2 mt-2">
          <div className="flex items-center">
            {/* Avatar & Prosperity */}
            <div className="relative flex items-center pointer-events-auto cursor-pointer" onClick={() => setIsAvatarMenuOpen(true)}>
              {/* Prosperity Banner (Behind Avatar) */}
              <div className="absolute left-8 bg-gradient-to-r from-[#5a3a2a] to-[#3a2a1a]/80 border border-[#8b6545]/50 rounded-r-full pl-6 pr-3 py-0.5 whitespace-nowrap flex items-center gap-1 shadow-md">
                <span className="text-[#d4b483] text-[10px] font-serif">繁荣</span>
                <span className="text-white text-xs font-bold">35043</span>
              </div>
              
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full border-2 border-[#8b4545] overflow-hidden bg-black relative z-10 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                <img src={currentAvatarHero.avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Territory Info */}
            <div className="flex flex-col ml-24 text-[10px] text-[#d4b483] font-bold drop-shadow-md">
              <div className="flex items-center gap-2">
                <span>领地</span>
                <span className="text-white">{territoryCount}/{territoryLimit}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>道路</span>
                <span className="text-white">{roadCount}/{roadLimit}</span>
              </div>
            </div>
          </div>

          {/* Currencies */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Jade */}
            <div className="flex items-center bg-black/60 border border-[#8b6545]/30 rounded-full pl-1 pr-2 py-0.5 gap-1.5 shadow-inner">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-green-700 border border-green-300 flex items-center justify-center shadow-[0_0_5px_rgba(74,222,128,0.5)]">
                <div className="w-2 h-2 rounded-full bg-black/40"></div>
              </div>
              <span className="text-white text-xs font-bold min-w-[20px] text-right">0</span>
              <Plus size={12} className="text-[#d4b483] cursor-pointer hover:text-white transition-colors" />
            </div>
            {/* Gold */}
            <div className="flex items-center bg-black/60 border border-[#8b6545]/30 rounded-full pl-1 pr-2 py-0.5 gap-1.5 shadow-inner">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center text-[10px] text-yellow-900 font-bold border border-yellow-200 shadow-[0_0_5px_rgba(234,179,8,0.5)]">
                ¥
              </div>
              <span className="text-white text-xs font-bold min-w-[32px] text-right">6144</span>
              <Plus size={12} className="text-[#d4b483] cursor-pointer hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        {/* Active Marches List */}
        <div className="flex flex-col items-end gap-2 px-2 mt-4 pointer-events-none w-full">
          {marches.map(m => {
            const lineup = lineups[m.lineupIndex];
            const firstHeroId = lineup.find(id => id !== null);
            const firstHero = heroes.find(h => h.id === firstHeroId);
            if (!firstHero) return null;

            return (
              <div 
                key={m.id}
                onClick={() => {
                  setSelectedMarchId(m.id);
                  centerOnTile(m.to.col, m.to.row);
                }}
                className={`pointer-events-auto w-12 h-12 rounded-full border-2 overflow-hidden bg-black relative shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95 ${selectedMarchId === m.id ? 'border-yellow-400' : 'border-white/50'}`}
              >
                <img src={firstHero.avatar} alt={firstHero.name} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] text-center font-bold">
                  {m.status === 'marching' ? '行军' : '返回'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Avatar Menu Modal */}
      {isAvatarMenuOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setIsAvatarMenuOpen(false)}>
          <div className="bg-bg-panel w-full max-w-xs rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-primary/50">
              <h3 className="font-serif font-bold text-lg text-ink tracking-widest">主公设置</h3>
              <button onClick={() => setIsAvatarMenuOpen(false)} className="p-1 text-ink-light hover:text-ink transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <button 
                onClick={() => {
                  setIsAvatarMenuOpen(false);
                  setIsAvatarSelectOpen(true);
                }}
                className="w-full py-3 bg-primary/80 hover:bg-primary border border-white/10 rounded-sm text-ink font-serif font-bold tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <Users size={18} />
                更换头像
              </button>
              <button 
                onClick={() => {
                  setIsAvatarMenuOpen(false);
                  setIsResetConfirmOpen(true);
                }}
                className="w-full py-3 bg-red-900/40 hover:bg-red-900/60 border border-red-500/30 rounded-sm text-red-200 font-serif font-bold tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <Settings size={18} />
                清空存档
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Selection Modal */}
      {isAvatarSelectOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsAvatarSelectOpen(false)}>
          <div className="bg-bg-panel w-full max-w-md max-h-[80vh] flex flex-col rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-primary/50 shrink-0">
              <h3 className="font-serif font-bold text-lg text-ink tracking-widest">选择头像</h3>
              <button onClick={() => setIsAvatarSelectOpen(false)} className="p-1 text-ink-light hover:text-ink transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-4 gap-3">
              {heroes.filter(h => !h.locked).map(hero => (
                <div 
                  key={hero.id}
                  onClick={() => {
                    setAvatarId(hero.id);
                    setIsAvatarSelectOpen(false);
                  }}
                  className={`relative aspect-square rounded-md overflow-hidden border-2 cursor-pointer transition-all ${avatarId === hero.id ? 'border-accent shadow-[0_0_10px_rgba(139,26,26,0.8)] scale-105' : 'border-white/20 hover:border-white/50'}`}
                >
                  <img src={hero.avatar} alt={hero.name} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5 font-serif">
                    {hero.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-bg-panel w-full max-w-sm rounded-xl border border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.3)] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center text-red-500 mb-2">
                <Settings size={32} />
              </div>
              <h3 className="font-serif font-bold text-xl text-red-400 tracking-widest">警告：清空存档</h3>
              <p className="text-ink-light text-sm leading-relaxed">
                此操作将永久删除您所有的武将、阵容和游戏进度。<br/>
                <span className="text-red-400 font-bold mt-2 block">此操作不可逆，是否继续？</span>
              </p>
              
              <div className="flex gap-3 w-full mt-4">
                <button 
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="flex-1 py-3 bg-primary/80 border border-white/10 rounded-sm text-ink font-serif font-bold hover:bg-white/10 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    resetGame();
                    setIsResetConfirmOpen(false);
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-sm text-white font-serif font-bold shadow-lg transition-colors"
                >
                  确认清空
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
