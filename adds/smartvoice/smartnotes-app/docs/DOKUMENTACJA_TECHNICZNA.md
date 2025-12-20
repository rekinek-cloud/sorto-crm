# 🔧 SmartNotes AI - Dokumentacja Techniczna

## 📋 Przegląd Architektury

SmartNotes AI to aplikacja React + TypeScript zbudowana z Vite, wykorzystująca Web Audio API do nagrywania dźwięku i LocalStorage do przechowywania danych.

### Tech Stack
- **Frontend**: React 18.3+ z TypeScript
- **Build Tool**: Vite 6.3+
- **Styling**: Tailwind CSS 4.1+
- **State Management**: Zustand 5.0+
- **Icons**: Lucide React 0.517+
- **Audio Processing**: Web Audio API
- **Storage**: Browser LocalStorage

## 🏗️ Struktura Projektu

```
smartnotes-app/
├── public/                     # Static assets
│   └── vite.svg               # Vite logo
├── src/
│   ├── components/            # React components
│   │   ├── common/           # Reusable components
│   │   │   ├── AppIcon.tsx   # App icons (smart/traditional)
│   │   │   ├── Button.tsx    # Custom button component
│   │   │   └── Header.tsx    # App header with navigation
│   │   ├── comparison/       # Landing page comparison
│   │   │   ├── AppColumn.tsx # Feature comparison column
│   │   │   ├── ComparisonView.tsx # Main comparison view
│   │   │   └── FeatureList.tsx # Features list component
│   │   ├── cta/             # Call-to-action components
│   │   │   └── CTASection.tsx # Installation CTA
│   │   ├── layout/          # Layout components
│   │   │   └── MobileLayout.tsx # Mobile-first layout
│   │   ├── notes/           # Notes management
│   │   │   ├── NoteEditor.tsx   # Note editing interface
│   │   │   ├── NotesList.tsx    # Notes list view
│   │   │   └── NotesSearch.tsx  # Search and filters
│   │   ├── recording/       # Audio recording
│   │   │   ├── AudioVisualizer.tsx # Real-time audio visualization
│   │   │   └── VoiceRecorder.tsx   # Recording controls
│   │   └── transcription/   # AI transcription
│   │       └── TranscriptionView.tsx # Transcription interface
│   ├── hooks/               # Custom React hooks
│   │   ├── useAudioRecording.ts # Audio recording logic
│   │   └── useLocalStorage.ts   # LocalStorage persistence
│   ├── store/               # Global state management
│   │   └── notesStore.ts    # Zustand store for notes
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts         # All interface definitions
│   ├── utils/               # Utility functions
│   │   └── transcription.ts # Mock AI transcription service
│   ├── views/               # Main application views
│   │   └── MainView.tsx     # Primary app interface
│   ├── App.tsx              # Root component
│   ├── index.css            # Global styles + Tailwind
│   └── main.tsx             # React DOM entry point
├── docs/                    # Documentation
├── dist/                    # Production build output
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── netlify.toml             # Netlify deployment config
├── vercel.json              # Vercel deployment config
├── server.pem               # Self-signed SSL certificate
├── start-https.py           # HTTPS development server
└── README.md                # Project documentation
```

## 🔧 Architektura Komponentów

### Główne widoki (Views)
- **Landing Page** - Porównanie funkcji i CTA instalacji
- **Main App** - Pełna aplikacja po "instalacji"

### Hierarchia komponentów:
```
App
├── MobileLayout (Landing)
│   ├── Header
│   ├── ComparisonView
│   │   ├── AppColumn
│   │   │   └── FeatureList
│   │   └── AppIcon
│   └── CTASection
└── MainView (Full App)
    ├── Header Controls
    ├── VoiceRecorder
    │   └── AudioVisualizer
    ├── TranscriptionView
    ├── NotesList
    │   └── NotesSearch
    └── NoteEditor
```

## 📡 API i Serwisy

