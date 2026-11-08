export type ExportAspectRatio = '16:9' | '9:16' | '1:1';

export interface ExportProgress {
  isExporting: boolean;
  progressPercent: number;
  stage: string;
}

export class ExportService {
  private static instance: ExportService;

  private constructor() {}

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  public downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }

  public async extractAudioAsWav(
    videoBlob: Blob,
    onProgress?: (percent: number) => void
  ): Promise<Blob> {
    onProgress?.(10);
    const arrayBuffer = await videoBlob.arrayBuffer();
    onProgress?.(30);

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const tempCtx = new AudioCtx();
    const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    onProgress?.(70);

    const wavBlob = this.audioBufferToWavBlob(audioBuffer);
    onProgress?.(100);
    tempCtx.close();
    return wavBlob;
  }

  private audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    const channels: Float32Array[] = [];
    let sample = 0;
    let offset = 0;
    let pos = 0;

    // RIFF chunk descriptor
    this.writeString(out, pos, 'RIFF'); pos += 4;
    out.setUint32(pos, length - 8, true); pos += 4;
    this.writeString(out, pos, 'WAVE'); pos += 4;

    // FMT sub-chunk
    this.writeString(out, pos, 'fmt '); pos += 4;
    out.setUint32(pos, 16, true); pos += 4; // Subchunk1Size (16 for PCM)
    out.setUint16(pos, 1, true); pos += 2;  // AudioFormat (1 = PCM)
    out.setUint16(pos, numOfChan, true); pos += 2;
    out.setUint32(pos, buffer.sampleRate, true); pos += 4;
    out.setUint32(pos, buffer.sampleRate * 2 * numOfChan, true); pos += 4; // ByteRate
    out.setUint16(pos, numOfChan * 2, true); pos += 2; // BlockAlign
    out.setUint16(pos, 16, true); pos += 2; // BitsPerSample

    // Data sub-chunk
    this.writeString(out, pos, 'data'); pos += 4;
    out.setUint32(pos, length - pos - 4, true); pos += 4;

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (offset < buffer.length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        out.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([out.buffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  public async reformatVideo(
    sourceBlob: Blob,
    aspect: ExportAspectRatio,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<Blob> {
    onProgress?.({ isExporting: true, progressPercent: 10, stage: 'Decoding media container...' });

    // Target dimensions
    let targetW = 1920;
    let targetH = 1080;
    if (aspect === '9:16') {
      targetW = 1080;
      targetH = 1920;
    } else if (aspect === '1:1') {
      targetW = 1080;
      targetH = 1080;
    }

    const videoUrl = URL.createObjectURL(sourceBlob);
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = () => resolve(true);
      video.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d')!;

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm',
    });

    const exportChunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) exportChunks.push(e.data);
    };

    return new Promise((resolve) => {
      recorder.onstop = () => {
        URL.revokeObjectURL(videoUrl);
        const finalBlob = new Blob(exportChunks, { type: 'video/webm' });
        onProgress?.({ isExporting: false, progressPercent: 100, stage: 'Complete' });
        resolve(finalBlob);
      };

      recorder.start();
      video.currentTime = 0;
      video.play();

      const duration = video.duration || 1;

      const drawLoop = () => {
        if (video.ended || video.paused) {
          recorder.stop();
          return;
        }

        const pct = Math.min(99, Math.round((video.currentTime / duration) * 90) + 10);
        onProgress?.({
          isExporting: true,
          progressPercent: pct,
          stage: `Rendering ${aspect} layout (${Math.round(video.currentTime)}s / ${Math.round(duration)}s)...`,
        });

        // 1. Draw blurred letterbox background
        ctx.save();
        ctx.filter = 'blur(20px) brightness(0.4)';
        ctx.drawImage(video, -40, -40, targetW + 80, targetH + 80);
        ctx.restore();

        // 2. Center main video feed with aspect fit
        const vw = video.videoWidth || 1920;
        const vh = video.videoHeight || 1080;
        const scale = Math.min(targetW / vw, targetH / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        const dx = (targetW - dw) / 2;
        const dy = (targetH - dh) / 2;

        ctx.drawImage(video, dx, dy, dw, dh);

        requestAnimationFrame(drawLoop);
      };

      requestAnimationFrame(drawLoop);
    });
  }
}
