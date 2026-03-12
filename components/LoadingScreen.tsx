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
      'https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/bg/loading_bg.jpg',
    ];

    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    // Preload video
    const video = document.createElement('video');
    video.src = 'https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/video/card.mp4';
    video.preload = 'auto';
    video.load();

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
      {/* Background image */}
      <img 
        src="https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/bg/loading_bg.jpg" 
        alt="Login Background" 
        className="absolute inset-0 w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />

      <div className="relative z-10 flex flex-col items-center h-full w-full py-20">
        <div className="flex-1 flex items-center justify-center">
        </div>
        
        <div className="w-4/5 max-w-sm flex flex-col items-center mt-auto mb-10 h-24 justify-end">
          {!hasStarted ? (
            <button 
              onClick={() => setHasStarted(true)}
              className="transition-all active:scale-95"
            >
              <img 
                src="https://cdn.jsdelivr.net/gh/dreamforgame-win/slg-assets@main/UI/btn_login.png" 
                alt="开始游戏" 
                className="h-11 w-auto"
                referrerPolicy="no-referrer"
              />
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
