import { AudioChannelState } from '../types/studio';

export class AudioEngine {
  private static instance: AudioEngine;
  private ctx: AudioContext | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private masterGainNode: GainNode | null = null;

  // Channels
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode | null = null;
  private micMuteGain: GainNode | null = null;
  private micHighPass: BiquadFilterNode | null = null;
  private micCompressor: DynamicsCompressorNode | null = null;
  private micPanner: StereoPannerNode | null = null;
  private micAnalyser: AnalyserNode | null = null;

  private systemSource: MediaStreamAudioSourceNode | null = null;
  private systemGain: GainNode | null = null;
  private systemMuteGain: GainNode | null = null;
  private systemPanner: StereoPannerNode | null = null;
  private systemAnalyser: AnalyserNode | null = null;

  private mediaSource: MediaStreamAudioSourceNode | null = null;
  private mediaGain: GainNode | null = null;
  private mediaMuteGain: GainNode | null = null;
  private mediaAnalyser: AnalyserNode | null = null;

  // Analysis buffers
  private micDataArray = new Uint8Array(256);
  private systemDataArray = new Uint8Array(256);
  private mediaDataArray = new Uint8Array(256);

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public init(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx({ sampleRate: 48000 });
      this.destinationNode = this.ctx.createMediaStreamDestination();
      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.connect(this.destinationNode);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getDestinationStream(): MediaStream {
    this.init();
    return this.destinationNode!.stream;
  }

  public attachMicrophone(stream: MediaStream): void {
    const ctx = this.init();
    if (this.micSource) {
      try { this.micSource.disconnect(); } catch { /* ignore */ }
    }

    if (stream.getAudioTracks().length === 0) return;

    this.micSource = ctx.createMediaStreamSource(stream);
    this.micGain = ctx.createGain();
    this.micMuteGain = ctx.createGain();
    this.micHighPass = ctx.createBiquadFilter();
    this.micHighPass.type = 'highpass';
    this.micHighPass.frequency.value = 80; // 80Hz rumble cut

    this.micCompressor = ctx.createDynamicsCompressor();
    this.micCompressor.threshold.setValueAtTime(-24, ctx.currentTime);
    this.micCompressor.knee.setValueAtTime(30, ctx.currentTime);
    this.micCompressor.ratio.setValueAtTime(4, ctx.currentTime);
    this.micCompressor.attack.setValueAtTime(0.003, ctx.currentTime);
    this.micCompressor.release.setValueAtTime(0.25, ctx.currentTime);

    this.micPanner = ctx.createStereoPanner();
    this.micAnalyser = ctx.createAnalyser();
    this.micAnalyser.fftSize = 512;
    this.micAnalyser.smoothingTimeConstant = 0.4;

    // Chain: Source -> HighPass -> Compressor -> Gain -> MuteGain -> Panner -> Master -> Analyser
    this.micSource.connect(this.micHighPass);
    this.micHighPass.connect(this.micCompressor);
    this.micCompressor.connect(this.micGain);
    this.micGain.connect(this.micMuteGain);
    this.micMuteGain.connect(this.micPanner);
    this.micPanner.connect(this.masterGainNode!);
    this.micPanner.connect(this.micAnalyser);
  }

  public attachSystemAudio(stream: MediaStream): void {
    const ctx = this.init();
    if (this.systemSource) {
      try { this.systemSource.disconnect(); } catch { /* ignore */ }
    }

    if (stream.getAudioTracks().length === 0) return;

    this.systemSource = ctx.createMediaStreamSource(stream);
    this.systemGain = ctx.createGain();
    this.systemMuteGain = ctx.createGain();
    this.systemPanner = ctx.createStereoPanner();
    this.systemAnalyser = ctx.createAnalyser();
    this.systemAnalyser.fftSize = 512;
    this.systemAnalyser.smoothingTimeConstant = 0.4;

    this.systemSource.connect(this.systemGain);
    this.systemGain.connect(this.systemMuteGain);
    this.systemMuteGain.connect(this.systemPanner);
    this.systemPanner.connect(this.masterGainNode!);
    this.systemPanner.connect(this.systemAnalyser);
  }

  public setChannelVolume(channel: 'mic' | 'system' | 'media', volume: number): void {
    const gainNode = channel === 'mic' ? this.micGain : channel === 'system' ? this.systemGain : this.mediaGain;
    if (gainNode && this.ctx) {
      gainNode.gain.setTargetAtTime(Math.max(0, Math.min(2, volume)), this.ctx.currentTime, 0.02);
    }
  }

  public setChannelMute(channel: 'mic' | 'system' | 'media', muted: boolean): void {
    const muteGain = channel === 'mic' ? this.micMuteGain : channel === 'system' ? this.systemMuteGain : this.mediaMuteGain;
    if (muteGain && this.ctx) {
      muteGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.02);
    }
  }

  public setChannelPan(channel: 'mic' | 'system', pan: number): void {
    const panner = channel === 'mic' ? this.micPanner : this.systemPanner;
    if (panner && this.ctx) {
      panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime, 0.02);
    }
  }

  public toggleHighPass(enabled: boolean): void {
    if (this.micHighPass && this.ctx) {
      this.micHighPass.frequency.setTargetAtTime(enabled ? 80 : 0, this.ctx.currentTime, 0.02);
    }
  }

  public toggleCompressor(enabled: boolean): void {
    if (this.micCompressor && this.ctx) {
      this.micCompressor.threshold.setTargetAtTime(enabled ? -24 : 0, this.ctx.currentTime, 0.02);
    }
  }

  public getLevels(): {
    mic: { rms: number; peak: number; clipping: boolean };
    system: { rms: number; peak: number; clipping: boolean };
  } {
    const result = {
      mic: { rms: 0, peak: 0, clipping: false },
      system: { rms: 0, peak: 0, clipping: false },
    };

    if (this.micAnalyser) {
      this.micAnalyser.getByteTimeDomainData(this.micDataArray);
      let sum = 0;
      let peak = 0;
      for (let i = 0; i < this.micDataArray.length; i++) {
        const val = (this.micDataArray[i] - 128) / 128;
        const absVal = Math.abs(val);
        if (absVal > peak) peak = absVal;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / this.micDataArray.length);
      result.mic = {
        rms: Math.min(1, rms * 2.5),
        peak: Math.min(1, peak),
        clipping: peak >= 0.98,
      };
    }

    if (this.systemAnalyser) {
      this.systemAnalyser.getByteTimeDomainData(this.systemDataArray);
      let sum = 0;
      let peak = 0;
      for (let i = 0; i < this.systemDataArray.length; i++) {
        const val = (this.systemDataArray[i] - 128) / 128;
        const absVal = Math.abs(val);
        if (absVal > peak) peak = absVal;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / this.systemDataArray.length);
      result.system = {
        rms: Math.min(1, rms * 2.5),
        peak: Math.min(1, peak),
        clipping: peak >= 0.98,
      };
    }

    return result;
  }
}
