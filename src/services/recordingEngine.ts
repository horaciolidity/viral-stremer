import { VideoRecording, StudioSettings } from '../types/studio';
import { StorageService } from './storageService';

export interface RecordingProgress {
  isRecording: boolean;
  isPaused: boolean;
  durationSeconds: number;
  sizeBytes: number;
  chunksRecorded: number;
}

export class RecordingEngine {
  private static instance: RecordingEngine;
  private recorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private startTime: number = 0;
  private timerInterval: number | null = null;
  private elapsedSeconds: number = 0;
  private isPaused: boolean = false;
  private progressListeners: ((progress: RecordingProgress) => void)[] = [];

  private currentMimeType: string = 'video/webm';
  private targetFps: number = 60;
  private resolution: string = '1920x1080';

  private constructor() {}

  public static getInstance(): RecordingEngine {
    if (!RecordingEngine.instance) {
      RecordingEngine.instance = new RecordingEngine();
    }
    return RecordingEngine.instance;
  }

  public onProgress(cb: (progress: RecordingProgress) => void): () => void {
    this.progressListeners.push(cb);
    return () => {
      this.progressListeners = this.progressListeners.filter(l => l !== cb);
    };
  }

  private notifyProgress(): void {
    const totalBytes = this.recordedChunks.reduce((acc, c) => acc + c.size, 0);
    const progress: RecordingProgress = {
      isRecording: this.recorder !== null && this.recorder.state !== 'inactive',
      isPaused: this.isPaused,
      durationSeconds: this.elapsedSeconds,
      sizeBytes: totalBytes,
      chunksRecorded: this.recordedChunks.length,
    };
    this.progressListeners.forEach(l => l(progress));
  }

  public isRecordingActive(): boolean {
    return this.recorder !== null && this.recorder.state !== 'inactive';
  }

  public isRecordingPaused(): boolean {
    return this.isPaused;
  }

  public startRecording(
    stream: MediaStream,
    settings: Partial<StudioSettings> = {},
    sourceCanvas?: HTMLCanvasElement
  ): void {
    if (this.recorder && this.recorder.state !== 'inactive') {
      throw new Error('A recording session is already active.');
    }

    this.recordedChunks = [];
    this.elapsedSeconds = 0;
    this.isPaused = false;
    this.targetFps = settings.targetFps || 60;
    this.resolution = settings.resolution ? (settings.resolution === '4k' ? '3840x2160' : settings.resolution === '1440p' ? '2560x1440' : '1920x1080') : '1920x1080';

    // Determine optimal supported mime type
    const preferredMimes = [
      'video/webm;codecs=vp9,opus',
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/mp4',
      'video/webm',
    ];

    let chosenMime = '';
    for (const m of preferredMimes) {
      if (MediaRecorder.isTypeSupported(m)) {
        chosenMime = m;
        break;
      }
    }

    this.currentMimeType = chosenMime || 'video/webm';

    const bitrateBps = (settings.videoBitrateMbps || 8) * 1000 * 1000;

    const options: MediaRecorderOptions = {
      mimeType: this.currentMimeType,
      videoBitsPerSecond: bitrateBps,
      audioBitsPerSecond: (settings.audioBitrateKbps || 192) * 1000,
    };

    try {
      this.recorder = new MediaRecorder(stream, options);
    } catch {
      // Fallback without bitrate constraint
      this.recorder = new MediaRecorder(stream);
      this.currentMimeType = this.recorder.mimeType || 'video/webm';
    }

    this.recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
        this.notifyProgress();
      }
    };

    // Segment into 1000ms slices for progressive streaming to disk
    this.recorder.start(1000);
    this.startTime = Date.now();

    this.timerInterval = window.setInterval(() => {
      if (!this.isPaused) {
        this.elapsedSeconds++;
        this.notifyProgress();
      }
    }, 1000);

    this.notifyProgress();
  }

  public pauseRecording(): void {
    if (this.recorder && this.recorder.state === 'recording') {
      this.recorder.pause();
      this.isPaused = true;
      this.notifyProgress();
    }
  }

  public resumeRecording(): void {
    if (this.recorder && this.recorder.state === 'paused') {
      this.recorder.resume();
      this.isPaused = false;
      this.notifyProgress();
    }
  }

  public stopRecording(
    canvasSnapshot?: HTMLCanvasElement,
    customTitle?: string
  ): Promise<{ recording: VideoRecording; blob: Blob }> {
    return new Promise((resolve, reject) => {
      if (!this.recorder || this.recorder.state === 'inactive') {
        reject(new Error('No active recording to stop.'));
        return;
      }

      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }

      this.recorder.onstop = async () => {
        const finalBlob = new Blob(this.recordedChunks, { type: this.currentMimeType });

        // Generate thumbnail from canvas snapshot
        let thumbnailUrl = '';
        if (canvasSnapshot) {
          try {
            const thumbCanvas = document.createElement('canvas');
            thumbCanvas.width = 480;
            thumbCanvas.height = 270;
            const tCtx = thumbCanvas.getContext('2d');
            if (tCtx) {
              tCtx.drawImage(canvasSnapshot, 0, 0, 480, 270);
              thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.85);
            }
          } catch {
            // ignore canvas security if cross-origin
          }
        }

        const now = new Date();
        const dateStr = now.toISOString();
        const recId = `rec_${Date.now()}`;
        const autoTitle = customTitle || `VisionCast Session - ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        const recording: VideoRecording = {
          id: recId,
          title: autoTitle,
          description: `Recorded with VisionCast Studio at ${this.resolution} @ ${this.targetFps} FPS`,
          tags: ['Studio', 'Master'],
          date: dateStr,
          duration: this.elapsedSeconds,
          sizeBytes: finalBlob.size,
          resolution: this.resolution,
          fps: this.targetFps,
          mimeType: this.currentMimeType,
          thumbnailUrl,
          favorite: false,
        };

        // Persist into IndexedDB
        try {
          await StorageService.getInstance().saveRecording(recording, finalBlob);
        } catch (err) {
          console.warn('Failed to auto-save to IndexedDB:', err);
        }

        this.recorder = null;
        this.recordedChunks = [];
        this.isPaused = false;
        this.elapsedSeconds = 0;
        this.notifyProgress();

        resolve({ recording, blob: finalBlob });
      };

      this.recorder.stop();
    });
  }
}
