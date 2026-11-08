import { StreamPlatformConfig, StreamStats, LiveChatMessage } from '../types/studio';

export class StreamingEngine {
  private static instance: StreamingEngine;
  private isStreaming: boolean = false;
  private streamStartTime: number = 0;
  private timerInterval: number | null = null;
  private platforms: StreamPlatformConfig[] = [
    {
      id: 'plat_youtube',
      platform: 'youtube',
      name: 'YouTube Live',
      rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
      streamKey: '••••-••••-••••-••••',
      resolution: '1080p',
      fps: 60,
      bitrateKbps: 6000,
      connected: true,
      primary: true,
    },
    {
      id: 'plat_twitch',
      platform: 'twitch',
      name: 'Twitch',
      rtmpUrl: 'rtmp://live.twitch.tv/app',
      streamKey: 'live_user_••••••••••••••',
      resolution: '1080p',
      fps: 60,
      bitrateKbps: 6000,
      connected: false,
      primary: false,
    },
    {
      id: 'plat_kick',
      platform: 'kick',
      name: 'Kick Broadcast',
      rtmpUrl: 'rtmps://fa723fc1b171.global-contribute.live-video.net:443/app',
      streamKey: 'sk_us-west-••••••••',
      resolution: '1080p',
      fps: 60,
      bitrateKbps: 8000,
      connected: false,
      primary: false,
    },
    {
      id: 'plat_custom',
      platform: 'custom',
      name: 'Custom RTMP Server',
      rtmpUrl: 'rtmps://ingest.visioncast.live/live',
      streamKey: 'vc_stream_key_99',
      resolution: '1080p',
      fps: 60,
      bitrateKbps: 6000,
      connected: false,
      primary: false,
    },
  ];

  private currentStats: StreamStats = {
    isStreaming: false,
    durationSeconds: 0,
    currentBitrateKbps: 0,
    fps: 60,
    droppedFrames: 0,
    uploadSpeedMbps: 0,
    networkHealth: 'excellent',
  };

  private chatMessages: LiveChatMessage[] = [
    {
      id: 'chat_1',
      author: 'Alex Rivers',
      avatarColor: '#6366f1',
      platform: 'youtube',
      content: 'Audio sounds super crisp with the vocal compressor! What mic are you using?',
      timestamp: '14:50',
      highlighted: false,
      pinned: false,
    },
    {
      id: 'chat_2',
      author: 'Elena Rostova',
      avatarColor: '#ec4899',
      platform: 'twitch',
      content: 'The 60 FPS screen capture is butter smooth 👌',
      timestamp: '14:52',
      highlighted: true,
      pinned: false,
    },
    {
      id: 'chat_3',
      author: 'Marcus Chen',
      avatarColor: '#10b981',
      platform: 'kick',
      content: 'Can you show the presentation slide with the architecture diagram again?',
      timestamp: '14:53',
      highlighted: false,
      pinned: false,
    },
  ];

  private listeners: ((stats: StreamStats) => void)[] = [];
  private chatListeners: ((msgs: LiveChatMessage[]) => void)[] = [];

  private constructor() {}

  public static getInstance(): StreamingEngine {
    if (!StreamingEngine.instance) {
      StreamingEngine.instance = new StreamingEngine();
    }
    return StreamingEngine.instance;
  }

  public getPlatforms(): StreamPlatformConfig[] {
    return this.platforms;
  }

  public updatePlatform(id: string, updates: Partial<StreamPlatformConfig>): void {
    this.platforms = this.platforms.map(p => (p.id === id ? { ...p, ...updates } : p));
  }

  public addPlatform(config: Omit<StreamPlatformConfig, 'id'>): void {
    this.platforms.push({
      ...config,
      id: `plat_${Date.now()}`,
    });
  }

  public deletePlatform(id: string): void {
    this.platforms = this.platforms.filter(p => p.id !== id);
  }

  public onStatsUpdate(cb: (stats: StreamStats) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  public onChatUpdate(cb: (msgs: LiveChatMessage[]) => void): () => void {
    this.chatListeners.push(cb);
    return () => {
      this.chatListeners = this.chatListeners.filter(l => l !== cb);
    };
  }

  public getChatMessages(): LiveChatMessage[] {
    return this.chatMessages;
  }

  public togglePinMessage(id: string): void {
    this.chatMessages = this.chatMessages.map(m =>
      m.id === id ? { ...m, pinned: !m.pinned } : m
    );
    this.notifyChat();
  }

  public addChatMessage(author: string, content: string, platform: 'youtube' | 'twitch' | 'facebook' | 'kick' = 'youtube'): void {
    const newMsg: LiveChatMessage = {
      id: `chat_${Date.now()}`,
      author,
      avatarColor: '#8b5cf6',
      platform,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      highlighted: false,
      pinned: false,
    };
    this.chatMessages.push(newMsg);
    this.notifyChat();
  }

  private notifyChat(): void {
    this.chatListeners.forEach(l => l([...this.chatMessages]));
  }

  public startStreaming(): void {
    this.isStreaming = true;
    this.streamStartTime = Date.now();

    this.timerInterval = window.setInterval(() => {
      if (!this.isStreaming) return;
      const duration = Math.floor((Date.now() - this.streamStartTime) / 1000);

      // Realistic bitrate telemetry variations (+- 3%)
      const baseBitrate = 6000;
      const jitter = (Math.random() - 0.5) * 150;
      const currentBitrate = Math.round(baseBitrate + jitter);
      const uploadSpeed = Number((currentBitrate / 800).toFixed(2));

      this.currentStats = {
        isStreaming: true,
        durationSeconds: duration,
        currentBitrateKbps: currentBitrate,
        fps: 60,
        droppedFrames: Math.floor(duration * 0.02),
        uploadSpeedMbps: uploadSpeed,
        networkHealth: currentBitrate > 5500 ? 'excellent' : 'good',
      };

      this.listeners.forEach(l => l({ ...this.currentStats }));
    }, 1000);
  }

  public stopStreaming(): void {
    this.isStreaming = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.currentStats = {
      isStreaming: false,
      durationSeconds: 0,
      currentBitrateKbps: 0,
      fps: 60,
      droppedFrames: 0,
      uploadSpeedMbps: 0,
      networkHealth: 'excellent',
    };
    this.listeners.forEach(l => l({ ...this.currentStats }));
  }

  public getStats(): StreamStats {
    return this.currentStats;
  }
}
