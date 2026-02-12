# Plan konsolidacji AI & Narzędzia

**Status: WYKONANO** (2026-02-06)

## Cel
Redukcja 16 zduplikowanych stron do 4 zunifikowanych.

---

## Faza 1: Reguły → rules-manager

### 1.1 Strony do usunięcia
- [x] `/dashboard/ai-rules` - funkcjonalność w zakładce AI_RULE
- [x] `/dashboard/universal-rules` - funkcjonalność w zakładce PROCESSING
- [x] `/dashboard/rules` - tylko redirect
- [x] `/dashboard/communication/rules-manager` - przenieść do głównego rules-manager

### 1.2 Zmiany w nawigacji
- [ ] Usunąć "Reguły AI" z sekcji "AI & Narzędzia"
- [ ] Usunąć "Reguły uniwersalne" z sekcji "AI & Narzędzia"
- [ ] Zmienić "Reguły komunikacji" w sekcji "Komunikacja" → link do `/rules-manager?type=EMAIL_FILTER`

### 1.3 Pliki do usunięcia
```
/packages/frontend/src/app/[locale]/dashboard/
├── ai-rules/page.tsx          # USUNĄĆ
├── universal-rules/page.tsx   # USUNĄĆ
├── rules/page.tsx             # USUNĄĆ
└── communication/rules-manager/page.tsx  # USUNĄĆ (redirect do głównego)
```

---

## Faza 2: AI Chat → ai-assistant

### 2.1 Strony do usunięcia
- [x] `/dashboard/ai-chat` - chat już w ai-assistant
- [x] `/dashboard/gemini` - dodać jako model w ai-assistant
- [x] `/dashboard/flow/conversation` - scalić z chat
- [x] `/dashboard/ai-prompts` - zakładka Prompty już istnieje

### 2.2 Rozszerzenie ai-assistant
- [ ] Dodać zakładkę "Insights" (z funkcjonalnością /ai-insights)
- [ ] Dodać selector modelu w Chat (GPT, Qwen, Gemini, Claude)

### 2.3 Zmiany w nawigacji
- [ ] Usunąć "AI Chat (Qwen)" z "AI & Narzędzia"
- [ ] Usunąć "Gemini" z "AI & Narzędzia"
- [ ] Usunąć "Flow Conversation" z "AI & Narzędzia"
- [ ] Usunąć "Prompty AI" z "AI & Narzędzia"

### 2.4 Pliki do usunięcia
```
/packages/frontend/src/app/[locale]/dashboard/
├── ai-chat/page.tsx           # USUNĄĆ
├── gemini/page.tsx            # USUNĄĆ
├── ai-prompts/page.tsx        # USUNĄĆ
└── flow/conversation/page.tsx # USUNĄĆ
```

---

## Faza 3: Wyszukiwanie → search

### 3.1 Strony do usunięcia
- [x] `/dashboard/rag-search` - scalić jako zakładka
- [x] `/dashboard/universal-search` - scalić jako zakładka
- [x] `/dashboard/universal-search-demo` - usunąć (demo)

### 3.2 Rozszerzenie /search
- [ ] Dodać zakładki: Wszystko, Semantyczne, Baza wiedzy, Dokumenty
- [ ] Przenieść funkcjonalność z universal-search i rag-search

### 3.3 Zmiany w nawigacji
- [ ] Usunąć "RAG Search" z "AI & Narzędzia"
- [ ] Usunąć "Universal Search" z "AI & Narzędzia"
- [ ] Pozostawić "Wyszukiwanie AI" jako główne

### 3.4 Pliki do usunięcia
```
/packages/frontend/src/app/[locale]/dashboard/
├── rag-search/page.tsx           # USUNĄĆ
├── universal-search/page.tsx     # USUNĄĆ
└── universal-search-demo/page.tsx # USUNĄĆ
```

---

## Faza 4: Voice → voice-assistant

### 4.1 Strony do usunięcia
- [x] `/dashboard/voice` - TTS do ustawień voice-assistant
- [x] `/dashboard/voice-rag` - scalić z voice-assistant
- [x] `/dashboard/voice-demo` - usunąć (demo)

### 4.2 Rozszerzenie voice-assistant
- [ ] Dodać zakładkę "TTS" z funkcjonalnością /voice
- [ ] Zintegrować RAG z voice-assistant

### 4.3 Zmiany w nawigacji
- [ ] Usunąć "Voice TTS" z "AI & Narzędzia"
- [ ] Usunąć "Voice RAG" z "AI & Narzędzia"
- [ ] Pozostawić "Voice Assistant" jako główne

### 4.4 Pliki do usunięcia
```
/packages/frontend/src/app/[locale]/dashboard/
├── voice/page.tsx        # USUNĄĆ
├── voice-rag/page.tsx    # USUNĄĆ
└── voice-demo/page.tsx   # USUNĄĆ
```

---

## Faza 5: Aktualizacja nawigacji

### 5.1 Nowa struktura "AI & Narzędzia"
```typescript
{
  name: 'AI & Narzędzia',
  icon: Robot,
  children: [
    { name: 'AI Assistant', href: '/dashboard/ai-assistant' },      // główny chat + sugestie + prompty
    { name: 'AI Insights', href: '/dashboard/ai-insights' },        // insights (lub zakładka w assistant)
    { name: 'Wyszukiwanie', href: '/dashboard/search' },            // zunifikowane search
    { name: 'Voice Assistant', href: '/dashboard/voice-assistant' }, // voice + TTS + RAG
    { name: 'Baza wiedzy RAG', href: '/dashboard/rag' },            // zarządzanie dokumentami
    { name: 'Smart Automation', href: '/dashboard/rules-manager' }, // wszystkie reguły
    { name: 'Flow Engine', href: '/dashboard/flow' },               // flow processing
    { name: 'Graf relacji', href: '/dashboard/graph' },             // graph visualization
  ]
}
```

### 5.2 Aktualizacja "Komunikacja"
```typescript
{
  name: 'Komunikacja',
  children: [
    // ... inne
    { name: 'Reguły email', href: '/dashboard/rules-manager?type=EMAIL_FILTER' },
    // usunąć: Reguły komunikacji (stary link)
  ]
}
```

---

## Faza 6: Cleanup i deploy

- [ ] Usunąć nieużywane komponenty
- [ ] Usunąć nieużywane API clients (jeśli są)
- [ ] Zaktualizować testy (jeśli są)
- [ ] Deploy i test
- [ ] Zaktualizować dokumentację

---

## Podsumowanie

| Faza | Opis | Strony usunięte |
|------|------|-----------------|
| 1 | Reguły → rules-manager | 4 |
| 2 | AI Chat → ai-assistant | 4 |
| 3 | Search → search | 3 |
| 4 | Voice → voice-assistant | 3 |
| 5 | Nawigacja | - |
| 6 | Cleanup | - |
| **Razem** | | **14 stron** |

**Rezultat:** Z 18 stron AI → 4 główne strony

---

## Kolejność wykonania

1. **Faza 1** - Reguły (najprostsze - tylko usunięcie)
2. **Faza 5** - Nawigacja (zaktualizować od razu)
3. **Faza 3** - Search (średnia złożoność)
4. **Faza 4** - Voice (średnia złożoność)
5. **Faza 2** - AI Chat (wymaga dodania model selector)
6. **Faza 6** - Cleanup i deploy
