import React, { useState, useEffect } from 'react';
import { StreamPlatformConfig, StreamStats, LiveChatMessage } from '../types/studio';
import { translations, Language } from '../services/i18n';
import { StreamingEngine } from '../services/streamingEngine';
import {
  Radio,
  Wifi,
  Key,
  Server,
  Plus,
  Trash2,
  Check,
  Eye,
  EyeOff,
  Activity,
  MessageSquare,
  Pin,
  Send,
  Sparkles,
  Layers,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';

interface StreamingViewProps {
  language: Language;
  isStreaming: boolean;
  streamingSeconds: number;
  onGoLive: () => void;
  onEndLive: () => void;
  onSendChatToOverlay?: (author: string, content: string) => void;
}

export const StreamingView: React.FC<StreamingViewProps> = ({
  language,
  isStreaming,
  streamingSeconds,
  onGoLive,
  onEndLive,
  onSendChatToOverlay,
}) => {
  const t = translations[language];
  const streamingEngine = StreamingEngine.getInstance();

  const [platforms, setPlatforms] = useState<StreamPlatformConfig[]>([]);
  const [stats, setStats] = useState<StreamStats>(streamingEngine.getStats());
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>(streamingEngine.getChatMessages());
  const [showKeys, setShowKeys] = useState<{ [id: string]: boolean }>({});

  // Chat input
  const [newChatAuthor, setNewChatAuthor] = useState('');
  const [newChatContent, setNewChatContent] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'youtube' | 'twitch' | 'kick' | 'facebook'>('youtube');

  // New platform form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addRtmp, setAddRtmp] = useState('');
  const [addKey, setAddKey] = useState('');

  useEffect(() => {
    setPlatforms(streamingEngine.getPlatforms());

    const unsubStats = streamingEngine.onStatsUpdate((newStats) => {
      setStats(newStats);
    });

    const unsubChat = streamingEngine.onChatUpdate((newMsgs) => {
      setChatMessages(newMsgs);
    });

    return () => {
      unsubStats();
      unsubChat();
    };
  }, [streamingEngine]);

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTogglePlatformConnected = (id: string, current: boolean) => {
    streamingEngine.updatePlatform(id, { connected: !current });
    setPlatforms(streamingEngine.getPlatforms());
  };

  const handleAddPlatform = () => {
    if (addName.trim() && addRtmp.trim()) {
      streamingEngine.addPlatform({
        platform: 'custom',
        name: addName.trim(),
        rtmpUrl: addRtmp.trim(),
        streamKey: addKey.trim() || 'stream_key_live',
        resolution: '1080p',
        fps: 60,
        bitrateKbps: 6000,
        connected: true,
        primary: false,
      });
      setPlatforms(streamingEngine.getPlatforms());
      setShowAddForm(false);
      setAddName('');
      setAddRtmp('');
      setAddKey('');
    }
  };

  const handleDeletePlatform = (id: string) => {
    streamingEngine.deletePlatform(id);
    setPlatforms(streamingEngine.getPlatforms());
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChatContent.trim()) {
      streamingEngine.addChatMessage(
        newChatAuthor.trim() || 'Live Viewer',
        newChatContent.trim(),
        selectedPlatform
      );
      setNewChatContent('');
    }
  };

  const handleSendToBroadcastOverlay = (msg: LiveChatMessage) => {
    if (onSendChatToOverlay) {
      onSendChatToOverlay(msg.author, msg.content);
    }
  };

  const formatTimer = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0e13] p-4 md:p-6 overflow-y-auto">
      {/* Header & Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1c212c] pb-4 mb-6">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-indigo-400" />
            <span>{t.streamConsole}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simultaneous multi-destination RTMP broadcast · Adaptive bitrate · Live chat overlay integration
          </p>
        </div>

        {/* Big Live Control Button */}
        <div>
          {!isStreaming ? (
            <button
              onClick={onGoLive}
              className="flex items-center gap-2.5 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
            >
              <Wifi className="w-4 h-4" />
              <span>{t.goLive}</span>
            </button>
          ) : (
            <button
              onClick={onEndLive}
              className="flex items-center gap-2.5 px-6 py-2.5 rounded-lg bg-[#2b1016] border border-rose-500/50 hover:bg-rose-950 text-rose-300 font-bold text-xs active:scale-95 transition-all"
            >
              <div className="w-3 h-3 rounded-xs bg-rose-500" />
              <span>{t.endLive}</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-time Broadcast Telemetry KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#12151d] border border-[#1e2330] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Stream Status</span>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
              }`}
            />
            <span className="text-sm font-bold text-white font-mono">
              {isStreaming ? `LIVE (${formatTimer(streamingSeconds)})` : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="bg-[#12151d] border border-[#1e2330] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Output Bitrate</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-base font-bold text-indigo-300 font-mono tabular-nums">
              {isStreaming ? stats.currentBitrateKbps : '0'}
            </span>
            <span className="text-xs text-slate-500 font-mono">Kbps</span>
          </div>
        </div>

        <div className="bg-[#12151d] border border-[#1e2330] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Upload Bandwidth</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-base font-bold text-emerald-400 font-mono tabular-nums">
              {isStreaming ? stats.uploadSpeedMbps : '0.00'}
            </span>
            <span className="text-xs text-slate-500 font-mono">Mbps</span>
          </div>
        </div>

        <div className="bg-[#12151d] border border-[#1e2330] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Dropped Frames</span>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-base font-bold text-slate-200 font-mono tabular-nums">
              {isStreaming ? stats.droppedFrames : '0'}
            </span>
            <span className="text-[11px] text-slate-500">
              ({isStreaming ? ((stats.droppedFrames / Math.max(1, streamingSeconds * 60)) * 100).toFixed(2) : 0}%)
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: RTMP Platform Configurations */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              <span>{t.streamPlatforms}</span>
            </h2>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151924] hover:bg-[#1e2332] text-xs font-semibold text-indigo-300 border border-[#232a3c] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addPlatform}</span>
            </button>
          </div>

          {/* Add Platform Form */}
          {showAddForm && (
            <div className="bg-[#141824] border border-[#232b3d] rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-white">Add Custom RTMP / RTMPS Endpoint</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Platform Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Kick Gaming / Restream"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="w-full bg-[#0d1017] border border-[#232a3a] rounded px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">RTMP Server Ingest URL</label>
                  <input
                    type="text"
                    placeholder="rtmps://ingest.service.com/app"
                    value={addRtmp}
                    onChange={(e) => setAddRtmp(e.target.value)}
                    className="w-full bg-[#0d1017] border border-[#232a3a] rounded px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                  />
                </div>
              </div>
              <div className="text-xs">
                <label className="text-slate-400 block mb-1">Stream Key</label>
                <input
                  type="password"
                  placeholder="Paste your secret stream key"
                  value={addKey}
                  onChange={(e) => setAddKey(e.target.value)}
                  className="w-full bg-[#0d1017] border border-[#232a3a] rounded px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded bg-[#181d2a] text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPlatform}
                  className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Save Platform
                </button>
              </div>
            </div>
          )}

          {/* Platform list */}
          <div className="space-y-3">
            {platforms.map((plat) => {
              const isKeyVisible = showKeys[plat.id] || false;
              return (
                <div
                  key={plat.id}
                  className={`bg-[#12151d] border rounded-xl p-4 space-y-3 transition-colors ${
                    plat.connected ? 'border-indigo-500/30' : 'border-[#1e2330]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          plat.connected ? 'bg-indigo-500' : 'bg-slate-600'
                        }`}
                      />
                      <span className="text-xs font-bold text-white">{plat.name}</span>
                      {plat.primary && (
                        <span className="text-[10px] text-indigo-400 font-semibold px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/40">
                          PRIMARY
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePlatformConnected(plat.id, plat.connected)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                          plat.connected
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                            : 'bg-[#181c26] text-slate-400 border border-[#222837]'
                        }`}
                      >
                        {plat.connected ? 'Active Ingest' : 'Disabled'}
                      </button>

                      {plat.platform === 'custom' && (
                        <button
                          onClick={() => handleDeletePlatform(plat.id)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* RTMP Server URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#0b0e14] p-3 rounded-lg border border-[#1b202c]">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5 font-semibold uppercase">
                        Ingest Server
                      </span>
                      <span className="font-mono text-slate-300 text-[11px] truncate block">
                        {plat.rtmpUrl}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5 font-semibold uppercase">
                        Stream Key
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-slate-300 text-[11px] truncate">
                          {isKeyVisible ? plat.streamKey : '••••••••••••••••••••'}
                        </span>
                        <button
                          onClick={() => toggleShowKey(plat.id)}
                          className="p-1 text-slate-500 hover:text-slate-300"
                        >
                          {isKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>Target: {plat.resolution}</span>
                    <span>·</span>
                    <span>{plat.fps} FPS</span>
                    <span>·</span>
                    <span>{plat.bitrateKbps} Kbps</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Chat & Audience Interaction Dock */}
        <div className="lg:col-span-5 flex flex-col bg-[#12151d] border border-[#1e2330] rounded-xl overflow-hidden h-[540px]">
          <div className="p-3.5 border-b border-[#1c2230] bg-[#0d0f15] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                {t.liveChat}
              </h2>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Real-time Ingest</span>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2.5 rounded-lg border text-xs transition-all group ${
                  msg.pinned
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : msg.highlighted
                    ? 'bg-indigo-950/20 border-indigo-500/30'
                    : 'bg-[#151923] border-[#1e2434]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: msg.avatarColor }}
                    />
                    <span className="font-bold text-white">{msg.author}</span>
                    <span className="text-[10px] text-slate-500 uppercase">({msg.platform})</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{msg.timestamp}</span>
                </div>

                <p className="text-slate-300 leading-relaxed">{msg.content}</p>

                {/* Send Comment to Studio Lower Third Button */}
                <div className="flex items-center justify-end gap-2 mt-2 pt-1.5 border-t border-[#1b202c]">
                  <button
                    onClick={() => streamingEngine.togglePinMessage(msg.id)}
                    className={`text-[11px] flex items-center gap-1 p-1 rounded hover:bg-[#1a1f2c] ${
                      msg.pinned ? 'text-amber-400 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    <Pin className="w-3 h-3" />
                    <span>{msg.pinned ? 'Pinned' : 'Pin'}</span>
                  </button>

                  <button
                    onClick={() => handleSendToBroadcastOverlay(msg)}
                    className="text-[11px] flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-semibold transition-colors"
                    title="Display viewer comment on live video overlay"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{t.sendToOverlay}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Chat Test Composer */}
          <form
            onSubmit={handleSendChatMessage}
            className="p-3 border-t border-[#1c2230] bg-[#0d0f15] space-y-2"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Username (optional)"
                value={newChatAuthor}
                onChange={(e) => setNewChatAuthor(e.target.value)}
                className="w-1/3 bg-[#141822] border border-[#212735] rounded px-2 py-1 text-xs text-white focus:outline-none"
              />
              <select
                value={selectedPlatform}
                onChange={(e: any) => setSelectedPlatform(e.target.value)}
                className="w-2/3 bg-[#141822] border border-[#212735] rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
              >
                <option value="youtube">YouTube Ingest</option>
                <option value="twitch">Twitch Ingest</option>
                <option value="kick">Kick Ingest</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Post mock audience comment..."
                value={newChatContent}
                onChange={(e) => setNewChatContent(e.target.value)}
                className="flex-1 bg-[#141822] border border-[#212735] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="p-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
