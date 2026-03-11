'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Users, Swords, BookOpen } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="absolute bottom-0 left-0 w-full z-50">
      <div className="flex gap-2 border-t border-ink/10 bg-bg-panel/95 backdrop-blur-xl px-2 pb-6 pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <Link href="/" className={`flex flex-1 flex-col items-center justify-center gap-1 ${pathname === '/' ? 'text-accent' : 'text-ink-light hover:text-ink'} transition-colors`}>
          <div className={`flex h-8 items-center justify-center`}>
            <Sparkles size={24} />
          </div>
          <p className="font-serif text-[10px] font-bold leading-normal tracking-widest">寻访</p>
        </Link>
        <Link href="/gallery" className={`flex flex-1 flex-col items-center justify-center gap-1 ${pathname === '/gallery' ? 'text-accent' : 'text-ink-light hover:text-ink'} transition-colors relative overflow-hidden`}>
          {pathname === '/gallery' && <div className="absolute inset-0 ink-splash opacity-60 pointer-events-none"></div>}
          <div className="flex h-8 items-center justify-center relative z-10">
            <BookOpen size={24} />
          </div>
          <p className="font-serif text-[10px] font-bold leading-normal tracking-widest relative z-10">图鉴</p>
        </Link>
        <Link href="/lineup" className={`flex flex-1 flex-col items-center justify-center gap-1 ${pathname === '/lineup' ? 'text-accent' : 'text-ink-light hover:text-ink'} transition-colors relative overflow-hidden`}>
          {pathname === '/lineup' && <div className="absolute inset-0 ink-splash opacity-60 pointer-events-none"></div>}
          <div className="flex h-8 items-center justify-center relative z-10">
            <Users size={24} />
          </div>
          <p className="font-serif text-[10px] font-bold leading-normal tracking-widest relative z-10">布阵</p>
        </Link>
        <Link href="/battle" className={`flex flex-1 flex-col items-center justify-center gap-1 ${pathname === '/battle' ? 'text-accent' : 'text-ink-light hover:text-ink'} transition-colors`}>
          <div className="flex h-8 items-center justify-center">
            <Swords size={24} />
          </div>
          <p className="font-serif text-[10px] font-bold leading-normal tracking-widest">出征</p>
        </Link>
      </div>
    </div>
  );
}
