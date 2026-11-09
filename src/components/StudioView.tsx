import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  StudioMode,
  FloatingCameraConfig,
  OverlayElement,
  SceneConfig,
  SceneTransition,
  StudioSettings,
} from '../types/studio';
import { translations, Language } from '../services/i18n';
import { CompositorEngine } from '../services/compositorEngine';
import { DeviceManager } from '../services/deviceManager';
import { AudioEngine } from '../services/audioEngine';
import { RecordingEngine } from '../services/recordingEngine';
import { StreamingEngine } from '../services/streamingEngine';
import { FloatingCamera } from './FloatingCamera';
import { AudioMixer } from './AudioMixer';
import { OverlayEditor } from './OverlayEditor';
import { SceneManager } from './SceneManager';
import {
  Tv,
  Monitor,
  Camera,
  Mic,
  MicOff,
  Disc,
  Radio,
  Sliders,
  Layers,
  Pause,
  Play,
  Maximize2,
  Camera as CameraIcon,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Presentation,
  Volume2,
  Smartphone,
  X,
  Sparkles,
} from 'lucide-react';

interface StudioViewProps {
  language: Language;
  settings: StudioSettings;
  isRecording: boolean;
  isPaused: boolean;
  isStreaming: boolean;
  recordingSeconds: number;
  streamingSeconds: number;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onPauseRecord: () => void;
  onResumeRecord: () => void;
  onGoLive: () => void;
  onEndLive: () => void;
  onRecordingSaved: () => void;
  onNavigate?: (tab: string) => void;
}

