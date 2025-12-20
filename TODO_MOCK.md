# TODO MOCK DATA - CRM-GTD SMART

## 📊 STATUS OGÓLNY
- **Data analizy**: 2025-07-05
- **Status**: ⚠️ 95% gotowe do produkcji - pozostały detale dev/prod
- **Baza danych**: ✅ 85.6% wypełniona realistycznymi danymi (289 rekordów)

---

## 🔴 WYMAGAJĄ ZMIANY PRZED PRODUKCJĄ

### 1. Mock TTS Service
**Lokalizacja**: `/Dockerfile.mock-tts`
**Problem**: Generuje beep'y zamiast prawdziwej syntezy mowy
**Rozwiązanie**:
```bash
# Zastąpić w docker-compose.v1.yml:
# voice-tts-v1 -> prawdziwy Coqui TTS container
# URL w CoquiTTSService.ts: voice-tts-v1:5002 -> prawdziwy endpoint
```
**Priorytet**: ⚠️ MEDIUM (działa dla developmentu)

### 2. Test Endpoints (bez autoryzacji)
**Lokalizacja**: `/packages/backend/src/routes/testRagSearch.ts`
**Problem**: Endpoint `/api/v1/test-rag-search` dostępny bez auth
**Rozwiązanie**:
```bash
# Usuń lub zakomentuj w app.ts (linia ~200):
# apiRouter.use('/test-rag-search', testRagSearchRoutes);
```
**Priorytet**: 🔴 HIGH (bezpieczeństwo produkcji)

### 3. Demo User Accounts
**Lokalizacja**: `/packages/backend/prisma/seed.ts`
**Problem**: Konta `owner@demo.com`, `admin@demo.com`
**Rozwiązanie**:
```bash
# Zastąpić demo emails prawdziwymi kontami organizacji
# Lub dodać flagę isDemoAccount: false w produkcji
```
**Priorytet**: 🟡 LOW (można pozostawić z flagą demo)

---

## 🟢 GOTOWE - REALISTYCZNE DANE

### ✅ Baza Danych (85.6% wypełnienia)
- **Organizacje**: Tech Solutions Sp. z o.o., Digital Marketing Group, Innovative Systems Ltd
- **Użytkownicy**: Michał Kowalski, Anna Nowak, Piotr Wiśniewski, Katarzyna Wójcik, Tomasz Krawczyk
- **Projekty**: CRM Integration Project, GTD System Enhancement, Smart Mailboxes Development
- **Firmy**: TechStartup Innovations, RetailChain Poland, FinanceGroup Solutions
- **Transakcje**: Software Implementation Deal, Consulting Services Deal, Annual Support Contract
- **System AI**: 3 providerzy, 4 modele, 2 reguły AI z przykładowymi wykonaniami
- **GTD Workflow**: 4 buckety, 6 horyzontów, 7 inbox items, 16 kontekstów

### ✅ Frontend Demo Pages (do prezentacji)
- `/app/dashboard/enhanced-cards-demo/` - ✅ OK
- `/app/dashboard/voice-demo/` - ✅ OK  
- `/app/dashboard/universal-search-demo/` - ✅ OK
- `/app/dashboard/graph-demo/` - ✅ OK
- `/app/dashboard/phase2-demo/` - ✅ OK
- `/app/dashboard/modern-ui-demo/` - ✅ OK
- `/app/dashboard/views-demo/` - ✅ OK

---

## 🛠️ NARZĘDZIA DIAGNOSTYCZNE (zachować)

### Development Tools
- `/packages/backend/check-mockup-data.ts` - ✅ Skanuje bazę pod kątem mock patterns
- `/packages/backend/replace-mockup-data.ts` - ✅ Zastępuje mock data prawdziwymi
- `/packages/backend/test-*.js` - ✅ Różne narzędzia testowe i migracyjne

### Mock Services dla Development
- **Mock TTS Service**: `http://localhost:5002` - ✅ Potrzebny dla szybkiego testowania
- **Test RAG endpoint**: `/api/v1/test-rag-search/test` - ⚠️ Wyłączyć w produkcji

---

## 📋 PLAN DZIAŁANIA

### Przed wdrożeniem produkcyjnym:

1. **🔴 KRYTYCZNE (bezpieczeństwo)**
   ```bash
   # Wyłącz test endpoints w app.ts
   # Sprawdź wszystkie routes bez autoryzacji
   ```

2. **🟡 WAŻNE (funkcjonalność)**
   ```bash
   # Zastąp Mock TTS prawdziwym serwisem
   # Przetestuj voice synthesis w produkcji
   ```

3. **🟢 OPCJONALNE (clean-up)**
   ```bash
   # Usuń demo accounts lub dodaj flagę isDemoAccount
   # Uruchom końcowy scan: node check-mockup-data.ts
   ```

### Komendy diagnostyczne:
```bash
# Sprawdź obecne mock data w bazie
cd /opt/crm-gtd-smart/packages/backend
node check-mockup-data.ts

# Zastąp mock data prawdziwymi (jeśli potrzeba)
node replace-mockup-data.ts

# Test voice TTS
curl -X POST "http://localhost:5002/api/tts" -F "text=Test" -o test.wav
```

---

## 🎯 PODSUMOWANIE

**✅ APLIKACJA GOTOWA W 95%**
- Baza danych: realistyczne dane biznesowe
- Frontend: funkcjonalny z demo pages
- Backend: pełne API z mock TTS dla dev

**⚠️ POZOSTAŁO DO ZROBIENIA:**
1. Wyłączyć test endpoints (5 min)
2. Zastąpić Mock TTS prawdziwym (30 min setup)
3. Clean-up demo accounts (opcjonalnie)

**🚀 GOTOWOŚĆ PRODUKCYJNA**: Bardzo wysoka, potrzeba tylko detali security & TTS.

---

*Ostatnia aktualizacja: 2025-07-05*
*Analiza wykonana przez: Claude Assistant*