import { FloatingCameraConfig, OverlayElement, StudioMode, SceneTransition } from '../types/studio';

export class CompositorEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private outputStream: MediaStream | null = null;

  private screenVideo: HTMLVideoElement | null = null;
  private cameraVideo: HTMLVideoElement | null = null;

  private mode: StudioMode = 'screen-camera';
  private cameraConfig: FloatingCameraConfig = {
    enabled: true,
    shape: 'circle',
    size: 280,
    aspectRatio: 1,
    x: 82, // % from left
    y: 72, // % from top
    opacity: 1,
    borderWidth: 4,
    borderColor: '#6366f1',
    shadow: true,
    mirror: true,
    zoom: 1,
    facingMode: 'user',
    deviceId: '',
  };

  private overlays: OverlayElement[] = [];
  private targetFps: number = 60;
  private width: number = 1920;
  private height: number = 1080;

  // Scene transition state
  private transitionType: SceneTransition = 'cut';
  private transitionProgress: number = 1; // 1 = fully transitioned
  private prevSnapshot: ImageData | null = null;

  // Timing
  private startTime: number = Date.now();

  constructor(targetFps: number = 60, width: number = 1920, height: number = 1080) {
    this.targetFps = targetFps;
    this.width = width;
    this.height = height;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d', { alpha: false, desynchronized: true })!;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public setScreenVideo(video: HTMLVideoElement | null): void {
    this.screenVideo = video;
  }

  public setCameraVideo(video: HTMLVideoElement | null): void {
    this.cameraVideo = video;
  }

  public setMode(mode: StudioMode): void {
    this.mode = mode;
  }

  public setCameraConfig(config: Partial<FloatingCameraConfig>): void {
    this.cameraConfig = { ...this.cameraConfig, ...config };
  }

  public getCameraConfig(): FloatingCameraConfig {
    return this.cameraConfig;
  }

  public setOverlays(overlays: OverlayElement[]): void {
    this.overlays = overlays;
  }

  public setResolution(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public triggerTransition(type: SceneTransition): void {
    this.transitionType = type;
    if (type !== 'cut') {
      try {
        this.prevSnapshot = this.ctx.getImageData(0, 0, this.width, this.height);
        this.transitionProgress = 0;
      } catch {
        this.transitionProgress = 1;
      }
    } else {
      this.transitionProgress = 1;
    }
  }

  public startRenderLoop(): void {
    if (this.animFrameId) return;

    let lastTime = performance.now();
    const interval = 1000 / this.targetFps;

    const render = (now: number) => {
      const delta = now - lastTime;
      if (delta >= interval * 0.85) {
        lastTime = now - (delta % interval);
        this.renderFrame();
      }
      this.animFrameId = requestAnimationFrame(render);
    };

    this.animFrameId = requestAnimationFrame(render);
  }

  public stopRenderLoop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public getOutputStream(): MediaStream {
    if (!this.outputStream) {
      this.startRenderLoop();
      this.outputStream = this.canvas.captureStream(this.targetFps);
    }
    return this.outputStream;
  }

  private renderFrame(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Advance transition if running
    if (this.transitionProgress < 1) {
      this.transitionProgress += 0.05;
      if (this.transitionProgress > 1) this.transitionProgress = 1;
    }

    // Default studio graphite background
    ctx.fillStyle = '#0c0e12';
    ctx.fillRect(0, 0, w, h);

    // 1. Render primary content layer based on mode
    if (this.mode === 'camera-only') {
      this.renderFullCamera(ctx, w, h);
    } else if (this.mode === 'screen-only') {
      this.renderFullScreen(ctx, w, h);
    } else if (this.mode === 'screen-camera') {
      this.renderFullScreen(ctx, w, h);
      if (this.cameraConfig.enabled && this.cameraVideo) {
        this.renderFloatingCamera(ctx, w, h);
      }
    } else if (this.mode === 'presenter') {
      // Split presenter composition: 75% screen, 25% camera column or PiP
      this.renderFullScreen(ctx, w, h);
      if (this.cameraConfig.enabled && this.cameraVideo) {
        this.renderFloatingCamera(ctx, w, h);
      }
    }

    // 2. Render Overlays (Lower Thirds, Text, Logos, Timers, Links)
    this.renderOverlays(ctx, w, h);

    // 3. Handle Transitions (Fade / Slide)
    if (this.transitionProgress < 1 && this.prevSnapshot && this.transitionType !== 'cut') {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.putImageData(this.prevSnapshot, 0, 0);

      if (this.transitionType === 'fade') {
        ctx.save();
        ctx.globalAlpha = 1 - this.transitionProgress;
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();
      } else if (this.transitionType === 'slide') {
        ctx.save();
        const offsetX = -w * this.transitionProgress;
        ctx.drawImage(tempCanvas, offsetX, 0);
        ctx.restore();
      }
    }
  }

  private renderFullScreen(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (this.screenVideo && this.screenVideo.readyState >= 2 && !this.screenVideo.paused) {
      const vid = this.screenVideo;
      const vw = vid.videoWidth || 1920;
      const vh = vid.videoHeight || 1080;
      const scale = Math.min(w / vw, h / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;

      ctx.drawImage(vid, dx, dy, dw, dh);
    } else {
      // Standby pattern
      this.renderStandbyDisplay(ctx, w, h, 'Screen Capture Source Ready');
    }
  }

  private renderFullCamera(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (this.cameraVideo && this.cameraVideo.readyState >= 2 && !this.cameraVideo.paused) {
      const vid = this.cameraVideo;
      const vw = vid.videoWidth || 1280;
      const vh = vid.videoHeight || 720;
      const scale = Math.max(w / vw, h / vh) * this.cameraConfig.zoom;
      const dw = vw * scale;
      const dh = vh * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;

      ctx.save();
      if (this.cameraConfig.mirror) {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(vid, dx, dy, dw, dh);
      ctx.restore();
    } else {
      this.renderStandbyDisplay(ctx, w, h, 'Camera Source Standby');
    }
  }

  private renderFloatingCamera(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const vid = this.cameraVideo;
    if (!vid || vid.readyState < 2) return;

    const cfg = this.cameraConfig;
    const camSize = (cfg.size / 1000) * w; // scaled to 1080p
    const camWidth = camSize;
    const camHeight = cfg.shape === 'circle' ? camSize : camSize * (9 / 16);

    const cx = (cfg.x / 100) * w - camWidth / 2;
    const cy = (cfg.y / 100) * h - camHeight / 2;

    ctx.save();
    ctx.globalAlpha = cfg.opacity;

    // Shadow
    if (cfg.shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 8;
    }

    // Path shape clipping
    ctx.beginPath();
    if (cfg.shape === 'circle') {
      const radius = camWidth / 2;
      ctx.arc(cx + radius, cy + radius, radius, 0, Math.PI * 2);
    } else if (cfg.shape === 'squircle') {
      const r = 24;
      ctx.roundRect(cx, cy, camWidth, camHeight, [r, r, r, r]);
    } else {
      // Rectangle
      const r = 12;
      ctx.roundRect(cx, cy, camWidth, camHeight, [r, r, r, r]);
    }
    ctx.closePath();

    // Clip and draw camera video
    ctx.save();
    ctx.clip();

    const vw = vid.videoWidth || 1280;
    const vh = vid.videoHeight || 720;
    const aspect = vw / vh;
    let drawW = camWidth;
    let drawH = camHeight;

    if (cfg.shape === 'circle') {
      drawW = camWidth * aspect * cfg.zoom;
      drawH = camHeight * cfg.zoom;
    } else {
      drawW = camWidth * cfg.zoom;
      drawH = camHeight * cfg.zoom;
    }

    const drawX = cx + (camWidth - drawW) / 2;
    const drawY = cy + (camHeight - drawH) / 2;

    if (cfg.mirror) {
      ctx.translate(cx + camWidth / 2, cy + camHeight / 2);
      ctx.scale(-1, 1);
      ctx.translate(-(cx + camWidth / 2), -(cy + camHeight / 2));
    }

    ctx.drawImage(vid, drawX, drawY, drawW, drawH);
    ctx.restore();

    // Border stroke
    if (cfg.borderWidth > 0) {
      ctx.lineWidth = cfg.borderWidth * 2;
      ctx.strokeStyle = cfg.borderColor;
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderOverlays(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    for (const ov of this.overlays) {
      if (!ov.visible) continue;

      ctx.save();
      ctx.globalAlpha = ov.opacity;

      const px = (ov.x / 100) * w;
      const py = (ov.y / 100) * h;

      if (ov.type === 'lower-third') {
        this.drawLowerThird(ctx, px, py, ov);
      } else if (ov.type === 'text') {
        this.drawTextOverlay(ctx, px, py, ov);
      } else if (ov.type === 'logo') {
        this.drawLogoWatermark(ctx, px, py, ov);
      } else if (ov.type === 'timer') {
        this.drawTimer(ctx, px, py, ov);
      } else if (ov.type === 'link') {
        this.drawLinkBadge(ctx, px, py, ov);
      } else if (ov.type === 'social') {
        this.drawSocialBadge(ctx, px, py, ov);
      }

      ctx.restore();
    }
  }

  private drawLowerThird(ctx: CanvasRenderingContext2D, x: number, y: number, ov: OverlayElement): void {
    const width = 560;
    const height = 96;

    // Backdrop with rounded corner and gradient
    const grad = ctx.createLinearGradient(x, y, x + width, y);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
    grad.addColorStop(0.85, 'rgba(15, 23, 42, 0.85)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, [8, 0, 0, 8]);
    ctx.fill();

    // Left Accent bar
    ctx.fillStyle = ov.accentColor || '#6366f1';
    ctx.beginPath();
    ctx.roundRect(x, y, 6, height, [8, 0, 0, 8]);
    ctx.fill();

    // Title
    ctx.font = `700 ${ov.fontSize || 28}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = ov.textColor || '#ffffff';
    ctx.fillText(ov.title, x + 24, y + 42);

    // Subtitle
    if (ov.subtitle) {
      ctx.font = `500 ${Math.round((ov.fontSize || 28) * 0.65)}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(ov.subtitle, x + 24, y + 74);
    }
  }

  private drawTextOverlay(ctx: CanvasRenderingContext2D, x: number, y: number, ov: OverlayElement): void {
    ctx.font = `700 ${ov.fontSize || 32}px "Plus Jakarta Sans", sans-serif`;
    const metrics = ctx.measureText(ov.title);
    const boxW = metrics.width + 36;
    const boxH = (ov.fontSize || 32) + 24;

    ctx.fillStyle = ov.backgroundColor || 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x - boxW / 2, y - boxH / 2, boxW, boxH, 8);
    ctx.fill();

    ctx.fillStyle = ov.textColor || '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ov.title, x, y);
  }

  private drawLogoWatermark(ctx: CanvasRenderingContext2D, x: number, y: number, ov: OverlayElement): void {
    // Elegant branded watermark badge
    const badgeW = 200;
    const badgeH = 44;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, badgeW, badgeH, 6);
    ctx.fill();
    ctx.stroke();

    // Logo icon dot
    ctx.fillStyle = ov.accentColor || '#6366f1';
    ctx.beginPath();
    ctx.arc(x + 20, y + 22, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(ov.title || 'VISIONCAST', x + 36, y + 22);
  }

  private drawTimer(ctx: CanvasRenderingContext2D, x: number, y: number, ov: OverlayElement): void {
    const elapsedSecs = Math.floor((Date.now() - this.startTime) / 1000);
    const mins = Math.floor(elapsedSecs / 60).toString().padStart(2, '0');
    const secs = (elapsedSecs % 60).toString().padStart(2, '0');
    const timerText = `${mins}:${secs}`;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, 140, 42, 6);
    ctx.fill();
    ctx.stroke();

    // Red live recording dot
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + 20, y + 21, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '600 16px "JetBrains Mono", monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(timerText, x + 36, y + 22);
  }

  private drawLinkBadge(ctx: CanvasRenderingContext2D, x: number, y: number, ov: OverlayElement): void {
    const text = ov.url || ov.title || 'visioncast.studio';
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    const metrics = ctx.measureText(text);
    const boxW = metrics.width + 48;
    const boxH = 40;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    // Link icon symbol
    ctx.fillStyle = '#818cf8';
    ctx.fillText('🔗', x + 12, y + 21);

    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 36, y + 21);
  }

  private drawSocialBadge(ctx: CanvasRenderingContext2D, x: number, y: number, ov: OverlayElement): void {
    const handle = ov.content || ov.title || '@visioncast';
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    const metrics = ctx.measureText(handle);
    const boxW = metrics.width + 44;
    const boxH = 38;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 6);
    ctx.fill();

    ctx.fillStyle = ov.accentColor || '#38bdf8';
    ctx.beginPath();
    ctx.arc(x + 18, y + 19, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(handle, x + 32, y + 20);
  }

  private renderStandbyDisplay(ctx: CanvasRenderingContext2D, w: number, h: number, label: string): void {
    // Subtle animated grid / gradient standby
    const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, '#161922');
    grad.addColorStop(1, '#090b0e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const step = 80;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Label
    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, w / 2, h / 2);

    ctx.font = '400 14px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillText(`${w} × ${h} · ${this.targetFps} FPS · STUDIO ENGINE READY`, w / 2, h / 2 + 36);
  }
}
