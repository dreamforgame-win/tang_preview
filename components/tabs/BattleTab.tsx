'use client';
import { useGameState } from '@/components/GameStateProvider';
import { Sparkles, Users, BookOpen, Map as MapIcon, X, Home } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';

type TileType = 'plains' | 'city' | 'mountain' | 'lake' | 'village' | 'forest' | 'iron' | 'town';

interface TileData {
  col: number;
  row: number;
  type: TileType;
  level?: number;
}

const MAP_WIDTH = 15;
const MAP_HEIGHT = 15;
const HEX_WIDTH = 80;
const HEX_HEIGHT = 92;

function hexDistance(col1: number, row1: number, col2: number, row2: number) {
  const q1 = col1 - Math.floor(row1 / 2);
  const r1 = row1;
  const q2 = col2 - Math.floor(row2 / 2);
  const r2 = row2;
  return Math.max(Math.abs(q1 - q2), Math.abs(r1 - r2), Math.abs(-q1 - r1 + q2 + r2));
}

const generateMap = () => {
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

export default function BattleTab() {
  const { setActiveTab } = useGameState();
  const [mapData, setMapData] = useState<TileData[]>(generateMap);
  const [selectedTile, setSelectedTile] = useState<TileData | null>(null);
  
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
    const currentRotateX = ((zoom - 0.5) / 1.3) * 45;
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
      setZoom(z => Math.max(0.5, Math.min(1.8, z + zoomDelta)));
      setSelectedTile(null);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    dragDistance.current = 0;
    if (e.pointerType !== 'mouse') {
      // For touch, we handle pinch in touch events
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
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
      const currentRotateX = ((zoom - 0.5) / 1.3) * 45;
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
        setZoom(z => Math.max(0.5, Math.min(1.8, z + delta * 0.01)));
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

  // Calculate rotateX based on zoom
  // zoom = 0.5 -> rotateX = 0deg (top-down)
  // zoom = 1.8 -> rotateX = 45deg (angled)
  const rotateX = ((zoom - 0.5) / 1.3) * 45;

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
                {/* Hexagon Shape */}
                <svg
                  width={HEX_WIDTH}
                  height={HEX_HEIGHT}
                  viewBox={`0 0 ${HEX_WIDTH} ${HEX_HEIGHT}`}
                  className="absolute inset-0 overflow-visible pointer-events-none"
                  style={{ filter: isSelected ? 'drop-shadow(0 0 10px rgba(255,255,255,0.6))' : 'none' }}
                >
                  <polygon
                    points="40,0 80,23 80,69 40,92 0,69 0,23"
                    className={`pointer-events-auto cursor-pointer transition-all ${getTileColor(tile.type)} hover:brightness-110 ${isSelected ? 'brightness-125' : ''}`}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    onClick={() => handleTileClick(tile)}
                  />
                </svg>

                {/* Content & UI */}
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

          {/* Selected Tile UI Overlay (Rendered in 3D space but above tiles) */}
          {selectedTile && (
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
              {/* Name Above */}
              <div className="absolute bottom-[40px] left-1/2 -translate-x-1/2 mb-2 bg-black/70 text-white px-3 py-1 rounded-sm text-xs font-bold whitespace-nowrap pointer-events-auto border border-white/20 shadow-lg">
                {getTileName(selectedTile.type)} {selectedTile.level ? `Lv.${selectedTile.level}` : ''}
              </div>
              {/* Coords Below */}
              <div className="absolute top-[40px] left-1/2 -translate-x-1/2 mt-2 bg-black/70 text-white px-3 py-1 rounded-sm text-xs font-mono whitespace-nowrap pointer-events-auto border border-white/20 shadow-lg">
                ({selectedTile.col}, {selectedTile.row})
              </div>
              {/* Buttons Right */}
              <div className="absolute left-[40px] top-1/2 -translate-y-1/2 ml-3 flex flex-col gap-2 pointer-events-auto">
                <button className="bg-black/70 text-white px-4 py-1.5 rounded-sm text-xs font-bold hover:bg-black/90 active:scale-95 whitespace-nowrap border border-white/20 shadow-lg transition-transform">
                  攻占
                </button>
                <button className="bg-black/70 text-white px-4 py-1.5 rounded-sm text-xs font-bold hover:bg-black/90 active:scale-95 whitespace-nowrap border border-white/20 shadow-lg transition-transform">
                  行军
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Overlay */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none flex flex-col p-4 pb-6 gap-4 z-40">
        <div className="flex justify-between items-end w-full">
          {/* Main City Button (Circular, bottom left) */}
          <button 
            onClick={handleGoHome}
            className="pointer-events-auto w-14 h-14 rounded-full bg-primary/90 text-ink flex flex-col items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.4)] active:scale-95 transition-transform border border-white/10"
          >
            <Home size={20} className="mb-0.5" />
            <span className="text-[10px] font-bold tracking-widest">主城</span>
          </button>

          {/* Summon Button (Circular, bottom right) */}
          <button 
            onClick={() => setActiveTab('summon')}
            className="pointer-events-auto w-14 h-14 rounded-full bg-accent text-white flex flex-col items-center justify-center shadow-[0_4px_15px_rgba(139,26,26,0.4)] active:scale-95 transition-transform border-2 border-white/20"
          >
            <Sparkles size={20} className="mb-0.5" />
            <span className="text-[10px] font-bold tracking-widest">寻访</span>
          </button>
        </div>

        {/* Bottom Bar (Heroes & Formation) */}
        <div className="pointer-events-auto w-full flex gap-3 mt-2">
          <button 
            onClick={() => setActiveTab('gallery')}
            className="flex-1 bg-primary/80 backdrop-blur-md border border-white/10 rounded-sm py-3 flex items-center justify-center gap-2 active:bg-white/5 transition-colors shadow-sm"
          >
            <BookOpen size={18} className="text-ink" />
            <span className="font-serif font-bold text-ink tracking-widest text-sm">武将</span>
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
    </div>
  );
}
