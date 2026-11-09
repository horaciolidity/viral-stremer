import React, { useState } from 'react';
import { translations, Language } from '../services/i18n';
import {
  Tv,
  Film,
  Radio,
  Menu,
  X,
  Home,
  Layers,
  FolderOpen,
  Settings,
  HelpCircle,
  Globe,
  Download,
  Disc,
  HardDrive,
  Camera,
  Mic,
} from 'lucide-react';

interface MobileNavBarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isRecording: boolean;
  onStartRecord: () => void;
  onStopRecord: () => void;
  recordingSeconds: number;
  storageQuota: { usedBytes: number; quotaBytes: number; percentage: number };
  deviceCounts: { cameras: number; mics: number };
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  currentTab,
  onNavigate,
  language,
  onLanguageChange,
  isRecording,
  onStartRecord,
  onStopRecord,
  recordingSeconds,
  storageQuota,
  deviceCounts,
}) => {
  const t = translations[language];
  const [showDrawer, setShowDrawer] = useState(false);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${s}`;
  };

  const handleSelectTab = (tab: string) => {
    onNavigate(tab);
    setShowDrawer(false);
  };

  return (
    <>
      {/* 1. Mobile Bottom Sheet / Action Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setShowDrawer(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative bg-[#11141c] border-t border-[#232a3c] rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto z-10 space-y-4 animate-slide-up">
            {/* Grab Handle */}
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto" />

            <div className="flex items-center justify-between border-b border-[#1f2638] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  VisionCast Studio Menu
                </span>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="p-1.5 rounded-full bg-[#1b202e] text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleSelectTab('home')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${
                  currentTab === 'home'
                    ? 'bg-indigo-600 border-indigo-500 text-white font-semibold'
                    : 'bg-[#161a25] border-[#22293b] text-slate-300'
                }`}
              >
                <Home className="w-4 h-4 text-indigo-400" />
                <span>{t.navHome}</span>
              </button>

              <button
                onClick={() => handleSelectTab('scenes')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${
                  currentTab === 'scenes'
                    ? 'bg-indigo-600 border-indigo-500 text-white font-semibold'
                    : 'bg-[#161a25] border-[#22293b] text-slate-300'
                }`}
              >
                <Layers className="w-4 h-4 text-purple-400" />
                <span>{t.navScenes}</span>
              </button>

              <button
                onClick={() => handleSelectTab('media')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${
                  currentTab === 'media'
                    ? 'bg-indigo-600 border-indigo-500 text-white font-semibold'
                    : 'bg-[#161a25] border-[#22293b] text-slate-300'
                }`}
              >
                <FolderOpen className="w-4 h-4 text-emerald-400" />
                <span>{t.navMedia}</span>
              </button>

              <button
                onClick={() => handleSelectTab('settings')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${
                  currentTab === 'settings'
                    ? 'bg-indigo-600 border-indigo-500 text-white font-semibold'
                    : 'bg-[#161a25] border-[#22293b] text-slate-300'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>{t.navSettings}</span>
              </button>

              <button
                onClick={() => handleSelectTab('help')}
                className={`col-span-2 flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${
                  currentTab === 'help'
                    ? 'bg-indigo-600 border-indigo-500 text-white font-semibold'
                    : 'bg-[#161a25] border-[#22293b] text-slate-300'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-sky-400" />
                <span>{t.navHelp} & Diagnóstico</span>
              </button>
            </div>

            {/* Quick Language Switcher */}
            <div className="pt-2 border-t border-[#1f2638] flex items-center justify-between">
              <span className="text-xs text-slate-400">{t.language}</span>
              <div className="flex items-center gap-1.5 bg-[#171c29] p-1 rounded-lg border border-[#232b3c]">
                <button
                  onClick={() => onLanguageChange('en')}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    language === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => onLanguageChange('es')}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    language === 'es' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Español
                </button>
              </div>
            </div>

            {/* Device and Storage summary for mobile */}
            <div className="bg-[#0b0e14] p-3 rounded-xl border border-[#1d2332] text-[11px] text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{deviceCounts.cameras} Cam</span>
                </span>
                <span className="flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5 text-purple-400" />
                  <span>{deviceCounts.mics} Mic</span>
                </span>
              </div>
              <span className="font-mono text-slate-300">
                {Math.round(storageQuota.usedBytes / (1024 * 1024))} MB
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Fixed Mobile Bottom Navigation Bar (Thumb Zone) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d0f15]/95 backdrop-blur-md border-t border-[#1e2330] flex md:hidden items-center justify-around h-16 px-1 safe-area-pb select-none"
      >
        {/* Studio Tab */}
        <button
          onClick={() => onNavigate('studio')}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center transition-colors ${
            currentTab === 'studio' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tv className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-semibold tracking-tight">{t.navStudio}</span>
        </button>

        {/* Recordings Tab */}
        <button
          onClick={() => onNavigate('recordings')}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center transition-colors ${
            currentTab === 'recordings' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Film className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-semibold tracking-tight">{t.navRecordings}</span>
        </button>

        {/* Center Primary Action: Quick Mobile Record Button */}
        <div className="flex-1 flex items-center justify-center -mt-4">
          {!isRecording ? (
            <button
              onClick={onStartRecord}
              className="w-13 h-13 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 active:scale-95 transition-transform border-2 border-[#0d0f15]"
              title={t.startRecord}
              aria-label={t.startRecord}
            >
              <Disc className="w-6 h-6 animate-pulse" />
            </button>
          ) : (
            <button
              onClick={onStopRecord}
              className="w-13 h-13 rounded-full bg-[#2a1016] border-2 border-rose-500 text-rose-400 flex flex-col items-center justify-center shadow-lg shadow-rose-600/30 active:scale-95 transition-transform"
              title={t.stopRecord}
              aria-label={t.stopRecord}
            >
              <div className="w-4 h-4 rounded-xs bg-rose-500 mb-0.5" />
              <span className="text-[9px] font-mono font-bold">{formatTimer(recordingSeconds)}</span>
            </button>
          )}
        </div>

        {/* Live Streaming Tab */}
        <button
          onClick={() => onNavigate('streaming')}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center transition-colors ${
            currentTab === 'streaming' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-semibold tracking-tight">{t.navStreaming}</span>
        </button>

        {/* More Menu Drawer Trigger */}
        <button
          onClick={() => setShowDrawer(true)}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center transition-colors ${
            showDrawer || ['home', 'scenes', 'media', 'settings', 'help'].includes(currentTab)
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-semibold tracking-tight">Más</span>
        </button>
      </nav>
    </>
  );
};