### Mock AI Services (`src/utils/transcription.ts`)

#### `transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult>`
- Symuluje transkrypcję audio na tekst
- Zwraca losowy tekst z przykładów
- Delay: 2-5 sekund (symulacja API)

#### `generateSummary(text: string): Promise<string>`
- Generuje streszczenie z transkrypcji
- Zwraca losowe streszczenie
- Delay: 1.5 sekundy

#### `extractKeywords(text: string): string[]`
- Wyodrębnia kluczowe słowa z tekstu
- Filtruje popularne słowa polskie
- Zwraca maksymalnie 5 słów kluczowych

### Web Audio API Integration

#### Audio Recording Hook (`src/hooks/useAudioRecording.ts`)
```typescript
interface AudioRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
  isSupported: boolean;
}
```

**Funkcjonalności:**
- `startRecording()` - Rozpoczyna nagrywanie z MediaRecorder
- `stopRecording()` - Kończy i zapisuje nagranie
- `pauseRecording()` / `resumeRecording()` - Kontrola pauzy
- `clearRecording()` - Czyszczenie danych nagrania

**Konfiguracja audio:**
```typescript
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm;codecs=opus'
});

const constraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100,
  }
};
```

## 🗄️ Zarządzanie Stanem

### Zustand Store (`src/store/notesStore.ts`)

#### State Interface:
```typescript
interface NotesState {
  notes: Note[];
  currentNote: Note | null;
  searchQuery: string;
  selectedCategory: string;
  isLoading: boolean;
}
```

#### Actions:
- **CRUD Operations**: `addNote`, `updateNote`, `deleteNote`
- **Search & Filter**: `setSearchQuery`, `setSelectedCategory`
- **Computed Values**: `getFilteredNotes`, `getCategories`
- **Utility**: `clearAllNotes`, `exportNotes`, `importNotes`

#### Persistence:
```typescript
persist(
  (set, get) => ({ /* state logic */ }),
  {
    name: 'smartnotes-storage',
    partialize: (state) => ({
      notes: state.notes,
      selectedCategory: state.selectedCategory,
    }),
  }
)
```

## 🎨 Styling i UI

