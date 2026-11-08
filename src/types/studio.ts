export type StudioMode = 'screen-camera' | 'screen-only' | 'camera-only' | 'presenter';

export type CameraShape = 'circle' | 'rectangle' | 'squircle';
export type CameraPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom';

export interface FloatingCameraConfig {
  enabled: boolean;
  shape: CameraShape;
  size: number; // width in px or %
  aspectRatio: number; // usually 16/9 or 1
  x: number; // percentage or px
  y: number;
  opacity: number; // 0 to 1
  borderWidth: number;
  borderColor: string;
  shadow: boolean;
  mirror: boolean;
  zoom: number; // 1 to 2
  facingMode: 'user' | 'environment';
  deviceId: string;
}

export type OverlayType = 'lower-third' | 'text' | 'logo' | 'link' | 'timer' | 'social';

export interface OverlayElement {
  id: string;
  type: OverlayType;
  title: string;
  subtitle?: string;
  content?: string;
  url?: string;
  x: number; // 0 - 100%
  y: number; // 0 - 100%
  width?: number;
  height?: number;
  fontFamily: string;
  fontSize: number; // in px on 1080p canvas
  textColor: string;
  backgroundColor: string;
  accentColor: string;
  opacity: number;
  visible: boolean;
  animation: 'none' | 'fade' | 'slide-up' | 'slide-in-left';
  durationSeconds?: number;
}

export interface AudioChannelState {
  id: string;
  name: string;
  type: 'mic' | 'system' | 'media';
  volume: number; // 0 to 1
  muted: boolean;
  gain: number; // 0 to 2
  pan: number; // -1 (L) to +1 (R)
  highPassEnabled: boolean;
  compressorEnabled: boolean;
  noiseGateEnabled: boolean;
  levelRms: number; // 0 to 1
  levelPeak: number; // 0 to 1
  clipping: boolean;
}

export type SceneTransition = 'cut' | 'fade' | 'slide';

export interface SceneConfig {
  id: string;
  name: string;
  mode: StudioMode;
  description: string;
  iconName: string;
  cameraConfig: Partial<FloatingCameraConfig>;
  overlays: OverlayElement[];
  active: boolean;
}

export interface StreamPlatformConfig {
  id: string;
  platform: 'youtube' | 'twitch' | 'facebook' | 'kick' | 'custom';
  name: string;
  rtmpUrl: string;
  streamKey: string;
  resolution: string;
  fps: number;
  bitrateKbps: number;
  connected: boolean;
  primary: boolean;
}

export interface StreamStats {
  isStreaming: boolean;
  durationSeconds: number;
  currentBitrateKbps: number;
  fps: number;
  droppedFrames: number;
  uploadSpeedMbps: number;
  networkHealth: 'excellent' | 'good' | 'poor' | 'critical';
}

export interface LiveChatMessage {
  id: string;
  author: string;
  avatarColor: string;
  platform: 'youtube' | 'twitch' | 'facebook' | 'kick';
  content: string;
  timestamp: string;
  highlighted: boolean;
  pinned: boolean;
}

export interface VideoRecording {
  id: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
  duration: number; // seconds
  sizeBytes: number;
  resolution: string; // e.g. "1920x1080"
  fps: number;
  mimeType: string;
  blobUrl?: string;
  thumbnailUrl?: string;
  favorite: boolean;
  folder?: string;
}

export interface StudioSettings {
  language: 'en' | 'es';
  resolution: '1080p' | '720p' | '1440p' | '4k';
  targetFps: 24 | 30 | 60;
  videoBitrateMbps: number;
  audioBitrateKbps: number;
  codec: 'vp9' | 'vp8' | 'h264' | 'av1';
  format: 'webm' | 'mp4';
  defaultMicId: string;
  defaultCameraId: string;
  autoSaveChunks: boolean;
  countdownSeconds: number;
  hardwareAcceleration: boolean;
  storageAlertThresholdMb: number;
}
