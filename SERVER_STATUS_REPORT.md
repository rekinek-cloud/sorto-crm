# Raport o Stanie Serwera Sorto-CRM

**Data wygenerowania**: 27 października 2025
**Uptime**: 25 dni, 19:52
**System**: Linux 5.4.0-216-generic

---

## 📊 Podsumowanie Zasobów

### Dysk
- **Użycie**: 56% (41G użyte / 32G wolne z 75G całkowitej przestrzeni)
- **Status**: ✅ Dostępne zasoby wystarczające

### Pamięć RAM
- **Całkowita**: 7.6Gi
- **Użyta**: 4.7Gi (62%)
- **Dostępna**: 2.5Gi
- **Status**: ✅ Wykorzystanie stabilne (po wyłączeniu Flyball +100MB)

### CPU
- **Load Average**: 1.94 (1-min), 1.75 (5-min), 1.74 (15-min)
- **Status**: ✅ Stabilne obciążenie

---

## 🐳 Kontenery Docker (14 uruchomionych)

| Nazwa | Status | Port | Uptime | Aplikacja |
|-------|--------|------|--------|-----------|
| rag-api | Up 45 hours | 8000 | 2 dni | RAG Service API |
| crm-backend-v1 | Up 8 days | 3003 | 8 dni | Sorto-CRM Backend |
| crm-frontend-v1 | Up 7 days | 9025 | 7 dni | Sorto-CRM Frontend |
| rag-celery-worker | Up 9 days | - | 9 dni | RAG Worker (sync) |
| rag-celery-beat | Up 9 days | - | 9 dni | RAG Scheduler |
| rag-redis | Up 9 days | 6383 | 9 dni | RAG Cache |
| rag-postgres | Up 9 days | 5437 | 9 dni | RAG Database |
| rag-qdrant | Up 9 days | 6333-6334 | 9 dni | RAG Vector DB |
| crm-postgres-v1 | Up 3 weeks | 5434 | 3 tygodnie | CRM Database |
| crm-redis-v1 | Up 3 weeks | 6381 | 3 tygodnie | CRM Cache |
| crm-voice-tts-v1 | Up 3 weeks | 5002 | 3 tygodnie | CRM Voice TTS |
| hrm-postgres-v1 | Up 3 weeks | 5435 | 3 tygodnie | HRM Database |
| hrm-redis-v1 | Up 3 weeks | 6382 | 3 tygodnie | HRM Cache |
| hrm-voice-tts-v1 | Up 3 weeks | 5003 | 3 tygodnie | HRM Voice TTS |

**Zauważenia**:
- Wszystkie kontenery działają stabilnie
- RAG Service niedawno restart (45h) - prawdopodobnie aktualizacja
- Pozostałe serwisy wysokie uptime (1-3 tygodnie)

---

## 🚀 Procesy PM2

**Status**: PM2 obecnie nie zarządza żadnymi procesami

**Historia**:
- Flyball został wyłączony 27 października 2025
- Przyczyna: Crash loop (585,044 restartów frontend, brak node_modules)
- Backup dostępny: `/opt/flyball/flyball_backup_2025-10-05.tar.gz` (208MB)
- Zwolnione zasoby: ~200MB RAM

---

## 💾 Obrazy Docker (Rozmiar całkowity: ~34GB)

| Repozytorium | Tag | Rozmiar | Uwagi |
|--------------|-----|---------|-------|
| rag-service | latest/cpu/v2 | 8.18GB (x3) | Główny obraz RAG |
| crm-gtd-smart-frontend-v1 | latest | 1.72GB | Frontend CRM |
| crm-gtd-smart-backend-v1 | latest | 1.83GB | Backend CRM |
| postgres | 15-alpine | 273MB | Lekka wersja |
| postgres | 14 | 426MB | Starsza wersja |
| qdrant/qdrant | latest | 157MB | Vector DB |
| redis | alpine | 41.4MB | Cache |
| crm-voice-tts-v1 | latest | 150MB | Voice synthesis |
| hrm-voice-tts-v1 | latest | 150MB | Voice synthesis |

---

## 📁 Aplikacje w /opt/

