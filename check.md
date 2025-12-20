# 🔍 Materiały do diagnozy projektu CRM Streams

## 1. BAZA DANYCH (priorytet najwyższy)

### Schemat tabel
```bash
# Jeśli PostgreSQL:
pg_dump --schema-only nazwa_bazy > schemat.sql

# Lub z Laravel:
php artisan schema:dump
```

**Potrzebuję zobaczyć:**
- Wszystkie tabele związane ze Streams (nie całe 85+, tylko te nowe)
- Relacje (klucze obce)
- Migracje Laravel dla Streams (folder `database/migrations/*streams*`)

---

## 2. MODELE I RELACJE

Pliki z `app/Models/` związane ze Streams:
- Stream.php
- Source.php (jeśli jest)
- Wszelkie powiązane (StreamItem, StreamRule, itp.)

**Kluczowe:** metody relacji (`hasMany`, `belongsTo`, `morphTo`)

---

## 3. ROUTING I KONTROLERY

### Routes
```bash
php artisan route:list --path=stream
```
Lub plik `routes/web.php` / `routes/api.php` — fragmenty dotyczące Streams

### Kontrolery
Pliki z `app/Http/Controllers/` dla Streams

---

## 4. FRONTEND

Lista widoków/komponentów Streams:
- Ścieżki plików (np. `resources/js/Pages/Streams/`)
- Które strony istnieją vs które powinny istnieć

---

## 5. STAN FAKTYCZNY

Krótki opis własnymi słowami:

| Funkcja | Status |
|---------|--------|
| Lista strumieni | ✅ Działa / ⚠️ Częściowo / ❌ Nie działa |
| Tworzenie strumienia | ? |
| Edycja strumienia | ? |
| Dodawanie elementów | ? |
| Hierarchia (dopływy) | ? |
| Zamrażanie/odmrażanie | ? |
| Widok Źródła | ? |

---

## 6. BŁĘDY

Jeśli są konkretne błędy:
- Logi z `storage/logs/laravel.log` (ostatnie wpisy)
- Błędy w konsoli przeglądarki (F12 → Console)

---

## 📦 Jak dostarczyć?

**Opcja A:** Wrzuć pliki tutaj (uploady)

**Opcja B:** Skopiuj zawartość kluczowych plików do wiadomości

**Opcja C:** Link do repo (jeśli masz na GitHubie/GitLabie)

---

## ⚡ Minimum na start

Jeśli nie chcesz wszystkiego naraz, zacznij od:

1. **Migracje Streams** (struktura bazy)
2. **Model Stream.php** (relacje)
3. **Tabela statusu** (co działa, co nie)

To wystarczy do pierwszej diagnozy.
