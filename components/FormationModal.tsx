'use client';
import React from 'react';
import { X } from 'lucide-react';
import { useGameState } from '@/components/GameStateProvider';
import { formations } from '@/data/formations';

export default function FormationModal({ onClose }: { onClose: () => void }) {
  const { formationId, setFormationId } = useGameState();

  const handleSelect = (id: number) => {
    setFormationId(id);
    alert('阵法切换成功');
    onClose();
  };

  const FormationGrid = ({ effectCells }: { effectCells: number[] }) => (
    <div className="grid grid-cols-3 gap-1 w-16 h-16 border border-gray-600">
      {[...Array(9)].map((_, i) => (
        <div
          key={i}
          className={`border border-gray-700 ${effectCells.includes(i) ? 'bg-yellow-500/50' : ''}`}
        />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-white">选择阵法</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto">
          <button
            onClick={() => handleSelect(0)}
            className={`w-full p-3 border rounded-lg flex gap-4 items-center ${
              formationId === 0 ? 'bg-yellow-900/30 border-yellow-600' : 'bg-gray-800 border-gray-700'
            }`}
          >
            <div className="w-12 h-12 border border-gray-600 flex items-center justify-center text-gray-500 text-xs shrink-0">无</div>
            <div className="text-white text-left">
              <div className="font-bold">无阵法</div>
              <div className="text-xs text-gray-400">不使用任何阵法</div>
            </div>
          </button>
          {formations.map((f) => (
            <button
              key={f.id}
              onClick={() => handleSelect(f.id)}
              className={`w-full p-3 border rounded-lg flex gap-4 items-center ${
                formationId === f.id ? 'bg-yellow-900/30 border-yellow-600' : 'bg-gray-800 border-gray-700'
              }`}
            >
              <div className="shrink-0"><FormationGrid effectCells={f.effectCells} /></div>
              <div className="text-white text-left">
                <div className="font-bold text-sm">{f.name}</div>
                <div className="text-xs text-gray-400 space-y-0.5">
                  {f.effects.map((e, i) => <div key={i}>{e}</div>)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
