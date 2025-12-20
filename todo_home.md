# TODO: Nowa Strona Główna CRM-GTD Smart

## Cel Projektu
Stworzenie nowoczesnej, atrakcyjnej strony głównej od podstaw, która zastąpi aktualną implementację.

## Lista Zadań

### 🎯 Wysokie Priorytety (MUST HAVE)

#### 1. Stworzenie nowej strony głównej od podstaw
- [ ] Analiza wymagań i konkurencji
- [ ] Wybór technologii i frameworka
- [ ] Stworzenie podstawowej struktury plików
- [ ] Konfiguracja środowiska development

#### 2. Zaprojektowanie nowoczesnego layoutu strony głównej
- [ ] Wireframe i mockup strony
- [ ] Wybór kolorystyki i typografii
- [ ] Definicja komponentów i sekcji
- [ ] Responsive grid system

#### 3. Implementacja hero section z CTA
- [ ] Nagłówek z hasłem głównym
- [ ] Podtytuł opisujący wartość produktu
- [ ] Call-to-Action przyciski (Demo, Rejestracja)
- [ ] Hero image lub video
- [ ] Animacje wejścia

### 🎨 Średnie Priorytety (SHOULD HAVE)

#### 4. Dodanie sekcji features/funkcjonalności
- [ ] Lista kluczowych funkcji produktu
- [ ] Ikony i grafiki ilustrujące features
- [ ] Krótkie opisy korzyści
- [ ] Grid layout z kartami funkcji

#### 5. Stworzenie sekcji testimonials/opinie
- [ ] Zbiór opinii użytkowników
- [ ] Zdjęcia i dane klientów
- [ ] System rotacji opinii
- [ ] Gwiazdy/rating system

#### 6. Implementacja pricing section
- [ ] Tabela planów cenowych
- [ ] Porównanie funkcji w planach
- [ ] Wyróżnienie planu rekomendowanego
- [ ] Przyciski zakupu/wyboru planu

#### 8. Optymalizacja responsywności mobile/desktop
- [ ] Testy na różnych urządzeniach
- [ ] Breakpointy dla mobile/tablet/desktop
- [ ] Touch-friendly elementy
- [ ] Optymalizacja ładowania na mobile

#### 10. Testy i optymalizacja wydajności
- [ ] Lighthouse performance audit
- [ ] Optymalizacja obrazów i assetów
- [ ] Lazy loading implementacja
- [ ] SEO optymalizacja

### 🎉 Niskie Priorytety (NICE TO HAVE)

#### 7. Dodanie footer z linkami
- [ ] Linki do dokumentacji
- [ ] Social media links
- [ ] Informacje kontaktowe
- [ ] Polityka prywatności i regulamin

#### 9. Implementacja animacji i efektów wizualnych
- [ ] Scroll-triggered animations
- [ ] Hover effects na elementach
- [ ] Parallax scrolling
- [ ] Micro-interactions

## Technologie i Narzędzia

### Frontend Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + Custom CSS
- **Animacje**: Framer Motion
- **Ikony**: Phosphor Icons / Heroicons
- **Komponenty**: Custom + Headless UI

### Design System
- **Kolory**: 
  - Primary: Blue (#3B82F6)
  - Secondary: Indigo (#6366F1)
  - Accent: Emerald (#10B981)
- **Typografia**: Inter font family
- **Spacing**: Tailwind spacing scale
- **Breakpoints**: Mobile-first approach

## Struktura Plików

```
/packages/frontend/src/app/
├── page.tsx                 # Nowa strona główna
├── components/
│   ├── home/
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   ├── PricingSection.tsx
│   │   └── FooterSection.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Container.tsx
└── styles/
    └── home.css
```

## Sekcje Strony (Top to Bottom)

1. **Header/Navigation**
   - Logo CRM-GTD Smart
   - Menu: Features, Pricing, About, Contact
   - Login/Register buttons

2. **Hero Section**
   - Główne hasło: "Productivity Redefined"
   - Podtytuł: "CRM + GTD w jednym inteligentnym systemie"
   - CTA: "Rozpocznij Za Darmo" + "Zobacz Demo"
   - Hero image/animation

3. **Features Section**
   - CRM Integration
   - GTD Methodology
   - AI-Powered Automation
   - Smart Day Planner
   - Voice Assistant
   - Real-time Analytics

4. **Social Proof**
   - Statystyki: "1000+ zadań wykonanych", "500+ projektów"
   - Logos firm korzystających

5. **Testimonials**
   - 3-4 opinie użytkowników
   - Zdjęcia i credibility indicators

6. **Pricing**
   - 3 plany: Starter, Professional, Enterprise
   - Feature comparison table
   - "14 dni za darmo" highlight

7. **Final CTA**
   - "Gotowy na zwiększenie produktywności?"
   - Registration form lub link

8. **Footer**
   - Linki, contact info, social media

## Timeline Implementacji

### Tydzień 1: Fundament
- Dni 1-2: Setup i wireframing
- Dni 3-5: Hero section + navigation
- Dni 6-7: Features section

### Tydzień 2: Zawartość
- Dni 1-3: Testimonials + social proof
- Dni 4-5: Pricing section
- Dni 6-7: Footer + final CTA

### Tydzień 3: Optymalizacja
- Dni 1-3: Responsywność i animacje
- Dni 4-5: Performance optimization
- Dni 6-7: Testing i deploy

## Metryki Sukcesu

- **Performance**: Lighthouse score >90
- **Accessibility**: WCAG 2.1 AA compliance
- **SEO**: Meta tags, structured data
- **Conversion**: Clear CTA flow
- **Mobile**: Perfect mobile experience

## Uwagi Techniczne

- Zachować kompatybilność z istniejącym systemem auth
- Integracja z obecnym API backend
- Możliwość A/B testowania różnych wersji
- Analytics tracking (Google Analytics/podobne)
- GDPR compliance dla form rejestracji

---

**Status**: 🚀 Gotowy do implementacji
**Ostatnia aktualizacja**: 2025-07-08
**Assignee**: Claude Code Team