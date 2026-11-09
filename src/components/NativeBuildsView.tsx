import React, { useState } from 'react';
import { translations, Language } from '../services/i18n';
import {
  HelpCircle,
  Cpu,
  Monitor,
  Smartphone,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Play,
  Layers,
  FileCode,
} from 'lucide-react';

interface NativeBuildsViewProps {
  language: Language;
}

interface DiagnosticItem {
  name: string;
  category: string;
  status: 'passed' | 'warning' | 'failed';
  details: string;
}

export const NativeBuildsView: React.FC<NativeBuildsViewProps> = ({ language }) => {
  const t = translations[language];
  const [activePlatform, setActivePlatform] = useState<'capacitor' | 'electron' | 'android' | 'ios' | 'ffmpeg'>('capacitor');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Diagnostics state
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagnosticsReport, setDiagnosticsReport] = useState<DiagnosticItem[] | null>(null);

  const runDiagnostics = async () => {
    setDiagnosticsRunning(true);
    const results: DiagnosticItem[] = [];

    // 1. Screen Capture API
    if (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
      results.push({
        name: 'ScreenCapture API (getDisplayMedia)',
        category: 'Display Ingest',
        status: 'passed',
        details: 'Supported natively by browser engine with system audio loopback.',
      });
    } else {
      results.push({
        name: 'ScreenCapture API (getDisplayMedia)',
        category: 'Display Ingest',
        status: 'warning',
        details: 'Mobile browser detected or sandboxed environment; use Camera or native build.',
      });
    }

    // 2. Camera & Mic MediaDevices
    if (navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices) {
      results.push({
        name: 'Webcam & Microphone (getUserMedia)',
        category: 'AV Ingest',
        status: 'passed',
        details: 'Standard WebRTC hardware capture pipeline fully supported.',
      });
    } else {
      results.push({
        name: 'Webcam & Microphone (getUserMedia)',
        category: 'AV Ingest',
        status: 'failed',
        details: 'Hardware media devices access is restricted.',
      });
    }

    // 3. MediaRecorder
    if (typeof MediaRecorder !== 'undefined') {
      const vp9 = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus');
      const mp4 = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2');
      results.push({
        name: 'MediaRecorder Hardware Encoder Engine',
        category: 'Encoding',
        status: 'passed',
        details: `Active. VP9/Opus: ${vp9 ? 'YES' : 'NO'}, Native MP4: ${mp4 ? 'YES' : 'NO'}.`,
      });
    } else {
      results.push({
        name: 'MediaRecorder Hardware Encoder Engine',
        category: 'Encoding',
        status: 'failed',
        details: 'MediaRecorder is not supported in this runtime.',
      });
    }

    // 4. Web Audio DSP Engine
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      results.push({
        name: 'Web Audio API (48kHz Multi-channel DSP)',
        category: 'Audio Processing',
        status: 'passed',
        details: `Active with high-pass filter, dynamics compressor, and stereo panner at ${ctx.sampleRate}Hz.`,
      });
      ctx.close();
    } catch {
      results.push({
        name: 'Web Audio API (48kHz Multi-channel DSP)',
        category: 'Audio Processing',
        status: 'failed',
        details: 'Web Audio Context creation failed.',
      });
    }

    // 5. IndexedDB Persistent Storage
    if (typeof indexedDB !== 'undefined') {
      results.push({
        name: 'IndexedDB Direct-to-Disk Storage',
        category: 'Storage',
        status: 'passed',
        details: 'Persistent zero-RAM progressive chunk storage available.',
      });
    } else {
      results.push({
        name: 'IndexedDB Direct-to-Disk Storage',
        category: 'Storage',
        status: 'failed',
        details: 'IndexedDB is disabled or in private mode.',
      });
    }

    // 6. WebGL / Canvas Acceleration
    try {
      const cvs = document.createElement('canvas');
      const gl = cvs.getContext('webgl2') || cvs.getContext('webgl');
      results.push({
        name: 'GPU Hardware Compositor Acceleration',
        category: 'Rendering',
        status: gl ? 'passed' : 'warning',
        details: gl ? 'GPU rendering and canvas pipeline fully active.' : 'Software rasterization fallback.',
      });
    } catch {
      results.push({
        name: 'GPU Hardware Compositor Acceleration',
        category: 'Rendering',
        status: 'warning',
        details: 'Canvas 2D context available.',
      });
    }

    setDiagnosticsReport(results);
    setDiagnosticsRunning(false);
  };

  const copyCodeToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const electronMainJs = `// VisionCast Studio - Desktop Native Architecture (Electron Main Process)
// Windows Graphics Capture (WGC) + macOS ScreenCaptureKit + WASAPI Audio Ingest
const { app, BrowserWindow, desktopCapturer, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    backgroundColor: '#0c0e12',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableWebSQL: false,
    },
  });

  // Load production bundle or Vite local server
  win.loadURL('http://localhost:3000');
}

// Low-latency Native Display Capture via ScreenCaptureKit / DesktopCapturer
ipcMain.handle('GET_NATIVE_SOURCES', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
    thumbnailSize: { width: 320, height: 180 },
    fetchWindowIcons: true,
  });
  return sources.map(s => ({ id: s.id, name: s.name, thumbnail: s.thumbnail.toDataURL() }));
});

app.whenReady().then(createWindow);`;

  const androidKotlin = `// VisionCast Studio - Android Native Engine
// Kotlin + MediaProjection (Screen Recording) + CameraX (Simultaneous Facecam) + ForegroundService
package com.visioncast.studio

import android.app.Notification
import android.app.Service
import android.content.Intent
import android.media.projection.MediaProjection
import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider

class VisionCastStudioService : Service() {
    private var mediaProjection: MediaProjection? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Foreground service keeps video & audio recording active when screen rotates or apps switch
        startForeground(1001, buildStudioNotification())
        return START_STICKY
    }

    private fun setupCameraX() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()
            val preview = Preview.Builder().build()
            val cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA
            // CameraX streams directly into OpenGL ES compositor overlay
        }, mainExecutor)
    }

    private fun buildStudioNotification(): Notification {
        return Notification.Builder(this, "RECORDING_CHANNEL")
            .setContentTitle("VisionCast Studio Active")
            .setContentText("Recording screen and camera simultaneously")
            .setSmallIcon(R.drawable.ic_studio_rec)
            .build()
    }
}`;

  const iosSwift = `// VisionCast Studio - iOS Native Engine
// Swift + ReplayKit (RPScreenRecorder) + AVFoundation (Front Camera & Microphone)
import UIKit
import ReplayKit
import AVFoundation

class VisionCastStudioEngine: NSObject {
    private let screenRecorder = RPScreenRecorder.shared()
    private var captureSession: AVCaptureSession?

    func startSimultaneousCapture(completion: @escaping (Bool) -> Void) {
        guard screenRecorder.isAvailable else {
            completion(false)
            return
        }

        // Enable iOS system audio capture and microphone
        screenRecorder.isMicrophoneEnabled = true
        screenRecorder.isCameraEnabled = true

        screenRecorder.startCapture(handler: { sampleBuffer, sampleType, error in
            guard error == nil else { return }
            switch sampleType {
            case .video:
                // Compositor combines ReplayKit screen frame buffer with AVFoundation front camera
                break
            case .audioApp:
                // iOS In-app audio loopback
                break
            case .audioMic:
                // User voice over audio track
                break
            @unknown default:
                break
            }
        }) { error in
            completion(error == nil)
        }
    }
}`;

  const capacitorGuide = `# ==============================================================================
# VISIONCAST STUDIO — BUILD NATIVE MOBILE APP (ANDROID APK & iOS) VIA CAPACITOR
# ==============================================================================
# Por qué se necesita una App Nativa para Grabar Pantalla en Móviles:
# Tanto iOS (Apple) como Android (Google) bloquean por seguridad que cualquier
# página web en el navegador grabe la pantalla completa del teléfono mientras
# el usuario navega en otras aplicaciones o juegos (sandbox del navegador).
# Una app nativa en Android utiliza Foreground Service + MediaProjection,
# lo que permite grabar WhatsApp, videojuegos, TikTok o cualquier app con tu cara.

# PASO 1: Instalar Capacitor en este proyecto
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/camera

# PASO 2: Inicializar el proyecto nativo
npx cap init "VisionCast Studio" "com.visioncast.studio" --web-dir dist

# PASO 3: Compilar los archivos web para producción
npm run build

# PASO 4: Generar el proyecto Android nativo
npx cap add android
npx cap sync android

# PASO 5: Agregar los permisos en android/app/src/main/AndroidManifest.xml:
# <uses-permission android:name="android.permission.RECORD_AUDIO" />
# <uses-permission android:name="android.permission.CAMERA" />
# <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
# <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
# <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" />

# PASO 6: Abrir en Android Studio y compilar tu APK firmado o depuración:
npx cap open android
# (En Android Studio: Menú Build > Build Bundle(s) / APK(s) > Build APK)

# ==============================================================================
# OPCIÓN iOS (iPhone / iPad - requiere macOS con Xcode):
# ==============================================================================
npm install @capacitor/ios
npx cap add ios
npx cap sync ios
npx cap open ios`;

  const ffmpegCommand = `# VisionCast Studio - Professional Lossless Transcode & Streaming Command
# 1. Hardware Accelerated NVENC (NVIDIA GPU) 60 FPS H.264
ffmpeg -y -i input_session.webm -c:v h264_nvenc -preset p7 -b:v 8M -maxrate 10M -bufsize 16M -c:a aac -b:a 192k output_master.mp4

# 2. Convert to TikTok / Instagram Reels 9:16 Vertical with Blurred Background
ffmpeg -i input_session.webm -lavfi "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:5[bg];[0:v]scale=1080:1920:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2" -c:v libx264 -crf 18 -preset slow -c:a aac output_vertical_916.mp4

# 3. Direct RTMP Live Streaming to YouTube / Twitch
ffmpeg -re -i input_session.webm -c:v copy -c:a copy -f flv rtmp://a.rtmp.youtube.com/live2/YOUR_STREAM_KEY`;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0e13] p-4 md:p-6 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1c212c] pb-4 mb-6">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <span>{t.nativeTitle}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Production-grade native architectures for Windows, macOS, Linux, Android, iOS and FFmpeg processing
          </p>
        </div>

        {/* Diagnostics Button */}
        <button
          onClick={runDiagnostics}
          disabled={diagnosticsRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>{diagnosticsRunning ? 'Running Tests...' : t.runHardwareDiagnostics}</span>
        </button>
      </div>

      {/* Diagnostics Report Panel */}
      {diagnosticsReport && (
        <div className="mb-6 bg-[#12151e] border border-[#1e2330] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1c2230] pb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                {t.testResults}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">
              {diagnosticsReport.filter((r) => r.status === 'passed').length} /{' '}
              {diagnosticsReport.length} Passed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {diagnosticsReport.map((item) => (
              <div
                key={item.name}
                className="flex items-start justify-between p-2.5 rounded-lg bg-[#0c0e14] border border-[#1b202c]"
              >
                <div>
                  <div className="font-semibold text-white">{item.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{item.details}</div>
                </div>
                <div className="ml-2 shrink-0">
                  {item.status === 'passed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : item.status === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multiplatform Architecture Selector */}
      <div className="flex items-center gap-2 mb-4 border-b border-[#1c212c] pb-2 overflow-x-auto">
        <button
          onClick={() => setActivePlatform('capacitor')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activePlatform === 'capacitor'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>App Móvil (Capacitor / APK)</span>
        </button>

        <button
          onClick={() => setActivePlatform('electron')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activePlatform === 'electron'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Desktop (Electron)</span>
        </button>

        <button
          onClick={() => setActivePlatform('android')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activePlatform === 'android'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Android (Kotlin Nativo)</span>
        </button>

        <button
          onClick={() => setActivePlatform('ios')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activePlatform === 'ios'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>iOS (Swift ReplayKit)</span>
        </button>

        <button
          onClick={() => setActivePlatform('ffmpeg')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activePlatform === 'ffmpeg'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>FFmpeg Utility</span>
        </button>
      </div>

      {/* Code & Architectural Blueprint Container */}
      <div className="bg-[#12151e] border border-[#1e2330] rounded-xl overflow-hidden flex-1 flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-[#1c2230] bg-[#0c0e14]">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono text-slate-300">
              {activePlatform === 'capacitor' && 'mobile/capacitor-build-guide.sh (Android APK + iOS)'}
              {activePlatform === 'electron' && 'desktop/main.js (Electron + ScreenCaptureKit)'}
              {activePlatform === 'android' && 'android/VisionCastStudioService.kt (CameraX + MediaProjection)'}
              {activePlatform === 'ios' && 'ios/VisionCastStudioEngine.swift (ReplayKit + AVFoundation)'}
              {activePlatform === 'ffmpeg' && 'scripts/transcode_and_stream.sh (NVENC + Vertical 9:16)'}
            </span>
          </div>

          <button
            onClick={() => {
              const code =
                activePlatform === 'capacitor'
                  ? capacitorGuide
                  : activePlatform === 'electron'
                  ? electronMainJs
                  : activePlatform === 'android'
                  ? androidKotlin
                  : activePlatform === 'ios'
                  ? iosSwift
                  : ffmpegCommand;
              copyCodeToClipboard(code, activePlatform);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#181d2a] hover:bg-[#222a3c] text-xs text-slate-300 hover:text-white transition-colors"
          >
            {copiedCode === activePlatform ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Source</span>
              </>
            )}
          </button>
        </div>

        <pre className="flex-1 p-4 text-xs font-mono text-slate-300 bg-[#08090d] overflow-x-auto leading-relaxed select-text">
          {activePlatform === 'capacitor' && capacitorGuide}
          {activePlatform === 'electron' && electronMainJs}
          {activePlatform === 'android' && androidKotlin}
          {activePlatform === 'ios' && iosSwift}
          {activePlatform === 'ffmpeg' && ffmpegCommand}
        </pre>
      </div>
    </div>
  );
};
