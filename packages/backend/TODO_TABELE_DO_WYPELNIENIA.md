# TODO - Tabele do Wypełnienia

## Stan Aktualny
- **Wypełnione:** 63/97 tabel (64.9%)
- **Do 70%:** 5 tabel więcej
- **Do 90%:** 25 tabel więcej

## 🔴 PRIORYTETY WYSOKIE (łatwe modele)

### 1. DelegatedTask - delegowane zadania
```sql
-- Wymagane pola: description, delegatedTo, organizationId
```

### 2. InvoiceItem - pozycje faktur
```sql  
-- Wymagane pola: itemType, quantity, unitPrice, totalPrice, invoiceId
```

### 3. OfferItem - pozycje ofert
```sql
-- Wymagane pola: itemType, quantity, unitPrice, totalPrice, offerId
```

### 4. BugReport - raporty błędów
```sql
-- Wymagane pola: title, description, severity, status, organizationId
```

### 5. ErrorLog - logi błędów
```sql
-- Wymagane pola: level, message, source, organizationId
```

## 🟡 PRIORYTETY ŚREDNIE

### 6. DocumentHistory - historia dokumentów
```sql
-- Wymagane pola: action, performedBy, documentId
```

### 7. DocumentVersion - wersje dokumentów
```sql
-- Wymagane pola: version, content, createdBy, documentId
```

### 8. Message - wiadomości
```sql
-- Wymagane pola: channelId, subject?, content?
-- Sprawdzić wymagane pola w schema.prisma
```

### 9. MessageAttachment - załączniki wiadomości
```sql
-- Wymagane pola: messageId, fileName, fileType
```

### 10. AIRule - reguły AI
```sql
-- Sprawdzić wymagane pola: triggerType, triggerConditions
```

### 11. AIExecution - wykonania AI
```sql
-- Sprawdzić wymagane pola w schema.prisma
```

### 12. AIModel - modele AI
```sql
-- Wymagane pola: name, displayName, type, providerId?
```

### 13. VectorDocument - dokumenty wektorowe
```sql
-- Wymagane pola: title, content, contentHash, embedding, entityType
```

### 14. VectorSearchResult - wyniki wyszukiwania
```sql
-- Sprawdzić wymagane pola w schema.prisma
```

### 15. UnifiedRule - zunifikowane reguły
```sql
-- Wymagane pola: name, ruleType, organizationId
```

### 16. UnifiedRuleExecution - wykonania reguł
```sql
-- Wymagane pola: triggeredBy, result, ruleId
```

## 🟢 PRIORYTETY NISKIE (skomplikowane)

### 17. StreamRelation - relacje strumieni
```sql
-- Sprawdzić wymagane pola w schema.prisma
```

### 18. StreamPermission - uprawnienia strumieni
```sql
-- Sprawdzić wymagane pola w schema.prisma
```

### 19. StreamAccessLog - logi dostępu
```sql
-- Sprawdzić wymagane pola w schema.prisma
```

### 20. EmailTemplate - szablony emaili
```sql
-- Sprawdzić wymagane pola w schema.prisma
```

### 21. EmailLog - logi emaili
```sql
-- Sprawdzić wymagane pola w schema.prisma
```

### 22. MessageProcessingResult - wyniki przetwarzania
```sql
-- Sprawdzić wymagane pola w schema.prisma
```

### 23. VectorCache - cache wektorów
```sql
-- Sprawdzić wymagane pola w schema.prisma
```

### 24. DocumentLink - linki dokumentów
```sql
-- Sprawdzić wymagane pola w schema.prisma  
```

### 25. AIPromptTemplate - szablony promptów AI
```sql
-- Sprawdzić wymagane pola w schema.prisma
```

## Pozostałe Modele do Analizy

1. SMARTAnalysisDetail
2. SMARTImprovement  
3. Dependency
4. ProjectDependency
5. CriticalPath (już wypełniony?)
6. UserRelation
7. ProcessingRule
8. Subscription
9. Timeline

## Kamienie Milowe

- ✅ **50%** - OSIĄGNĘTE
- ✅ **60%** - OSIĄGNĘTE  
- ✅ **64.9%** - AKTUALNIE
- 🎯 **70%** - 5 tabel więcej (68 łącznie)
- 🎯 **75%** - 10 tabel więcej (73 łącznie)
- 🎯 **80%** - 15 tabel więcej (78 łącznie)
- 🎯 **90%** - 25 tabel więcej (88 łącznie)

## Strategie Sukcesu

1. ✅ Sprawdzanie definicji w schema.prisma
2. ✅ Minimalne wymagane pola
3. ✅ Proste relacje z istniejącymi rekordami  
4. ✅ Unikanie skomplikowanych modeli
5. ✅ Systematyczne podejście wave po wave

## Następne Kroki

1. **Uruchom:** `seed-simple-models.js` z DelegatedTask, InvoiceItem, BugReport
2. **Sprawdź:** schema.prisma dla każdego modelu przed implementacją
3. **Test:** Każdy model osobno z dokładnymi komunikatami błędów
4. **Cel:** Osiągnąć 70% (68 tabel) w pierwszej kolejności