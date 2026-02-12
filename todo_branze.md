# TODO: Wybór branży przy rejestracji organizacji

## Cel
Przy rejestracji nowej organizacji użytkownik wybiera branżę (nakładkę), która determinuje:
- Widoczne moduły
- Nawigację
- Kolor brandingu
- Dostępne add-ony

---

## Zadania

### 1. Backend - Schema rejestracji
- [x] Dodać pole `overlaySlug` do `registerSchema` w `schemas.ts`
- [x] Zaktualizować typ `RegisterRequest`

### 2. Backend - Service rejestracji
- [x] W `register()` pobierać overlay z bazy po slug
- [x] Przypisywać `overlayId` do nowej organizacji

### 3. Backend - Endpoint listy nakładek
- [x] Dodać `GET /api/v1/overlays/public` - lista nakładek dla formularza rejestracji (bez auth)
  - Endpoint: `GET /api/v1/overlays` (bez auth) - zwraca wszystkie aktywne nakładki

### 4. Frontend - API client
- [x] Dodać funkcję `getPublicOverlays()` w API
  - Używa `getAllOverlays()` z `/lib/api/overlays.ts`

### 5. Frontend - Strona rejestracji
- [x] Dodać krok wyboru branży (przed danymi firmy)
- [x] Wyświetlić karty z nakładkami (ikona, nazwa, opis, kolor)
- [x] Wysyłać `overlaySlug` przy rejestracji

### 6. Dodatkowe nakładki (config)
- [x] Dodać nakładkę: Biuro Rachunkowe (`biuro-rachunkowe`)
- [x] Dodać nakładkę: Kancelaria Prawnicza (`kancelaria-prawnicza`)
- [x] Dodać nakładkę: Agencja Nieruchomości (`agencja-nieruchomosci`)
- [x] Dodać nakładkę: Targi/Eventy (`targi-eventy`)
- [x] Seed nowych nakładek do bazy danych

### 7. Test
- [ ] Zarejestrować nową organizację z wybraną branżą
- [ ] Sprawdzić czy nawigacja/branding się zmienia

---

## Status: ZAIMPLEMENTOWANE

Wszystkie zadania implementacyjne zostały ukończone. Pozostały testy manualne.

### Dostępne nakładki (6):
| Slug | Nazwa | Kolor | Cena bazowa |
|------|-------|-------|-------------|
| `sorto-business` | Sorto Business | #6366f1 (indigo) | 299 zł |
| `focus-photo` | Focus Photo | #0EA5E9 (sky) | 99 zł |
| `biuro-rachunkowe` | Biuro Rachunkowe | #10b981 (emerald) | 149 zł |
| `kancelaria-prawnicza` | Kancelaria Prawnicza | #1e3a5f (navy) | 199 zł |
| `agencja-nieruchomosci` | Agencja Nieruchomości | #8b5cf6 (purple) | 199 zł |
| `targi-eventy` | Targi i Eventy | #f59e0b (amber) | 249 zł |

### Zmodyfikowane pliki:
```
packages/backend/src/
├── modules/auth/schemas.ts          # +overlaySlug
├── modules/auth/service.ts          # przypisanie overlay przy rejestracji
└── config/overlays/index.ts         # +4 nowe nakładki

packages/frontend/src/
└── app/[locale]/auth/register/page.tsx  # 2-krokowy formularz z wyborem branży
```

### API:
```
GET /api/v1/overlays - lista wszystkich nakładek (publiczny)
```

---

## Następne kroki (opcjonalne)
- Dodać więcej nakładek branżowych w miarę potrzeb
- Dodać podgląd nawigacji przy wyborze nakładki
- Dodać możliwość zmiany nakładki dla istniejącej organizacji (admin)
