import React, { useState, useEffect } from 'react';
import { StudioMode, VideoRecording } from '../types/studio';
import { translations, Language } from '../services/i18n';
import { StorageService } from '../services/storageService';
import {
  Tv,
  Monitor,
  Camera,
  Presentation,
  Radio,
  ArrowRight,
  HardDrive,
  Film,
  Play,
  CheckCircle2,
  Sliders,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';

interface HomeViewProps {
  language: Language;
  onSelectMode: (mode: StudioMode) => void;
  onNavigate: (tab: string) => void;
  storageQuota: { usedBytes: number; quotaBytes: number; percentage: number };
}

export const HomeView: React.FC<HomeViewProps> = ({
  language,
  onSelectMode,
  onNavigate,
  storageQuota,
}) => {
  const t = translations[language];
  const [recentRecordings, setRecentRecordings] = useState<VideoRecording[]>([]);

  useEffect(() => {
    StorageService.getInstance().getRecordings().then((recs) => {
      setRecentRecordings(recs.slice(0, 3));
    });
  }, []);

  const formatStorage = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) return `${Math.round(mb)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem.toString().padStart(2, '0')}`;
  };

  const quickModes = [
    {
      id: 'screen-camera' as StudioMode,
      title: t.modeScreenCam,
      desc: 'Simultaneous display recording with floating movable webcam overlay.',
      icon: Tv,
      badge: 'Primary Mode',
      color: 'indigo',
    },
    {
      id: 'screen-only' as StudioMode,
      title: t.modeScreenOnly,
      desc: 'Clean desktop capture with system audio and crystal voice commentary.',
      icon: Monitor,
      badge: 'High FPS',
      color: 'blue',
    },
    {
      id: 'camera-only' as StudioMode,
      title: t.modeCameraOnly,
      desc: 'Full-screen portrait, interview, or presenter monologue with framing controls.',
      icon: Camera,
      badge: '1080p / 4K',
      color: 'purple',
    },
    {
      id: 'presenter' as StudioMode,
      title: t.modePresenter,
      desc: 'Screen + Camera equipped with real-time lower thirds, titles, and live links.',
      icon: Presentation,
      badge: 'Pro Broadcast',
      color: 'pink',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0e13] p-4 md:p-8 overflow-y-auto">
      {/* Studio Banner */}
      <div className="max-w-6xl mx-auto w-full space-y-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#141724] via-[#161a29] to-[#12141e] border border-[#212738] p-6 md:p-8 shadow-2xl">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Next-Generation Audiovisual Suite</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {t.appName}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Record your screen and camera simultaneously into one composed video. Mix multi-channel audio with real DSP vocal compression. Stream live across multiple platforms with interactive overlays.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  onSelectMode('screen-camera');
                  onNavigate('studio');
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-transform active:scale-95"
              >
                <span>Launch Studio Room</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onNavigate('streaming')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#191f2c] hover:bg-[#222a3d] border border-[#2b344a] text-slate-200 font-semibold text-xs transition-colors"
              >
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
                <span>Configure Live Stream</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Primary Recording Modes Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Select Production Mode
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">Real-time Compositor Engine</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickModes.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    onSelectMode(m.id);
                    onNavigate('studio');
                  }}
                  className="bg-[#12151e] border border-[#1e2330] hover:border-indigo-500/50 rounded-xl p-5 text-left flex flex-col justify-between space-y-4 transition-all group hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-lg bg-[#181d2a] text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 font-mono">
                        {m.badge}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {m.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
                    <span>Enter Mode</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* System Readiness Checklist & Storage Quota */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Readiness Checklist */}
          <div className="lg:col-span-7 bg-[#12151e] border border-[#1e2330] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#1c2230] pb-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Hardware Readiness Checklist
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Live Hardware Status</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0d0f16] border border-[#1b202c]">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Display Capture Engine (getDisplayMedia)</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">Ready</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0d0f16] border border-[#1b202c]">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Web Audio API Mixer (48kHz DSP + Vocal Compressor)</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">Ready</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0d0f16] border border-[#1b202c]">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Progressive IndexedDB Disk Streamer (Zero-RAM Leak)</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">Active</span>
              </div>
            </div>
          </div>

          {/* Local Storage Quota */}
          <div className="lg:col-span-5 bg-[#12151e] border border-[#1e2330] rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 border-b border-[#1c2230] pb-2.5 mb-3">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Local Storage Space
                </h3>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Storage Used</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {formatStorage(storageQuota.usedBytes)} of {formatStorage(storageQuota.quotaBytes)}
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-[#1b1f2b] overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${Math.max(2, storageQuota.percentage)}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                  {t.unlimitedDiskNote}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('recordings')}
              className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#161a25] hover:bg-[#1e2334] border border-[#232b3d] text-xs font-semibold text-slate-200 transition-colors"
            >
              <span>Manage Recordings</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
            </button>
          </div>
        </div>

        {/* Recent Recordings Strip */}
        {recentRecordings.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Film className="w-4 h-4 text-indigo-400" />
                <span>Recent Studio Recordings</span>
              </h2>
              <button
                onClick={() => onNavigate('recordings')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                View all recordings →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recentRecordings.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => onNavigate('recordings')}
                  className="bg-[#12151e] border border-[#1e2330] hover:border-[#2a3348] rounded-xl overflow-hidden cursor-pointer transition-all group"
                >
                  <div className="aspect-video bg-[#090b10] relative flex items-center justify-center">
                    {rec.thumbnailUrl ? (
                      <img src={rec.thumbnailUrl} alt={rec.title} className="w-full h-full object-cover" />
                    ) : (
                      <Film className="w-6 h-6 text-slate-600" />
                    )}
                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-white">
                      {formatDuration(rec.duration)}
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="text-xs font-semibold text-white truncate group-hover:text-indigo-300">
                      {rec.title}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                      {rec.resolution} · {rec.fps} FPS
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
