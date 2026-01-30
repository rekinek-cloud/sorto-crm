UWAGA: Nie używać bez potwierdzenia / WARNING: Do not use without confirmation
Data archiwizacji: Fri Jan 30 02:29:18 PM UTC 2026

=== CO ZOSTAŁO ZARCHIWIZOWANE ===

1. frontend_duplicates/app_dashboard/
   - Zduplikowana struktura /app/dashboard/ (bez [locale])
   - Powodowała konflikty routingu w Next.js App Router

2. frontend_duplicates/locale_dashboard/_ai-management/
   - Katalog _ai-management z prefixem underscore
   - Duplikat prawidłowego ai-management

3. frontend_duplicates/escaped_locale_dir/
   - Katalog \[locale\] z literalnymi backslashami
   - Błędna nazwa katalogu

4. frontend_duplicates/*.backup, *.bak
   - Pliki backup: smartDayPlanner.ts.backup, page.tsx.backup, page-old.tsx.bak
   - Stare wersje plików

5. root_backups/
   - docker-compose.v1.backup

6. backend_backups/
   - nodemon.json.backup

7. _archived_dashboard_backup_20251211/
   - Stary backup dashboardu z 11.12.2025

=== DLACZEGO ZARCHIWIZOWANE ===
- Duplikaty powodowały konflikty routingu
- Pliki .backup/.bak zaśmiecały strukturę
- Po git pull zmiany były tracone - teraz są zarchiwizowane

=== PRZED UŻYCIEM ===
Skontaktuj się z deweloperem aby potwierdzić czy plik jest nadal potrzebny.