### Główne aplikacje:
1. **crm-gtd-smart/** - Sorto-CRM (główna aplikacja)
   - Frontend: Next.js + React + TypeScript
   - Backend: Node.js + Express + PostgreSQL
   - Funkcje: GTD, CRM, Smart Day Planner, Streamy

2. **rag-service/** - RAG Microservice
   - Framework: FastAPI + Python
   - Vector DB: Qdrant
   - AI: OpenAI GPT-4
   - Celery: Background tasks

3. **hrm/** - System HR (Human Resource Management)
   - Struktura: Frontend + Backend
   - Database: PostgreSQL (port 5435)

4. **flyball/**
   - Status: ❌ Wyłączony (27.10.2025)
   - Backup: flyball_backup_2025-10-05.tar.gz (208MB)
   - Powód wyłączenia: Crash loop, brakujące zależności

### Pliki konfiguracyjne:
- **mdk-integracja-dzwonki.js** - Integracja telefoniczna
- **mdk-integracja-test.js** - Testy integracji
- **package.json** - Zależności Node.js
- **package-lock.json** - Lock file npm

---

## 📦 Globalne Pakiety npm

```
@anthropic-ai/claude-code@2.0.27
axios@1.10.0
corepack@0.32.0
n@10.2.0
npm@10.9.2
pm2@6.0.8
```

---

## 🛠️ Wersje Narzędzi Deweloperskich

| Narzędzie | Wersja |
|-----------|--------|
| Docker | 28.1.1 (build 4eba377) |
| Docker Compose | v2.20.0 |
| Node.js | v22.16.0 |
| npm | 10.9.2 |
| Python | 3.8.10 |
| PM2 | 6.0.8 |

---

## 📚 Pakiety Systemowe

**Zainstalowanych pakietów systemowych**: 728

Główne kategorie:
- Podstawowe narzędzia Linux (coreutils, bash, vim, etc.)
- Biblioteki systemowe (libc, libssl, etc.)
- Narzędzia sieciowe (curl, wget, ssh, nginx)
- Kompilatory i build tools (gcc, make, etc.)
- Python i biblioteki (python3, pip, virtualenv)
- Node.js dependencies

---

## 🌐 Porty i Usługi

| Port | Usługa | Aplikacja |
|------|--------|-----------|
| 80 | Nginx | Reverse proxy |
| 443 | Nginx SSL | HTTPS |
| 3003 | Backend | CRM API |
| 9025 | Frontend | CRM Web UI |
| 8000 | RAG API | RAG Service |
| 5434 | PostgreSQL | CRM Database |
| 5437 | PostgreSQL | RAG Database |
| 5435 | PostgreSQL | HRM Database |
| 6333-6334 | Qdrant | Vector Database |
| 6381 | Redis | CRM Cache |
| 6382 | Redis | HRM Cache |
| 6383 | Redis | RAG Cache |
| 5002 | Voice TTS | CRM Voice |
| 5003 | Voice TTS | HRM Voice |

---

## 📈 Statystyki Danych (RAG Service)

- **Indexed Vectors**: 79,732
- **Companies**: 13,397
- **Contacts**: 277
- **Tasks**: 0 (w przygotowaniu)
- **Messages**: 0 (w przygotowaniu)
- **Activities**: 0 (w przygotowaniu)
- **Documents**: 0 (w przygotowaniu)
- **Leads**: 0 (w przygotowaniu)

---

## ⚠️ Rekomendacje

### Umiarkowane:
1. **RAM Usage** - Monitorowanie wykorzystania pamięci (62%)
   - Rozważyć dodanie 2-4GB RAM przy wzroście obciążenia
   - Obecne 2.5Gi dostępne po wyłączeniu Flyball (+100MB)

2. **Dysk** - 32GB wolne (56% użyte)
   - Wystarczające na kilka miesięcy
   - Planować czyszczenie starych logów i backupów
   - Rozważyć archiwizację starych danych

### Opcjonalne:
3. **Docker Images** - Czyszczenie nieużywanych obrazów
   - Obecne: ~34GB w obrazach
   - Potencjalnie można zwolnić 5-10GB

4. **PostgreSQL Versions** - Zunifikować wersje
   - Obecnie: PostgreSQL 14 i 15
   - Rozważyć migrację wszystkich do wersji 15-alpine (lżejsza)

---

## ✅ Wnioski

**Stan serwera: BARDZO DOBRY** ✅

- ✅ Wystarczające zasoby dyskowe (32GB wolne)
- ✅ Pamięć RAM stabilna (33% wolne, +100MB po optymalizacji)
- ✅ CPU stabilne (load ~1.9)
- ✅ Wszystkie kluczowe serwisy działają
- ✅ Problemy z Flyball rozwiązane (wyłączony 27.10.2025)

**Serwer jest w doskonałym stanie i ma wystarczający margines na wzrost.**

### Ostatnie akcje (27 października 2025):
- ✅ Wyłączono niestabilne procesy Flyball (585k+ restartów)
- ✅ Zwolniono ~200MB RAM
- ✅ Wyeliminowano źródło błędów w logach

---

*Raport wygenerowany automatycznie przez Claude Code*
*Lokalizacja: /opt/crm-gtd-smart/SERVER_STATUS_REPORT.md*
