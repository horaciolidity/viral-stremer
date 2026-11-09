import React, { useState, useEffect } from 'react';
import { translations, Language } from '../services/i18n';
import { Radio, Video, Disc, Wifi, Globe, Download, Check, Shield } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface TopNavProps {
  currentTab: string;
  isRecording: boolean;
  isStreaming: boolean;
  recordingSeconds: number;
  streamingSeconds: number;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onGoLive: () => void;
  onEndLive: () => void;
  onNavigate: (tab: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  isRecording,
  isStreaming,
  recordingSeconds,
  streamingSeconds,
  language,
  onLanguageChange,
  onStartRecord,
  onStopRecord,
  onGoLive,
  onEndLive,
  onNavigate,
}) => {
  const t = translations[language];
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [storageMb, setStorageMb] = useState<number>(0);

  useEffect(() => {
    // Check if running in standalone
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(standalone);

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Storage estimate
    StorageService.getInstance().getStorageQuota().then((q) => {
      setStorageMb(Math.round(q.usedBytes / (1024 * 1024)));
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      alert(language === 'es'
        ? 'Para instalar en tu dispositivo, abre el menú del navegador y selecciona "Instalar aplicación" o "Añadir a pantalla de inicio".'
        : 'To install on this device, open your browser menu and choose "Install App" or "Add to Home Screen".');
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${s}`;
  };

  return (
    <header className="h-14 border-b border-[#1f242e] bg-[#0f1217] px-4 md:px-6 flex items-center justify-between gap-4 select-none z-30 shrink-0">
      {/* Zone 1: Brand title & real active indicators */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors whitespace-nowrap">
            VISIONCAST <span className="text-indigo-400 font-semibold hidden sm:inline">STUDIO</span>
          </span>
        </button>

        {/* Real Live Session Badges */}
        {isRecording && (
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] sm:text-xs font-mono tabular-nums">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-semibold hidden sm:inline">{t.recording}</span>
            <span>{formatTimer(recordingSeconds)}</span>
          </div>
        )}

        {isStreaming && (
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] sm:text-xs font-mono tabular-nums">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold hidden sm:inline">{t.streaming}</span>
            <span>{formatTimer(streamingSeconds)}</span>
          </div>
        )}
      </div>

      {/* Zone 2: Navigation Links (Clean single-line prose, anti-slop) */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={() => onNavigate('home')}
          className={`transition-colors whitespace-nowrap hover:text-white ${currentTab === 'home' ? 'text-indigo-400 font-semibold' : ''}`}
        >
          {t.navHome}
        </button>
        <button
          onClick={() => onNavigate('studio')}
          className={`transition-colors whitespace-nowrap hover:text-white ${currentTab === 'studio' ? 'text-indigo-400 font-semibold' : ''}`}
        >
          {t.navStudio}
        </button>
        <button
          onClick={() => onNavigate('recordings')}
          className={`transition-colors whitespace-nowrap hover:text-white ${currentTab === 'recordings' ? 'text-indigo-400 font-semibold' : ''}`}
        >
          {t.navRecordings}
        </button>
        <button
          onClick={() => onNavigate('streaming')}
          className={`transition-colors whitespace-nowrap hover:text-white ${currentTab === 'streaming' ? 'text-indigo-400 font-semibold' : ''}`}
        >
          {t.navStreaming}
        </button>
        <button
          onClick={() => onNavigate('scenes')}
          className={`transition-colors whitespace-nowrap hover:text-white ${currentTab === 'scenes' ? 'text-indigo-400 font-semibold' : ''}`}
        >
          {t.navScenes}
        </button>
        <button
          onClick={() => onNavigate('help')}
          className={`transition-colors whitespace-nowrap hover:text-white ${currentTab === 'help' ? 'text-indigo-400 font-semibold' : ''}`}
        >
          {t.navHelp}
        </button>
      </nav>

      {/* Zone 3: Primary action cluster & utilities */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Language selector */}
        <button
          onClick={() => onLanguageChange(language === 'en' ? 'es' : 'en')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#161a22] hover:bg-[#1f242e] border border-[#232936] rounded-md transition-colors"
          title="Switch Language (English / Español)"
        >
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono uppercase">{language}</span>
        </button>

        {/* PWA Install */}
        {!isInstalled && (
          <button
            onClick={handleInstallPWA}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#161a22] hover:bg-[#1f242e] border border-[#232936] rounded-md transition-colors"
            title="Install VisionCast Studio as Desktop/Mobile Native App"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span className="whitespace-nowrap">Install App</span>
          </button>
        )}

        {/* Primary Studio Action: Record button */}
        {!isRecording ? (
          <button
            onClick={onStartRecord}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 active:scale-95 transition-all whitespace-nowrap"
          >
            <Disc className="w-3.5 h-3.5 animate-pulse" />
            <span>{t.startRecord}</span>
          </button>
        ) : (
          <button
            onClick={onStopRecord}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#251016] border border-rose-500/40 text-rose-400 hover:bg-rose-950/60 text-xs font-semibold active:scale-95 transition-all whitespace-nowrap"
          >
            <div className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
            <span>{t.stopRecord}</span>
          </button>
        )}

        {/* Primary Streaming Action */}
        {!isStreaming ? (
          <button
            onClick={onGoLive}
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 active:scale-95 transition-all whitespace-nowrap"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>{t.goLive}</span>
          </button>
        ) : (
          <button
            onClick={onEndLive}
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#18231e] border border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/60 text-xs font-semibold active:scale-95 transition-all whitespace-nowrap"
          >
            <div className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
            <span>{t.endLive}</span>
          </button>
        )}
      </div>
    </header>
  );
};
