/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StudioMode, StudioSettings, OverlayElement } from './types/studio';
import { translations, Language } from './services/i18n';
import { DeviceManager } from './services/deviceManager';
import { AudioEngine } from './services/audioEngine';
import { RecordingEngine, RecordingProgress } from './services/recordingEngine';
import { StreamingEngine } from './services/streamingEngine';
import { StorageService } from './services/storageService';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './components/HomeView';
import { StudioView } from './components/StudioView';
import { RecordingsView } from './components/RecordingsView';
import { StreamingView } from './components/StreamingView';
import { SceneManager } from './components/SceneManager';
import { MediaLibraryView } from './components/MediaLibraryView';
import { SettingsView } from './components/SettingsView';
import { NativeBuildsView } from './components/NativeBuildsView';
import { MobileNavBar } from './components/MobileNavBar';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('studio');
  const [language, setLanguage] = useState<Language>('en');

  // Studio Settings
  const [settings, setSettings] = useState<StudioSettings>({
    language: 'en',
    resolution: '1080p',
    targetFps: 60,
    videoBitrateMbps: 8,
    audioBitrateKbps: 192,
    codec: 'vp9',
    format: 'webm',
    defaultMicId: '',
    defaultCameraId: '',
    autoSaveChunks: true,
    countdownSeconds: 0,
    hardwareAcceleration: true,
    storageAlertThresholdMb: 500,
  });

  // Recording & Streaming Status
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingSeconds, setStreamingSeconds] = useState(0);

  // Device & Storage Counts
  const [deviceCounts, setDeviceCounts] = useState({ cameras: 0, mics: 0 });
  const [storageQuota, setStorageQuota] = useState({ usedBytes: 0, quotaBytes: 10 * 1024 * 1024 * 1024, percentage: 0 });

  // Notifications toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const recordingEngine = RecordingEngine.getInstance();
  const streamingEngine = StreamingEngine.getInstance();
  const audioEngine = AudioEngine.getInstance();
  const deviceManager = DeviceManager.getInstance();
  const storageService = StorageService.getInstance();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const refreshStorage = useCallback(async () => {
    const quota = await storageService.getStorageQuota();
    setStorageQuota(quota);
  }, [storageService]);

  const refreshDevices = useCallback(async () => {
    const devs = await deviceManager.getMediaDevices();
    setDeviceCounts({
      cameras: devs.cameras.length,
      mics: devs.microphones.length,
    });
  }, [deviceManager]);

  useEffect(() => {
    refreshDevices();
    refreshStorage();

    // Listen to recording engine progress
    const unsubRec = recordingEngine.onProgress((progress: RecordingProgress) => {
      setIsRecording(progress.isRecording);
      setIsPaused(progress.isPaused);
      setRecordingSeconds(progress.durationSeconds);
    });

    // Listen to streaming stats
    const unsubStream = streamingEngine.onStatsUpdate((stats) => {
      setIsStreaming(stats.isStreaming);
      setStreamingSeconds(stats.durationSeconds);
    });

    return () => {
      unsubRec();
      unsubStream();
    };
  }, [recordingEngine, streamingEngine, refreshDevices, refreshStorage]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isRecording) {
          handleStopRecording();
        } else {
          handleStartRecording();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        // Toggle mic mute
        audioEngine.setChannelMute('mic', true);
        showToast(language === 'es' ? 'Micrófono silenciado' : 'Microphone muted');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, language]);

  const handleStartRecording = () => {
    try {
      // Find output canvas in DOM
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) {
        showToast('Please open Studio view to record output canvas.');
        setCurrentTab('studio');
        return;
      }

      const canvasStream = canvas.captureStream(settings.targetFps);
      const audioDest = audioEngine.getDestinationStream();

      // Combined A/V stream
      const combinedTracks = [
        ...canvasStream.getVideoTracks(),
        ...audioDest.getAudioTracks(),
      ];
      const mixedStream = new MediaStream(combinedTracks);

      recordingEngine.startRecording(mixedStream, settings, canvas);
      setIsRecording(true);
      showToast(language === 'es' ? 'Grabación iniciada' : 'Recording started');
    } catch (err: any) {
      console.warn('Recording start error:', err);
      showToast(`Record error: ${err.message}`);
    }
  };

  const handleStopRecording = async () => {
    try {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const result = await recordingEngine.stopRecording(canvas);
      setIsRecording(false);
      setRecordingSeconds(0);
      refreshStorage();
      showToast(
        language === 'es'
          ? `Guardado en Biblioteca (${(result.blob.size / (1024 * 1024)).toFixed(1)} MB)`
          : `Saved to Library (${(result.blob.size / (1024 * 1024)).toFixed(1)} MB)`
      );
    } catch (err: any) {
      console.warn('Recording stop error:', err);
    }
  };

  const handlePauseRecording = () => {
    recordingEngine.pauseRecording();
    setIsPaused(true);
    showToast(language === 'es' ? 'Grabación en pausa' : 'Recording paused');
  };

  const handleResumeRecording = () => {
    recordingEngine.resumeRecording();
    setIsPaused(false);
    showToast(language === 'es' ? 'Grabación reanudada' : 'Recording resumed');
  };

  const handleGoLive = () => {
    streamingEngine.startStreaming();
    setIsStreaming(true);
    showToast(language === 'es' ? 'Transmisión en vivo iniciada' : 'Live broadcast started');
  };

  const handleEndLive = () => {
    streamingEngine.stopStreaming();
    setIsStreaming(false);
    setStreamingSeconds(0);
    showToast(language === 'es' ? 'Transmisión finalizada' : 'Live stream ended');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0c0e12] text-slate-100 font-sans select-none">
      {/* Top Navigation Bar */}
      <TopNav
        currentTab={currentTab}
        isRecording={isRecording}
        isStreaming={isStreaming}
        recordingSeconds={recordingSeconds}
        streamingSeconds={streamingSeconds}
        language={language}
        onLanguageChange={(lang) => {
          setLanguage(lang);
          setSettings((prev) => ({ ...prev, language: lang }));
        }}
        onStartRecord={handleStartRecording}
        onStopRecord={handleStopRecording}
        onGoLive={handleGoLive}
        onEndLive={handleEndLive}
        onNavigate={setCurrentTab}
      />

      {/* Main Studio Body: Sidebar + Main Content Viewport */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          currentTab={currentTab}
          onNavigate={setCurrentTab}
          language={language}
          deviceCounts={deviceCounts}
          storageQuota={storageQuota}
        />

        <main className="flex-1 flex flex-col overflow-hidden relative pb-16 md:pb-0">
          {currentTab === 'home' && (
            <HomeView
              language={language}
              onSelectMode={(mode) => setCurrentTab('studio')}
              onNavigate={setCurrentTab}
              storageQuota={storageQuota}
            />
          )}

          {currentTab === 'studio' && (
            <StudioView
              language={language}
              settings={settings}
              isRecording={isRecording}
              isPaused={isPaused}
              isStreaming={isStreaming}
              recordingSeconds={recordingSeconds}
              streamingSeconds={streamingSeconds}
              onStartRecord={handleStartRecording}
              onStopRecord={handleStopRecording}
              onPauseRecord={handlePauseRecording}
              onResumeRecord={handleResumeRecording}
              onGoLive={handleGoLive}
              onEndLive={handleEndLive}
              onRecordingSaved={refreshStorage}
            />
          )}

          {currentTab === 'recordings' && <RecordingsView language={language} />}

          {currentTab === 'streaming' && (
            <StreamingView
              language={language}
              isStreaming={isStreaming}
              streamingSeconds={streamingSeconds}
              onGoLive={handleGoLive}
              onEndLive={handleEndLive}
              onSendChatToOverlay={(author, content) => {
                showToast(`Audience comment sent to overlay`);
                setCurrentTab('studio');
              }}
            />
          )}

          {currentTab === 'scenes' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto space-y-4">
                <h1 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Production Scenes</span>
                </h1>
                <p className="text-xs text-slate-400">
                  Switch scenes on the fly during recording and live streaming with Cut, Fade, and Slide transitions.
                </p>
                <div className="pt-2">
                  <SceneManager
                    scenes={[
                      {
                        id: 's1',
                        name: 'Screen + Camera',
                        mode: 'screen-camera',
                        description: 'Display with circular webcam overlay',
                        iconName: 'Tv',
                        cameraConfig: { enabled: true, shape: 'circle' },
                        overlays: [],
                        active: true,
                      },
                      {
                        id: 's2',
                        name: 'Presenter Mode',
                        mode: 'presenter',
                        description: 'Lower thirds & rectangular camera overlay',
                        iconName: 'Presentation',
                        cameraConfig: { enabled: true, shape: 'rectangle' },
                        overlays: [],
                        active: false,
                      },
                      {
                        id: 's3',
                        name: 'Full Camera Only',
                        mode: 'camera-only',
                        description: 'Full-screen presenter monologue',
                        iconName: 'Camera',
                        cameraConfig: { enabled: true },
                        overlays: [],
                        active: false,
                      },
                      {
                        id: 's4',
                        name: 'Clean Screen Only',
                        mode: 'screen-only',
                        description: 'Desktop capture without webcam',
                        iconName: 'Monitor',
                        cameraConfig: { enabled: false },
                        overlays: [],
                        active: false,
                      },
                    ]}
                    activeSceneId="s1"
                    activeTransition="fade"
                    onSelectScene={(id) => {
                      showToast(`Scene switched: ${id}`);
                      setCurrentTab('studio');
                    }}
                    onSelectTransition={(tr) => showToast(`Transition set to ${tr}`)}
                    language={language}
                  />
                </div>
              </div>
            </div>
          )}

          {currentTab === 'media' && (
            <MediaLibraryView
              language={language}
              onApplyPreset={(ovs) => {
                showToast('Applied lower third template to Studio');
                setCurrentTab('studio');
              }}
              onNavigateToStudio={() => setCurrentTab('studio')}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={(up) => setSettings((prev) => ({ ...prev, ...up }))}
              language={language}
              onLanguageChange={setLanguage}
            />
          )}

          {currentTab === 'help' && <NativeBuildsView language={language} />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Thumb Zone) */}
      <MobileNavBar
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        language={language}
        onLanguageChange={(lang) => {
          setLanguage(lang);
          setSettings((prev) => ({ ...prev, language: lang }));
        }}
        isRecording={isRecording}
        onStartRecord={handleStartRecording}
        onStopRecord={handleStopRecording}
        recordingSeconds={recordingSeconds}
        storageQuota={storageQuota}
        deviceCounts={deviceCounts}
      />

      {/* Floating System Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 bg-[#141926] border border-[#232c42] text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-slide-up backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
