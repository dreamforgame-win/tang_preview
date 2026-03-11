'use client';
import { useGameState } from '@/components/GameStateProvider';
import { ArrowLeft, PlusCircle, Hexagon, Info } from 'lucide-react';
import { useState } from 'react';

export default function SummonPage() {
  const { coins, tokens, setTokens } = useGameState();
  const [isSummoning, setIsSummoning] = useState(false);

  const handleSummon = (amount: number) => {
    if (tokens >= amount) {
      setIsSummoning(true);
      setTimeout(() => {
        setTokens(tokens - amount);
        setIsSummoning(false);
      }, 1000);
    } else {
      alert('寻访令不足！');
    }
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-y-auto pb-24 altar-gradient">
      {/* Header */}
      <div className="sticky top-0 w-full z-20 flex justify-between items-center p-4 bg-gradient-to-b from-bg-dark to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-ink/20 flex items-center justify-center bg-bg-panel/80 cursor-pointer">
            <ArrowLeft className="text-ink w-4 h-4" />
          </div>
          <h1 className="font-serif text-lg font-bold tracking-widest text-ink">秘境寻访</h1>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1 bg-white/60 px-3 py-1 rounded-full border border-ink/10 shadow-sm">
            <div className="w-4 h-4 rounded-full bg-gold flex items-center justify-center text-white text-[10px] font-bold">★</div>
            <span className="text-xs font-bold text-ink">{coins.toLocaleString()}</span>
            <PlusCircle className="text-accent w-3 h-3 ml-1 cursor-pointer" />
          </div>
          <div className="flex items-center gap-1 bg-white/60 px-3 py-1 rounded-full border border-ink/10 shadow-sm">
            <Hexagon className="text-jade w-4 h-4 fill-jade/20" />
            <span className="text-xs font-bold text-ink">{tokens}</span>
          </div>
        </div>
      </div>

      {/* Background Elements (Ink Splashes) */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-ink blur-[80px] rounded-full opacity-30"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-ink blur-[100px] rounded-full opacity-20"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-accent blur-[60px] rounded-full opacity-10"></div>
      </div>

      {/* Main Scroll */}
      <div className="relative z-10 w-full px-6 flex flex-col items-center mt-8">
        <div className={`w-full aspect-[4/5] relative rounded-sm overflow-hidden scroll-glow border border-ink/20 bg-bg-panel transition-all duration-1000 ${isSummoning ? 'scale-105 brightness-95 shadow-[0_0_40px_rgba(139,26,26,0.3)]' : ''}`}>
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-90 mix-blend-multiply" 
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAuLVmZv0nA0B-jF5adzFf5xu-muFXAo88t0OpqUruQ3_ajQxJXIbP3a_bRBwnvkcAqwETWNKwNv1bwrQBnHZBrs-W-Y_FGk1k7tRpwQn6GVp0YzFuB4KW6meMeOBZMobhQL0bICSwMiFhDuZsYf0bvZaTda7luhNSj9YXK_J3R4Pe8DanQaYsqkbeChhAzmQ4r50GbmtpjgWZjOkpDKOs0gCJzpBLZ9ghXqARcwxvsK2nCogbeaub2OWcSdbCntWNB8HNzmfKkdLk")' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/90 via-bg-dark/20 to-transparent"></div>
          </div>
          
          <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col items-center text-center">
            <div className="mb-2 px-3 py-0.5 border border-accent/50 rounded-sm bg-accent/5 backdrop-blur-sm">
              <span className="text-[10px] tracking-[0.2em] text-accent font-bold uppercase">绝密水墨卷</span>
            </div>
            <h2 className="font-serif text-3xl font-bold text-ink mb-2 tracking-widest">水墨丹青</h2>
            <p className="text-xs text-ink-light font-medium leading-relaxed max-w-[200px] font-serif">研墨挥毫，唤醒画卷中沉睡的千古英魂</p>
          </div>

          {/* Corners (Chinese style brackets) */}
          <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-ink/40"></div>
          <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-ink/40"></div>
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-ink/40"></div>
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-ink/40"></div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[10px] text-ink-light bg-white/60 px-3 py-1.5 rounded-full border border-ink/10 backdrop-blur-sm shadow-sm">
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
            className="flex-1 group relative flex flex-col items-center justify-center py-4 bg-white/80 backdrop-blur-md border border-ink/20 rounded-sm active:scale-95 transition-all disabled:opacity-50 shadow-sm"
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
            className="flex-1 group relative flex flex-col items-center justify-center py-4 bg-accent/5 backdrop-blur-md border-2 border-accent/60 rounded-sm active:scale-95 transition-all disabled:opacity-50 overflow-hidden shadow-sm"
          >
            <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-sm shadow-sm">朱砂印</div>
            <span className="font-serif text-lg font-bold text-accent">寻访五次</span>
            <div className="flex items-center gap-1 mt-1">
              <Hexagon className="text-accent w-3 h-3 fill-accent/20" />
              <span className="text-xs font-bold text-accent">5</span>
            </div>
          </button>
        </div>
        <p className="text-center text-[10px] text-ink-light mt-4 tracking-widest font-medium">每寻访20次必得一名五星名将</p>
      </div>
    </div>
  );
}
