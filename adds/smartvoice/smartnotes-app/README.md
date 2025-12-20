# SmartNotes AI - Inteligentne Notatki Głosowe

Nowoczesna aplikacja web do inteligentnych notatek głosowych z funkcjami AI.

## 🚀 Deployment

Aplikacja jest gotowa do deploymentu na platformach hostingowych.

### Vercel (Zalecane)

1. Zaloguj się na [vercel.com](https://vercel.com)
2. Kliknij "New Project"
3. Importuj ten repository
4. Vercel automatycznie wykryje ustawienia
5. Kliknij "Deploy"

### Netlify

1. Zaloguj się na [netlify.com](https://netlify.com)
2. Przeciągnij folder `dist` lub połącz z Git
3. Build command: `npm run build`
4. Publish directory: `dist`

### GitHub Pages

```bash
npm run build
# Następnie prześlij zawartość folderu dist na gh-pages branch
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server (localhost only)
npm run dev

# Start development server (accessible in local network)
npm run dev:network

# Build for production
npm run build

# Preview production build (localhost only)
npm run preview

# Preview production build (accessible in local network)
npm run preview:network

# Build and serve in local network (one command)
npm run serve
```

### 🌐 Local Network Access

Po uruchomieniu z flagą `--host 0.0.0.0` aplikacja będzie dostępna:

- **Localhost**: http://localhost:3000
- **Sieć lokalna**: http://192.168.1.17:3000 (lub inne IP z twojej sieci)
- **Wszystkie urządzenia** w tej samej sieci WiFi/LAN mogą dostać się do aplikacji

### Szybkie komendy:

```bash
# Development z dostępem sieciowym
npm run dev:network

# Production z dostępem sieciowym
npm run serve
```

## 📱 Features

### 🎙️ Nagrywanie Audio
- ✅ Web Audio API z mikrofonem
- ✅ Real-time audio visualization
- ✅ Pause/Resume podczas nagrywania
- ✅ Timer nagrywania
- ✅ Playback controls

### 🧠 AI Funkcje
- ✅ Automatyczna transkrypcja audio
- ✅ Generowanie streszczeń AI
- ✅ Wyodrębnianie kluczowych słów
- ✅ Rozpoznawanie mówców (symulacja)
- ✅ Ocena jakości transkrypcji

### 📝 Zarządzanie Notatkami
- ✅ Lista notatek z podglądem
- ✅ Edytor notatek z metadanymi
- ✅ Wyszukiwanie i filtrowanie
- ✅ System kategorii i tagów
- ✅ LocalStorage persistence

### 🎨 UI/UX
- ✅ Mobilny design (400px)
- ✅ Gradient background
- ✅ Animated icons
- ✅ Responsive design
- ✅ Accessibility support

## 🎨 Tech Stack

- React 18 + TypeScript
- Tailwind CSS
- Vite
- Lucide React Icons
- Zustand (state management)

## 📂 Struktura

```
src/
├── components/
│   ├── common/          # Komponenty wielokrotnego użytku
│   ├── comparison/      # Sekcja porównania
│   ├── cta/            # Call-to-action
│   └── layout/         # Layout komponenty
├── types/              # TypeScript typy
└── styles/             # Style CSS
```

## 🌐 Live Demo

Po deploymencie aplikacja będzie dostępna pod adresem wybranej platformy hostingowej.

### Szybki Deploy:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/smartnotes-app)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/smartnotes-app)