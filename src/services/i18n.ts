export type Language = 'en' | 'es';

export const translations = {
  en: {
    appName: 'VisionCast Studio',
    tagline: 'Professional Screen, Camera & Live Streaming Suite',
    
    // Nav
    navHome: 'Home',
    navStudio: 'Studio',
    navRecordings: 'Recordings',
    navStreaming: 'Live Streaming',
    navScenes: 'Scenes',
    navMedia: 'Media Library',
    navSettings: 'Settings',
    navHelp: 'Help & Native',

    // Status & Actions
    recording: 'Recording',
    streaming: 'Streaming',
    standby: 'Standby',
    startRecord: 'Start Recording',
    stopRecord: 'Stop Recording',
    pauseRecord: 'Pause',
    resumeRecord: 'Resume',
    goLive: 'Go Live',
    endLive: 'End Stream',
    livePreview: 'Live Output Preview',
    
    // Modes
    modeScreenCam: 'Screen + Camera',
    modeScreenOnly: 'Screen Only',
    modeCameraOnly: 'Camera Only',
    modePresenter: 'Presenter Mode',

    // Camera controls
    cameraLayout: 'Camera Overlay',
    cameraShape: 'Shape',
    shapeCircle: 'Circular',
    shapeRect: 'Rectangle',
    shapeSquircle: 'Squircle',
    cameraPosition: 'Position',
    flipHorizontal: 'Mirror Selfie',
    hideCamera: 'Hide Camera',
    showCamera: 'Show Camera',
    switchCamera: 'Switch (Front/Rear)',
    cameraOpacity: 'Opacity',
    cameraSize: 'Size',
    cameraZoom: 'Zoom Framing',

    // Audio Mixer
    audioMixer: 'Audio Mixer',
    micSource: 'Microphone',
    systemSource: 'System Audio',
    mediaSource: 'Media Sound',
    mute: 'Mute',
    unmute: 'Unmute',
    gain: 'Gain',
    volume: 'Volume',
    pan: 'Balance L/R',
    highPass: 'High-Pass Filter (80Hz)',
    compressor: 'Vocal Compressor',
    noiseGate: 'Noise Gate',
    peak: 'Peak',
    clipping: 'Clip',

    // Scenes
    scenesTitle: 'Production Scenes',
    transition: 'Transition',
    transCut: 'Cut',
    transFade: 'Fade',
    transSlide: 'Slide',
    newScene: 'New Scene',

    // Overlays
    overlaysTitle: 'Visual Overlays',
    addOverlay: 'Add Overlay',
    lowerThird: 'Lower Third',
    customText: 'Text Title',
    logoWatermark: 'Logo / Watermark',
    streamTimer: 'Broadcast Timer',
    clickableLink: 'Website Link',
    socialHandle: 'Social Handle',

    // Streaming
    streamConsole: 'Live Streaming Console',
    streamPlatforms: 'Connected Platforms',
    addPlatform: 'Add Platform',
    streamKey: 'Stream Key',
    rtmpServer: 'RTMP Server URL',
    bitrate: 'Bitrate',
    fps: 'FPS',
    droppedFrames: 'Dropped Frames',
    networkHealth: 'Network Quality',
    liveChat: 'Live Chat & Audience Dock',
    sendToOverlay: 'Send to Lower Third',

    // Recordings
    recordingsTitle: 'Multimedia Recordings Library',
    searchRecordings: 'Search recordings...',
    filterAll: 'All Files',
    filterFavorites: 'Favorites',
    duration: 'Duration',
    fileSize: 'File Size',
    exportVideo: 'Export / Download',
    deleteRecording: 'Delete',
    renameRecording: 'Rename',
    noRecordingsYet: 'No recordings saved yet. Start a session in Studio to record.',
    
    // Export suite
    aspectRatio: 'Aspect Ratio',
    landscape169: '16:9 Landscape (YouTube / Twitch)',
    vertical916: '9:16 Vertical (TikTok / Reels / Shorts)',
    square11: '1:1 Square (Instagram Feed)',
    extractAudio: 'Extract Audio (WAV / WebM)',

    // Storage
    storageUsed: 'Local Storage Quota',
    available: 'Available',
    unlimitedDiskNote: 'Recordings stream directly to local disk storage via IndexedDB/FileSystem.',

    // Settings
    settingsTitle: 'Studio & Engine Settings',
    videoSettings: 'Video & Encoding',
    audioSettings: 'Audio & DSP',
    hotkeys: 'Keyboard Shortcuts',
    language: 'Interface Language',

    // Native & Tests
    nativeTitle: 'Multiplatform Architecture & Diagnostics',
    runHardwareDiagnostics: 'Run Hardware & Codec Diagnostics',
    testResults: 'Diagnostics Report',
    electronArchitecture: 'Desktop (Electron / Windows WASAPI & ScreenCaptureKit)',
    androidArchitecture: 'Android (Kotlin MediaProjection & CameraX)',
    iosArchitecture: 'iOS (Swift ReplayKit & AVFoundation)',
    ffmpegGenerator: 'FFmpeg Command Line Utility',
  },
  es: {
    appName: 'VisionCast Studio',
    tagline: 'Suite Profesional de Grabación de Pantalla, Cámara y Transmisión en Vivo',
    
    // Nav
    navHome: 'Inicio',
    navStudio: 'Estudio',
    navRecordings: 'Grabaciones',
    navStreaming: 'En Vivo',
    navScenes: 'Escenas',
    navMedia: 'Biblioteca Multimedia',
    navSettings: 'Ajustes',
    navHelp: 'Ayuda y Nativo',

    // Status & Actions
    recording: 'Grabando',
    streaming: 'Transmitiendo',
    standby: 'En Espera',
    startRecord: 'Iniciar Grabación',
    stopRecord: 'Detener Grabación',
    pauseRecord: 'Pausar',
    resumeRecord: 'Reanudar',
    goLive: 'Transmitir En Vivo',
    endLive: 'Finalizar Emisión',
    livePreview: 'Vista Previa de Salida',

    // Modes
    modeScreenCam: 'Pantalla + Cámara',
    modeScreenOnly: 'Solo Pantalla',
    modeCameraOnly: 'Solo Cámara',
    modePresenter: 'Modo Presentador',

    // Camera controls
    cameraLayout: 'Superposición de Cámara',
    cameraShape: 'Forma',
    shapeCircle: 'Circular',
    shapeRect: 'Rectangular',
    shapeSquircle: 'Super-elipse',
    cameraPosition: 'Posición',
    flipHorizontal: 'Efecto Espejo',
    hideCamera: 'Ocultar Cámara',
    showCamera: 'Mostrar Cámara',
    switchCamera: 'Cambiar Cámara (Frontal/Trasera)',
    cameraOpacity: 'Opacidad',
    cameraSize: 'Tamaño',
    cameraZoom: 'Encuadre / Zoom',

    // Audio Mixer
    audioMixer: 'Mezclador de Audio',
    micSource: 'Micrófono',
    systemSource: 'Audio del Sistema',
    mediaSource: 'Audio Multimedia',
    mute: 'Silenciar',
    unmute: 'Activar Sonido',
    gain: 'Ganancia',
    volume: 'Volumen',
    pan: 'Balance I/D',
    highPass: 'Filtro Paso Alto (80Hz)',
    compressor: 'Compresor Vocal',
    noiseGate: 'Compuerta de Ruido',
    peak: 'Pico',
    clipping: 'Saturación',

    // Scenes
    scenesTitle: 'Escenas de Producción',
    transition: 'Transición',
    transCut: 'Corte Directo',
    transFade: 'Fundido',
    transSlide: 'Desplazamiento',
    newScene: 'Nueva Escena',

    // Overlays
    overlaysTitle: 'Elementos Visuales',
    addOverlay: 'Añadir Elemento',
    lowerThird: 'Tercio Inferior (Lower Third)',
    customText: 'Título / Texto',
    logoWatermark: 'Logo / Marca de Agua',
    streamTimer: 'Temporizador de Emisión',
    clickableLink: 'Enlace Web',
    socialHandle: 'Red Social',

    // Streaming
    streamConsole: 'Consola de Transmisión en Vivo',
    streamPlatforms: 'Plataformas Conectadas',
    addPlatform: 'Añadir Plataforma',
    streamKey: 'Clave de Transmisión',
    rtmpServer: 'URL Servidor RTMP',
    bitrate: 'Tasa de Bits',
    fps: 'FPS',
    droppedFrames: 'Cuadros Perdidos',
    networkHealth: 'Calidad de Red',
    liveChat: 'Chat en Vivo y Audiencia',
    sendToOverlay: 'Enviar al Tercio Inferior',

    // Recordings
    recordingsTitle: 'Biblioteca de Grabaciones Multimedia',
    searchRecordings: 'Buscar grabaciones...',
    filterAll: 'Todos los Archivos',
    filterFavorites: 'Favoritos',
    duration: 'Duración',
    fileSize: 'Tamaño',
    exportVideo: 'Exportar / Descargar',
    deleteRecording: 'Eliminar',
    renameRecording: 'Renombrar',
    noRecordingsYet: 'Aún no hay grabaciones guardadas. Inicia una sesión en el Estudio para grabar.',

    // Export suite
    aspectRatio: 'Relación de Aspecto',
    landscape169: '16:9 Horizontal (YouTube / Twitch)',
    vertical916: '9:16 Vertical (TikTok / Reels / Shorts)',
    square11: '1:1 Cuadrado (Instagram)',
    extractAudio: 'Extraer Audio (WAV / WebM)',

    // Storage
    storageUsed: 'Cuota de Almacenamiento Local',
    available: 'Disponible',
    unlimitedDiskNote: 'Las grabaciones se guardan progresivamente en disco local mediante IndexedDB/FileSystem.',

    // Settings
    settingsTitle: 'Ajustes del Estudio y Motor',
    videoSettings: 'Video y Codificación',
    audioSettings: 'Audio y Procesamiento DSP',
    hotkeys: 'Atajos de Teclado',
    language: 'Idioma de Interfaz',

    // Native & Tests
    nativeTitle: 'Arquitectura Multiplataforma y Diagnósticos',
    runHardwareDiagnostics: 'Ejecutar Diagnóstico de Hardware y Códecs',
    testResults: 'Informe de Diagnóstico',
    electronArchitecture: 'Escritorio (Electron / Windows WASAPI y ScreenCaptureKit)',
    androidArchitecture: 'Android (Kotlin MediaProjection y CameraX)',
    iosArchitecture: 'iOS (Swift ReplayKit y AVFoundation)',
    ffmpegGenerator: 'Generador de Comandos FFmpeg',
  }
};
