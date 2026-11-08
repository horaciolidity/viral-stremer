import React from 'react';
import { FloatingCameraConfig, CameraShape } from '../types/studio';
import { translations, Language } from '../services/i18n';
import {
  Camera,
  Circle,
  Square,
  Maximize2,
  Minimize2,
  FlipHorizontal,
  Eye,
  EyeOff,
  Move,
  ZoomIn,
  RefreshCw,
} from 'lucide-react';

interface FloatingCameraProps {
  config: FloatingCameraConfig;
  onChange: (config: Partial<FloatingCameraConfig>) => void;
  onSwitchCamera: () => void;
  language: Language;
}

export const FloatingCamera: React.FC<FloatingCameraProps> = ({
  config,
  onChange,
  onSwitchCamera,
  language,
}) => {
  const t = translations[language];

  const snapPositions = [
    { label: 'TL', x: 18, y: 18 },
    { label: 'TR', x: 82, y: 18 },
    { label: 'BL', x: 18, y: 78 },
    { label: 'BR', x: 82, y: 78 },
    { label: 'Center', x: 50, y: 50 },
  ];

  const shapes: { id: CameraShape; label: string; icon: any }[] = [
    { id: 'circle', label: t.shapeCircle, icon: Circle },
    { id: 'rectangle', label: t.shapeRect, icon: Square },
    { id: 'squircle', label: t.shapeSquircle, icon: Square },
  ];

  return (
    <div className="bg-[#12151d] border border-[#1e2330] rounded-xl p-4 space-y-4 text-slate-200">
      <div className="flex items-center justify-between border-b border-[#1c212c] pb-2.5">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {t.cameraLayout}
          </h3>
        </div>

        {/* Visibility & Mirror Quick Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onChange({ enabled: !config.enabled })}
            className={`p-1.5 rounded transition-colors ${
              config.enabled ? 'bg-indigo-600/20 text-indigo-300' : 'bg-slate-800 text-slate-400'
            }`}
            title={config.enabled ? t.hideCamera : t.showCamera}
          >
            {config.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onChange({ mirror: !config.mirror })}
            className={`p-1.5 rounded transition-colors ${
              config.mirror ? 'bg-indigo-600/20 text-indigo-300' : 'bg-slate-800 text-slate-400'
            }`}
            title={t.flipHorizontal}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onSwitchCamera}
            className="p-1.5 rounded bg-[#1c2230] hover:bg-[#252c3e] text-slate-300 hover:text-white transition-colors"
            title={t.switchCamera}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Camera Shapes */}
      <div>
        <label className="text-xs text-slate-400 block mb-2">{t.cameraShape}</label>
        <div className="grid grid-cols-3 gap-2">
          {shapes.map((s) => {
            const Icon = s.icon;
            const isSelected = config.shape === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onChange({ shape: s.id })}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium border transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                    : 'bg-[#161a24] border-[#222836] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Snap Positions */}
      <div>
        <label className="text-xs text-slate-400 block mb-2">{t.cameraPosition}</label>
        <div className="grid grid-cols-5 gap-1.5">
          {snapPositions.map((pos) => {
            const isSelected =
              Math.abs(config.x - pos.x) < 4 && Math.abs(config.y - pos.y) < 4;
            return (
              <button
                key={pos.label}
                onClick={() => onChange({ x: pos.x, y: pos.y })}
                className={`py-1 rounded text-[11px] font-semibold border transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-[#161a24] border-[#202634] text-slate-400 hover:text-slate-200'
                }`}
              >
                {pos.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders: Size, Zoom, Opacity */}
      <div className="space-y-3 pt-1 text-xs">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400">{t.cameraSize}</span>
            <span className="font-mono text-slate-300">{Math.round((config.size / 500) * 100)}%</span>
          </div>
          <input
            type="range"
            min="160"
            max="500"
            step="10"
            value={config.size}
            onChange={(e) => onChange({ size: parseInt(e.target.value) })}
            className="w-full accent-indigo-500 h-1.5 bg-[#0a0d13] rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400">{t.cameraZoom}</span>
            <span className="font-mono text-slate-300">{config.zoom.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="2.5"
            step="0.1"
            value={config.zoom}
            onChange={(e) => onChange({ zoom: parseFloat(e.target.value) })}
            className="w-full accent-indigo-500 h-1.5 bg-[#0a0d13] rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400">{t.cameraOpacity}</span>
            <span className="font-mono text-slate-300">{Math.round(config.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={config.opacity}
            onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
            className="w-full accent-indigo-500 h-1.5 bg-[#0a0d13] rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
