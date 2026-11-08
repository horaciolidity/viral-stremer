import React, { useState, useEffect } from 'react';
import { StudioSettings } from '../types/studio';
import { translations, Language } from '../services/i18n';
import { DeviceManager, DeviceInfo, CodecSupport } from '../services/deviceManager';
import {
  Settings,
  Tv,
  Mic,
  Camera,
  Keyboard,
  Globe,
  HardDrive,
  Cpu,
  Check,
  Shield,
  Zap,
} from 'lucide-react';

interface SettingsViewProps {
  settings: StudioSettings;
  onUpdateSettings: (settings: Partial<StudioSettings>) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  language,
  onLanguageChange,
}) => {
  const t = translations[language];
  const deviceManager = DeviceManager.getInstance();

  const [cameras, setCameras] = useState<DeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<DeviceInfo[]>([]);
  const [codecs, setCodecs] = useState<CodecSupport[]>([]);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    deviceManager.getMediaDevices().then((res) => {
      setCameras(res.cameras);
      setMicrophones(res.microphones);
    });
    setCodecs(deviceManager.checkSupportedCodecs());
  }, [deviceManager]);

  const handleChange = (updates: Partial<StudioSettings>) => {
    onUpdateSettings(updates);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0e13] p-4 md:p-6 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1c212c] pb-4 mb-6">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-indigo-400" />
            <span>{t.settingsTitle}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Video encoder parameters · Audio capture constraints · Hotkey mappings · Language
          </p>
        </div>

        {savedToast && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-fade-in">
            <Check className="w-4 h-4" />
            <span>Settings Saved</span>
          </div>
        )}
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Section 1: Video & Encoding */}
        <div className="bg-[#12151e] border border-[#1e2330] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1c2230] pb-3">
            <Tv className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              {t.videoSettings}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Resolution */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Canvas Resolution</label>
              <select
                value={settings.resolution}
                onChange={(e: any) => handleChange({ resolution: e.target.value })}
                className="w-full bg-[#0d1017] border border-[#232a3c] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="720p">720p HD (1280 × 720) - Low CPU</option>
                <option value="1080p">1080p Full HD (1920 × 1080) - Recommended</option>
                <option value="1440p">1440p 2K QHD (2560 × 1440)</option>
                <option value="4k">4K Ultra HD (3840 × 2160) - High Performance</option>
              </select>
            </div>

            {/* Target FPS */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Target Frame Rate (FPS)</label>
              <select
                value={settings.targetFps}
                onChange={(e: any) => handleChange({ targetFps: parseInt(e.target.value) as any })}
                className="w-full bg-[#0d1017] border border-[#232a3c] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="24">24 FPS (Cinematic standard)</option>
                <option value="30">30 FPS (Standard broadcast)</option>
                <option value="60">60 FPS (Ultra Smooth Screen & Motion)</option>
              </select>
            </div>

            {/* Video Bitrate */}
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1.5">
                <span>Video Bitrate</span>
                <span className="font-mono text-indigo-400">{settings.videoBitrateMbps} Mbps</span>
              </div>
              <input
                type="range"
                min="3"
                max="25"
                step="1"
                value={settings.videoBitrateMbps}
                onChange={(e) => handleChange({ videoBitrateMbps: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 h-1.5 bg-[#0a0d13] rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Higher bitrates produce pristine image sharpness with larger output files.
              </span>
            </div>

            {/* Audio Bitrate */}
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1.5">
                <span>Audio Bitrate</span>
                <span className="font-mono text-purple-400">{settings.audioBitrateKbps} Kbps</span>
              </div>
              <input
                type="range"
                min="128"
                max="320"
                step="32"
                value={settings.audioBitrateKbps}
                onChange={(e) => handleChange({ audioBitrateKbps: parseInt(e.target.value) })}
                className="w-full accent-purple-500 h-1.5 bg-[#0a0d13] rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Opus stereo encoding at 48,000 Hz.
              </span>
            </div>
          </div>

          {/* Hardware Supported Codecs Matrix */}
          <div className="pt-3 border-t border-[#1b202c]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Detected Hardware Encoder Support
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
              {codecs.map((c) => (
                <div
                  key={c.mimeType}
                  className="flex items-center justify-between p-2 rounded bg-[#0c0e14] border border-[#1b202d]"
                >
                  <span className="text-slate-300 truncate mr-2">{c.notes}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.supported
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {c.supported ? 'HARDWARE READY' : 'UNAVAILABLE'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Audio & Connected Devices */}
        <div className="bg-[#12151e] border border-[#1e2330] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1c2230] pb-3">
            <Mic className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              {t.audioSettings}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Default Microphone</label>
              <select
                value={settings.defaultMicId}
                onChange={(e) => handleChange({ defaultMicId: e.target.value })}
                className="w-full bg-[#0d1017] border border-[#232a3c] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">System Default Audio Input</option>
                {microphones.map((m) => (
                  <option key={m.deviceId} value={m.deviceId}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Default Camera</label>
              <select
                value={settings.defaultCameraId}
                onChange={(e) => handleChange({ defaultCameraId: e.target.value })}
                className="w-full bg-[#0d1017] border border-[#232a3c] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">System Default Video Input</option>
                {cameras.map((c) => (
                  <option key={c.deviceId} value={c.deviceId}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Keyboard Shortcuts & Language */}
        <div className="bg-[#12151e] border border-[#1e2330] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1c2230] pb-3">
            <Keyboard className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              {t.hotkeys} & {t.language}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Language Selector */}
            <div>
              <label className="text-slate-300 font-semibold block mb-2">{t.language}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onLanguageChange('en')}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    language === 'en'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                      : 'bg-[#151923] border-[#222836] text-slate-400'
                  }`}
                >
                  <div className="text-xs">English</div>
                  <div className="text-[10px] text-slate-500">United States / Global</div>
                </button>
                <button
                  onClick={() => onLanguageChange('es')}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    language === 'es'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                      : 'bg-[#151923] border-[#222836] text-slate-400'
                  }`}
                >
                  <div className="text-xs">Español</div>
                  <div className="text-[10px] text-slate-500">Latinoamérica / España</div>
                </button>
              </div>
            </div>

            {/* Hotkeys Matrix */}
            <div>
              <label className="text-slate-300 font-semibold block mb-2">Shortcuts Reference</label>
              <div className="space-y-1.5 font-mono text-[11px] bg-[#0c0e14] p-3 rounded-xl border border-[#1b202c]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Start / Stop Record</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#1c2230] text-indigo-300">Space</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Toggle Mic Mute</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#1c2230] text-indigo-300">M</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Toggle Camera Overlay</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#1c2230] text-indigo-300">C</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Switch Scenes</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#1c2230] text-indigo-300">1 - 4</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
