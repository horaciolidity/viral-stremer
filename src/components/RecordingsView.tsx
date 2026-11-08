import React, { useState, useEffect } from 'react';
import { VideoRecording } from '../types/studio';
import { translations, Language } from '../services/i18n';
import { StorageService } from '../services/storageService';
import { ExportService, ExportAspectRatio, ExportProgress } from '../services/exportService';
import {
  Film,
  Play,
  Pause,
  Download,
  Trash2,
  Edit2,
  Star,
  Search,
  Filter,
  Info,
  Music,
  Share2,
  Check,
  X,
  FileVideo,
  Clock,
  HardDrive,
  Sparkles,
} from 'lucide-react';

interface RecordingsViewProps {
  language: Language;
}

export const RecordingsView: React.FC<RecordingsViewProps> = ({ language }) => {
  const t = translations[language];
  const storage = StorageService.getInstance();
  const exporter = ExportService.getInstance();

  const [recordings, setRecordings] = useState<VideoRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFav, setFilterFav] = useState(false);

  // Player state
  const [activeRecording, setActiveRecording] = useState<VideoRecording | null>(null);
  const [activeBlobUrl, setActiveBlobUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Technical inspector modal
  const [inspectRecording, setInspectRecording] = useState<VideoRecording | null>(null);

  // Editing filename
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Export & conversion modal state
  const [exportModalRec, setExportModalRec] = useState<VideoRecording | null>(null);
  const [exportAspect, setExportAspect] = useState<ExportAspectRatio>('16:9');
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

  const loadRecordings = async () => {
    setLoading(true);
    try {
      const items = await storage.getRecordings();
      setRecordings(items);
    } catch (err) {
      console.warn('Failed to load recordings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecordings();
  }, []);

  const handlePlayRecording = async (rec: VideoRecording) => {
    if (activeBlobUrl) {
      URL.revokeObjectURL(activeBlobUrl);
    }

    const blob = await storage.getRecordingBlob(rec.id);
    if (blob) {
      const url = URL.createObjectURL(blob);
      setActiveBlobUrl(url);
      setActiveRecording(rec);
      setIsPlaying(true);
    } else {
      alert('Could not retrieve recorded video data from local storage.');
    }
  };

  const handleClosePlayer = () => {
    if (activeBlobUrl) {
      URL.revokeObjectURL(activeBlobUrl);
      setActiveBlobUrl(null);
    }
    setActiveRecording(null);
    setIsPlaying(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this recording from local storage?')) {
      await storage.deleteRecording(id);
      if (activeRecording?.id === id) {
        handleClosePlayer();
      }
      loadRecordings();
    }
  };

  const handleToggleFavorite = async (rec: VideoRecording) => {
    const nextFav = !rec.favorite;
    await storage.updateRecording(rec.id, { favorite: nextFav });
    setRecordings((prev) =>
      prev.map((r) => (r.id === rec.id ? { ...r, favorite: nextFav } : r))
    );
  };

  const handleSaveTitle = async (id: string) => {
    if (editingTitle.trim()) {
      await storage.updateRecording(id, { title: editingTitle.trim() });
      setRecordings((prev) =>
        prev.map((r) => (r.id === id ? { ...r, title: editingTitle.trim() } : r))
      );
    }
    setEditingId(null);
  };

  const handleDownloadDirect = async (rec: VideoRecording) => {
    const blob = await storage.getRecordingBlob(rec.id);
    if (blob) {
      const ext = rec.mimeType.includes('mp4') ? 'mp4' : 'webm';
      const cleanName = rec.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      exporter.downloadBlob(blob, `${cleanName}.${ext}`);
    }
  };

  const handleExtractAudio = async (rec: VideoRecording) => {
    const blob = await storage.getRecordingBlob(rec.id);
    if (!blob) return;

    try {
      setExportProgress({ isExporting: true, progressPercent: 20, stage: 'Extracting audio channels to 48kHz WAV...' });
      const wavBlob = await exporter.extractAudioAsWav(blob, (pct) => {
        setExportProgress({ isExporting: true, progressPercent: pct, stage: 'Processing PCM audio buffer...' });
      });
      const cleanName = rec.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      exporter.downloadBlob(wavBlob, `${cleanName}_audio.wav`);
    } catch (err: any) {
      alert(`Audio extraction failed: ${err.message}`);
    } finally {
      setExportProgress(null);
    }
  };

  const handleRunReformatExport = async () => {
    if (!exportModalRec) return;
    const blob = await storage.getRecordingBlob(exportModalRec.id);
    if (!blob) return;

    try {
      const exportedBlob = await exporter.reformatVideo(blob, exportAspect, (p) => {
        setExportProgress(p);
      });
      const cleanName = exportModalRec.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      const aspectTag = exportAspect.replace(':', 'x');
      exporter.downloadBlob(exportedBlob, `${cleanName}_${aspectTag}.webm`);
      setExportModalRec(null);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setExportProgress(null);
    }
  };

  const filtered = recordings.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterFav) return matchSearch && r.favorite;
    return matchSearch;
  });

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${Math.round(bytes / 1024)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}:${remSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0e13] p-4 md:p-6 overflow-y-auto">
      {/* Header & Search / Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1c212c] pb-4 mb-6">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2.5">
            <Film className="w-5 h-5 text-indigo-400" />
            <span>{t.recordingsTitle}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            IndexedDB storage · Progressive disk streaming · Multiplatform format conversion
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.searchRecordings}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#141822] border border-[#212735] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-64"
            />
          </div>

          <button
            onClick={() => setFilterFav(!filterFav)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filterFav
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-[#141822] border-[#212735] text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filterFav ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>{t.filterFavorites}</span>
          </button>
        </div>
      </div>

      {/* Grid of Recordings */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500 border border-dashed border-[#1c212c] rounded-xl">
          <FileVideo className="w-12 h-12 text-slate-600 mb-3 stroke-[1.5]" />
          <p className="text-sm font-semibold text-slate-300">{t.noRecordingsYet}</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Recordings made in Studio are automatically saved to local storage with zero cloud dependence.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((rec) => (
            <div
              key={rec.id}
              className="bg-[#12151d] border border-[#1e2330] hover:border-[#2d3549] rounded-xl overflow-hidden flex flex-col transition-all group"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video bg-[#08090d] overflow-hidden flex items-center justify-center">
                {rec.thumbnailUrl ? (
                  <img
                    src={rec.thumbnailUrl}
                    alt={rec.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-600">
                    <FileVideo className="w-8 h-8 mb-1" />
                    <span className="text-[10px] font-mono">{rec.resolution}</span>
                  </div>
                )}

                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[11px] font-mono text-white flex items-center gap-1 backdrop-blur-xs">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{formatDuration(rec.duration)}</span>
                </div>

                {/* Favorite Star */}
                <button
                  onClick={() => handleToggleFavorite(rec)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-slate-400 hover:text-amber-400 transition-colors backdrop-blur-xs"
                >
                  <Star className={`w-3.5 h-3.5 ${rec.favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>

                {/* Hover Play Overlay */}
                <button
                  onClick={() => handlePlayRecording(rec)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 transform scale-90 group-hover:scale-100 transition-transform">
                    <Play className="w-5 h-5 ml-0.5 fill-white" />
                  </div>
                </button>
              </div>

              {/* Card Meta & Controls */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  {editingId === rec.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="flex-1 bg-[#181d28] border border-[#283244] rounded px-2 py-1 text-xs text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveTitle(rec.id)}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-slate-500 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className="text-xs font-semibold text-white line-clamp-1 cursor-pointer hover:text-indigo-400"
                        onClick={() => handlePlayRecording(rec)}
                      >
                        {rec.title}
                      </h3>
                      <button
                        onClick={() => {
                          setEditingId(rec.id);
                          setEditingTitle(rec.title);
                        }}
                        className="p-1 text-slate-500 hover:text-slate-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Clean unboxed metadata with separators (Anti-slop) */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
                    <span>{rec.resolution}</span>
                    <span aria-hidden="true">·</span>
                    <span>{rec.fps} FPS</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatSize(rec.sizeBytes)}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-[#1b202a] text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDownloadDirect(rec)}
                      className="p-1.5 rounded hover:bg-[#1a1f2b] text-slate-300 hover:text-white transition-colors"
                      title="Download Original Recording"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setExportModalRec(rec)}
                      className="p-1.5 rounded hover:bg-[#1a1f2b] text-indigo-400 hover:text-indigo-300 transition-colors"
                      title="Reformat for Social Media (9:16 / 1:1)"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleExtractAudio(rec)}
                      className="p-1.5 rounded hover:bg-[#1a1f2b] text-purple-400 hover:text-purple-300 transition-colors"
                      title="Extract Audio to WAV"
                    >
                      <Music className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setInspectRecording(rec)}
                      className="p-1.5 rounded hover:bg-[#1a1f2b] text-slate-400 hover:text-slate-200 transition-colors"
                      title="Inspect Technical Metadata"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(rec.id)}
                    className="p-1.5 rounded hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete recording"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Built-in Media Player Modal */}
      {activeRecording && activeBlobUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-[#12151e] border border-[#202737] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#1c2230] bg-[#0c0e14]">
              <div className="flex items-center gap-2.5">
                <Film className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-white">{activeRecording.title}</span>
              </div>
              <button
                onClick={handleClosePlayer}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#1a1f2c]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video bg-black flex items-center justify-center">
              <video
                src={activeBlobUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-4 bg-[#0e1118] flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-3 font-mono">
                <span>{activeRecording.resolution}</span>
                <span>·</span>
                <span>{activeRecording.fps} FPS</span>
                <span>·</span>
                <span>{formatSize(activeRecording.sizeBytes)}</span>
                <span>·</span>
                <span>{activeRecording.mimeType}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadDirect(activeRecording)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reformat & Social Export Modal */}
      {exportModalRec && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#131722] border border-[#21283a] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2536] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Export & Social Reformatting</h3>
              </div>
              <button
                onClick={() => setExportModalRec(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Transform <span className="text-white font-semibold">{exportModalRec.title}</span> into optimized aspect ratios for social networks.
            </p>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-semibold block">{t.aspectRatio}</label>
              <div className="space-y-2 text-xs">
                <button
                  onClick={() => setExportAspect('16:9')}
                  className={`w-full p-2.5 rounded-lg border text-left transition-colors ${
                    exportAspect === '16:9'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                      : 'bg-[#171c2a] border-[#222a3d] text-slate-300'
                  }`}
                >
                  <div className="font-semibold">{t.landscape169}</div>
                  <div className="text-[11px] text-slate-400">1920 × 1080 · Standard desktop & widescreen</div>
                </button>

                <button
                  onClick={() => setExportAspect('9:16')}
                  className={`w-full p-2.5 rounded-lg border text-left transition-colors ${
                    exportAspect === '9:16'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                      : 'bg-[#171c2a] border-[#222a3d] text-slate-300'
                  }`}
                >
                  <div className="font-semibold">{t.vertical916}</div>
                  <div className="text-[11px] text-slate-400">1080 × 1920 · Centered with blurred background</div>
                </button>

                <button
                  onClick={() => setExportAspect('1:1')}
                  className={`w-full p-2.5 rounded-lg border text-left transition-colors ${
                    exportAspect === '1:1'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                      : 'bg-[#171c2a] border-[#222a3d] text-slate-300'
                  }`}
                >
                  <div className="font-semibold">{t.square11}</div>
                  <div className="text-[11px] text-slate-400">1080 × 1080 · Feed carousels & squares</div>
                </button>
              </div>
            </div>

            {exportProgress && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>{exportProgress.stage}</span>
                  <span className="font-mono">{exportProgress.progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-[#0c0e14] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-200 rounded-full"
                    style={{ width: `${exportProgress.progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e2536]">
              <button
                onClick={() => setExportModalRec(null)}
                className="px-4 py-2 rounded-lg bg-[#181d2a] hover:bg-[#202738] text-slate-300 text-xs font-semibold"
                disabled={exportProgress?.isExporting}
              >
                Cancel
              </button>
              <button
                onClick={handleRunReformatExport}
                disabled={exportProgress?.isExporting}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
              >
                {exportProgress?.isExporting ? 'Exporting...' : 'Render & Download'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Technical Metadata Inspector Modal */}
      {inspectRecording && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#131722] border border-[#21283a] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2536] pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Technical Container Inspector</h3>
              </div>
              <button
                onClick={() => setInspectRecording(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono bg-[#0c0e14] p-3 rounded-xl border border-[#1b202c]">
              <div className="flex justify-between py-1 border-b border-[#191f2c]">
                <span className="text-slate-500">File ID</span>
                <span className="text-slate-300">{inspectRecording.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#191f2c]">
                <span className="text-slate-500">MIME Container</span>
                <span className="text-indigo-400">{inspectRecording.mimeType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#191f2c]">
                <span className="text-slate-500">Video Canvas</span>
                <span className="text-slate-300">{inspectRecording.resolution}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#191f2c]">
                <span className="text-slate-500">Frame Cadence</span>
                <span className="text-slate-300">{inspectRecording.fps} FPS</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#191f2c]">
                <span className="text-slate-500">Duration</span>
                <span className="text-slate-300">{inspectRecording.duration}s ({formatDuration(inspectRecording.duration)})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#191f2c]">
                <span className="text-slate-500">Payload Size</span>
                <span className="text-slate-300">{formatSize(inspectRecording.sizeBytes)} ({inspectRecording.sizeBytes} B)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Audio Track</span>
                <span className="text-purple-400">Opus 48000Hz Stereo</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setInspectRecording(null)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
