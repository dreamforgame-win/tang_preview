'use client';
import { X } from 'lucide-react';

interface WelfareModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export default function WelfareModal({ onClose, onConfirm }: WelfareModalProps) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-bg-panel border border-ink/20 rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-white/10 flex justify-center items-center bg-primary/50 relative">
          <h3 className="font-serif font-bold text-lg text-ink tracking-widest">送福利</h3>
          <X size={18} className="cursor-pointer absolute right-4" onClick={onClose} />
        </div>
        <div className="p-6 text-center">
          <p className="text-sm text-ink-light">抽抽抽，使劲抽！！</p>
        </div>
        <div className="p-4 border-t border-white/10 bg-primary/50">
          <button 
            onClick={onConfirm}
            className="w-full py-2.5 rounded-sm bg-accent text-white font-bold text-sm"
          >
            再来100抽！
          </button>
        </div>
      </div>
    </div>
  );
}
