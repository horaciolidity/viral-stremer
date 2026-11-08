export interface DeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
  groupId: string;
}

export interface CodecSupport {
  mimeType: string;
  supported: boolean;
  notes: string;
}

export class DeviceManager {
  private static instance: DeviceManager;

  private constructor() {}

  public static getInstance(): DeviceManager {
    if (!DeviceManager.instance) {
      DeviceManager.instance = new DeviceManager();
    }
    return DeviceManager.instance;
  }

  public async getMediaDevices(): Promise<{
    cameras: DeviceInfo[];
    microphones: DeviceInfo[];
    speakers: DeviceInfo[];
  }> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return { cameras: [], microphones: [], speakers: [] };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras: DeviceInfo[] = [];
      const microphones: DeviceInfo[] = [];
      const speakers: DeviceInfo[] = [];

      devices.forEach((device, index) => {
        const info: DeviceInfo = {
          deviceId: device.deviceId,
          label: device.label || `${device.kind === 'videoinput' ? 'Camera' : device.kind === 'audioinput' ? 'Microphone' : 'Speaker'} ${index + 1}`,
          kind: device.kind,
          groupId: device.groupId,
        };

        if (device.kind === 'videoinput') {
          cameras.push(info);
        } else if (device.kind === 'audioinput') {
          microphones.push(info);
        } else if (device.kind === 'audiooutput') {
          speakers.push(info);
        }
      });

      return { cameras, microphones, speakers };
    } catch (err) {
      console.warn('Failed to enumerate devices:', err);
      return { cameras: [], microphones: [], speakers: [] };
    }
  }

  public async requestCameraStream(
    deviceId?: string,
    facingMode: 'user' | 'environment' = 'user',
    targetFps: number = 30
  ): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      video: deviceId
        ? { deviceId: { exact: deviceId }, frameRate: { ideal: targetFps } }
        : { facingMode: { ideal: facingMode }, frameRate: { ideal: targetFps } },
      audio: false,
    };

    return await navigator.mediaDevices.getUserMedia(constraints);
  }

  public async requestMicrophoneStream(deviceId?: string): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: deviceId
        ? {
            deviceId: { exact: deviceId },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        : {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
      video: false,
    };

    return await navigator.mediaDevices.getUserMedia(constraints);
  }

  public async requestDisplayStream(captureSystemAudio: boolean = true): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error('Screen capture (getDisplayMedia) is not supported on this browser or platform.');
    }

    const displayConstraints: DisplayMediaStreamOptions = {
      video: {
        displaySurface: 'monitor',
        frameRate: { ideal: 60, max: 60 },
      },
      audio: captureSystemAudio,
    };

    return await navigator.mediaDevices.getDisplayMedia(displayConstraints);
  }

  public checkSupportedCodecs(): CodecSupport[] {
    if (typeof MediaRecorder === 'undefined') {
      return [];
    }

    const candidates = [
      { mime: 'video/webm;codecs=vp9,opus', label: 'VP9 + Opus (High Efficiency WebM)' },
      { mime: 'video/webm;codecs=vp8,opus', label: 'VP8 + Opus (Standard WebM)' },
      { mime: 'video/webm;codecs=h264,opus', label: 'H.264 + Opus (Hardware WebM)' },
      { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', label: 'H.264 / AVC + AAC (Native MP4)' },
      { mime: 'video/mp4;codecs=av01.0.05M.08,opus', label: 'AV1 + Opus (Ultra Next-Gen MP4)' },
      { mime: 'video/webm', label: 'Default WebM' },
      { mime: 'video/mp4', label: 'Default MP4' },
    ];

    return candidates.map(c => ({
      mimeType: c.mime,
      supported: MediaRecorder.isTypeSupported(c.mime),
      notes: c.label,
    }));
  }

  public getOptimalMimeType(): string {
    const priorities = [
      'video/webm;codecs=vp9,opus',
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/mp4',
      'video/webm',
    ];

    for (const mime of priorities) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    }
    return '';
  }
}
