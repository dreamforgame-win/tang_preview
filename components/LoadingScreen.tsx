'use client';
import { useState, useEffect } from 'react';

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [hasStarted, setHasStarted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!hasStarted) return;

    // Preload images
    const imagesToPreload = [
      'https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/bg/card_bg.jpg',
      'https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/bg/summon_bg.jpg',
      'https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/bg/team_bg.jpg',
    ];

    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    // Animate progress bar over 5 seconds
    const duration = 5000;
    const interval = 50; // update every 50ms
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min(100, Math.floor((currentStep / steps) * 100));
      setProgress(currentProgress);

      if (currentStep >= steps) {
        clearInterval(timer);
        onComplete();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [hasStarted, onComplete]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0f1a] text-white overflow-hidden">
      {/* Background styling for the loading screen */}
      <div className="absolute inset-0 opacity-40 bg-[url('https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/bg/team_bg.jpg')] bg-cover bg-center blur-sm" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/60 via-[#0a0f1a]/80 to-[#0a0f1a]" />

      <div className="relative z-10 flex flex-col items-center h-full w-full py-20">
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-5xl font-serif font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-blue-200 to-blue-600 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] filter drop-shadow-lg" style={{ textShadow: '0 4px 24px rgba(37, 99, 235, 0.6)' }}>
            河图：唐破阵志
          </h1>
        </div>
        
        <div className="w-4/5 max-w-sm flex flex-col items-center mt-auto mb-10 h-24 justify-end">
          {!hasStarted ? (
            <button 
              onClick={() => setHasStarted(true)}
              className="px-8 py-3 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500/50 rounded-sm text-blue-100 font-serif tracking-widest text-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all active:scale-95"
            >
              开始游戏
            </button>
          ) : (
            <>
              <span className="text-sm text-blue-100/80 mb-3 font-serif tracking-widest drop-shadow-md">正在加载资源</span>
              
              <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden relative border border-blue-900/50 shadow-[0_0_15px_rgba(0,0,0,0.5)_inset]">
                <div 
                  className="h-full bg-gradient-to-r from-blue-700 via-blue-500 to-blue-300 transition-all duration-75 ease-linear shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <span className="text-xs font-mono mt-3 text-blue-400/90 font-bold tracking-wider">{progress}%</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
