'use client';
import { useGameState } from '@/components/GameStateProvider';
import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Filter, X, ChevronUp, Shield, Sword, Zap, Heart, Wind, Star } from 'lucide-react';
import FormationModal from '@/components/FormationModal';
import { HERO_GALLERY, HeroQuality, HeroType, HeroRole, HeroDetail } from '@/data/heroes';
import { formations } from '@/data/formations';
import { TALISMANS, Talisman } from '@/data/talismans';
import { useDragScroll } from '@/hooks/useDragScroll';

type Hero = {
  id: string;
  name: string;
  avatar: string;
  troops: number;
  maxTroops: number;
};

const HeroRow = ({ hero, updateHeroTroops }: { hero: Hero, updateHeroTroops: (id: string, troops: number) => void }) => {
  const [localTroops, setLocalTroops] = useState(hero.troops);
  const [prevTroops, setPrevTroops] = useState(hero.troops);

  if (hero.troops !== prevTroops) {
    setPrevTroops(hero.troops);
    setLocalTroops(hero.troops);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTroops(parseInt(e.target.value));
  };

  const handleCommit = () => {
    updateHeroTroops(hero.id, localTroops);
  };

  return (
    <div className="flex items-center gap-3 bg-primary/60 px-3 h-[45px] rounded-sm border border-white/10 shadow-sm">
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

const EmptyRow = () => (
  <div className="flex items-center gap-3 bg-primary/40 px-3 h-[45px] rounded-sm border border-white/5 border-dashed shadow-sm opacity-60">
    <div className="w-8 h-8 rounded-sm border border-ink/10 border-dashed bg-ink/5 shrink-0 flex items-center justify-center">
      <span className="text-ink/30 text-xs font-bold">?</span>
    </div>
    <div className="flex-1 flex flex-col justify-center">
      <span className="font-serif font-bold text-ink/50 text-sm leading-none">未配置武将</span>
    </div>
  </div>
);

const qualityOrder = { '橙品': 3, '紫品': 2, '蓝品': 1 };

export default function LineupTab() {
  const { heroes, lineups, lineup, currentLineupIndex, setCurrentLineupIndex, updateHeroTroops, quickAssign, setActiveTab, setFullLineup, addHeroToRoster, lineupSubTab, setLineupSubTab, formationId, talismans, currentLineupTalismans, setFullLineupTalismans } = useGameState();
  
  // Filtering state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedQualities, setSelectedQualities] = useState<HeroQuality[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<HeroType[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<HeroRole[]>([]);

  // Lineup Switch state
  const [isLineupMenuOpen, setIsLineupMenuOpen] = useState(false);

  // Drag and Drop state
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);

  // Hero Info Modal state
  const [selectedHeroInfo, setSelectedHeroInfo] = useState<HeroDetail | null>(null);
  const [selectedTalisman, setSelectedTalisman] = useState<Talisman | null>(null);
  const [selectedEffectCell, setSelectedEffectCell] = useState<number | null>(null);
  const selectedFormation = formations.find(f => f.id === formationId);

  const sortedTalismans = useMemo(() => {
    return [...TALISMANS].sort((a, b) => qualityOrder[b.quality] - qualityOrder[a.quality]);
  }, []);

  // Calculate talisman effects
  const talismanEffects = useMemo(() => {
    const effects: Record<number, string[]> = {};
    
    currentLineupTalismans.forEach((talismanId, index) => {
      if (talismanId === null) return;
      
      const talisman = TALISMANS.find(t => t.id === talismanId);
      if (!talisman) return;
      
      const affectedCells: number[] = [];
      const row = Math.floor(index / 3);
      const col = index % 3;
      
      const cond = talisman.spatialCondition;
      if (cond.includes('周围十字')) {
        if (row > 0) affectedCells.push(index - 3);
        if (row < 2) affectedCells.push(index + 3);
        if (col > 0) affectedCells.push(index - 1);
        if (col < 2) affectedCells.push(index + 1);
      } else if (cond.includes('左上方1格')) {
        if (row > 0 && col > 0) affectedCells.push(index - 4);
      } else if (cond.includes('右下方1格')) {
        if (row < 2 && col < 2) affectedCells.push(index + 4);
      } else if (cond.includes('上方1格')) {
        if (row > 0) affectedCells.push(index - 3);
      } else if (cond.includes('下方1格')) {
        if (row < 2) affectedCells.push(index + 3);
      } else if (cond.includes('左侧1格')) {
        if (col > 0) affectedCells.push(index - 1);
      } else if (cond.includes('右侧1格')) {
        if (col < 2) affectedCells.push(index + 1);
      } else if (cond.includes('左侧或右侧1格')) {
        if (col > 0) affectedCells.push(index - 1);
        if (col < 2) affectedCells.push(index + 1);
      } else if (cond.includes('同列')) {
        affectedCells.push(col, col + 3, col + 6);
      } else if (cond.includes('同排')) {
        affectedCells.push(row * 3, row * 3 + 1, row * 3 + 2);
      } else if (cond.includes('任意位置') || cond.includes('所有') || cond.includes('全图') || cond.includes('随机')) {
        for (let i = 0; i < 9; i++) affectedCells.push(i);
      } else if (cond.includes('周围九宫格')) {
        for (let r = Math.max(0, row - 1); r <= Math.min(2, row + 1); r++) {
          for (let c = Math.max(0, col - 1); c <= Math.min(2, col + 1); c++) {
            if (r !== row || c !== col) {
              affectedCells.push(r * 3 + c);
            }
          }
        }
      } else if (cond.includes('自身')) {
        affectedCells.push(index);
      }
      
      affectedCells.forEach(cellIndex => {
        if (cellIndex === index && !cond.includes('自身') && !cond.includes('同列') && !cond.includes('同排') && !cond.includes('任意位置') && !cond.includes('所有') && !cond.includes('全图') && !cond.includes('随机')) return;
        
        let isTarget = false;
        const targetHeroId = lineup[cellIndex];
        const targetTalismanId = currentLineupTalismans[cellIndex];
        
        const tc = talisman.targetCondition;
        if (tc.includes('武将(不限)') && targetHeroId) isTarget = true;
        else if (tc.includes('全部武将') && targetHeroId) isTarget = true;
        else if (tc.includes('阵符') && targetTalismanId) isTarget = true;
        else if (tc.includes('阵眼') && selectedFormation?.effectCells.includes(cellIndex)) isTarget = true;
        else if (targetHeroId) {
          const hero = HERO_GALLERY.find(h => h.id === targetHeroId);
          if (hero) {
            if (tc.includes('【步兵】') && hero.type === '步兵') isTarget = true;
            if (tc.includes('【骑兵】') && hero.type === '骑兵') isTarget = true;
            if (tc.includes('【弓兵】') && hero.type === '弓兵') isTarget = true;
            if (tc.includes('【盾兵】') && hero.type === '盾兵') isTarget = true;
            if (tc.includes('【枪兵】') && hero.type === '枪兵') isTarget = true;
            if (tc.includes('【辅助】') && hero.role === '辅助') isTarget = true;
            if (tc.includes('【陷阵】') && hero.role === '陷阵') isTarget = true;
            if (tc.includes('【勇武】') && hero.role === '勇武') isTarget = true;
            if (tc.includes('【突袭】') && (hero.role === '突击' || hero.role === '突袭' as any)) isTarget = true;
            if (tc.includes('【奇谋】') && hero.role === '奇谋') isTarget = true;
            if (tc.includes('【统帅】') && hero.role === '统帅') isTarget = true;
            if (tc.includes('【先锋】') && hero.role === '先锋') isTarget = true;
            if (tc.includes('【谋士】') && hero.role === '谋士') isTarget = true;
          }
        }
        
        if (isTarget) {
          if (!effects[cellIndex]) effects[cellIndex] = [];
          effects[cellIndex].push(`【${talisman.name}】: ${talisman.effect}`);
        }
      });
    });
    
    return effects;
  }, [currentLineupTalismans, lineup, selectedFormation]);

  const talismanConnections = useMemo(() => {
    const connections: { source: number, target: number }[] = [];
    
    currentLineupTalismans.forEach((talismanId, index) => {
      if (talismanId === null) return;
      
      const talisman = TALISMANS.find(t => t.id === talismanId);
      if (!talisman) return;
      
      const affectedCells: number[] = [];
      const row = Math.floor(index / 3);
      const col = index % 3;
      
      const cond = talisman.spatialCondition;
      if (cond.includes('周围十字')) {
        if (row > 0) affectedCells.push(index - 3);
        if (row < 2) affectedCells.push(index + 3);
        if (col > 0) affectedCells.push(index - 1);
        if (col < 2) affectedCells.push(index + 1);
      } else if (cond.includes('左上方1格')) {
        if (row > 0 && col > 0) affectedCells.push(index - 4);
      } else if (cond.includes('右下方1格')) {
        if (row < 2 && col < 2) affectedCells.push(index + 4);
      } else if (cond.includes('上方1格')) {
        if (row > 0) affectedCells.push(index - 3);
      } else if (cond.includes('下方1格')) {
        if (row < 2) affectedCells.push(index + 3);
      } else if (cond.includes('左侧1格')) {
        if (col > 0) affectedCells.push(index - 1);
      } else if (cond.includes('右侧1格')) {
        if (col < 2) affectedCells.push(index + 1);
      } else if (cond.includes('左侧或右侧1格')) {
        if (col > 0) affectedCells.push(index - 1);
        if (col < 2) affectedCells.push(index + 1);
      } else if (cond.includes('同列')) {
        affectedCells.push(col, col + 3, col + 6);
      } else if (cond.includes('同排')) {
        affectedCells.push(row * 3, row * 3 + 1, row * 3 + 2);
      } else if (cond.includes('任意位置') || cond.includes('所有') || cond.includes('全图') || cond.includes('随机')) {
        for (let i = 0; i < 9; i++) affectedCells.push(i);
      } else if (cond.includes('周围九宫格')) {
        for (let r = Math.max(0, row - 1); r <= Math.min(2, row + 1); r++) {
          for (let c = Math.max(0, col - 1); c <= Math.min(2, col + 1); c++) {
            if (r !== row || c !== col) {
              affectedCells.push(r * 3 + c);
            }
          }
        }
      } else if (cond.includes('自身')) {
        affectedCells.push(index);
      }
      
      affectedCells.forEach(cellIndex => {
        if (cellIndex === index && !cond.includes('自身') && !cond.includes('同列') && !cond.includes('同排') && !cond.includes('任意位置') && !cond.includes('所有') && !cond.includes('全图') && !cond.includes('随机')) return;
        
        let isTarget = false;
        const targetHeroId = lineup[cellIndex];
        const targetTalismanId = currentLineupTalismans[cellIndex];
        
        const tc = talisman.targetCondition;
        if (tc.includes('武将(不限)') && targetHeroId) isTarget = true;
        else if (tc.includes('全部武将') && targetHeroId) isTarget = true;
        else if (tc.includes('阵符') && targetTalismanId) isTarget = true;
        else if (tc.includes('阵眼') && selectedFormation?.effectCells.includes(cellIndex)) isTarget = true;
        else if (targetHeroId) {
          const hero = HERO_GALLERY.find(h => h.id === targetHeroId);
          if (hero) {
            if (tc.includes('【步兵】') && hero.type === '步兵') isTarget = true;
            if (tc.includes('【骑兵】') && hero.type === '骑兵') isTarget = true;
            if (tc.includes('【弓兵】') && hero.type === '弓兵') isTarget = true;
            if (tc.includes('【盾兵】') && hero.type === '盾兵') isTarget = true;
            if (tc.includes('【枪兵】') && hero.type === '枪兵') isTarget = true;
            if (tc.includes('【辅助】') && hero.role === '辅助') isTarget = true;
            if (tc.includes('【陷阵】') && hero.role === '陷阵') isTarget = true;
            if (tc.includes('【勇武】') && hero.role === '勇武') isTarget = true;
            if (tc.includes('【突袭】') && (hero.role === '突击' || hero.role === '突袭' as any)) isTarget = true;
            if (tc.includes('【奇谋】') && hero.role === '奇谋') isTarget = true;
            if (tc.includes('【统帅】') && hero.role === '统帅') isTarget = true;
            if (tc.includes('【先锋】') && hero.role === '先锋') isTarget = true;
            if (tc.includes('【谋士】') && hero.role === '谋士') isTarget = true;
          }
        }
        
        if (isTarget) {
          connections.push({ source: index, target: cellIndex });
        }
      });
    });
    
    return connections;
  }, [currentLineupTalismans, lineup, selectedFormation]);

  const activeConnections = useMemo(() => {
    if (selectedEffectCell === null) return [];
    
    return talismanConnections.filter(c => c.source === selectedEffectCell || c.target === selectedEffectCell);
  }, [selectedEffectCell, talismanConnections]);

  // View Angle state
  const [viewAngle, setViewAngle] = useState(45);
  const [isTopDown, setIsTopDown] = useState(false);
  const [isAnimatingView, setIsAnimatingView] = useState(false);
  const [isFormationModalOpen, setIsFormationModalOpen] = useState(false);

  const toggleViewAngle = () => {
    if (isAnimatingView) return;
    setIsAnimatingView(true);
    const targetAngle = isTopDown ? 45 : 0;
    const startAngle = viewAngle;
    const startTime = performance.now();
    const duration = 1000;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeInOutQuad
      const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      setViewAngle(startAngle + (targetAngle - startAngle) * easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsTopDown(!isTopDown);
        setIsAnimatingView(false);
      }
    };
    requestAnimationFrame(animate);
  };

  // Drag Scroll refs
  const heroListScrollRef = useDragScroll<HTMLDivElement>({ direction: 'horizontal' });
  const talismanListScrollRef = useDragScroll<HTMLDivElement>({ direction: 'horizontal' });
  const lineupSelectScrollRef = useDragScroll<HTMLDivElement>({ direction: 'horizontal' });
  const filterScrollRef = useDragScroll<HTMLDivElement>({ direction: 'vertical' });

  // Image Loading state
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  // Touch Drag state
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const draggedRef = useRef(false);
  const touchStartPosRef = useRef<{x: number, y: number} | null>(null);
  const [touchDragState, setTouchDragState] = useState<{
    heroId?: string;
    talismanId?: number;
    sourceIndex?: number;
    x: number;
    y: number;
    heroData?: HeroDetail;
    talismanData?: any;
  } | null>(null);

  useEffect(() => {
    if (touchDragState) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [touchDragState]);

  const handlePointerDown = (e: React.PointerEvent, heroId: string, sourceIndex?: number) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return; // Only left click
    
    const heroData = HERO_GALLERY.find(h => h.id === heroId);
    if (!heroData) return;

    draggedRef.current = false;
    touchStartPosRef.current = { x: e.clientX, y: e.clientY };
    
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    
    let isDragStarted = false;
    let timer: NodeJS.Timeout | null = null;
    
    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!touchStartPosRef.current) return;
      
      const dx = moveEvent.clientX - touchStartPosRef.current.x;
      const dy = moveEvent.clientY - touchStartPosRef.current.y;
      
      if (!isDragStarted) {
        if (sourceIndex !== undefined) {
          if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            isDragStarted = true;
            draggedRef.current = true;
            if (timer) clearTimeout(timer);
            
            setTouchDragState({
              heroId,
              sourceIndex,
              x: moveEvent.clientX,
              y: moveEvent.clientY,
              heroData
            });
            setIsDragging(true);
            if (window.navigator && window.navigator.vibrate) {
              window.navigator.vibrate(50);
            }
          }
        } else {
          // Dragging from list: distinguish between horizontal scroll and vertical drag
          if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
            // Horizontal scroll, cancel drag
            cleanup();
            return;
          } else if (dy > 10 && Math.abs(dy) > Math.abs(dx)) {
            // Vertical drag downwards, cancel drag
            cleanup();
            return;
          } else if (dy < -10 && Math.abs(dy) > Math.abs(dx)) {
            // Vertical drag upwards, start drag
            isDragStarted = true;
            draggedRef.current = true;
            if (timer) clearTimeout(timer);
            
            setTouchDragState({
              heroId,
              sourceIndex,
              x: moveEvent.clientX,
              y: moveEvent.clientY,
              heroData
            });
            setIsDragging(true);
            if (window.navigator && window.navigator.vibrate) {
              window.navigator.vibrate(50);
            }
          }
        }
      } else {
        // Update drag position
        setTouchDragState(prev => prev ? { ...prev, x: moveEvent.clientX, y: moveEvent.clientY } : null);
        const elem = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
        const cell = elem?.closest('[data-cell-index]');
        if (cell) {
          setHoveredCell(parseInt(cell.getAttribute('data-cell-index')!));
        } else {
          setHoveredCell(null);
        }
      }
    };
    
    const onPointerUp = (upEvent: PointerEvent) => {
      if (isDragStarted) {
        const elem = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
        const cell = elem?.closest('[data-cell-index]');
        
        if (cell) {
          const targetIndex = parseInt(cell.getAttribute('data-cell-index')!);
          handleDrop(targetIndex, heroId, sourceIndex);
        } else {
          const removeZone = elem?.closest('[data-drop-zone="remove"]');
          if (removeZone && sourceIndex !== undefined) {
            const newLineup = [...lineup];
            newLineup[sourceIndex] = null;
            setFullLineup(newLineup);
          }
        }
        
        setTouchDragState(null);
        setHoveredCell(null);
        setIsDragging(false);
        
        setTimeout(() => {
          draggedRef.current = false;
        }, 100);
      }
      cleanup();
    };

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      try { target.releasePointerCapture(e.pointerId); } catch (err) {}
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
    };

    const onPointerCancel = () => {
      if (isDragStarted) {
        setTouchDragState(null);
        setHoveredCell(null);
        setIsDragging(false);
        setTimeout(() => {
          draggedRef.current = false;
        }, 100);
      }
      cleanup();
    };

    // Long press fallback
    timer = setTimeout(() => {
      if (!isDragStarted) {
        isDragStarted = true;
        draggedRef.current = true;
        setTouchDragState({
          heroId,
          sourceIndex,
          x: touchStartPosRef.current!.x,
          y: touchStartPosRef.current!.y,
          heroData
        });
        setIsDragging(true);
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(50);
        }
      }
    }, 300);

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
  };

  const handleTalismanPointerDown = (e: React.PointerEvent, talismanId: number, sourceIndex?: number) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return; // Only left click
    
    const talismanData = TALISMANS.find(t => t.id === talismanId);
    if (!talismanData) return;

    draggedRef.current = false;
    touchStartPosRef.current = { x: e.clientX, y: e.clientY };
    
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    
    let isDragStarted = false;
    let timer: NodeJS.Timeout | null = null;
    
    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!touchStartPosRef.current) return;
      
      const dx = moveEvent.clientX - touchStartPosRef.current.x;
      const dy = moveEvent.clientY - touchStartPosRef.current.y;
      
      if (!isDragStarted) {
        if (sourceIndex !== undefined) {
          if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            isDragStarted = true;
            draggedRef.current = true;
            if (timer) clearTimeout(timer);
            
            setTouchDragState({
              talismanId,
              sourceIndex,
              x: moveEvent.clientX,
              y: moveEvent.clientY,
              talismanData
            });
            setIsDragging(true);
            if (window.navigator && window.navigator.vibrate) {
              window.navigator.vibrate(50);
            }
          }
        } else {
          // Dragging from list: distinguish between horizontal scroll and vertical drag
          if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
            // Horizontal scroll, cancel drag
            cleanup();
            return;
          } else if (dy > 10 && Math.abs(dy) > Math.abs(dx)) {
            // Vertical drag downwards, cancel drag
            cleanup();
            return;
          } else if (dy < -10 && Math.abs(dy) > Math.abs(dx)) {
            // Vertical drag upwards, start drag
            isDragStarted = true;
            draggedRef.current = true;
            if (timer) clearTimeout(timer);
            
            setTouchDragState({
              talismanId,
              sourceIndex,
              x: moveEvent.clientX,
              y: moveEvent.clientY,
              talismanData
            });
            setIsDragging(true);
            if (window.navigator && window.navigator.vibrate) {
              window.navigator.vibrate(50);
            }
          }
        }
      } else {
        setTouchDragState(prev => prev ? { ...prev, x: moveEvent.clientX, y: moveEvent.clientY } : null);
        const elem = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
        const cell = elem?.closest('[data-cell-index]');
        if (cell) {
          setHoveredCell(parseInt(cell.getAttribute('data-cell-index')!));
        } else {
          setHoveredCell(null);
        }
      }
    };
    
    const onPointerUp = (upEvent: PointerEvent) => {
      if (isDragStarted) {
        const elem = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
        const cell = elem?.closest('[data-cell-index]');
        
        if (cell) {
          const targetIndex = parseInt(cell.getAttribute('data-cell-index')!);
          handleTalismanDrop(targetIndex, talismanId, sourceIndex);
        } else {
          const removeZone = elem?.closest('[data-drop-zone="remove-talisman"]');
          if (removeZone && sourceIndex !== undefined) {
            const newTalismans = [...currentLineupTalismans];
            newTalismans[sourceIndex] = null;
            setFullLineupTalismans(newTalismans);
          }
        }
        
        setTouchDragState(null);
        setHoveredCell(null);
        setIsDragging(false);
        
        setTimeout(() => {
          draggedRef.current = false;
        }, 100);
      }
      cleanup();
    };

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      try { target.releasePointerCapture(e.pointerId); } catch (err) {}
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
    };

    const onPointerCancel = () => {
      if (isDragStarted) {
        setTouchDragState(null);
        setHoveredCell(null);
        setIsDragging(false);
        setTimeout(() => {
          draggedRef.current = false;
        }, 100);
      }
      cleanup();
    };

    timer = setTimeout(() => {
      if (!isDragStarted) {
        isDragStarted = true;
        draggedRef.current = true;
        setTouchDragState({
          talismanId,
          sourceIndex,
          x: touchStartPosRef.current!.x,
          y: touchStartPosRef.current!.y,
          talismanData
        });
        setIsDragging(true);
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(50);
        }
      }
    }, 300);

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
  };

  // Calculate troops based on current lineup
  const currentLineupHeroes = lineup.map(id => id ? heroes.find(h => h.id === id) : null).filter(Boolean) as Hero[];
  const totalTroops = currentLineupHeroes.reduce((sum, h) => sum + h.troops, 0);
  const maxTotalTroops = currentLineupHeroes.reduce((sum, h) => sum + h.maxTroops, 0);

  const getHeroLineups = (heroId: string) => {
    const inLineups: number[] = [];
    lineups.forEach((lu, idx) => {
      if (lu.includes(heroId)) {
        inLineups.push(idx);
      }
    });
    return inLineups;
  };

  // Filter logic
  const filteredHeroes = HERO_GALLERY.filter(hero => {
    const matchQuality = selectedQualities.length === 0 || selectedQualities.includes(hero.quality);
    const matchType = selectedTypes.length === 0 || selectedTypes.includes(hero.type);
    const matchRole = selectedRoles.length === 0 || selectedRoles.includes(hero.role);
    return matchQuality && matchType && matchRole;
  });

  const sortedFilteredHeroes = [...filteredHeroes].sort((a, b) => {
    const aState = heroes.find(h => h.id === a.id);
    const bState = heroes.find(h => h.id === b.id);
    const aLocked = aState?.locked ?? true;
    const bLocked = bState?.locked ?? true;

    if (aLocked && !bLocked) return 1;
    if (!aLocked && bLocked) return -1;

    const aLineups = getHeroLineups(a.id);
    const bLineups = getHeroLineups(b.id);
    if (aLineups.length === 0 && bLineups.length > 0) return -1;
    if (aLineups.length > 0 && bLineups.length === 0) return 1;
    return 0;
  });

  const getQualityColor = (quality: string) => {
    switch(quality) {
      case '神将': return 'text-red-600 border-red-600 bg-red-50';
      case '名将': return 'text-orange-500 border-orange-500 bg-orange-50';
      case '良将': return 'text-purple-600 border-purple-600 bg-purple-50';
      case '裨将': return 'text-blue-500 border-blue-500 bg-blue-50';
      default: return 'text-gray-500 border-gray-500 bg-gray-50';
    }
  };

  const getRoleLabel = (role: HeroRole) => {
    switch(role) {
      case '辅助': return '辅';
      case '奇谋': return '谋';
      case '统帅': return '帅';
      case '突击': return '袭';
      case '陷阵': return '陷';
      case '勇武': return '勇';
      case '谋士': return '谋';
      case '先锋': return '先';
      default: return role[0];
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case '步兵': return 'text-amber-700 bg-amber-100 border-amber-200';
      case '骑兵': return 'text-blue-700 bg-blue-100 border-blue-200';
      case '弓兵': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
      case '盾兵': return 'text-slate-700 bg-slate-200 border-slate-300';
      case '枪兵': return 'text-red-700 bg-red-100 border-red-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const toggleFilter = <T,>(item: T, list: T[], setList: (l: T[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleDrop = (targetIndex: number, heroId: string, sourceIndex?: number) => {
    const targetTalisman = currentLineupTalismans[targetIndex];
    
    if (targetTalisman !== null) {
      if (sourceIndex !== undefined) {
        const newLineup = [...lineup];
        const newTalismans = [...currentLineupTalismans];
        
        newLineup[sourceIndex] = null;
        newLineup[targetIndex] = heroId;
        
        newTalismans[targetIndex] = null;
        newTalismans[sourceIndex] = targetTalisman;
        
        setFullLineup(newLineup);
        setFullLineupTalismans(newTalismans);
        return;
      } else {
        alert('武将不可与阵符放置在同一格！');
        return;
      }
    }

    const currentPlacedCount = lineup.filter(id => id !== null).length;
    const isAlreadyInLineup = lineup.includes(heroId);
    
    if (!isAlreadyInLineup && currentPlacedCount >= 3 && sourceIndex === undefined) {
      alert('最多只能上阵3名武将！');
      return;
    }

    const newLineup = [...lineup];
    
    if (sourceIndex !== undefined) {
      newLineup[sourceIndex] = null;
    } else {
      const oldIndex = newLineup.indexOf(heroId);
      if (oldIndex !== -1) {
        newLineup[oldIndex] = null;
      }
    }
    
    const existingHero = newLineup[targetIndex];
    if (existingHero && sourceIndex !== undefined) {
      newLineup[sourceIndex] = existingHero;
    }
    
    newLineup[targetIndex] = heroId;
    setFullLineup(newLineup);
    addHeroToRoster(heroId);
  };

  const handleTalismanDrop = (targetIndex: number, talismanId: number, sourceIndex?: number) => {
    const targetHero = lineup[targetIndex];
    
    if (targetHero !== null) {
      if (sourceIndex !== undefined) {
        const newLineup = [...lineup];
        const newTalismans = [...currentLineupTalismans];
        
        newTalismans[sourceIndex] = null;
        newTalismans[targetIndex] = talismanId;
        
        newLineup[targetIndex] = null;
        newLineup[sourceIndex] = targetHero;
        
        setFullLineup(newLineup);
        setFullLineupTalismans(newTalismans);
        return;
      } else {
        alert('阵符不可与武将放置在同一格！');
        return;
      }
    }

    const newTalismans = [...currentLineupTalismans];
    
    if (sourceIndex !== undefined) {
      newTalismans[sourceIndex] = null;
    } else {
      const ownedCount = talismans[talismanId] || 0;
      const placedCount = newTalismans.filter(id => id === talismanId).length;
      if (placedCount >= ownedCount) {
        const oldIndex = newTalismans.indexOf(talismanId);
        if (oldIndex !== -1) {
          newTalismans[oldIndex] = null;
        }
      }
    }
    
    const existingTalisman = newTalismans[targetIndex];
    if (existingTalisman && sourceIndex !== undefined) {
      newTalismans[sourceIndex] = existingTalisman;
    }
    
    newTalismans[targetIndex] = talismanId;
    setFullLineupTalismans(newTalismans);
  };

  const lineupNames = ['阵容一', '阵容二', '阵容三', '阵容四', '阵容五'];

  return (
    <div 
      className="flex-1 flex flex-col relative overflow-hidden bg-bg-panel bg-[url('https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/bg/team_bg.jpg')] bg-cover bg-center"
    >
      <div className="absolute inset-0 bg-bg-dark/60 backdrop-blur-[2px] pointer-events-none z-0"></div>
      {/* Header */}
      <header className="flex items-center justify-center bg-bg-panel/80 backdrop-blur-md border-b border-ink/10 p-4 sticky top-0 z-50 shrink-0">
        <h2 className="font-serif text-lg font-bold leading-tight uppercase tracking-widest text-ink">编队</h2>
      </header>

      <div className="flex-1 overflow-y-auto flex flex-col pb-24" onClick={() => setSelectedEffectCell(null)}>
        {/* 3D Grid Section */}
        <section className="w-full h-80 shrink-0 flex items-center justify-center relative overflow-hidden border-b border-ink/5 z-10">
          <div style={{ perspective: '1000px' }} className="w-full h-full flex items-center justify-center">
            <div 
              style={{ transform: `rotateX(${viewAngle}deg) translateY(-10px)`, transformStyle: 'preserve-3d' }} 
              className="grid grid-cols-3 gap-3 relative"
              onClick={() => setSelectedEffectCell(null)}
            >
              {lineup.map((heroId, index) => {
                const heroData = heroId ? HERO_GALLERY.find(h => h.id === heroId) : null;
                const isEffectCell = selectedFormation?.effectCells.includes(index);
                return (
                  <div 
                    key={index}
                    data-cell-index={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEffectCell(selectedEffectCell === index ? null : index);
                    }}
                    onDragOver={(e) => { e.preventDefault(); setHoveredCell(index); }}
                    onDragLeave={() => setHoveredCell(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      const droppedHeroId = e.dataTransfer.getData('heroId');
                      const droppedTalismanId = e.dataTransfer.getData('talismanId');
                      const sourceIndexStr = e.dataTransfer.getData('sourceIndex');
                      const sourceIndex = sourceIndexStr ? parseInt(sourceIndexStr) : undefined;
                      
                      if (droppedHeroId) {
                        handleDrop(index, droppedHeroId, sourceIndex);
                      } else if (droppedTalismanId) {
                        handleTalismanDrop(index, parseInt(droppedTalismanId), sourceIndex);
                      }
                      setHoveredCell(null);
                      setIsDragging(false);
                    }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className={`w-[95px] h-[95px] border-[1.5px] transition-colors relative ${hoveredCell === index ? 'bg-accent/30 border-accent' : selectedEffectCell === index ? 'bg-green-500/30 border-green-500' : isEffectCell ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-ink/5 border-ink/40'}`}
                  >
                    {(selectedEffectCell === index) && (isEffectCell || talismanEffects[index]) && (
                      <div 
                        className="absolute top-1/2 left-1/2 z-50 bg-black/80 text-white text-[10px] p-2 rounded shadow-lg w-32 whitespace-normal pointer-events-none"
                        style={{ transform: `rotateX(-${viewAngle}deg) translateY(-100%) translateX(8px)`, transformOrigin: 'bottom left' }}
                      >
                        {isEffectCell && (() => {
                          const effect = selectedFormation?.effects[selectedFormation.effectCells.indexOf(index)];
                          if (!effect) return null;
                          const parts = effect.split(/[:：]/);
                          return <div className="mb-1 text-yellow-400">【阵法】{parts.length > 1 ? parts[1].trim() : parts[0].trim()}</div>;
                        })()}
                        {talismanEffects[index] && talismanEffects[index].map((eff, i) => (
                          <div key={i} className="text-green-400">{eff}</div>
                        ))}
                      </div>
                    )}
                    {heroData && (
                      <div 
                        onPointerDown={(e) => handlePointerDown(e, heroData.id, index)}
                        style={{ transform: `rotateX(-${viewAngle}deg) translateY(-6px) translateZ(0)`, transformOrigin: 'bottom center', WebkitTouchCallout: 'none', touchAction: 'none' }}
                        className={`absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-end cursor-grab active:cursor-grabbing transition-opacity w-24 z-20 select-none ${isDragging ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}
                      >
                        <div className="relative w-full flex justify-center items-end mb-1">
                          <div className={`flex flex-col items-center transition-opacity duration-300 w-full ${viewAngle < 22.5 ? 'opacity-100' : 'opacity-0 absolute bottom-0 pointer-events-none'}`}>
                            <div 
                              className={`w-16 h-16 rounded-full border-2 ${getQualityColor(heroData.quality).split(' ')[1]} bg-bg-dark bg-cover bg-center shadow-lg`}
                              style={{ backgroundImage: `url(${heroData.avatar})` }}
                            ></div>
                          </div>
                          <div className={`flex flex-col items-center transition-opacity duration-300 w-full ${viewAngle >= 22.5 ? 'opacity-100' : 'opacity-0 absolute bottom-0 pointer-events-none'}`}>
                            <img 
                              src={`https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/hero-chess/${heroData.id}.png`} 
                              alt={heroData.name}
                              className="w-20 h-auto object-contain drop-shadow-2xl"
                              draggable={false}
                              onLoad={() => setLoadedImages(prev => ({ ...prev, [heroData.id]: true }))}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-1 bg-black/60 px-1.5 py-0.5 rounded-sm whitespace-nowrap z-10">
                          <span className={`text-[8px] font-bold ${getTypeColor(heroData.type).split(' ')[0]}`}>{heroData.type[0]}</span>
                          <span className="text-[8px] font-bold text-white border border-white/50 px-0.5 rounded-sm">{getRoleLabel(heroData.role)}</span>
                          <span className="text-[10px] font-serif font-bold text-white">{heroData.name}</span>
                          {(isEffectCell || talismanEffects[index]) && (
                            <span 
                              className="text-[8px] font-bold text-green-400 border border-green-400/50 px-0.5 rounded-sm ml-0.5 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEffectCell(selectedEffectCell === index ? null : index);
                              }}
                              onPointerDown={(e) => e.stopPropagation()}
                            >
                              提升
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {(() => {
                      const talismanId = currentLineupTalismans[index];
                      const talismanData = talismanId ? TALISMANS.find(t => t.id === talismanId) : null;
                      if (!talismanData) return null;
                      return (
                        <div 
                          onPointerDown={(e) => handleTalismanPointerDown(e, talismanData.id, index)}
                          style={{ transform: `rotateX(-${viewAngle}deg) translateY(-6px) translateZ(0)`, transformOrigin: 'bottom center', WebkitTouchCallout: 'none', touchAction: 'none' }}
                          className={`absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-end cursor-grab active:cursor-grabbing transition-opacity w-24 z-20 select-none ${isDragging ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}
                        >
                          <div className="relative w-full flex justify-center items-end mb-1">
                            <div className={`w-14 h-14 rounded-md border-2 ${talismanData.quality === '橙品' ? 'border-orange-500 bg-orange-500/20' : talismanData.quality === '紫品' ? 'border-purple-500 bg-purple-500/20' : 'border-blue-500 bg-blue-500/20'} flex items-center justify-center shadow-lg backdrop-blur-sm`}>
                              <span className="font-serif font-bold text-white text-lg">{talismanData.name[0]}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-1 bg-black/60 px-1.5 py-0.5 rounded-sm whitespace-nowrap z-10">
                            <span className="text-[10px] font-serif font-bold text-white">{talismanData.name}</span>
                            {(isEffectCell || talismanEffects[index]) && (
                              <span 
                                className="text-[8px] font-bold text-green-400 border border-green-400/50 px-0.5 rounded-sm ml-0.5 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEffectCell(selectedEffectCell === index ? null : index);
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                              >
                                提升
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
              {activeConnections.length > 0 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ transform: 'translateZ(1px)' }}>
                  <defs>
                    <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(74, 222, 128, 0.2)" />
                      <stop offset="50%" stopColor="rgba(74, 222, 128, 0.8)" />
                      <stop offset="100%" stopColor="rgba(74, 222, 128, 0.2)" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  {activeConnections.map((conn, i) => {
                    if (conn.source === conn.target) return null;
                    
                    const startCol = conn.source % 3;
                    const startRow = Math.floor(conn.source / 3);
                    const endCol = conn.target % 3;
                    const endRow = Math.floor(conn.target / 3);
                    
                    const x1 = startCol * 107 + 47.5;
                    const y1 = startRow * 107 + 47.5;
                    const x2 = endCol * 107 + 47.5;
                    const y2 = endRow * 107 + 47.5;
                    
                    return (
                      <g key={i}>
                        <line 
                          x1={x1} y1={y1} x2={x2} y2={y2} 
                          stroke="rgba(74, 222, 128, 0.3)" 
                          strokeWidth="2"
                          strokeDasharray="4 4"
                        />
                        <circle r="3" fill="#4ade80" filter="url(#glow)">
                          <animateMotion 
                            dur="1.5s" 
                            repeatCount="indefinite"
                            path={`M ${x1} ${y1} L ${x2} ${y2}`}
                          />
                        </circle>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>
        </section>

        {/* View Angle Toggle */}
        <div className="relative z-30 px-6 py-3 bg-bg-panel border-b border-ink/5 flex items-center justify-between text-xs text-ink-light font-bold shrink-0">
          <div 
            className="flex items-center gap-2 cursor-pointer select-none" 
            onClick={toggleViewAngle}
          >
            <span className={`w-8 text-right transition-colors duration-300 ${isTopDown ? 'text-accent' : 'text-ink'}`}>
              {isTopDown ? '俯视' : '默认'}
            </span>
            <div className={`relative w-10 h-5 rounded-full transition-colors duration-1000 ${isTopDown ? 'bg-accent' : 'bg-ink/20'}`}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-1000 ease-in-out ${isTopDown ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>
          <button 
            onClick={() => setIsFormationModalOpen(true)}
            className="px-3 py-1 bg-accent text-white rounded-md text-xs font-bold shadow-md hover:bg-accent/90"
          >
            阵法：{formations.find(f => f.id === formationId)?.name.replace(/[【】]/g, '') || '无'}
          </button>
        </div>

        {isFormationModalOpen && <FormationModal onClose={() => setIsFormationModalOpen(false)} />}

        {/* Tabs */}
        <nav className="flex border-b border-ink/10 bg-bg-panel/80 backdrop-blur-md sticky top-0 z-40 shrink-0">
          <button 
            onClick={() => setLineupSubTab('troops')}
            className={`flex-1 py-3 border-b-2 font-bold text-sm tracking-wider transition-colors ${lineupSubTab === 'troops' ? 'border-accent text-accent' : 'border-transparent text-ink-light'}`}
          >
            兵力配置
          </button>
          <button 
            onClick={() => setLineupSubTab('heroes')}
            className={`flex-1 py-3 border-b-2 font-bold text-sm tracking-wider transition-colors ${lineupSubTab === 'heroes' ? 'border-accent text-accent' : 'border-transparent text-ink-light'}`}
          >
            武将配置
          </button>
          <button 
            onClick={() => setLineupSubTab('runes')}
            className={`flex-1 py-3 border-b-2 font-bold text-sm tracking-wider transition-colors ${lineupSubTab === 'runes' ? 'border-accent text-accent' : 'border-transparent text-ink-light'}`}
          >
            阵符配置
          </button>
        </nav>

        {/* Content Area */}
        <div className="flex-1 relative">
          {lineupSubTab === 'troops' && (
            <section className="p-3 space-y-2">
              {Array.from({ length: 3 }).map((_, index) => {
                const placedHeroes = lineup.map((id, idx) => id ? { id, idx } : null).filter(Boolean);
                const heroObj = placedHeroes[index];
                if (heroObj) {
                  const hero = heroes.find(h => h.id === heroObj.id);
                  return hero ? (
                    <HeroRow key={`slot-${index}-${hero.id}`} hero={hero} updateHeroTroops={updateHeroTroops} />
                  ) : <EmptyRow key={`slot-${index}-empty`} />;
                } else {
                  return <EmptyRow key={`slot-${index}-empty`} />;
                }
              })}
              
              {/* Action Bar */}
              <div className="mt-[25px] flex gap-3 h-[45px]">
                <button 
                  onClick={quickAssign}
                  className="flex-1 bg-primary/80 border border-white/10 rounded-sm flex flex-col items-center justify-center active:bg-white/5 transition-colors shadow-sm"
                >
                  <span className="font-bold text-ink uppercase tracking-tighter text-sm leading-none mb-1">快速分配</span>
                  <span className="text-[10px] text-ink-light font-mono leading-none">{totalTroops.toLocaleString()} / {maxTotalTroops.toLocaleString()}</span>
                </button>
                <button 
                  onClick={() => alert('编队已保存！')}
                  className="flex-[1.5] bg-accent text-white font-serif font-bold text-lg rounded-sm shadow-[0_4px_10px_rgba(139,26,26,0.3)] active:scale-[0.98] transition-all flex items-center justify-center"
                >
                  确认编队
                </button>
              </div>
            </section>
          )}

          {lineupSubTab === 'heroes' && (
            <section 
              className="p-4 flex flex-col h-full"
              data-drop-zone="remove"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const sourceIndexStr = e.dataTransfer.getData('sourceIndex');
                if (sourceIndexStr) {
                  const sourceIndex = parseInt(sourceIndexStr);
                  const newLineup = [...lineup];
                  newLineup[sourceIndex] = null;
                  setFullLineup(newLineup);
                }
                setIsDragging(false);
              }}
            >
              {/* Horizontal Scroll List */}
              <div 
                ref={heroListScrollRef}
                className="w-full overflow-x-scroll show-scrollbar pb-4 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-primary/20 [&::-webkit-scrollbar-thumb]:bg-accent [&::-webkit-scrollbar-thumb]:rounded-full cursor-grab active:cursor-grabbing"
              >
                <div className="flex gap-2 w-max px-1">
                  {sortedFilteredHeroes.map(hero => {
                    const heroLineups = getHeroLineups(hero.id);
                    const isPlaced = heroLineups.length > 0;
                    const heroState = heroes.find(h => h.id === hero.id);
                    return (
                    <div 
                      key={hero.id} 
                      onPointerDown={(e) => {
                        if (heroState?.locked) return;
                        handlePointerDown(e, hero.id);
                      }}
                      className="flex flex-col items-center cursor-pointer group shrink-0 relative select-none"
                      style={{ WebkitTouchCallout: 'none', touchAction: 'none' }}
                      onClick={(e) => {
                        if (draggedRef.current) {
                          e.preventDefault();
                          return;
                        }
                        setSelectedHeroInfo(hero);
                      }}
                    >
                      <div className={`w-[80px] h-[120px] rounded-sm border-2 ${getQualityColor(hero.quality).split(' ')[1]} overflow-hidden bg-bg-dark bg-cover bg-center shadow-sm group-active:scale-95 transition-transform relative`}
                           style={{ backgroundImage: `url(${hero.avatar})` }}>
                        {heroState?.locked && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
                            <div className="text-white">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 pt-4">
                          {heroState && heroState.starLevel > 0 && (
                            <div className="flex justify-center mb-0.5">
                              {[1, 2, 3, 4, 5].slice(0, heroState.starLevel).map(i => (
                                <Star key={i} size={8} className="text-yellow-400 fill-yellow-400" />
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-center gap-1 w-full">
                            <span className="text-[8px] font-bold px-1 rounded-sm bg-black/60 text-white whitespace-nowrap">{hero.type[0]}</span>
                            <span className="text-[8px] font-bold px-1 rounded-sm bg-black/60 text-white whitespace-nowrap">{getRoleLabel(hero.role)}</span>
                            <span className="text-[10px] font-serif font-bold text-white truncate drop-shadow-md">{hero.name}</span>
                          </div>
                        </div>
                        {isPlaced && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 z-10">
                            {heroLineups.map(lIdx => (
                              <span key={lIdx} className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-sm border border-white/20 shadow-sm">
                                阵容{lineupNames[lIdx]}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )})}
                  {sortedFilteredHeroes.length === 0 && (
                    <div className="w-full h-[110px] flex items-center justify-center text-ink-light text-sm font-serif">
                      没有符合条件的武将
                    </div>
                  )}
                </div>
              </div>

              {/* Filter Button */}
              <div className="mt-auto pt-4 flex justify-center border-t border-ink/10">
                <button 
                  onClick={() => setIsFilterOpen(true)}
                  className="relative flex items-center gap-2 bg-primary/80 px-6 py-2 rounded-full border border-white/10 shadow-sm active:bg-white/5 transition-colors"
                >
                  <Filter size={16} className="text-ink" />
                  <span className="font-serif font-bold text-ink text-sm tracking-widest">筛选武将</span>
                  {(selectedQualities.length > 0 || selectedTypes.length > 0 || selectedRoles.length > 0) && (
                    <span className="w-2 h-2 rounded-full bg-accent absolute top-0 right-0 -mt-0.5 -mr-0.5"></span>
                  )}
                </button>
              </div>
            </section>
          )}

          {lineupSubTab === 'runes' && (
            <section 
              className="p-4 flex flex-col h-full"
              data-drop-zone="remove-talisman"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const sourceIndexStr = e.dataTransfer.getData('sourceIndex');
                if (sourceIndexStr) {
                  const sourceIndex = parseInt(sourceIndexStr);
                  const newTalismans = [...currentLineupTalismans];
                  newTalismans[sourceIndex] = null;
                  setFullLineupTalismans(newTalismans);
                }
                setIsDragging(false);
              }}
            >
              <div 
                ref={talismanListScrollRef}
                className="w-full overflow-x-scroll show-scrollbar pb-4 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-primary/20 [&::-webkit-scrollbar-thumb]:bg-accent [&::-webkit-scrollbar-thumb]:rounded-full cursor-grab active:cursor-grabbing"
              >
                <div className="flex gap-3 w-max px-1">
                  {sortedTalismans.filter(t => talismans[t.id] > 0).map(talisman => {
                    const placedCount = currentLineupTalismans.filter(id => id === talisman.id).length;
                    const ownedCount = talismans[talisman.id] || 0;
                    const isFullyPlaced = placedCount >= ownedCount;
                    
                    return (
                      <div 
                        key={talisman.id} 
                        onPointerDown={(e) => {
                          if (isFullyPlaced) return;
                          handleTalismanPointerDown(e, talisman.id);
                        }}
                        onClick={(e) => {
                          if (draggedRef.current) {
                            e.preventDefault();
                            return;
                          }
                          setSelectedTalisman(talisman);
                        }}
                        className={`flex flex-col items-center cursor-pointer group shrink-0 relative select-none ${isFullyPlaced ? 'opacity-50 grayscale' : ''}`}
                        style={{ WebkitTouchCallout: 'none', touchAction: 'none' }}
                      >
                        <div className={`w-[80px] h-[120px] rounded-sm border-2 ${talisman.quality === '橙品' ? 'border-orange-500 bg-orange-500/10' : talisman.quality === '紫品' ? 'border-purple-500 bg-purple-500/10' : 'border-blue-500 bg-blue-500/10'} overflow-hidden shadow-sm group-active:scale-95 transition-transform relative flex flex-col items-center`}>
                          <div className="flex-1 flex items-center justify-center w-full">
                            <span className={`font-serif font-bold text-4xl ${talisman.quality === '橙品' ? 'text-orange-500' : talisman.quality === '紫品' ? 'text-purple-500' : 'text-blue-500'}`}>
                              {talisman.name[0]}
                            </span>
                          </div>
                          <div className="w-full bg-black/70 flex flex-col items-center p-1">
                            <div className="text-[10px] font-serif font-bold text-white text-center w-full truncate">{talisman.name}</div>
                            <div className="text-[8px] text-white/80 text-center w-full line-clamp-2 leading-tight mt-0.5">{talisman.shortDesc}</div>
                          </div>
                          {placedCount > 0 && (
                            <div className="absolute top-1 right-1 bg-accent text-white text-[8px] font-bold px-1 rounded-sm">
                              已上阵
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {TALISMANS.filter(t => talismans[t.id] > 0).length === 0 && (
                    <div className="w-full h-[120px] flex items-center justify-center text-ink-light text-sm font-serif">
                      暂无阵符
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="absolute bottom-0 left-0 w-full h-16 bg-bg-panel/95 backdrop-blur-md border-t border-white/10 flex items-center px-4 z-50 gap-3">
        <button 
          onClick={() => setActiveTab('battle')}
          className="w-10 h-10 rounded-full bg-primary/80 border border-white/10 flex items-center justify-center shadow-sm active:scale-95 transition-transform text-ink shrink-0 mr-2"
        >
          <ArrowLeft size={20} />
        </button>

        <div 
          ref={lineupSelectScrollRef}
          className="flex-1 flex gap-1 h-10 overflow-x-scroll show-scrollbar [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-primary/20 [&::-webkit-scrollbar-thumb]:bg-accent [&::-webkit-scrollbar-thumb]:rounded-full pb-1 cursor-grab active:cursor-grabbing"
        >
          {[0, 1, 2, 3, 4].map(idx => (
            <button
              key={idx}
              onClick={() => setCurrentLineupIndex(idx)}
              className={`px-3 rounded-sm border flex items-center justify-center shadow-sm active:scale-95 transition-all whitespace-nowrap shrink-0 ${
                currentLineupIndex === idx 
                  ? 'bg-accent text-white border-accent' 
                  : 'bg-primary/80 border-white/10 text-ink hover:bg-white/20'
              }`}
            >
              <span className="font-serif font-bold text-xs tracking-widest">{lineupNames[idx]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-bg-dark/80 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md bg-bg-panel rounded-t-xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-primary/50">
              <h3 className="font-serif font-bold text-lg text-ink tracking-widest">筛选</h3>
              <button onClick={() => setIsFilterOpen(false)} className="p-1 text-ink-light hover:text-ink transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div 
              ref={filterScrollRef}
              className="p-4 overflow-y-auto space-y-6 cursor-grab active:cursor-grabbing"
            >
              {/* Rarity */}
              <div>
                <h4 className="text-xs font-bold text-ink-light mb-3 uppercase tracking-widest">稀有度</h4>
                <div className="flex flex-wrap gap-2">
                  {(['神将', '名将', '良将', '裨将'] as HeroQuality[]).map(q => (
                    <button 
                      key={q}
                      onClick={() => toggleFilter(q, selectedQualities, setSelectedQualities)}
                      className={`px-4 py-1.5 rounded-sm text-xs font-bold border transition-colors ${selectedQualities.includes(q) ? 'bg-white/20 text-white border-white/20' : 'bg-white text-ink border-ink/20 hover:border-ink/50'}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div>
                <h4 className="text-xs font-bold text-ink-light mb-3 uppercase tracking-widest">兵种类型</h4>
                <div className="flex flex-wrap gap-2">
                  {(['步兵', '骑兵', '弓兵', '盾兵', '枪兵'] as HeroType[]).map(t => (
                    <button 
                      key={t}
                      onClick={() => toggleFilter(t, selectedTypes, setSelectedTypes)}
                      className={`px-4 py-1.5 rounded-sm text-xs font-bold border transition-colors ${selectedTypes.includes(t) ? 'bg-white/20 text-white border-white/20' : 'bg-white text-ink border-ink/20 hover:border-ink/50'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Role */}
              <div>
                <h4 className="text-xs font-bold text-ink-light mb-3 uppercase tracking-widest">战斗类型</h4>
                <div className="flex flex-wrap gap-2">
                  {(['统帅', '谋士', '突击', '辅助', '先锋', '勇武', '奇谋', '陷阵'] as HeroRole[]).map(r => (
                    <button 
                      key={r}
                      onClick={() => toggleFilter(r, selectedRoles, setSelectedRoles)}
                      className={`px-4 py-1.5 rounded-sm text-xs font-bold border transition-colors ${selectedRoles.includes(r) ? 'bg-white/20 text-white border-white/20' : 'bg-white text-ink border-ink/20 hover:border-ink/50'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-primary/50 flex gap-3">
              <button 
                onClick={() => {
                  setSelectedQualities([]);
                  setSelectedTypes([]);
                  setSelectedRoles([]);
                }}
                className="flex-1 py-2.5 rounded-sm border border-white/20 text-ink font-bold text-sm active:bg-white/5 transition-colors"
              >
                重置
              </button>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="flex-[2] py-2.5 rounded-sm bg-white/20 text-white font-bold text-sm active:bg-white/30 transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Detail Modal */}
      {selectedHeroInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-dark/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-bg-panel border border-ink/20 rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="relative h-64 bg-bg-dark flex items-end p-4">
              <div className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-full cursor-pointer text-white/80 hover:text-white z-20 transition-colors" onClick={() => setSelectedHeroInfo(null)}>
                <X size={18} />
              </div>
              <div className="absolute inset-0 bg-cover bg-top" style={{ backgroundImage: `url(${selectedHeroInfo.avatar})` }}></div>
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg-panel via-bg-panel/60 to-transparent"></div>
              
              <div className="relative z-10 flex items-end gap-3 w-full pb-2">
                <h2 className="text-3xl font-serif font-bold text-white tracking-widest drop-shadow-md">{selectedHeroInfo.name}</h2>
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${getQualityColor(selectedHeroInfo.quality)}`}>{selectedHeroInfo.quality}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${getTypeColor(selectedHeroInfo.type)}`}>{selectedHeroInfo.type}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-bg-dark/60 text-white border border-white/30 backdrop-blur-sm">{selectedHeroInfo.role}</span>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 bg-bg-panel text-ink">
              {/* Stats */}
              <div className="flex justify-between items-center mb-6 p-4 bg-primary/60 border border-white/10 rounded-sm shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                  <Shield size={100} />
                </div>
                <div className="flex flex-col items-center gap-1 relative z-10">
                  <div className="flex items-center gap-1 text-ink-light"><Heart size={12} /> <span className="text-[10px] font-bold">生命</span></div>
                  <span className="font-mono font-bold text-ink text-sm">{selectedHeroInfo.hp}</span>
                </div>
                <div className="flex flex-col items-center gap-1 relative z-10">
                  <div className="flex items-center gap-1 text-ink-light"><Sword size={12} /> <span className="text-[10px] font-bold">攻击</span></div>
                  <span className="font-mono font-bold text-ink text-sm">{selectedHeroInfo.attack}</span>
                </div>
                <div className="flex flex-col items-center gap-1 relative z-10">
                  <div className="flex items-center gap-1 text-ink-light"><Zap size={12} /> <span className="text-[10px] font-bold">谋略</span></div>
                  <span className="font-mono font-bold text-ink text-sm">{selectedHeroInfo.magic}</span>
                </div>
                <div className="flex flex-col items-center gap-1 relative z-10">
                  <div className="flex items-center gap-1 text-ink-light"><Shield size={12} /> <span className="text-[10px] font-bold">防御</span></div>
                  <span className="font-mono font-bold text-ink text-sm">{selectedHeroInfo.defense}</span>
                </div>
                <div className="flex flex-col items-center gap-1 relative z-10">
                  <div className="flex items-center gap-1 text-ink-light"><Wind size={12} /> <span className="text-[10px] font-bold">攻速</span></div>
                  <span className="font-mono font-bold text-ink text-sm">{selectedHeroInfo.speed}</span>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-5">
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-sm font-bold tracking-widest">被动</span>
                    <h3 className="font-serif font-bold text-sm text-ink">{selectedHeroInfo.passive.name}</h3>
                  </div>
                  <p className="text-xs text-ink-light leading-relaxed pl-1">{selectedHeroInfo.passive.description}</p>
                </div>
                
                <div className="w-full flex items-center justify-center opacity-20 py-1">
                  <div className="h-px bg-white/20 flex-1"></div>
                  <div className="w-1.5 h-1.5 rotate-45 bg-white/20 mx-2"></div>
                  <div className="h-px bg-white/20 flex-1"></div>
                </div>

                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-sm font-bold tracking-widest">主动</span>
                    <h3 className="font-serif font-bold text-sm text-accent">{selectedHeroInfo.active.name}</h3>
                  </div>
                  <p className="text-xs text-ink-light leading-relaxed pl-1">{selectedHeroInfo.active.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Touch Drag Ghost Element */}
      {touchDragState && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed z-[9999] pointer-events-none flex flex-col items-center justify-end"
          style={{ 
            left: touchDragState.x, 
            top: touchDragState.y,
            transform: 'translate(-50%, -120%)'
          }}
        >
          {touchDragState.heroData && (
            <>
              <div className="relative w-full flex justify-center items-end mb-1">
                <div className={`flex flex-col items-center transition-opacity duration-300 ${viewAngle < 22.5 ? 'opacity-100' : 'opacity-0 absolute bottom-0 pointer-events-none'}`}>
                  <div 
                    className={`w-16 h-16 rounded-full border-2 ${getQualityColor(touchDragState.heroData.quality).split(' ')[1]} bg-bg-dark bg-cover bg-center shadow-lg`}
                    style={{ backgroundImage: `url(${touchDragState.heroData.avatar})` }}
                  ></div>
                </div>
                <div className={`flex flex-col items-center transition-opacity duration-300 ${viewAngle >= 22.5 ? 'opacity-100' : 'opacity-0 absolute bottom-0 pointer-events-none'}`}>
                  <img 
                    src={`https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/hero-chess/${touchDragState.heroData.id}.png`} 
                    alt={touchDragState.heroData.name}
                    className="w-20 h-auto object-contain drop-shadow-2xl"
                    draggable={false}
                    onLoad={() => setLoadedImages(prev => ({ ...prev, [touchDragState.heroData!.id]: true }))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-center gap-1 bg-black/60 px-1.5 py-0.5 rounded-sm whitespace-nowrap z-10">
                <span className={`text-[8px] font-bold ${getTypeColor(touchDragState.heroData.type).split(' ')[0]}`}>{touchDragState.heroData.type[0]}</span>
                <span className="text-[10px] font-serif font-bold text-white">{touchDragState.heroData.name}</span>
              </div>
            </>
          )}
          {touchDragState.talismanData && (
            <>
              <div className="relative w-full flex justify-center items-end mb-1">
                <div className={`w-14 h-14 rounded-md border-2 ${touchDragState.talismanData.quality === '橙品' ? 'border-orange-500 bg-orange-500/20' : touchDragState.talismanData.quality === '紫品' ? 'border-purple-500 bg-purple-500/20' : 'border-blue-500 bg-blue-500/20'} flex items-center justify-center shadow-lg backdrop-blur-sm`}>
                  <span className="font-serif font-bold text-white text-lg">{touchDragState.talismanData.name[0]}</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-1 bg-black/60 px-1.5 py-0.5 rounded-sm whitespace-nowrap z-10">
                <span className="text-[10px] font-serif font-bold text-white">{touchDragState.talismanData.name}</span>
              </div>
            </>
          )}
        </div>,
        document.body
      )}
      {/* Talisman Detail Modal */}
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
    </div>
  );
}
