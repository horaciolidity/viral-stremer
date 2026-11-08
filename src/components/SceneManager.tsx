import React from 'react';
import { SceneConfig, SceneTransition, StudioMode } from '../types/studio';
import { translations, Language } from '../services/i18n';
import {
  Layers,
  Tv,
  Camera,
  Monitor,
  Presentation,
  Gamepad2,
  Newspaper,
  Users,
  Scissors,
  Sparkles,
  ArrowRightLeft,
} from 'lucide-react';

interface SceneManagerProps {
  scenes: SceneConfig[];
  activeSceneId: string;
  activeTransition: SceneTransition;
  onSelectScene: (sceneId: string) => void;
  onSelectTransition: (trans: SceneTransition) => void;
  language: Language;
}

export const SceneManager: React.FC<SceneManagerProps> = ({
  scenes,
  activeSceneId,
  activeTransition,
  onSelectScene,
  onSelectTransition,
  language,
}) => {
  const t = translations[language];

  const getSceneIcon = (mode: StudioMode) => {
    switch (mode) {
      case 'screen-camera':
        return Tv;
      case 'camera-only':
        return Camera;
      case 'screen-only':
        return Monitor;
      case 'presenter':
        return Presentation;
      default:
        return Layers;
    }
  };

  const transitions: { id: SceneTransition; label: string; icon: any }[] = [
    { id: 'cut', label: t.transCut, icon: Scissors },
    { id: 'fade', label: t.transFade, icon: Sparkles },
    { id: 'slide', label: t.transSlide, icon: ArrowRightLeft },
  ];

  return (
    <div className="bg-[#12151d] border border-[#1e2330] rounded-xl p-4 space-y-4 text-slate-200">
      <div className="flex items-center justify-between border-b border-[#1c212c] pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {t.scenesTitle}
          </h3>
        </div>

        {/* Transition Switcher */}
        <div className="flex items-center gap-1 bg-[#161a24] p-1 rounded-md border border-[#202736]">
          {transitions.map((tr) => {
            const Icon = tr.icon;
            const isSelected = activeTransition === tr.id;
            return (
              <button
                key={tr.id}
                onClick={() => onSelectTransition(tr.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Transition: ${tr.label}`}
              >
                <Icon className="w-3 h-3" />
                <span>{tr.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Production Scenes */}
      <div className="grid grid-cols-2 gap-2.5">
        {scenes.map((scene, index) => {
          const Icon = getSceneIcon(scene.mode);
          const isActive = scene.id === activeSceneId;
          return (
            <button
              key={scene.id}
              onClick={() => onSelectScene(scene.id)}
              className={`p-3 rounded-lg border text-left transition-all relative overflow-hidden group ${
                isActive
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-600/10'
                  : 'bg-[#151923] border-[#1f2534] hover:bg-[#1a1f2c] hover:border-[#2a3246]'
              }`}
            >
              {/* Hotkey hint */}
              <span className="absolute top-2 right-2 text-[10px] font-mono text-slate-500 group-hover:text-slate-300">
                [{index + 1}]
              </span>

              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={`p-1.5 rounded-md ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-[#1c2230] text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-white truncate">{scene.name}</span>
              </div>

              <p className="text-[10px] text-slate-400 line-clamp-1">{scene.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
