import React from 'react';
import { translations, Language } from '../services/i18n';
import {
  Home,
  Tv,
  Film,
  Radio,
  Layers,
  FolderOpen,
  Settings,
  HelpCircle,
  HardDrive,
  Mic,
  Camera,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  language: Language;
  deviceCounts: { cameras: number; mics: number };
  storageQuota: { usedBytes: number; quotaBytes: number; percentage: number };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  language,
  deviceCounts,
  storageQuota,
}) => {
  const t = translations[language];

  const navItems = [
    { id: 'home', label: t.navHome, icon: Home },
    { id: 'studio', label: t.navStudio, icon: Tv },
    { id: 'recordings', label: t.navRecordings, icon: Film },
    { id: 'streaming', label: t.navStreaming, icon: Radio },
    { id: 'scenes', label: t.navScenes, icon: Layers },
    { id: 'media', label: t.navMedia, icon: FolderOpen },
    { id: 'settings', label: t.navSettings, icon: Settings },
    { id: 'help', label: t.navHelp, icon: HelpCircle },
  ];

  const formatStorage = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) return `${Math.round(mb)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  return (
    <aside className="hidden md:flex w-60 bg-[#0e1015] border-r border-[#1e222a] flex-col justify-between select-none shrink-0 z-20">
      {/* Navigation list */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Studio Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#151820]'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom hardware & storage status */}
      <div className="p-3 border-t border-[#1a1e27] space-y-3 bg-[#0a0c10]/50">
        {/* Device Summary */}
        <div className="px-2">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Connected Devices
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 rounded bg-[#13161e] border border-[#1d222e]">
              <Camera className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <div className="truncate">
                <span className="font-mono text-slate-200 font-semibold">{deviceCounts.cameras}</span>
                <span className="text-[10px] text-slate-400 ml-1">Video</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-[#13161e] border border-[#1d222e]">
              <Mic className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <div className="truncate">
                <span className="font-mono text-slate-200 font-semibold">{deviceCounts.mics}</span>
                <span className="text-[10px] text-slate-400 ml-1">Audio</span>
              </div>
            </div>
          </div>
        </div>

        {/* Local storage quota gauge */}
        <div className="px-2 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3 h-3 text-slate-400" />
              <span>Storage</span>
            </span>
            <span className="font-mono tabular-nums text-slate-300">
              {formatStorage(storageQuota.usedBytes)} / {formatStorage(storageQuota.quotaBytes)}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#1b1f2b] overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                storageQuota.percentage > 85 ? 'bg-rose-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.max(2, storageQuota.percentage)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">
            Direct streaming to disk. Unlimited duration.
          </p>
        </div>
      </div>
    </aside>
  );
};