export const StudioView: React.FC<StudioViewProps> = ({
  language,
  settings,
  isRecording,
  isPaused,
  isStreaming,
  recordingSeconds,
  streamingSeconds,
  onStartRecord,
  onStopRecord,
  onPauseRecord,
  onResumeRecord,
  onGoLive,
  onEndLive,
  onRecordingSaved,
  onNavigate,
}) => {
  const t = translations[language];

  // Detect mobile device
  const isMobile = typeof navigator !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (typeof window !== 'undefined' && window.innerWidth < 768)
  );

  // DOM Elements
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);

  // Engines
  const [compositor, setCompositor] = useState<CompositorEngine | null>(null);
  const deviceManager = DeviceManager.getInstance();
  const audioEngine = AudioEngine.getInstance();

  // Mode & Configuration: On mobile smartphones, default to camera-only so user gets instant working video
  const [mode, setMode] = useState<StudioMode>(() => {
    if (typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      return 'camera-only';
    }
    return 'screen-camera';
  });
  const [showMobileScreenModal, setShowMobileScreenModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'overlays' | 'audio' | 'scenes'>('camera');
  const [activeSceneId, setActiveSceneId] = useState<string>('scene_default');
  const [transition, setTransition] = useState<SceneTransition>('cut');

  // Streams status
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [hasMic, setHasMic] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Floating Camera config
  const [cameraConfig, setCameraConfig] = useState<FloatingCameraConfig>({
    enabled: true,
    shape: 'circle',
    size: 280,
    aspectRatio: 1,
    x: 82,
    y: 72,
    opacity: 1,
    borderWidth: 4,
    borderColor: '#6366f1',
    shadow: true,
    mirror: true,
    zoom: 1,
    facingMode: 'user',
    deviceId: '',
  });

  // Overlays
  const [overlays, setOverlays] = useState<OverlayElement[]>([
    {
      id: 'ov_default_l3',
      type: 'lower-third',
      title: 'VisionCast Presenter',
      subtitle: 'Professional Broadcast Production',
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
      id: 'ov_default_watermark',
      type: 'logo',
      title: 'VISIONCAST LIVE',
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
  ]);

  // Production Scenes
  const [scenes, setScenes] = useState<SceneConfig[]>([
    {
      id: 'scene_default',
      name: 'Screen + Camera',
      mode: 'screen-camera',
      description: 'Primary capture: Full desktop display with circular facecam overlay',
      iconName: 'Tv',
      cameraConfig: { enabled: true, shape: 'circle', x: 82, y: 72 },
      overlays: [],
      active: true,
    },
    {
      id: 'scene_camera_full',
      name: 'Full Camera Intro',
      mode: 'camera-only',
      description: 'Full-screen presenter monologue or video intro',
      iconName: 'Camera',
      cameraConfig: { enabled: true, zoom: 1.0 },
      overlays: [],
      active: false,
    },
    {
      id: 'scene_screen_clean',
      name: 'Clean Screen',
      mode: 'screen-only',
      description: 'Uncluttered screen capture without camera overlay',
      iconName: 'Monitor',
      cameraConfig: { enabled: false },
      overlays: [],
      active: false,
    },
    {
      id: 'scene_presenter',
      name: 'Presenter Mode',
      mode: 'presenter',
      description: 'Screen with rectangular camera and animated lower third',
      iconName: 'Presentation',
      cameraConfig: { enabled: true, shape: 'rectangle', x: 80, y: 70, size: 340 },
      overlays: [],
      active: false,
    },
  ]);

  // Initialize Compositor
  useEffect(() => {
    const comp = new CompositorEngine(settings.targetFps, 1920, 1080);
    setCompositor(comp);

    // Initialize Hidden video elements for video feeds
    const sVid = document.createElement('video');
    sVid.autoplay = true;
    sVid.playsInline = true;
    sVid.muted = true;
    screenVideoRef.current = sVid;
    comp.setScreenVideo(sVid);

    const cVid = document.createElement('video');
    cVid.autoplay = true;
    cVid.playsInline = true;
    cVid.muted = true;
    cameraVideoRef.current = cVid;
    comp.setCameraVideo(cVid);

    comp.startRenderLoop();

    return () => {
      comp.stopRenderLoop();
    };
  }, [settings.targetFps]);

  // Connect Compositor Canvas to view
  useEffect(() => {
    if (!compositor || !containerRef.current) return;
    const canvas = compositor.getCanvas();
    canvas.className = 'w-full h-full object-contain select-none';
    canvasRef.current = canvas;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(canvas);
  }, [compositor]);

  // Sync mode & overlays to compositor
  useEffect(() => {
    if (compositor) {
      compositor.setMode(mode);
      compositor.setCameraConfig(cameraConfig);
      compositor.setOverlays(overlays);
    }
  }, [compositor, mode, cameraConfig, overlays]);

  // Request Hardware Streams
  const startCamera = useCallback(async () => {
    try {
      setStatusMessage('Requesting camera stream...');
      const stream = await deviceManager.requestCameraStream(
        cameraConfig.deviceId,
        cameraConfig.facingMode,
        settings.targetFps
      );
      setCameraStream(stream);
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play();
      }
      setStatusMessage('Camera stream active');
    } catch (err: any) {
      console.warn('Camera request error:', err);
      setStatusMessage('Camera access denied or unavailable.');
    }
  }, [deviceManager, cameraConfig.deviceId, cameraConfig.facingMode, settings.targetFps]);

  const startScreen = useCallback(async () => {
    // Check if getDisplayMedia is missing or blocked on mobile browser (iOS Safari / Android Chrome)
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setShowMobileScreenModal(true);
      return;
    }

    try {
      setStatusMessage('Select screen, window or tab to share...');
      const stream = await deviceManager.requestDisplayStream(true);
      setScreenStream(stream);
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
        await screenVideoRef.current.play();
      }

      // Check for system audio in screen stream
      if (stream.getAudioTracks().length > 0) {
        audioEngine.attachSystemAudio(stream);
      }

      // Listen for when user stops screen share from browser UI
      stream.getVideoTracks()[0].onended = () => {
        setScreenStream(null);
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = null;
        }
      };

      setStatusMessage('Screen capture active');
    } catch (err: any) {
      console.warn('Display media error:', err);
      if (isMobile || err.name === 'NotSupportedError' || err.message?.toLowerCase().includes('not supported')) {
        setShowMobileScreenModal(true);
      } else {
        setStatusMessage('Screen capture was cancelled or unavailable.');
      }
    }
  }, [deviceManager, audioEngine, isMobile]);

  const startMicrophone = useCallback(async () => {
    try {
      const stream = await deviceManager.requestMicrophoneStream(settings.defaultMicId);
      setMicStream(stream);
      audioEngine.attachMicrophone(stream);
      setHasMic(true);
    } catch (err) {
      console.warn('Microphone error:', err);
      setHasMic(false);
    }
  }, [deviceManager, audioEngine, settings.defaultMicId]);

  // Auto-start camera & mic on first mount
  useEffect(() => {
    startCamera();
    startMicrophone();
  }, [startCamera, startMicrophone]);

  const handleSwitchFacingMode = () => {
    const nextFacing = cameraConfig.facingMode === 'user' ? 'environment' : 'user';
    setCameraConfig(prev => ({ ...prev, facingMode: nextFacing }));
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
    }
    setTimeout(() => startCamera(), 100);
  };

  const handleSelectScene = (sceneId: string) => {
    const targetScene = scenes.find(s => s.id === sceneId);
    if (!targetScene || !compositor) return;

    compositor.triggerTransition(transition);
    setActiveSceneId(sceneId);
    setMode(targetScene.mode);
    if (targetScene.cameraConfig) {
      setCameraConfig(prev => ({ ...prev, ...targetScene.cameraConfig }));
    }
  };

  const handleTakeSnapshot = () => {
    if (!compositor) return;
    const canvas = compositor.getCanvas();
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `VisionCast-Snapshot-${Date.now()}.png`;
    a.click();
  };

  const handleToggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  // Click & drag camera on canvas (Mouse & Touch supported)
  const updateCameraPositionFromCoords = (clientX: number, clientY: number, container: HTMLElement) => {
    const rect = container.getBoundingClientRect();
    const xPct = Math.max(10, Math.min(90, Math.round(((clientX - rect.left) / rect.width) * 100)));
    const yPct = Math.max(10, Math.min(90, Math.round(((clientY - rect.top) / rect.height) * 100)));
    setCameraConfig(prev => ({ ...prev, x: xPct, y: yPct }));
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode === 'screen-only' || !cameraConfig.enabled) return;
    const container = e.currentTarget;
    updateCameraPositionFromCoords(e.clientX, e.clientY, container);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateCameraPositionFromCoords(moveEvent.clientX, moveEvent.clientY, container);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (mode === 'screen-only' || !cameraConfig.enabled) return;
    const touch = e.touches[0];
    if (!touch) return;
    updateCameraPositionFromCoords(touch.clientX, touch.clientY, e.currentTarget);
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (mode === 'screen-only' || !cameraConfig.enabled) return;
    const touch = e.touches[0];
    if (!touch) return;
    updateCameraPositionFromCoords(touch.clientX, touch.clientY, e.currentTarget);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0e13] overflow-hidden">
      {/* Studio Viewport & Side Dock: Responsive Stack on mobile, Side-by-side on desktop */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Central Preview Area */}
        <div className="flex-1 flex flex-col p-2.5 sm:p-4 overflow-hidden relative shrink-0 lg:shrink">
          {/* Top Mode Bar - Horizontally scrollable on mobile */}
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3 shrink-0">
            {/* Mode selection buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-[#13161f] rounded-lg border border-[#1f2533] overflow-x-auto max-w-full">
              <button
                onClick={() => {
                  if (isMobile && (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia)) {
                    setShowMobileScreenModal(true);
                  }
                  setMode('screen-camera');
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  mode === 'screen-camera'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Tv className="w-3.5 h-3.5 shrink-0" />
                <span>{t.modeScreenCam}</span>
              </button>
              <button
                onClick={() => {
                  if (isMobile && (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia)) {
                    setShowMobileScreenModal(true);
                  }
                  setMode('screen-only');
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  mode === 'screen-only'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 shrink-0" />
                <span>{t.modeScreenOnly}</span>
              </button>
              <button
                onClick={() => setMode('camera-only')}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  mode === 'camera-only'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5 shrink-0" />
                <span>{t.modeCameraOnly}</span>
              </button>
              <button
                onClick={() => setMode('presenter')}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  mode === 'presenter'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Presentation className="w-3.5 h-3.5 shrink-0" />
                <span>{t.modePresenter}</span>
              </button>
            </div>

            {/* Quick Hardware Status Pill (hidden on very small screens) */}
            <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 font-mono shrink-0">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${screenStream ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                Screen
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${cameraStream ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                Cam
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${hasMic ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                Mic
              </span>
            </div>
          </div>

          {/* Central Canvas Viewport: Adaptive aspect-ratio with touch dragging and quick action overlays */}
          <div className="relative w-full h-[34vh] sm:h-[46vh] lg:h-auto lg:flex-1 bg-[#08090d] rounded-xl border border-[#1b1f2b] overflow-hidden flex items-center justify-center studio-canvas-pattern cursor-crosshair shadow-2xl shrink-0 lg:shrink">
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ touchAction: 'none' }}
              onMouseDown={handleCanvasMouseDown}
              onTouchStart={handleCanvasTouchStart}
              onTouchMove={handleCanvasTouchMove}
              ref={containerRef}
            />

            {/* Mobile quick-flip camera button floating on canvas */}
            <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwitchFacingMode();
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md text-xs font-semibold shadow-lg active:scale-90 transition-transform"
                title="Switch Camera (Front / Rear)"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px]">Flip Cam</span>
              </button>
            </div>
          </div>

          {/* Helpful drag prompt banner */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-1">
            <span className="truncate">Toca o arrastra la cámara en la pantalla para moverla.</span>
            {statusMessage && <span className="text-indigo-400 font-medium truncate ml-2">{statusMessage}</span>}
          </div>
        </div>

        {/* Tabbed Studio Controls Dock */}
        <div className="flex-1 lg:flex-initial lg:w-96 bg-[#0f1217] border-t lg:border-t-0 lg:border-l border-[#1e232e] flex flex-col overflow-hidden shrink-0">
          {/* Dock Tabs Header */}
          <div className="flex items-center border-b border-[#1b202a] bg-[#0c0e13] px-2 pt-1.5">
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex-1 min-h-[38px] pb-2 text-xs font-semibold text-center border-b-2 transition-colors ${
                activeTab === 'camera'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Camera
            </button>
            <button
              onClick={() => setActiveTab('overlays')}
              className={`flex-1 min-h-[38px] pb-2 text-xs font-semibold text-center border-b-2 transition-colors ${
                activeTab === 'overlays'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Overlays
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`flex-1 min-h-[38px] pb-2 text-xs font-semibold text-center border-b-2 transition-colors ${
                activeTab === 'audio'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Mixer
            </button>
            <button
              onClick={() => setActiveTab('scenes')}
              className={`flex-1 min-h-[38px] pb-2 text-xs font-semibold text-center border-b-2 transition-colors ${
                activeTab === 'scenes'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Scenes
            </button>
          </div>

          {/* Dock Content Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {activeTab === 'camera' && (
              <FloatingCamera
                config={cameraConfig}
                onChange={(c) => setCameraConfig((prev) => ({ ...prev, ...c }))}
                onSwitchCamera={handleSwitchFacingMode}
                language={language}
              />
            )}

            {activeTab === 'overlays' && (
              <OverlayEditor
                overlays={overlays}
                onChange={setOverlays}
                language={language}
              />
            )}

            {activeTab === 'audio' && <AudioMixer language={language} />}

            {activeTab === 'scenes' && (
              <SceneManager
                scenes={scenes}
                activeSceneId={activeSceneId}
                activeTransition={transition}
                onSelectScene={handleSelectScene}
                onSelectTransition={setTransition}
                language={language}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Production Console Control Bar - Fluid and responsive for mobile thumb reach */}
      <div className="bg-[#0f1217] border-t border-[#1e232e] px-3 md:px-6 py-2.5 md:py-0 min-h-[56px] md:h-16 flex flex-wrap md:flex-nowrap items-center justify-between gap-2.5 md:gap-4 select-none shrink-0 z-20 pb-20 md:pb-2.5">
        {/* Left: Input Source Activators */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Screen Share Activator */}
          <button
            onClick={startScreen}
            className={`min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              screenStream
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                : 'bg-[#151923] border-[#222837] text-slate-300 hover:text-white hover:bg-[#1a1f2c]'
            }`}
          >
            <Monitor className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="whitespace-nowrap text-[11px] sm:text-xs">{screenStream ? 'Pantalla OK' : 'Pantalla'}</span>
          </button>

          {/* Webcam Activator */}
          <button
            onClick={() => {
              if (cameraStream) {
                setCameraConfig(prev => ({ ...prev, enabled: !prev.enabled }));
              } else {
                startCamera();
              }
            }}
            className={`min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              cameraConfig.enabled && cameraStream
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                : 'bg-[#151923] border-[#222837] text-slate-300 hover:text-white hover:bg-[#1a1f2c]'
            }`}
          >
            <Camera className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="whitespace-nowrap text-[11px] sm:text-xs">{cameraConfig.enabled ? 'Cámara' : 'Muted'}</span>
          </button>

          {/* Mic Activator */}
          <button
            onClick={() => {
              const audioEng = AudioEngine.getInstance();
              setHasMic(!hasMic);
              audioEng.setChannelMute('mic', hasMic);
            }}
            className={`min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              hasMic
                ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
            }`}
          >
            {hasMic ? <Mic className="w-4 h-4 text-purple-400 shrink-0" /> : <MicOff className="w-4 h-4 text-rose-400 shrink-0" />}
            <span className="whitespace-nowrap text-[11px] sm:text-xs">{hasMic ? 'Voz Live' : 'Mute'}</span>
          </button>
        </div>

        {/* Center: Main Record & Broadcast Controller */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!isRecording ? (
            <button
              onClick={onStartRecord}
              className="min-h-[44px] flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-rose-600/30 active:scale-95 transition-all whitespace-nowrap"
            >
              <Disc className="w-4 h-4 animate-pulse shrink-0" />
              <span>{t.startRecord}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Pause / Resume */}
              <button
                onClick={isPaused ? onResumeRecord : onPauseRecord}
                className="min-h-[44px] flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-lg bg-[#1f2533] hover:bg-[#283042] text-slate-200 text-xs font-semibold active:scale-95 transition-all"
              >
                {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
                <span className="hidden sm:inline">{isPaused ? t.resumeRecord : t.pauseRecord}</span>
              </button>

              {/* Stop Recording */}
              <button
                onClick={onStopRecord}
                className="min-h-[44px] flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg bg-[#2b1016] border border-rose-500/50 hover:bg-rose-900/60 text-rose-300 font-bold text-xs active:scale-95 transition-all whitespace-nowrap"
              >
                <div className="w-3 h-3 rounded-xs bg-rose-500 shrink-0" />
                <span>{t.stopRecord}</span>
              </button>
            </div>
          )}

          {/* Go Live / Stream button */}
          {!isStreaming ? (
            <button
              onClick={onGoLive}
              className="min-h-[44px] flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all whitespace-nowrap"
            >
              <Radio className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{t.goLive}</span>
              <span className="sm:hidden">Live</span>
            </button>
          ) : (
            <button
              onClick={onEndLive}
              className="min-h-[44px] flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-lg bg-[#15241d] border border-emerald-500/50 hover:bg-emerald-950/60 text-emerald-300 text-xs font-bold active:scale-95 transition-all whitespace-nowrap"
            >
              <div className="w-3 h-3 rounded-xs bg-emerald-500 shrink-0" />
              <span>{t.endLive}</span>
            </button>
          )}
        </div>

        {/* Right: Studio Utility Controls */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Snapshot Button */}
          <button
            onClick={handleTakeSnapshot}
            className="min-h-[44px] min-w-[44px] p-2 rounded-lg bg-[#151923] hover:bg-[#1f2434] text-slate-300 hover:text-white border border-[#222837] flex items-center justify-center transition-colors"
            title="Take High-Res Snapshot (PNG)"
          >
            <CameraIcon className="w-4 h-4" />
          </button>

          {/* Fullscreen Canvas */}
          <button
            onClick={handleToggleFullscreen}
            className="min-h-[44px] min-w-[44px] p-2 rounded-lg bg-[#151923] hover:bg-[#1f2434] text-slate-300 hover:text-white border border-[#222837] flex items-center justify-center transition-colors"
            title="Fullscreen Output Preview"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Screen Capture Explanation & Solution Modal */}
      {showMobileScreenModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#131722] border border-[#232b3d] rounded-2xl p-5 shadow-2xl space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-[#1e2536] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Captura de Pantalla en Móviles</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Restricción del Navegador Móvil (iOS & Android)</span>
                </div>
              </div>
              <button
                onClick={() => setShowMobileScreenModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1c2232]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed">
                <strong className="text-white">¿Por qué parece inactivo o no captura pantalla?</strong><br />
                Por políticas de privacidad y seguridad de <strong>Apple (Safari en iPhone)</strong> y <strong>Google (Chrome en Android)</strong>, los navegadores en celulares <strong>bloquean la captura de pantalla de otras apps</strong> para evitar que una página web espíe tu teléfono.
              </p>

              <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#1b212f] space-y-2.5">
                <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tus 2 opciones para usar VisionCast en el móvil:</span>
                </span>
                
                <div className="space-y-2 text-[11px] text-slate-300">
                  <div className="p-2 rounded-lg bg-[#141824] border border-[#202738]">
                    <div className="font-bold text-white mb-0.5">1. Modo Cámara y Presentador (Inmediato en tu celular):</div>
                    <p className="text-slate-400 leading-normal">
                      Graba video con tu cámara frontal o trasera en Full HD, captura tu voz con el micrófono, mezcla audio, agrega logos/títulos y transmite en vivo sin instalar nada.
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#141824] border border-[#202738]">
                    <div className="font-bold text-white mb-0.5">2. Compilar la App Real Nativa (APK Android / IPA iOS):</div>
                    <p className="text-slate-400 leading-normal">
                      Para grabar la pantalla completa de tu teléfono mientras juegas o usas WhatsApp, Android exige un Servicio en primer plano (<code className="text-indigo-400 font-mono">MediaProjection</code>) e iOS exige <code className="text-indigo-400 font-mono">ReplayKit</code>. Todo el código fuente nativo y los comandos de compilación ya están listos en la app.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-[#1e2536]">
              <button
                onClick={() => {
                  setMode('camera-only');
                  startCamera();
                  setShowMobileScreenModal(false);
                }}
                className="w-full sm:flex-1 py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all text-center"
              >
                Activar Modo Cámara (Recomendado)
              </button>

              <button
                onClick={() => {
                  setShowMobileScreenModal(false);
                  onNavigate?.('help');
                }}
                className="w-full sm:w-auto py-2.5 px-4 rounded-lg bg-[#181d2a] hover:bg-[#202738] text-slate-300 text-xs font-semibold text-center border border-[#232b3d]"
              >
                Ver Código de App Nativa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
