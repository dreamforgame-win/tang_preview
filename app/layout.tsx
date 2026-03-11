import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { GameStateProvider } from '@/components/GameStateProvider';

export const metadata: Metadata = {
  title: 'My Google AI Studio App',
  description: 'My Google AI Studio App',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="zh" className="dark">
      <body className="bg-black text-slate-100 antialiased flex justify-center h-[100dvh] overflow-hidden" suppressHydrationWarning>
        <GameStateProvider>
          <div className="w-full max-w-md bg-bg-dark relative flex flex-col h-full overflow-hidden shadow-2xl border-x border-white/10">
            {children}
          </div>
        </GameStateProvider>
      </body>
    </html>
  );
}
