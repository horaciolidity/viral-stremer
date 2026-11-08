import React, { useState } from 'react';
import { OverlayElement, OverlayType } from '../types/studio';
import { translations, Language } from '../services/i18n';
import {
  Layers,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Type,
  Clock,
  Link2,
  Share2,
  Shield,
  Edit2,
  Check,
} from 'lucide-react';

interface OverlayEditorProps {
  overlays: OverlayElement[];
  onChange: (overlays: OverlayElement[]) => void;
  language: Language;
}

export const OverlayEditor: React.FC<OverlayEditorProps> = ({
  overlays,
  onChange,
  language,
}) => {
  const t = translations[language];
  const [editingId, setEditingId] = useState<string | null>(null);

  const toggleVisibility = (id: string) => {
    onChange(
      overlays.map((o) => (o.id === id ? { ...o, visible: !o.visible } : o))
    );
  };

  const removeOverlay = (id: string) => {
    onChange(overlays.filter((o) => o.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const updateOverlay = (id: string, updates: Partial<OverlayElement>) => {
    onChange(
      overlays.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
  };

  const addPreset = (type: OverlayType) => {
    const id = `ov_${Date.now()}`;
    let newElement: OverlayElement;

    switch (type) {
      case 'lower-third':
        newElement = {
          id,
          type: 'lower-third',
          title: 'Alex Rivers',
          subtitle: 'Lead Software Architect & Producer',
          x: 5,
          y: 84,
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 26,
          textColor: '#ffffff',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          accentColor: '#6366f1',
          opacity: 1,
          visible: true,
          animation: 'slide-in-left',
        };
        break;
      case 'timer':
        newElement = {
          id,
          type: 'timer',
          title: '00:00',
          x: 5,
          y: 5,
          fontFamily: 'JetBrains Mono',
          fontSize: 16,
          textColor: '#f8fafc',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          accentColor: '#ef4444',
          opacity: 1,
          visible: true,
          animation: 'fade',
        };
        break;
      case 'logo':
        newElement = {
          id,
          type: 'logo',
          title: 'VISIONCAST LIVE',
          x: 80,
          y: 5,
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 16,
          textColor: '#ffffff',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          accentColor: '#6366f1',
          opacity: 0.9,
          visible: true,
          animation: 'none',
        };
        break;
      case 'link':
        newElement = {
          id,
          type: 'link',
          title: 'visioncast.studio',
          url: 'https://visioncast.studio',
          x: 5,
          y: 12,
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 16,
          textColor: '#e2e8f0',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          accentColor: '#818cf8',
          opacity: 1,
          visible: true,
          animation: 'fade',
        };
        break;
      case 'social':
        newElement = {
          id,
          type: 'social',
          title: 'Social Handle',
          content: '@visioncast_app',
          x: 75,
          y: 92,
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 16,
          textColor: '#ffffff',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          accentColor: '#38bdf8',
          opacity: 1,
          visible: true,
          animation: 'fade',
        };
        break;
      default:
        newElement = {
          id,
          type: 'text',
          title: 'Live Workshop',
          x: 50,
          y: 8,
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 28,
          textColor: '#ffffff',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          accentColor: '#6366f1',
          opacity: 1,
          visible: true,
          animation: 'fade',
        };
    }

    onChange([...overlays, newElement]);
    setEditingId(id);
  };

  const selectedOverlay = overlays.find((o) => o.id === editingId);

  return (
    <div className="bg-[#12151d] border border-[#1e2330] rounded-xl p-4 space-y-4 text-slate-200">
      <div className="flex items-center justify-between border-b border-[#1c212c] pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {t.overlaysTitle}
          </h3>
        </div>

        <span className="text-[10px] text-slate-400 font-mono">
          {overlays.filter((o) => o.visible).length}/{overlays.length} active
        </span>
      </div>

      {/* Quick Add Presets Bar */}
      <div>
        <label className="text-xs text-slate-400 block mb-2">{t.addOverlay}</label>
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          <button
            onClick={() => addPreset('lower-third')}
            className="flex items-center gap-1.5 p-2 rounded bg-[#161a24] hover:bg-[#1e2332] border border-[#222836] text-slate-300 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{t.lowerThird}</span>
          </button>
          <button
            onClick={() => addPreset('timer')}
            className="flex items-center gap-1.5 p-2 rounded bg-[#161a24] hover:bg-[#1e2332] border border-[#222836] text-slate-300 hover:text-white transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">{t.streamTimer}</span>
          </button>
          <button
            onClick={() => addPreset('logo')}
            className="flex items-center gap-1.5 p-2 rounded bg-[#161a24] hover:bg-[#1e2332] border border-[#222836] text-slate-300 hover:text-white transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">{t.logoWatermark}</span>
          </button>
          <button
            onClick={() => addPreset('link')}
            className="flex items-center gap-1.5 p-2 rounded bg-[#161a24] hover:bg-[#1e2332] border border-[#222836] text-slate-300 hover:text-white transition-colors"
          >
            <Link2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">{t.clickableLink}</span>
          </button>
          <button
            onClick={() => addPreset('social')}
            className="flex items-center gap-1.5 p-2 rounded bg-[#161a24] hover:bg-[#1e2332] border border-[#222836] text-slate-300 hover:text-white transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{t.socialHandle}</span>
          </button>
          <button
            onClick={() => addPreset('text')}
            className="flex items-center gap-1.5 p-2 rounded bg-[#161a24] hover:bg-[#1e2332] border border-[#222836] text-slate-300 hover:text-white transition-colors"
          >
            <Type className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{t.customText}</span>
          </button>
        </div>
      </div>

      {/* Overlays List */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {overlays.map((ov) => {
          const isEditing = editingId === ov.id;
          return (
            <div
              key={ov.id}
              className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                isEditing
                  ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                  : 'bg-[#151923] border-[#1f2534] text-slate-300'
              }`}
            >
              <div
                className="flex items-center gap-2 truncate cursor-pointer flex-1"
                onClick={() => setEditingId(isEditing ? null : ov.id)}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: ov.accentColor || '#6366f1' }}
                />
                <span className="font-semibold truncate">{ov.title}</span>
                {ov.subtitle && (
                  <span className="text-[10px] text-slate-400 truncate">· {ov.subtitle}</span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => toggleVisibility(ov.id)}
                  className={`p-1 rounded ${
                    ov.visible ? 'text-indigo-400 hover:text-indigo-300' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={ov.visible ? 'Hide' : 'Show'}
                >
                  {ov.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setEditingId(isEditing ? null : ov.id)}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Edit element"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => removeOverlay(ov.id)}
                  className="p-1 text-slate-500 hover:text-rose-400"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline Editor Drawer for Selected Overlay */}
      {selectedOverlay && (
        <div className="bg-[#151924] border border-[#232b3c] rounded-lg p-3 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-[#202737] pb-1.5">
            <span className="font-semibold text-indigo-300">Edit: {selectedOverlay.title}</span>
            <button
              onClick={() => setEditingId(null)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Title / Name</label>
            <input
              type="text"
              value={selectedOverlay.title}
              onChange={(e) => updateOverlay(selectedOverlay.id, { title: e.target.value })}
              className="w-full bg-[#0d1016] border border-[#242b3b] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {selectedOverlay.type === 'lower-third' && (
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Subtitle / Role</label>
              <input
                type="text"
                value={selectedOverlay.subtitle || ''}
                onChange={(e) => updateOverlay(selectedOverlay.id, { subtitle: e.target.value })}
                className="w-full bg-[#0d1016] border border-[#242b3b] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {selectedOverlay.type === 'link' && (
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">URL Address</label>
              <input
                type="text"
                value={selectedOverlay.url || ''}
                onChange={(e) => updateOverlay(selectedOverlay.id, { url: e.target.value })}
                className="w-full bg-[#0d1016] border border-[#242b3b] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">X Position ({selectedOverlay.x}%)</label>
              <input
                type="range"
                min="0"
                max="90"
                value={selectedOverlay.x}
                onChange={(e) => updateOverlay(selectedOverlay.id, { x: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 h-1 bg-[#090b10] rounded"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Y Position ({selectedOverlay.y}%)</label>
              <input
                type="range"
                min="0"
                max="90"
                value={selectedOverlay.y}
                onChange={(e) => updateOverlay(selectedOverlay.id, { y: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 h-1 bg-[#090b10] rounded"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">Accent Color</span>
            <div className="flex items-center gap-1.5">
              {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#38bdf8'].map((col) => (
                <button
                  key={col}
                  onClick={() => updateOverlay(selectedOverlay.id, { accentColor: col })}
                  className="w-4 h-4 rounded-full border border-white/20 transition-transform active:scale-90"
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
