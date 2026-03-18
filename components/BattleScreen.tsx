import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { CombatHero, BattleEngine, BattleLog, BattleEvent } from '@/lib/battleEngine';
import { X, FastForward, Play, Pause, MessageSquareText } from 'lucide-react';

interface BattleScreenProps {
  playerLineup: CombatHero[];
  enemyLineup: CombatHero[];
  onClose: (result: 'victory' | 'defeat' | null, consumedEnemyHpPercentage: number) => void;
  onVictory: () => void;
}

interface VisualEffect {
  id: string;
  type: 'damage' | 'heal' | 'buff' | 'shout';
  targetId: string;
  text: string;
  isMagic?: boolean;
  createdAt: number;
}

export default function BattleScreen({ playerLineup, enemyLineup, onClose, onVictory }: BattleScreenProps) {
  const [logs, setLogs] = useState<BattleLog[]>([]);
  const [heroes, setHeroes] = useState<CombatHero[]>(() => {
    return [
      ...JSON.parse(JSON.stringify(playerLineup)),
      ...JSON.parse(JSON.stringify(enemyLineup))
    ];
  });
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [effects, setEffects] = useState<VisualEffect[]>([]);
  const [attackingHeroes, setAttackingHeroes] = useState<Record<string, number>>({});
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BattleEngine | null>(null);

  useEffect(() => {
    const engine = new BattleEngine(
      JSON.parse(JSON.stringify(playerLineup)), // Deep copy
      JSON.parse(JSON.stringify(enemyLineup))
    );
    
    engine.onUpdate = () => {
      setHeroes([...engine.heroes]);
      setLogs([...engine.logs]);
    };
    
    engine.onEvent = (event: BattleEvent) => {
      if (event.type === 'attack' && event.sourceId) {
        setAttackingHeroes(prev => ({ ...prev, [event.sourceId!]: Date.now() }));
      } else if (event.type === 'damage' || event.type === 'heal' || event.type === 'buff' || event.type === 'shout') {
        setEffects(prev => [...prev, {
          id: Math.random().toString(),
          type: event.type as any,
          targetId: (event.targetId || event.sourceId)!,
          text: event.text || (event.value ? event.value.toString() : ''),
          isMagic: event.isMagic,
          createdAt: Date.now()
        }]);
      }
    };
    
    engine.onEnd = (w) => {
      setWinner(w);
      setHeroes([...engine.heroes]);
      setLogs([...engine.logs]);
    };
    
    engineRef.current = engine;
    
    return () => {
      engineRef.current = null;
    };
  }, [playerLineup, enemyLineup]);

  useEffect(() => {
    if (isPaused || winner) return;
    
    let lastTime = performance.now();
    let frameId: number;
    
    const loop = (time: number) => {
      const delta = (time - lastTime) / 1000; // seconds
      lastTime = time;
      
      if (engineRef.current) {
        engineRef.current.update(delta * speed);
        
        if (!engineRef.current.isFinished) {
          frameId = requestAnimationFrame(loop);
        }
      }
    };
    
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [isPaused, speed, winner]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    // Cleanup old effects
    const interval = setInterval(() => {
      const now = Date.now();
      setEffects(prev => prev.filter(e => now - e.createdAt < 1000));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const renderGrid = (team: 'player' | 'enemy') => {
    const teamHeroes = heroes.filter(h => h.team === team);
    const grid = Array(9).fill(null);
    teamHeroes.forEach(h => {
      grid[h.position] = h;
    });

    return (
      <div className="grid grid-cols-3 gap-1.5 w-full max-w-[272px]">
        {grid.map((hero, idx) => {
          const isAttacking = hero && attackingHeroes[hero.instanceId] && Date.now() - attackingHeroes[hero.instanceId] < 200;
          const heroEffects = hero ? effects.filter(e => e.targetId === hero.instanceId) : [];
          
          return (
          <div key={idx} className="aspect-square bg-black/20 rounded-md border border-white/10 relative flex items-center justify-center">
            {hero && hero.hp > 0 && (
              <div className={`absolute inset-0 flex flex-col items-center justify-center p-1 transition-transform duration-100 ${isAttacking ? (team === 'player' ? '-translate-y-2' : 'translate-y-2') : ''}`}>
                <div className={`relative w-14 h-14 rounded-sm overflow-hidden border ${team === 'player' ? 'border-blue-400' : 'border-red-400'}`}>
                  <Image 
                    src={hero.avatar} 
                    alt={hero.name} 
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                {/* Visual Effects Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-50">
                  {heroEffects.map(effect => (
                    <div 
                      key={effect.id} 
                      className={`absolute animate-in slide-in-from-bottom-2 fade-in duration-300 font-bold text-xs whitespace-nowrap drop-shadow-md
                        ${effect.type === 'damage' ? (effect.isMagic ? 'text-purple-400' : 'text-red-500') : ''}
                        ${effect.type === 'heal' ? 'text-green-400' : ''}
                        ${effect.type === 'buff' ? 'text-blue-300' : ''}
                        ${effect.type === 'shout' ? 'text-yellow-400 -top-4 text-sm' : ''}
                      `}
                      style={{
                        top: effect.type === 'shout' ? '-20px' : '50%',
                        transform: effect.type === 'shout' ? 'translateX(-50%)' : 'translate(-50%, -50%)',
                        left: '50%'
                      }}
                    >
                      {effect.type === 'damage' ? `-${effect.text}` : effect.type === 'heal' ? `+${effect.text}` : effect.text}
                    </div>
                  ))}
                </div>

                <div className="w-full mt-1 space-y-0.5">
                  {/* HP Bar */}
                  <div className="w-full h-3 bg-black/50 rounded-sm overflow-hidden relative flex items-center justify-center">
                    <div 
                      className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-200"
                      style={{ width: `${(hero.hp / hero.max_hp) * 100}%` }}
                    />
                    {hero.shield > 0 && (
                      <div 
                        className="absolute top-0 left-0 h-full bg-white/50 transition-all duration-200"
                        style={{ width: `${(hero.shield / hero.max_hp) * 100}%` }}
                      />
                    )}
                    <span className="relative z-10 text-[8px] font-mono font-bold text-white drop-shadow-md leading-none">
                      {Math.floor(hero.hp)} / {hero.max_hp}
                    </span>
                  </div>
                  {/* Energy Bar */}
                  <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 transition-all duration-200"
                      style={{ width: `${hero.energy}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
            {hero && hero.hp <= 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-14 h-14 rounded-sm overflow-hidden grayscale opacity-50">
                  <Image 
                    src={hero.avatar} 
                    alt={hero.name} 
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <X className="text-red-500 w-10 h-10 opacity-80" />
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-bg-dark flex items-center justify-center animate-in fade-in duration-300">
      <div className="w-full max-w-md h-full flex flex-col bg-[url('https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/bg/Battle_bg.jpg')] bg-cover bg-center relative">
        {/* Header */}
        <div className="h-14 bg-bg-panel/90 border-b border-white/10 flex items-center justify-between px-4 shrink-0">
          <h2 className="font-serif font-bold text-lg text-ink">战斗进行中</h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSpeed(s => s === 1 ? 2 : s === 2 ? 4 : 1)}
              className="p-2 bg-black/20 rounded-full text-ink-light hover:text-ink transition-colors flex items-center gap-1"
            >
              <FastForward size={16} />
              <span className="text-xs font-mono font-bold">{speed}x</span>
            </button>
            <button 
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 bg-black/20 rounded-full text-ink-light hover:text-ink transition-colors"
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          </div>
        </div>

        {/* Battlefield */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-8 relative overflow-hidden">
          {/* Toggle Logs Button */}
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="absolute bottom-4 left-4 z-40 p-3 bg-black/50 rounded-full text-white/80 hover:text-white hover:bg-black/70 transition-all border border-white/10 shadow-lg"
          >
            <MessageSquareText size={20} />
          </button>
          {/* Enemy Side */}
          <div className="flex flex-col items-center gap-2 w-full">
            {renderGrid('enemy')}
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-between w-full relative px-8 py-2">
            <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent top-1/2 -translate-y-1/2"></div>
            <span className="text-xs font-bold text-red-400 tracking-widest uppercase z-10 bg-bg-dark px-2">敌方阵容</span>
            <div className="bg-bg-dark px-4 py-1 rounded-full border border-white/10 z-10 font-serif font-bold text-ink-light italic">VS</div>
            <span className="text-xs font-bold text-blue-400 tracking-widest uppercase z-10 bg-bg-dark px-2">我方阵容</span>
          </div>

          {/* Player Side */}
          <div className="flex flex-col items-center gap-2 w-full">
            {renderGrid('player')}
          </div>
          
          {/* Winner Overlay */}
          {winner && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-[300] animate-in zoom-in duration-300 p-4 overflow-y-auto">
              <h1 className={`text-5xl font-serif font-bold mb-6 drop-shadow-lg ${winner === 'player' ? 'text-yellow-400' : 'text-gray-400'}`}>
                {winner === 'player' ? '战斗胜利' : '战斗失败'}
              </h1>
              
              <div className="w-full max-w-sm bg-bg-panel/90 border border-white/10 rounded-md p-4 mb-6">
                <h3 className="text-lg font-serif font-bold text-white mb-4 text-center border-b border-white/10 pb-2">战斗统计</h3>
                
                <div className="space-y-6">
                  {/* Player Stats */}
                  <div>
                    <h4 className="text-sm font-bold text-blue-400 mb-2">我方武将</h4>
                    <div className="space-y-2">
                      {heroes.filter(h => h.team === 'player').map(h => (
                        <div key={h.instanceId} className="flex items-center gap-2 bg-black/30 p-2 rounded-sm border border-white/5">
                          <div className="relative w-10 h-10 rounded-sm overflow-hidden border border-blue-400/50">
                            <Image src={h.avatar} alt={h.name} fill className="object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 text-[10px] font-mono text-white/80 grid grid-cols-2 gap-x-2 gap-y-1">
                            <div className="col-span-2 font-bold text-white text-xs mb-0.5">{h.name}</div>
                            <div>输出: <span className="text-red-400">{Math.floor(h.stats.damageDealt)}</span></div>
                            <div>承伤: <span className="text-gray-400">{Math.floor(h.stats.damageTaken)}</span></div>
                            <div>恢复: <span className="text-green-400">{Math.floor(h.stats.healingDone)}</span></div>
                            <div>技能: <span className="text-yellow-400">{h.stats.skillsCast}次</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Enemy Stats */}
                  <div>
                    <h4 className="text-sm font-bold text-red-400 mb-2">敌方武将</h4>
                    <div className="space-y-2">
                      {heroes.filter(h => h.team === 'enemy').map(h => (
                        <div key={h.instanceId} className="flex items-center gap-2 bg-black/30 p-2 rounded-sm border border-white/5">
                          <div className="relative w-10 h-10 rounded-sm overflow-hidden border border-red-400/50">
                            <Image src={h.avatar} alt={h.name} fill className="object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 text-[10px] font-mono text-white/80 grid grid-cols-2 gap-x-2 gap-y-1">
                            <div className="col-span-2 font-bold text-white text-xs mb-0.5">{h.name}</div>
                            <div>输出: <span className="text-red-400">{Math.floor(h.stats.damageDealt)}</span></div>
                            <div>承伤: <span className="text-gray-400">{Math.floor(h.stats.damageTaken)}</span></div>
                            <div>恢复: <span className="text-green-400">{Math.floor(h.stats.healingDone)}</span></div>
                            <div>技能: <span className="text-yellow-400">{h.stats.skillsCast}次</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (winner === 'player') onVictory();
                  
                  const initialEnemyHp = enemyLineup.reduce((sum, h) => sum + h.max_hp, 0);
                  const currentEnemyHp = heroes.filter(h => h.team === 'enemy').reduce((sum, h) => sum + h.hp, 0);
                  const consumedPercentage = initialEnemyHp > 0 ? (initialEnemyHp - currentEnemyHp) / initialEnemyHp : 0;
                  
                  const result = winner === 'player' ? 'victory' : winner === 'enemy' ? 'defeat' : null;
                  onClose(result, consumedPercentage);
                }}
                className="px-8 py-3 bg-accent text-white font-bold rounded-sm shadow-lg hover:scale-105 active:scale-95 transition-transform"
              >
                返回地图
              </button>
            </div>
          )}
        </div>

        {/* Battle Logs */}
        {showLogs && (
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-black/90 border-t border-white/20 flex flex-col font-mono text-xs z-50 animate-in slide-in-from-bottom-full duration-300 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center px-4 py-2 border-b border-white/10 shrink-0 bg-black/50">
              <span className="text-white/70 font-bold">战斗日志</span>
              <button onClick={() => setShowLogs(false)} className="text-white/50 hover:text-white p-1">
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {logs.map((log, i) => (
                <div key={i} className={`px-2 py-1 rounded-sm ${
                  log.type === 'attack' ? 'text-gray-300' : 
                  log.type === 'skill' ? 'text-yellow-300 bg-yellow-500/10' : 
                  log.type === 'death' ? 'text-red-400 font-bold' : 'text-gray-500'
                }`}>
                  <span className="opacity-50 mr-2">[{log.time.toFixed(1)}s]</span>
                  {log.message}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
