'use client';
import { useGameState } from '@/components/GameStateProvider';
import { ArrowLeft, PlusCircle, Hexagon, Info } from 'lucide-react';
import { useState, useRef } from 'react';
import { HERO_GALLERY, HeroDetail } from '@/data/heroes';
import SummonResult from '@/components/SummonResult';
import WelfareModal from '@/components/WelfareModal';
import { useDragScroll } from '@/hooks/useDragScroll';

export default function SummonTab() {
  const { coins, tokens, setTokens, setActiveTab, addHeroToRoster, pityCounter } = useGameState();
  const [isSummoning, setIsSummoning] = useState(false);
  const [summonAmount, setSummonAmount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showWelfare, setShowWelfare] = useState(false);
  const [drawnHeroes, setDrawnHeroes] = useState<HeroDetail[]>([]);
  const [summonResults, setSummonResults] = useState<{ hero: HeroDetail, status: 'new' | 'converted' }[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useDragScroll<HTMLDivElement>({ direction: 'vertical' });

  const handleSummon = (amount: number) => {
    if (tokens >= amount) {
      setIsSummoning(true);
      setSummonAmount(amount);
      
      // Play video
      const container = document.getElementById('video-container');
      if (container && videoRef.current) {
        container.style.display = 'block';
        videoRef.current.currentTime = 0; // Reset video to start
        videoRef.current.play();
      } else {
        performSummon(amount);
      }
    } else {
      setShowWelfare(true);
    }
  };

  const handleWelfareConfirm = () => {
    setTokens(tokens + 100);
    setShowWelfare(false);
  };

  const skipVideo = () => {
    const container = document.getElementById('video-container');
    if (container && videoRef.current) {
      videoRef.current.pause();
      container.style.display = 'none';
      performSummon(summonAmount);
    }
  };

  const performSummon = (amount: number) => {
    const results: { hero: HeroDetail, status: 'new' | 'converted' }[] = [];
    let currentPity = pityCounter;

    for (let i = 0; i < amount; i++) {
      let quality: '神将' | '名将' | '良将' | '裨将';
      
      // Check pity
      if (currentPity >= 19) {
        quality = '名将';
      } else {
        const rand = Math.random() * 100;
        if (rand < 2) quality = '名将';
        else if (rand < 17) quality = '良将';
        else quality = '裨将';
      }
      
      const pool = HERO_GALLERY.filter(h => h.quality === quality);
      const hero = pool[Math.floor(Math.random() * pool.length)];
      const { status } = addHeroToRoster(hero.id);
      
      if (hero.quality === '名将') {
        currentPity = 0;
      } else {
        currentPity++;
      }
      
      results.push({ hero, status });
    }
    setDrawnHeroes(results.map(r => r.hero));
    setSummonResults(results);
    setTokens(tokens - amount);
    setIsSummoning(false);
    setShowResult(true);
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-[url('https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/bg/summon_bg.jpg')] bg-cover bg-center">
      
      <div 
        className="absolute inset-0 z-[100] hidden"
        id="video-container"
      >
        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          src="https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/video/card.mp4"
          onEnded={() => {
            const container = document.getElementById('video-container');
            if (container) container.style.display = 'none';
            performSummon(summonAmount);
          }}
        />
        <button 
          onClick={skipVideo}
          className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-sm text-xs"
        >
          点击跳过动画
        </button>
      </div>

      {showResult && (
        <SummonResult results={summonResults} onClose={() => setShowResult(false)} />
      )}

      {showWelfare && (
        <WelfareModal onClose={() => setShowWelfare(false)} onConfirm={handleWelfareConfirm} />
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col pb-24 relative z-10 cursor-grab active:cursor-grabbing">
        {/* Header */}
        <div className="sticky top-0 w-full z-20 flex justify-between items-center p-4 bg-gradient-to-b from-bg-dark/80 to-transparent">
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-lg font-bold tracking-widest text-white drop-shadow-md">秘境寻访</h1>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1 bg-bg-dark/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20 shadow-sm">
            <div className="w-4 h-4 rounded-full bg-gold flex items-center justify-center text-white text-[10px] font-bold">★</div>
            <span className="text-xs font-bold text-white">{coins.toLocaleString()}</span>
            <PlusCircle className="text-accent w-3 h-3 ml-1 cursor-pointer" />
          </div>
          <div className="flex items-center gap-1 bg-bg-dark/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20 shadow-sm">
            <Hexagon className="text-jade w-4 h-4 fill-jade/20" />
            <span className="text-xs font-bold text-white">{tokens}</span>
          </div>
        </div>
      </div>

      {/* Background Elements (Ink Splashes) */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-overlay">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-accent blur-[80px] rounded-full opacity-30"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent blur-[100px] rounded-full opacity-20"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-accent blur-[60px] rounded-full opacity-10"></div>
      </div>

      {/* Main Scroll */}
      <div className="relative z-10 w-full px-6 flex flex-col items-center mt-8">
        <div className="mt-4 flex items-center gap-2 text-[10px] text-ink-light bg-primary/60 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm shadow-sm">
          <Info className="w-3 h-3" />
          <span>寻访概率：名将 2.0%, 良将 15%, 裨将 83%</span>
        </div>
      </div>

      <div className="flex-1"></div>

      {/* Action Buttons */}
      <div className="relative z-20 px-6 mt-8">
        <div className="flex gap-4 justify-stretch">
          <button 
            onClick={() => handleSummon(1)}
            disabled={isSummoning}
            className="flex-1 group relative flex flex-col items-center justify-center h-[50px] bg-primary border border-white/10 rounded-sm active:scale-95 transition-all disabled:opacity-50 shadow-sm"
          >
            <span className="font-serif text-lg font-bold text-ink">寻访一次</span>
            <div className="flex items-center gap-1 mt-1">
              <Hexagon className="text-ink w-3 h-3 fill-ink/10" />
              <span className="text-xs font-bold text-ink">1</span>
            </div>
          </button>
          
          <button 
            onClick={() => handleSummon(5)}
            disabled={isSummoning}
            className="flex-1 group relative flex flex-col items-center justify-center h-[50px] bg-accent border-2 border-accent rounded-sm active:scale-95 transition-all disabled:opacity-50 overflow-hidden shadow-sm"
          >
            <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-sm shadow-sm">朱砂印</div>
            <span className="font-serif text-lg font-bold text-white">寻访五次</span>
            <div className="flex items-center gap-1 mt-1">
              <Hexagon className="text-white w-3 h-3 fill-white/20" />
              <span className="text-xs font-bold text-white">5</span>
            </div>
          </button>
        </div>
        <p className="text-center text-[10px] mt-4 tracking-widest font-medium" style={{ color: '#101729' }}>每寻访20次必得一名五星名将</p>
      </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="absolute bottom-0 left-0 w-full h-16 bg-bg-panel/95 backdrop-blur-md border-t border-white/10 flex items-center px-4 z-50">
        <button 
          onClick={() => setActiveTab('battle')}
          className="w-10 h-10 rounded-full bg-primary/80 border border-white/10 flex items-center justify-center shadow-sm active:scale-95 transition-transform text-ink"
        >
          <ArrowLeft size={20} />
        </button>
      </div>
    </div>
  );
}
