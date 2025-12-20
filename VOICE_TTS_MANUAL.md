# 🎤 Voice TTS System - Manual Użytkownika

## **Status**: ✅ UKOŃCZONY (2025-06-25)

**Kompletny przewodnik użytkowania systemu Voice Text-to-Speech w CRM-GTD Smart.**

---

## 📋 **Spis treści**

1. [🎯 Przegląd systemu](#przegląd-systemu)
2. [🚀 Jak używać w Smart Mailboxes](#jak-używać-w-smart-mailboxes)
3. [⚙️ Parametry i konfiguracja](#parametry-i-konfiguracja)
4. [🔧 API Endpoints dla deweloperów](#api-endpoints-dla-deweloperów)
5. [🧪 Testowanie systemu](#testowanie-systemu)
6. [🔍 Troubleshooting](#troubleshooting)
7. [🚀 Roadmap i rozszerzenia](#roadmap-i-rozszerzenia)

---

## 🎯 **Przegląd systemu**

Voice TTS System umożliwia **czytanie wiadomości na głos** w Smart Mailboxes oraz zaawansowaną syntezę mowy przez REST API.

### **🏗️ Architektura:**
- **Frontend**: Web Speech API (speechSynthesis)
- **Backend**: REST API z CoquiTTSService
- **Docker**: Mock TTS Service (crm-voice-tts-v1)
- **Network**: Komunikacja przez crm-v1-network

### **🌟 Główne funkcje:**
- ✅ **Czytanie wiadomości** na głos w Smart Mailboxes
- ✅ **Start/Stop controls** - pełna kontrola odtwarzania
- ✅ **Polski język** - automatyczne rozpoznawanie
- ✅ **Toast notifications** - feedback dla użytkownika
- ✅ **Error handling** - obsługa błędów przeglądarki
- ✅ **REST API** - dla zaawansowanych zastosowań

---

## 🚀 **Jak używać w Smart Mailboxes**

### **🎯 Krok po kroku:**

#### **1. Otwórz Smart Mailboxes**
```
URL: http://91.99.50.80/crm/dashboard/smart-mailboxes/
Menu: Komunikacja → Smart Mailboxes
```

#### **2. Wybierz wiadomość**
- Kliknij na **dowolną wiadomość** w liście
- Rozwinie się **okno podglądu** pod wiadomością
- Zobaczysz **action buttons** na dole

#### **3. Użyj Voice TTS**
- **🔊 Przeczytaj** - rozpoczyna czytanie temat + treść
- **⏹️ Stop** - zatrzymuje czytanie w dowolnym momencie

#### **4. Obserwuj feedback**
- **Toast success**: "Rozpoczęto czytanie wiadomości"
- **Toast info**: "Zatrzymano czytanie wiadomości"  
- **Toast error**: "Przeglądarka nie obsługuje syntezy mowy"

### **🎨 UI/UX Features:**

#### **Przyciski TTS:**
- **🔊 Przeczytaj**: Kolor indigo, hover effect
- **⏹️ Stop**: Kolor pomarańczowy, hover effect
- **Tooltips**: Opisowe podpowiedzi przy hover
- **Responsive**: Dostosowują się do ekranu

#### **Smart behavior:**
- **Auto-stop poprzedniego** - zatrzymuje aktualne czytanie przed nowym
- **Escape HTML** - bezpieczne czytanie treści HTML
- **Empty content handling** - obsługa pustych wiadomości

---

## ⚙️ **Parametry i konfiguracja**

### **🎵 Domyślne parametry TTS:**
```javascript
utterance.lang = 'pl-PL';      // Polski język
utterance.rate = 0.9;          // Prędkość (nieco wolniej)
utterance.pitch = 1;           // Wysokość (normalna)
utterance.volume = 0.8;        // Głośność (80%)
```

### **🎭 Dostępne emocje (API):**
- `neutral` - Neutralny (domyślny)
- `happy` - Szczęśliwy  
- `sad` - Smutny
- `angry` - Zły/sarkastyczny
- `surprised` - Zaskoczony

### **⚡ Personality Levels (API):**
- `1-2` - Bardzo spokojny
- `3-4` - Neutralny
- `5-6` - Przyjazny (domyślny w UI)
- `7-8` - Energiczny
- `9-10` - Sarkastyczny

### **🌍 Obsługiwane języki:**
- `pl-PL` - Polski (domyślny w UI)
- `en-US` - Angielski (dostępny przez API)

---

## 🔧 **API Endpoints dla deweloperów**

### **🌐 Public Test Endpoint (bez autoryzacji):**
```bash
POST /api/v1/voice/test-synthesis-public
Content-Type: application/json

{
  "text": "Tekst do przeczytania"
}

# Response:
{
  "success": true,
  "data": {
    "audioSize": 180854,
    "duration": 4.1,
    "sampleRate": 22050,
    "format": "wav",
    "base64Audio": "UklGRm7CAgBXQVZFZm10..."
  }
}
```

### **🔐 Authorized Endpoints (z tokenem):**

#### **Basic Synthesis:**
```bash
POST /api/v1/voice/synthesize
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Tekst do syntezy",
  "language": "pl",
  "personalityLevel": 7,
  "emotion": "happy",
  "speed": 1.2
}
```

#### **Health Check:**
```bash
GET /api/v1/voice/health
Authorization: Bearer <token>

# Response:
{
  "success": true,
  "data": {
    "ttsService": "healthy",
    "timestamp": "2025-06-25T21:00:00.000Z"
  }
}
```

#### **Available Models:**
```bash
GET /api/v1/voice/models
Authorization: Bearer <token>

# Response:
{
  "success": true,
  "data": {
    "models": [
      {
        "name": "mock-tts-pl",
        "language": "pl",
        "description": "Mock Polish TTS (Development)"
      }
    ],
    "count": 2
  }
}
```

### **🎭 Direct Mock TTS Service:**
```bash
# Bezpośrednie wywołanie TTS service
POST http://localhost:5002/api/tts
Content-Type: multipart/form-data

text=Witaj w systemie CRM
language=pl
emotion=happy

# Response: Binary WAV audio data
```

---

## 🧪 **Testowanie systemu**

### **🔍 Quick Tests:**

#### **1. Test UI w przeglądarce:**
```
1. Otwórz: http://91.99.50.80/crm/dashboard/smart-mailboxes/
2. Kliknij dowolną wiadomość
3. Kliknij "🔊 Przeczytaj"
4. Sprawdź czy słyszysz czytanie
5. Kliknij "⏹️ Stop" żeby zatrzymać
```

#### **2. Test API przez curl:**
```bash
# Test podstawowy
curl -X POST "http://91.99.50.80/crm/api/v1/voice/test-synthesis-public" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test systemu TTS"}' | jq

# Test health
curl -s "http://localhost:5002/health" | jq

# Test z zapisem do pliku
curl -X POST "http://localhost:5002/api/tts" \
  -F "text=Test audio" \
  -F "language=pl" \
  -o /tmp/test_audio.wav
```

#### **3. Test różnych emocji:**
```bash
# Szczęśliwy
curl -X POST "http://localhost:5002/api/tts" \
  -F "text=Jestem bardzo szczesliwy" \
  -F "emotion=happy" \
  -o /tmp/happy.wav

# Sarkastyczny  
curl -X POST "http://localhost:5002/api/tts" \
  -F "text=To brzmi sarkastycznie" \
  -F "emotion=angry" \
  -o /tmp/sarcastic.wav
```

### **✅ Expected Results:**
- **API calls**: Status 200, JSON response z `success: true`
- **Audio size**: 75-200KB dla krótkich tekstów (1-5 sekund)
- **Sample rate**: 22050 Hz
- **Format**: WAV, 16-bit, Mono
- **UI**: Toast notifications, słyszalne czytanie

---

## 🔍 **Troubleshooting**

### **❌ Najczęstsze problemy:**

#### **Problem**: Nie słyszę czytania w przeglądarce
**Rozwiązania:**
```
✅ Sprawdź głośniki/słuchawki
✅ Sprawdź czy przeglądarka obsługuje Web Speech API
✅ Sprawdź czy strona ma pozwolenie na audio
✅ Sprawdź Console DevTools czy są błędy
✅ Spróbuj innej przeglądarki (Chrome/Firefox/Edge)
```

#### **Problem**: Toast error "Przeglądarka nie obsługuje syntezy mowy"
**Rozwiązania:**
```
✅ Użyj najnowszej wersji Chrome/Firefox/Edge
✅ Sprawdź czy speechSynthesis jest dostępne: typeof speechSynthesis !== 'undefined'
✅ Sprawdź czy HTTPS jest włączony (dla niektórych przeglądarek)
```

#### **Problem**: API zwraca 500 error
**Rozwiązania:**
```bash
# Sprawdź status kontenerów
docker ps | grep voice-tts

# Sprawdź logi TTS service
docker logs crm-voice-tts-v1 --tail 20

# Sprawdź logi backend
docker logs crm-backend-v1 --tail 20

# Restart services
docker restart crm-voice-tts-v1 crm-backend-v1
```

#### **Problem**: Przyciski TTS nie są widoczne
**Rozwiązania:**
```bash
# Sprawdź czy frontend został zrestartowany
docker restart crm-frontend-v1

# Sprawdź czy zmiany w kodzie zostały załadowane
curl -s http://91.99.50.80/crm/dashboard/smart-mailboxes/ | grep "Przeczytaj"

# Clear browser cache i refresh
```

### **🔧 Debug Commands:**

#### **Check Services Status:**
```bash
# Sprawdź wszystkie kontenery
docker ps | grep crm

# Test connectivity
curl -s http://localhost:5002/health
curl -s http://localhost:3003/health

# Check Docker network
docker network inspect crm-v1-network
```

#### **Check Logs:**
```bash
# TTS Service logs
docker logs crm-voice-tts-v1 --tail 50

# Backend logs dla voice routes
docker logs crm-backend-v1 | grep TTS

# Frontend logs
docker logs crm-frontend-v1 --tail 20
```

---

## 🚀 **Roadmap i rozszerzenia**

### **📋 Phase 2 - Zaawansowane funkcje:**

#### **🎯 Real Coqui TTS Integration:**
```bash
# Upgrade z mock na prawdziwy Coqui TTS
docker-compose -f docker-compose.v1.yml down voice-tts-v1
# Zmień dockerfile na Dockerfile.coqui-tts  
docker-compose -f docker-compose.v1.yml up -d voice-tts-v1
```

#### **🎤 Voice Commands:**
- **Speech-to-Text** - rozpoznawanie komend głosowych
- **Voice Navigation** - nawigacja głosowa po systemie
- **Voice Compose** - dyktowanie odpowiedzi na maile

#### **📚 Bulk TTS Features:**
- **Queue reading** - czytanie wielu wiadomości z kolejki
- **Playlist mode** - automatyczne przejście do następnej
- **Speed controls** - regulacja prędkości czytania w UI

### **📋 Phase 3 - AI Integration:**

#### **🤖 AI Voice Personality:**
```javascript
// Integracja z AI personality levels
const aiResponse = await getAIPersonalityLevel(user.id);
await synthesizeWithPersonality(text, aiResponse.level, 'pl');
```

#### **👥 Custom Voice Profiles:**
- **User voice preferences** - zapisane ustawienia głosu
- **Voice cloning** - personalizowane głosy użytkowników
- **Context-aware** - różne głosy dla różnych typów wiadomości

#### **📊 Voice Analytics:**
- **Usage statistics** - statystyki użycia funkcji voice
- **User preferences** - analiza preferencji głosowych
- **Performance metrics** - optymalizacja jakości TTS

### **🔧 Technical Improvements:**

#### **Performance:**
- **Caching** - cache dla często czytanych tekstów
- **Streaming** - real-time synthesis dla długich tekstów
- **Background processing** - pre-generation audio dla ważnych wiadomości

#### **Quality:**
- **SSML support** - zaawansowane formatowanie mowy
- **Neural voices** - wysokiej jakości głosy AI
- **Accent detection** - automatyczna detakcja akcentu tekstu

---

## 📞 **Wsparcie i kontakt**

### **🔧 Debug Self-Service:**
```bash
# Quick health check
curl -s http://localhost:5002/health && echo "✅ TTS Service OK"
curl -s http://localhost:3003/health && echo "✅ Backend OK"

# Quick test
curl -X POST "http://91.99.50.80/crm/api/v1/voice/test-synthesis-public" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test"}' | jq .success
```

### **📚 Dokumentacja:**
- **Główna dokumentacja**: `/opt/crm-gtd-smart/CLAUDE.md` (sekcja Voice TTS)
- **API Reference**: `/opt/crm-gtd-smart/packages/backend/src/routes/voice.ts`
- **Frontend kod**: `/opt/crm-gtd-smart/packages/frontend/src/app/dashboard/smart-mailboxes/page.tsx`

### **🛠️ Restart Commands:**
```bash
# Restart całego systemu voice
docker restart crm-voice-tts-v1 crm-backend-v1 crm-frontend-v1

# Test po restarcie
sleep 10 && curl -s http://91.99.50.80/crm/dashboard/smart-mailboxes/ > /dev/null && echo "✅ System OK"
```

---

## ✅ **Podsumowanie**

**Voice TTS System jest w pełni funkcjonalny i gotowy do użycia!**

### **🎯 Kluczowe punkty:**
1. **Smart Mailboxes** - przyciski 🔊 Przeczytaj i ⏹️ Stop
2. **REST API** - endpoints dla deweloperów  
3. **Mock TTS Service** - działający backend w Docker
4. **Web Speech API** - frontend integration
5. **Polski język** - pełne wsparcie pl-PL

### **🚀 Jak zacząć:**
1. Otwórz Smart Mailboxes
2. Kliknij wiadomość 
3. Kliknij "🔊 Przeczytaj"
4. Ciesz się czytaniem na głos!

**Voice TTS System ready to use! 🎤✨**

---

*Ostatnia aktualizacja: 2025-06-25*
*Wersja: 1.0.0*
*Status: Production Ready*