### Tailwind CSS Configuration
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        50: '#f0f9ff',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
      },
    },
    maxWidth: {
      'mobile': '400px',
    },
    animation: {
      'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      'fade-in': 'fadeIn 0.5s ease-in-out',
    },
  },
}
```

### Custom CSS Classes
- `.pulse-gradient` - Animacja gradientu dla smart icon
- Responsive breakpoints dla mobile-first design
- Custom scrollbar styling

## 🔊 Audio Processing

### AudioVisualizer Component
- Real-time frequency analysis z Web Audio API
- Canvas-based visualization
- Gradient bars odpowiadające częstotliwościom audio

```typescript
const analyser = audioContext.createAnalyser();
analyser.fftSize = 256;
const dataArray = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteFrequencyData(dataArray);
```

### MediaRecorder Configuration
- **Format**: WebM z Opus codec
- **Chunk Size**: 100ms intervals
- **Quality**: High-quality audio recording
- **Browser Support**: Chrome, Firefox, Safari, Edge

## 💾 Data Models

### Note Interface
```typescript
interface Note {
  id: string;                 // Unique identifier
  title: string;              // User-defined title
  content: string;            // Note text content
  recording?: Recording;      // Optional audio recording
  timestamp: Date;            // Creation date
  lastModified: Date;         // Last edit date
  tags: string[];             // User and AI tags
  category?: string;          // Optional category
}
```

### Recording Interface
```typescript
interface Recording {
  id: string;                 // Unique identifier
  title: string;              // Recording title
  timestamp: Date;            // Recording date
  duration: number;           // Length in seconds
  audioUrl?: string;          // Blob URL for playback
  transcription?: string;     // AI-generated transcription
  summary?: string;           // AI-generated summary
  speakers?: string[];        // Identified speakers
  tags?: string[];            // AI-extracted keywords
}
```

## 🔧 Build i Deploy

### Development Scripts
```json
{
  "dev": "vite",                                    // Local development
  "dev:network": "vite --host 0.0.0.0",           // Network accessible
  "build": "tsc -b && vite build",                // Production build
  "preview": "vite preview",                       // Preview build
  "preview:network": "vite preview --host 0.0.0.0", // Network preview
  "serve": "npm run build && npm run preview:network" // Build + serve
}
```

### Production Build
- **TypeScript compilation** z strict mode
- **Vite bundling** z code splitting
- **CSS optimization** z Tailwind purging
- **Asset optimization** (images, fonts)

### Deployment Targets

#### Vercel
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

#### Netlify
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🌐 Network Configuration

### Local Development Servers

#### HTTP Server (Python)
```bash
python3 -m http.server 9999 --directory dist --bind 0.0.0.0
```

#### HTTPS Server (Custom Python)
```python
# start-https.py
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain('server.pem')
httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
```

### Security Considerations
- **Self-signed certificates** dla HTTPS development
- **CORS policy** skonfigurowany w Vite
- **Mikrofon permissions** wymagają secure context
- **LocalStorage** ograniczony do origin

## 🔍 Performance Optimizations

### Code Splitting
- Lazy loading komponentów głównych widoków
- Dynamic imports dla heavy dependencies
- Tree shaking nieużywanych dependencies

### Audio Optimizations
- **Chunk-based recording** (100ms intervals)
- **Memory management** dla audio blobs
- **Automatic cleanup** dla MediaStream tracks

### Storage Optimizations
- **Selective persistence** tylko wybranych state fields
- **JSON compression** dla large notes
- **Cleanup strategies** dla starych recordings

## 🧪 Testing Strategy

### Unit Testing Areas
- **Custom hooks** (useAudioRecording, useLocalStorage)
- **Utility functions** (transcription, audio processing)
- **Store actions** (CRUD operations, filters)

### Integration Testing
- **Audio recording flow** end-to-end
- **Note creation** z recording + transcription
- **Search and filter** functionality

### Browser Compatibility Testing
- **Web Audio API** support across browsers
- **MediaRecorder** compatibility
- **LocalStorage** persistence

## 🔐 Security & Privacy

### Data Handling
- **Local-only processing** - żadne dane nie opuszczają urządzenia
- **No external API calls** - wszystkie operacje AI symulowane
- **Browser storage only** - LocalStorage + IndexedDB

### Permissions Model
- **Mikrofon access** - tylko podczas nagrywania
- **Camera access** - nie wymagany
- **Location access** - nie używany

### Privacy Features
- **No tracking** - brak analytics zewnętrznych
- **No telemetry** - brak wysyłania danych użytkowania
- **Local AI** - symulacja bez zewnętrznych serwisów

## 🚀 Future Enhancements

### Planned Features
1. **Real AI Integration**
   - OpenAI Whisper API integration
   - Local Whisper model support
   - Custom transcription models

2. **Enhanced Audio**
   - Multiple audio formats support
   - Audio quality settings
   - Noise reduction algorithms

3. **Collaboration**
   - Real-time collaboration
   - Cloud synchronization
   - Sharing capabilities

4. **Advanced AI**
   - Sentiment analysis
   - Topic extraction
   - Meeting minutes generation

### Technical Improvements
- **PWA capabilities** z service workers
- **IndexedDB migration** od LocalStorage
- **WebAssembly** dla audio processing
- **WebRTC** dla real-time features

---

## 📞 Developer Contact

### Contributing Guidelines
1. Fork repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request

### Code Standards
- **TypeScript strict mode**
- **ESLint + Prettier** configuration
- **Semantic commit messages**
- **Component documentation**

---

**SmartNotes AI** - Profesjonalna aplikacja do inteligentnych notatek głosowych 🎙️🧠⚡