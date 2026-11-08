import React, { useState } from 'react';
import { translations, Language } from '../services/i18n';
import {
  FolderOpen,
  Sparkles,
  Volume2,
  Image as ImageIcon,
  Check,
  Play,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { OverlayElement } from '../types/studio';

interface MediaLibraryViewProps {
  language: Language;
  onApplyPreset: (overlays: OverlayElement[]) => void;
  onNavigateToStudio: () => void;
}

export const MediaLibraryView: React.FC<MediaLibraryViewProps> = ({
  language,
  onApplyPreset,
  onNavigateToStudio,
}) => {
  const t = translations[language];
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const presets = [
    {
      id: 'template_tech',
      name: 'Tech Reviewer & Software Architecture',
      category: 'Lower Thirds & Badges',
      accent: '#6366f1',
      description: 'Modern indigo gradient lower third with monospace timer and minimal URL badge.',
      overlays: [
        {
          id: 'ov_t1',
          type: 'lower-third',
          title: 'Alex Rivers',
          subtitle: 'Senior Software Architect',
          x: 4,
          y: 84,
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 26,
          textColor: '#ffffff',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          accentColor: '#6366f1',
          opacity: 1,
          visible: true,
          animation: 'slide-in-left',
        },
        {
          id: 'ov_t2',
          type: 'logo',
          title: 'VISIONCAST PRO',
          x: 78,
          y: 4,
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 16,
          textColor: '#ffffff',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          accentColor: '#6366f1',
          opacity: 0.9,
          visible: true,
          animation: 'none',
        },
        {
          id: 'ov_t3',
          type: 'link',
          title: 'github.com/visioncast',
          url: 'https://github.com',
          x: 4,
          y: 8,
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 15,
          textColor: '#e2e8f0',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          accentColor: '#818cf8',
          opacity: 1,
          visible: true,
          animation: 'fade',
        },
      ] as OverlayElement[],
    },
    {
      id: 'template_news',
      name: 'Breaking News & Editorial Desk',
      category: 'Broadcast Desk',
      accent: '#ef4444',
      description: 'Bold red headline ticker, live broadcast timer badge, and verified source insignia.',
      overlays: [
        {
          id: 'ov_n1',
          type: 'lower-third',
          title: 'BREAKING NEWS DESK',
          subtitle: 'Live Analysis & High-Priority Industry Coverage',
          x: 4,
          y: 84,
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 28,
          textColor: '#ffffff',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          accentColor: '#ef4444',
          opacity: 1,
          visible: true,
          animation: 'slide-in-left',
        },
        {
          id: 'ov_n2',
          type: 'timer',
          title: 'LIVE',
          x: 4,
          y: 4,
          fontFamily: 'JetBrains Mono',
          fontSize: 16,
          textColor: '#ffffff',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          accentColor: '#ef4444',
          opacity: 1,
          visible: true,
          animation: 'fade',
        },
      ] as OverlayElement[],
    },
    {
      id: 'template_minimal',
      name: 'Clean Minimalist Webinar',
      category: 'Executive Webinar',
      accent: '#10b981',
      description: 'Clean emerald accent bar, subtle contact handle and non-distracting branding.',
      overlays: [
        {
          id: 'ov_m1',
          type: 'lower-third',
          title: 'Product Demonstration',
          subtitle: 'Executive Briefing & Workflow Overview',
          x: 4,
          y: 86,
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 24,
          textColor: '#ffffff',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          accentColor: '#10b981',
          opacity: 0.95,
          visible: true,
          animation: 'fade',
        },
        {
          id: 'ov_m2',
          type: 'social',
          title: 'LinkedIn',
          content: '@visioncast-studio',
          x: 75,
          y: 92,
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 15,
          textColor: '#ffffff',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          accentColor: '#10b981',
          opacity: 1,
          visible: true,
          animation: 'fade',
        },
      ] as OverlayElement[],
    },
    {
      id: 'template_creator',
      name: 'Creator & Gamer Neon',
      category: 'Live Entertainment',
      accent: '#ec4899',
      description: 'High energy pink & purple overlay, social handles and highlight banner.',
      overlays: [
        {
          id: 'ov_c1',
          type: 'lower-third',
          title: 'STREAMER ARENA',
          subtitle: 'Live Gameplay & Audience Interactive Challenges',
          x: 4,
          y: 84,
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 26,
          textColor: '#ffffff',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          accentColor: '#ec4899',
          opacity: 1,
          visible: true,
          animation: 'slide-in-left',
        },
        {
          id: 'ov_c2',
          type: 'social',
          title: 'Twitch',
          content: 'twitch.tv/visioncast',
          x: 70,
          y: 6,
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 15,
          textColor: '#ffffff',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          accentColor: '#ec4899',
          opacity: 1,
          visible: true,
          animation: 'fade',
        },
      ] as OverlayElement[],
    },
  ];

  const handleApply = (id: string, ovs: OverlayElement[]) => {
    onApplyPreset(ovs);
    setAppliedId(id);
    setTimeout(() => setAppliedId(null), 2500);
  };

  // Web Audio synthesizer for audio stingers / sound effects
  const playSoundEffect = (type: 'intro' | 'ping' | 'outro') => {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'ping') {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'intro') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.12);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0e13] p-4 md:p-6 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1c212c] pb-4 mb-6">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2.5">
            <FolderOpen className="w-5 h-5 text-indigo-400" />
            <span>{t.navMedia}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pre-designed broadcast lower thirds · Watermarks · Synth sound effects
          </p>
        </div>

        <button
          onClick={onNavigateToStudio}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
        >
          <span>Return to Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Audio Stingers Section */}
      <div className="mb-8 bg-[#12151e] border border-[#1e2330] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Volume2 className="w-4 h-4 text-purple-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Synthesized Broadcast Stingers & Alerts
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Instant audio feedback cues synthesized directly via Web Audio API.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => playSoundEffect('intro')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#161a25] hover:bg-[#1f2536] border border-[#232b3d] text-slate-200 text-xs font-medium transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
            <span>Intro Triad Chime</span>
          </button>
          <button
            onClick={() => playSoundEffect('ping')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#161a25] hover:bg-[#1f2536] border border-[#232b3d] text-slate-200 text-xs font-medium transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>Audience Question Ping</span>
          </button>
          <button
            onClick={() => playSoundEffect('outro')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#161a25] hover:bg-[#1f2536] border border-[#232b3d] text-slate-200 text-xs font-medium transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>Broadcast Sign-off Tone</span>
          </button>
        </div>
      </div>

      {/* Predefined Templates Grid */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Professional Lower-Third & Overlay Templates</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presets.map((p) => {
            const isApplied = appliedId === p.id;
            return (
              <div
                key={p.id}
                className="bg-[#12151e] border border-[#1e2330] rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-[#2a3348] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-indigo-400 font-mono">
                      {p.category}
                    </span>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: p.accent }}
                    />
                  </div>

                  <h3 className="text-sm font-bold text-white">{p.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{p.description}</p>

                  {/* Visual Preview Badge */}
                  <div className="mt-4 p-3 bg-[#0a0d13] rounded-lg border border-[#1a1f2c] flex items-center gap-3">
                    <div
                      className="w-1.5 h-10 rounded-xs shrink-0"
                      style={{ backgroundColor: p.accent }}
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate">
                        {p.overlays[0].title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {p.overlays[0].subtitle}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#1b202c]">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {p.overlays.length} active elements
                  </span>
                  <button
                    onClick={() => handleApply(p.id, p.overlays)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isApplied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Applied to Studio</span>
                      </>
                    ) : (
                      <>
                        <Layers className="w-3.5 h-3.5" />
                        <span>Use Template in Studio</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
