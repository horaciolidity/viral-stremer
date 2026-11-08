import React, { useState, useEffect } from 'react';
import { translations, Language } from '../services/i18n';
import { AudioEngine } from '../services/audioEngine';
import {
  Mic,
  Volume2,
  VolumeX,
  Sliders,
  Activity,
  AudioLines,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface AudioMixerProps {
  language: Language;
}

export const AudioMixer: React.FC<AudioMixerProps> = ({ language }) => {
  const t = translations[language];
  const audioEngine = AudioEngine.getInstance();

  // Channels state
  const [micVol, setMicVol] = useState(1.0);
  const [micMuted, setMicMuted] = useState(false);
  const [micGain, setMicGain] = useState(1.0);
  const [micPan, setMicPan] = useState(0);
  const [highPass, setHighPass] = useState(true);
  const [compressor, setCompressor] = useState(true);

  const [sysVol, setSysVol] = useState(1.0);
  const [sysMuted, setSysMuted] = useState(false);
  const [sysPan, setSysPan] = useState(0);

  // Meter levels (0 to 1)
  const [micRms, setMicRms] = useState(0);
  const [micPeak, setMicPeak] = useState(0);
  const [micClipping, setMicClipping] = useState(false);

  const [sysRms, setSysRms] = useState(0);
  const [sysPeak, setSysPeak] = useState(0);
  const [sysClipping, setSysClipping] = useState(false);

  useEffect(() => {
    let animId: number;
    const pollLevels = () => {
      const levels = audioEngine.getLevels();
      setMicRms(levels.mic.rms);
      setMicPeak(levels.mic.peak);
      setMicClipping(levels.mic.clipping);

      setSysRms(levels.system.rms);
      setSysPeak(levels.system.peak);
      setSysClipping(levels.system.clipping);

      animId = requestAnimationFrame(pollLevels);
    };

    animId = requestAnimationFrame(pollLevels);
    return () => cancelAnimationFrame(animId);
  }, [audioEngine]);

  const handleMicVolChange = (val: number) => {
    setMicVol(val);
    audioEngine.setChannelVolume('mic', val * micGain);
  };

  const handleMicGainChange = (val: number) => {
    setMicGain(val);
    audioEngine.setChannelVolume('mic', micVol * val);
  };

  const handleMicMuteToggle = () => {
    const next = !micMuted;
    setMicMuted(next);
    audioEngine.setChannelMute('mic', next);
  };

  const handleMicPanChange = (val: number) => {
    setMicPan(val);
    audioEngine.setChannelPan('mic', val);
  };

  const handleHighPassToggle = () => {
    const next = !highPass;
    setHighPass(next);
    audioEngine.toggleHighPass(next);
  };

  const handleCompressorToggle = () => {
    const next = !compressor;
    setCompressor(next);
    audioEngine.toggleCompressor(next);
  };

  const handleSysVolChange = (val: number) => {
    setSysVol(val);
    audioEngine.setChannelVolume('system', val);
  };

  const handleSysMuteToggle = () => {
    const next = !sysMuted;
    setSysMuted(next);
    audioEngine.setChannelMute('system', next);
  };

  const handleSysPanChange = (val: number) => {
    setSysPan(val);
    audioEngine.setChannelPan('system', val);
  };

  const computeMeterDb = (linear: number) => {
    if (linear <= 0.001) return -60;
    const db = Math.round(20 * Math.log10(linear));
    return Math.max(-60, Math.min(0, db));
  };

  return (
    <div className="bg-[#101319] border border-[#1e232f] rounded-xl p-4 flex flex-col gap-4 text-slate-200">
      <div className="flex items-center justify-between border-b border-[#1b202b] pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {t.audioMixer}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
          <span>48kHz · 24-bit PCM</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Channel 1: Microphone */}
        <div className="bg-[#141822] border border-[#1f2635] rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold">{t.micSource}</span>
            </div>
            <button
              onClick={handleMicMuteToggle}
              className={`p-1.5 rounded transition-colors ${
                micMuted ? 'bg-rose-500/20 text-rose-400' : 'bg-[#1b212f] text-slate-300 hover:text-white'
              }`}
              title={micMuted ? t.unmute : t.mute}
            >
              {micMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Real Peak / RMS VU Meter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>{computeMeterDb(micRms)} dB</span>
              {micClipping && (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> CLIP
                </span>
              )}
            </div>
            <div className="w-full h-3 bg-[#0a0d13] rounded overflow-hidden flex p-0.5 gap-0.5 border border-[#1e2534]">
              {/* Green nominal section */}
              <div
                className="h-full bg-emerald-500 rounded-xs transition-all duration-75"
                style={{ width: `${Math.min(70, micRms * 100)}%` }}
              />
              {/* Yellow warning section */}
              <div
                className="h-full bg-amber-400 rounded-xs transition-all duration-75"
                style={{
                  width: `${micRms > 0.7 ? Math.min(20, (micRms - 0.7) * 100 * 3.3) : 0}%`,
                }}
              />
              {/* Red clipping section */}
              <div
                className="h-full bg-rose-500 rounded-xs transition-all duration-75"
                style={{
                  width: `${micRms > 0.9 ? Math.min(10, (micRms - 0.9) * 100 * 10) : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Fader & Gain Sliders */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{t.volume}</span>
              <span className="font-mono text-slate-300">{Math.round(micVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.01"
              value={micVol}
              onChange={(e) => handleMicVolChange(parseFloat(e.target.value))}
              className="w-full accent-purple-500 h-1.5 bg-[#0b0e14] rounded-lg cursor-pointer"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">{t.pan}</span>
              <span className="font-mono text-slate-300">
                {micPan === 0 ? 'Center' : micPan < 0 ? `L${Math.abs(Math.round(micPan * 100))}%` : `R${Math.round(micPan * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={micPan}
              onChange={(e) => handleMicPanChange(parseFloat(e.target.value))}
              className="w-full accent-indigo-400 h-1 bg-[#0b0e14] rounded cursor-pointer"
            />
          </div>

          {/* DSP Filters (High-pass + Vocal Compressor) */}
          <div className="pt-2 border-t border-[#1d2331] flex flex-wrap gap-2 text-[11px]">
            <button
              onClick={handleHighPassToggle}
              className={`px-2.5 py-1 rounded border transition-colors ${
                highPass
                  ? 'bg-purple-950/60 border-purple-500/40 text-purple-300 font-semibold'
                  : 'bg-[#181d28] border-[#242b3b] text-slate-400'
              }`}
            >
              HPF 80Hz
            </button>
            <button
              onClick={handleCompressorToggle}
              className={`px-2.5 py-1 rounded border transition-colors ${
                compressor
                  ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300 font-semibold'
                  : 'bg-[#181d28] border-[#242b3b] text-slate-400'
              }`}
            >
              Vocal Comp
            </button>
          </div>
        </div>

        {/* Channel 2: System Audio */}
        <div className="bg-[#141822] border border-[#1f2635] rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold">{t.systemSource}</span>
            </div>
            <button
              onClick={handleSysMuteToggle}
              className={`p-1.5 rounded transition-colors ${
                sysMuted ? 'bg-rose-500/20 text-rose-400' : 'bg-[#1b212f] text-slate-300 hover:text-white'
              }`}
              title={sysMuted ? t.unmute : t.mute}
            >
              {sysMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* VU Meter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>{computeMeterDb(sysRms)} dB</span>
              {sysClipping && (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> CLIP
                </span>
              )}
            </div>
            <div className="w-full h-3 bg-[#0a0d13] rounded overflow-hidden flex p-0.5 gap-0.5 border border-[#1e2534]">
              <div
                className="h-full bg-indigo-500 rounded-xs transition-all duration-75"
                style={{ width: `${Math.min(70, sysRms * 100)}%` }}
              />
              <div
                className="h-full bg-amber-400 rounded-xs transition-all duration-75"
                style={{
                  width: `${sysRms > 0.7 ? Math.min(20, (sysRms - 0.7) * 100 * 3.3) : 0}%`,
                }}
              />
              <div
                className="h-full bg-rose-500 rounded-xs transition-all duration-75"
                style={{
                  width: `${sysRms > 0.9 ? Math.min(10, (sysRms - 0.9) * 100 * 10) : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Fader & Pan */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{t.volume}</span>
              <span className="font-mono text-slate-300">{Math.round(sysVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.01"
              value={sysVol}
              onChange={(e) => handleSysVolChange(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-[#0b0e14] rounded-lg cursor-pointer"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">{t.pan}</span>
              <span className="font-mono text-slate-300">
                {sysPan === 0 ? 'Center' : sysPan < 0 ? `L${Math.abs(Math.round(sysPan * 100))}%` : `R${Math.round(sysPan * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={sysPan}
              onChange={(e) => handleSysPanChange(parseFloat(e.target.value))}
              className="w-full accent-indigo-400 h-1 bg-[#0b0e14] rounded cursor-pointer"
            />
          </div>

          <div className="pt-2 border-t border-[#1d2331] text-[11px] text-slate-400">
            <span>Direct OS desktop sound stream</span>
          </div>
        </div>
      </div>
    </div>
  );
};
