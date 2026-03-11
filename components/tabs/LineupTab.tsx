'use client';
import { useGameState } from '@/components/GameStateProvider';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Filter, X, ChevronUp, Shield, Sword, Zap, Heart, Wind } from 'lucide-react';
import { HERO_GALLERY, HeroQuality, HeroType, HeroRole, HeroDetail } from '@/data/heroes';

type Hero = {
  id: string;
  name: string;
  avatar: string;
  troops: number;
  maxTroops: number;
};

const HeroRow = ({ hero, updateHeroTroops }: { hero: Hero, updateHeroTroops: (id: string, troops: number) => void }) => {
  const [localTroops, setLocalTroops] = useState(hero.troops);

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

const EmptyRow = () => (
  <div className="flex items-center gap-3 bg-white/40 px-3 h-[45px] rounded-sm border border-ink/5 border-dashed shadow-sm opacity-60">
    <div className="w-8 h-8 rounded-sm border border-ink/10 border-dashed bg-ink/5 shrink-0 flex items-center justify-center">
      <span className="text-ink/30 text-xs font-bold">?</span>
    </div>
    <div className="flex-1 flex flex-col justify-center">
      <span className="font-serif font-bold text-ink/50 text-sm leading-none">未配置武将</span>
    </div>
  </div>
);

export default function LineupTab() {
  const { heroes, lineups, lineup, currentLineupIndex, setCurrentLineupIndex, updateHeroTroops, quickAssign, setActiveTab, setFullLineup, addHeroToRoster } = useGameState();
  const [activeTab, setLocalActiveTab] = useState('troops');
  
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

  // Touch Drag state
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const draggedRef = useRef(false);
  const [touchDragState, setTouchDragState] = useState<{
    heroId: string;
    sourceIndex?: number;
    x: number;
    y: number;
    heroData: HeroDetail;
  } | null>(null);

  useEffect(() => {
    if (touchDragState) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [touchDragState]);

  const handleTouchStart = (e: React.TouchEvent, heroId: string, sourceIndex?: number) => {
    draggedRef.current = false;
    const touch = e.touches[0];
    const heroData = HERO_GALLERY.find(h => h.id === heroId);
    if (!heroData) return;
    
    const timer = setTimeout(() => {
      draggedRef.current = true;
      setTouchDragState({
        heroId,
        sourceIndex,
        x: touch.clientX,
        y: touch.clientY,
        heroData
      });
      setIsDragging(true);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 250);
    setPressTimer(timer);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchDragState) {
      const touch = e.touches[0];
      setTouchDragState(prev => prev ? { ...prev, x: touch.clientX, y: touch.clientY } : null);
      
      const elem = document.elementFromPoint(touch.clientX, touch.clientY);
      const cell = elem?.closest('[data-cell-index]');
      if (cell) {
        setHoveredCell(parseInt(cell.getAttribute('data-cell-index')!));
      } else {
        setHoveredCell(null);
      }
    } else if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    
    if (!touchDragState) return;
    
    const touch = e.changedTouches[0];
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    const cell = elem?.closest('[data-cell-index]');
    
    if (cell) {
      const targetIndex = parseInt(cell.getAttribute('data-cell-index')!);
      handleDrop(targetIndex, touchDragState.heroId, touchDragState.sourceIndex);
    } else {
      const removeZone = elem?.closest('[data-drop-zone="remove"]');
      if (removeZone && touchDragState.sourceIndex !== undefined) {
        const newLineup = [...lineup];
        newLineup[touchDragState.sourceIndex] = null;
        setFullLineup(newLineup);
      }
    }
    
    setTouchDragState(null);
    setHoveredCell(null);
    setIsDragging(false);
    
    setTimeout(() => {
      draggedRef.current = false;
    }, 100);
  };

  const handleTouchCancel = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    setTouchDragState(null);
    setHoveredCell(null);
    setIsDragging(false);
    draggedRef.current = false;
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

  const lineupNames = ['一', '二', '三', '四', '五'];

  return (
    <div 
      className="flex-1 flex flex-col relative overflow-hidden bg-bg-panel"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* Header */}
      <header className="flex items-center justify-center bg-bg-panel border-b border-ink/10 p-4 sticky top-0 z-50 shrink-0">
        <h2 className="font-serif text-lg font-bold leading-tight uppercase tracking-widest text-ink">编队</h2>
      </header>

      <div className="flex-1 overflow-y-auto flex flex-col pb-24">
        {/* 3D Grid Section */}
        <section className="w-full h-80 shrink-0 flex items-center justify-center bg-gradient-to-b from-bg-dark to-bg-panel relative overflow-hidden border-b border-ink/5">
          <div style={{ perspective: '1000px' }} className="w-full h-full flex items-center justify-center">
            <div 
              style={{ transform: 'rotateX(60deg) translateY(-10px)', transformStyle: 'preserve-3d' }} 
              className="grid grid-cols-3 gap-3"
            >
              {lineup.map((heroId, index) => {
                const heroData = heroId ? HERO_GALLERY.find(h => h.id === heroId) : null;
                return (
                  <div 
                    key={index}
                    data-cell-index={index}
                    onDragOver={(e) => { e.preventDefault(); setHoveredCell(index); }}
                    onDragLeave={() => setHoveredCell(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      const droppedHeroId = e.dataTransfer.getData('heroId');
                      const sourceIndexStr = e.dataTransfer.getData('sourceIndex');
                      const sourceIndex = sourceIndexStr ? parseInt(sourceIndexStr) : undefined;
                      handleDrop(index, droppedHeroId, sourceIndex);
                      setHoveredCell(null);
                      setIsDragging(false);
                    }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className={`w-[100px] h-[100px] border-[1.5px] transition-colors relative ${hoveredCell === index ? 'bg-accent/30 border-accent' : 'bg-ink/5 border-ink/40'}`}
                  >
                    {heroData && (
                      <div 
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('heroId', heroData.id);
                          e.dataTransfer.setData('sourceIndex', index.toString());
                          setTimeout(() => setIsDragging(true), 0);
                        }}
                        onDragEnd={() => setIsDragging(false)}
                        onTouchStart={(e) => handleTouchStart(e, heroData.id, index)}
                        style={{ transform: 'rotateX(-60deg) translateY(-20px)', transformOrigin: 'bottom center', WebkitTouchCallout: 'none' }}
                        className={`absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing transition-opacity w-24 z-20 select-none ${isDragging ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}
                      >
                        <div className="flex items-center justify-center gap-1 mb-1 bg-black/60 px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                          <span className={`text-[8px] font-bold ${getTypeColor(heroData.type).split(' ')[0]}`}>{heroData.type[0]}</span>
                          <span className="text-[10px] font-serif font-bold text-white">{heroData.name}</span>
                        </div>
                        <div 
                          className={`w-16 h-16 rounded-full border-2 ${getQualityColor(heroData.quality).split(' ')[1]} bg-bg-dark bg-cover bg-center shadow-lg`}
                          style={{ backgroundImage: `url(${heroData.avatar})` }}
                        ></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Tabs */}
        <nav className="flex border-b border-ink/10 bg-bg-panel sticky top-0 z-40 shrink-0">
          <button 
            onClick={() => setLocalActiveTab('troops')}
            className={`flex-1 py-3 border-b-2 font-bold text-sm tracking-wider transition-colors ${activeTab === 'troops' ? 'border-accent text-accent' : 'border-transparent text-ink-light'}`}
          >
            兵力配置
          </button>
          <button 
            onClick={() => setLocalActiveTab('heroes')}
            className={`flex-1 py-3 border-b-2 font-bold text-sm tracking-wider transition-colors ${activeTab === 'heroes' ? 'border-accent text-accent' : 'border-transparent text-ink-light'}`}
          >
            武将配置
          </button>
          <button 
            onClick={() => setLocalActiveTab('runes')}
            className={`flex-1 py-3 border-b-2 font-bold text-sm tracking-wider transition-colors ${activeTab === 'runes' ? 'border-accent text-accent' : 'border-transparent text-ink-light'}`}
          >
            阵符配置
          </button>
        </nav>

        {/* Content Area */}
        <div className="flex-1 relative">
          {activeTab === 'troops' && (
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
                  className="flex-1 bg-white/80 border border-ink/20 rounded-sm flex flex-col items-center justify-center active:bg-ink/5 transition-colors shadow-sm"
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

          {activeTab === 'heroes' && (
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
              <div className="w-full overflow-x-auto pb-4 hide-scrollbar">
                <div className="flex gap-3 w-max px-1">
                  {sortedFilteredHeroes.map(hero => {
                    const heroLineups = getHeroLineups(hero.id);
                    const isPlaced = heroLineups.length > 0;
                    return (
                    <div 
                      key={hero.id} 
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('heroId', hero.id);
                        setTimeout(() => setIsDragging(true), 0);
                      }}
                      onDragEnd={() => setIsDragging(false)}
                      onTouchStart={(e) => handleTouchStart(e, hero.id)}
                      className="flex flex-col items-center cursor-pointer group shrink-0 relative select-none"
                      style={{ WebkitTouchCallout: 'none' }}
                      onClick={(e) => {
                        if (draggedRef.current) {
                          e.preventDefault();
                          return;
                        }
                        setSelectedHeroInfo(hero);
                      }}
                    >
                      <div className={`w-[70px] h-[110px] rounded-sm border-2 ${getQualityColor(hero.quality).split(' ')[1]} overflow-hidden bg-bg-dark bg-cover bg-center shadow-sm group-active:scale-95 transition-transform relative`}
                           style={{ backgroundImage: `url(${hero.avatar})` }}>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 pt-4">
                          <div className="flex items-center justify-center gap-1 w-full">
                            <span className="text-[8px] font-bold px-1 rounded-sm bg-ink/80 text-white whitespace-nowrap">{hero.type[0]}</span>
                            <span className="text-[10px] font-serif font-bold text-white truncate drop-shadow-md">{hero.name}</span>
                          </div>
                        </div>
                        {isPlaced && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 z-10">
                            {heroLineups.map(lIdx => (
                              <span key={lIdx} className="text-[10px] font-bold text-white bg-ink/80 px-2 py-0.5 rounded-sm border border-white/20 shadow-sm">
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
                  className="relative flex items-center gap-2 bg-white/80 px-6 py-2 rounded-full border border-ink/20 shadow-sm active:bg-ink/5 transition-colors"
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

          {activeTab === 'runes' && (
            <section className="p-4 flex items-center justify-center h-40 text-ink-light font-serif">
              阵符系统暂未开放
            </section>
          )}
        </div>
      </div>

      {/* Floating Controls (Back & Lineup Switch) */}
      <div className="absolute bottom-6 left-4 z-50 flex items-center gap-3">
        <button 
          onClick={() => setActiveTab('battle')}
          className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md border border-ink/20 flex items-center justify-center shadow-lg active:scale-95 transition-transform text-ink"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="relative">
          <button 
            onClick={() => setIsLineupMenuOpen(!isLineupMenuOpen)}
            className="h-12 px-5 rounded-full bg-white/90 backdrop-blur-md border border-ink/20 flex items-center justify-center gap-1 shadow-lg active:scale-95 transition-transform text-ink"
          >
            <span className="font-serif font-bold text-sm tracking-widest">阵容{lineupNames[currentLineupIndex]}</span>
            <ChevronUp size={16} className={`transition-transform duration-200 ${isLineupMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isLineupMenuOpen && (
            <div className="absolute bottom-full left-0 mb-3 w-28 bg-bg-panel border border-ink/20 rounded-sm shadow-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2">
              {[0, 1, 2, 3, 4].map(idx => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentLineupIndex(idx);
                    setIsLineupMenuOpen(false);
                  }}
                  className={`py-3 text-sm font-serif font-bold transition-colors border-b border-ink/5 last:border-0 ${currentLineupIndex === idx ? 'bg-ink text-white' : 'text-ink hover:bg-ink/5'}`}
                >
                  阵容{lineupNames[idx]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md bg-bg-panel rounded-t-xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-ink/10 bg-white/50">
              <h3 className="font-serif font-bold text-lg text-ink tracking-widest">筛选</h3>
              <button onClick={() => setIsFilterOpen(false)} className="p-1 text-ink-light hover:text-ink transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-6">
              {/* Rarity */}
              <div>
                <h4 className="text-xs font-bold text-ink-light mb-3 uppercase tracking-widest">稀有度</h4>
                <div className="flex flex-wrap gap-2">
                  {(['神将', '名将', '良将', '裨将'] as HeroQuality[]).map(q => (
                    <button 
                      key={q}
                      onClick={() => toggleFilter(q, selectedQualities, setSelectedQualities)}
                      className={`px-4 py-1.5 rounded-sm text-xs font-bold border transition-colors ${selectedQualities.includes(q) ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-ink/20 hover:border-ink/50'}`}
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
                      className={`px-4 py-1.5 rounded-sm text-xs font-bold border transition-colors ${selectedTypes.includes(t) ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-ink/20 hover:border-ink/50'}`}
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
                      className={`px-4 py-1.5 rounded-sm text-xs font-bold border transition-colors ${selectedRoles.includes(r) ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-ink/20 hover:border-ink/50'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-ink/10 bg-white/50 flex gap-3">
              <button 
                onClick={() => {
                  setSelectedQualities([]);
                  setSelectedTypes([]);
                  setSelectedRoles([]);
                }}
                className="flex-1 py-2.5 rounded-sm border border-ink/20 text-ink font-bold text-sm active:bg-ink/5 transition-colors"
              >
                重置
              </button>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="flex-[2] py-2.5 rounded-sm bg-ink text-white font-bold text-sm active:bg-ink/90 transition-colors"
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
            <div className="relative h-36 bg-ink flex items-end p-4">
              <div className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-full cursor-pointer text-white/80 hover:text-white z-20 transition-colors" onClick={() => setSelectedHeroInfo(null)}>
                <X size={18} />
              </div>
              <div className="absolute inset-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: `url(${selectedHeroInfo.avatar})` }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent"></div>
              
              <div className="relative z-10 flex items-end gap-4 w-full">
                <div className={`w-20 h-20 rounded-sm border-2 ${getQualityColor(selectedHeroInfo.quality).split(' ')[1]} bg-bg-dark bg-cover bg-center shadow-lg`}
                     style={{ backgroundImage: `url(${selectedHeroInfo.avatar})` }}></div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${getQualityColor(selectedHeroInfo.quality)}`}>{selectedHeroInfo.quality}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${getTypeColor(selectedHeroInfo.type)}`}>{selectedHeroInfo.type}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-white/20 text-white border border-white/30">{selectedHeroInfo.role}</span>
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-white tracking-widest">{selectedHeroInfo.name}</h2>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 bg-bg-panel text-ink">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-6 p-4 bg-white/60 border border-ink/10 rounded-sm shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                  <Shield size={100} />
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-1.5 text-ink-light"><Heart size={14} /> <span className="text-xs font-bold">生命</span></div>
                  <span className="font-mono font-bold text-ink">{selectedHeroInfo.hp}</span>
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-1.5 text-ink-light"><Sword size={14} /> <span className="text-xs font-bold">攻击</span></div>
                  <span className="font-mono font-bold text-ink">{selectedHeroInfo.attack}</span>
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-1.5 text-ink-light"><Zap size={14} /> <span className="text-xs font-bold">谋略</span></div>
                  <span className="font-mono font-bold text-ink">{selectedHeroInfo.magic}</span>
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-1.5 text-ink-light"><Shield size={14} /> <span className="text-xs font-bold">防御</span></div>
                  <span className="font-mono font-bold text-ink">{selectedHeroInfo.defense}</span>
                </div>
                <div className="flex items-center justify-between col-span-2 relative z-10 pt-2 border-t border-ink/5 mt-1">
                  <div className="flex items-center gap-1.5 text-ink-light"><Wind size={14} /> <span className="text-xs font-bold">攻速</span></div>
                  <span className="font-mono font-bold text-ink">{selectedHeroInfo.speed}</span>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-5">
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-ink text-white text-[10px] px-1.5 py-0.5 rounded-sm font-bold tracking-widest">被动</span>
                    <h3 className="font-serif font-bold text-sm text-ink">{selectedHeroInfo.passive.name}</h3>
                  </div>
                  <p className="text-xs text-ink-light leading-relaxed pl-1">{selectedHeroInfo.passive.description}</p>
                </div>
                
                <div className="w-full flex items-center justify-center opacity-20 py-1">
                  <div className="h-px bg-ink flex-1"></div>
                  <div className="w-1.5 h-1.5 rotate-45 bg-ink mx-2"></div>
                  <div className="h-px bg-ink flex-1"></div>
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
      {touchDragState && (
        <div 
          className="fixed z-[9999] pointer-events-none flex flex-col items-center"
          style={{ 
            left: touchDragState.x, 
            top: touchDragState.y,
            transform: 'translate(-50%, -120%)'
          }}
        >
          <div className="flex items-center justify-center gap-1 mb-1 bg-black/60 px-1.5 py-0.5 rounded-sm whitespace-nowrap">
            <span className={`text-[8px] font-bold ${getTypeColor(touchDragState.heroData.type).split(' ')[0]}`}>{touchDragState.heroData.type[0]}</span>
            <span className="text-[10px] font-serif font-bold text-white">{touchDragState.heroData.name}</span>
          </div>
          <div 
            className={`w-16 h-16 rounded-full border-2 ${getQualityColor(touchDragState.heroData.quality).split(' ')[1]} bg-bg-dark bg-cover bg-center shadow-lg`}
            style={{ backgroundImage: `url(${touchDragState.heroData.avatar})` }}
          ></div>
        </div>
      )}
    </div>
  );
}
