# Fakturownia.pl Integration

This document describes the Fakturownia.pl API integration for the CRM system, allowing bidirectional synchronization of invoices between the CRM and Fakturownia accounting system.

## Overview

The integration provides:
- **Bidirectional sync**: Create, read, update invoices between CRM and Fakturownia
- **Automatic syncing**: Scheduled tasks sync invoices every 30 minutes
- **Manual operations**: Send invoices via email, manual sync triggers
- **Import functionality**: Import existing invoices from Fakturownia
- **Status tracking**: Monitor sync status and errors

## Configuration

### Environment Variables

Add these environment variables to your `.env` file:

```env
# Fakturownia Configuration
FAKTUROWNIA_DOMAIN=your-company.fakturownia.pl
FAKTUROWNIA_API_TOKEN=your_api_token_here
FAKTUROWNIA_ENVIRONMENT=production
```

### Getting Fakturownia API Token

1. Log in to your Fakturownia account
2. Go to **Ustawienia** → **Ustawienia konta** → **Integracja**
3. Find **Kod autoryzacyjny API** section
4. Copy the API token
5. Add it to your environment variables

### Domain Configuration

The domain can be specified in two formats:
- Full domain: `your-company.fakturownia.pl`
- Short name: `your-company` (automatically becomes `your-company.fakturownia.pl`)

## Database Schema Updates

The Invoice model has been enhanced with Fakturownia-specific fields:

```prisma
model Invoice {
  // ... existing fields ...
  
  // Fakturownia integration
  fakturowniaId Int?          // ID in Fakturownia system
  fakturowniaNumber String?   // Invoice number from Fakturownia
  fakturowniaStatus String?   // Status from Fakturownia
  lastSyncedAt DateTime?      // Last sync timestamp
  syncError   String?         // Last sync error if any
  autoSync    Boolean @default(true) // Whether to auto-sync
}
```

## API Endpoints

### Invoice Management

#### Create Invoice
```http
POST /api/v1/invoices
Content-Type: application/json

{
  "title": "Invoice for Services",
  "description": "Development services for Q1 2024",
  "amount": 5000.00,
  "currency": "PLN",
  "dueDate": "2024-07-15T00:00:00Z",
  "customerEmail": "client@example.com",
  "customerPhone": "+48123456789",
  "customerAddress": "ul. Przykładowa 123, 00-000 Warszawa",
  "autoSync": true,
  "items": [
    {
      "itemType": "SERVICE",
      "quantity": 40,
      "unitPrice": 125.00,
      "customName": "Development Services",
      "customDescription": "React/Node.js development - 40 hours"
    }
  ]
}
```

#### Get Invoices (with optional sync)
```http
GET /api/v1/invoices?sync=true&page=1&limit=20
```

#### Update Invoice
```http
PUT /api/v1/invoices/{invoiceId}
Content-Type: application/json

{
  "status": "SENT",
  "paymentDate": "2024-06-15T10:30:00Z"
}
```

#### Delete Invoice
```http
DELETE /api/v1/invoices/{invoiceId}
```

### Fakturownia-Specific Operations

#### Send Invoice via Fakturownia Email
```http
POST /api/v1/invoices/{invoiceId}/send
Content-Type: application/json

{
  "recipient": "client@example.com",
  "subject": "Invoice #{invoiceNumber}",
  "message": "Please find attached your invoice."
}
```

#### Manual Sync Single Invoice
```http
POST /api/v1/invoices/{invoiceId}/sync
```

#### Bulk Sync All Invoices
```http
POST /api/v1/invoices/sync-all
```

#### Get Sync Status
```http
GET /api/v1/invoices/sync-status
```

Response:
```json
{
  "totalInvoices": 150,
  "syncedInvoices": 145,
  "pendingSync": 5,
  "lastSyncErrors": [
    {
      "id": "invoice-123",
      "invoiceNumber": "INV-2024-06-0001",
      "syncError": "Customer data validation failed",
      "lastSyncedAt": "2024-06-15T10:30:00Z"
    }
  ],
  "fakturowniaAvailable": true
}
```

#### Import from Fakturownia
```http
POST /api/v1/invoices/import-from-fakturownia
Content-Type: application/json

{
  "page": 1,
  "perPage": 50,
  "period": "this_month"
}
```

#### Manual Sync Trigger (Admin only)
```http
POST /api/v1/invoices/trigger-sync
```

## Automatic Synchronization

### Scheduled Tasks

The system runs two automated tasks:

1. **Invoice Sync Task**
   - Runs every 30 minutes
   - Syncs all invoices with `autoSync: true`
   - Processes organizations in batches
   - Updates invoice status from Fakturownia

2. **Fakturownia Import Task**
   - Runs daily at 2:00 AM
   - Imports new invoices from Fakturownia
   - Imports invoices from the last 30 days
   - Creates local records for new Fakturownia invoices

### Sync Logic

**For Existing Invoices:**
- Fetch latest data from Fakturownia
- Update local invoice with Fakturownia status
- Update timestamps and clear errors

**For New Invoices:**
- Transform local invoice to Fakturownia format
- Create invoice in Fakturownia
- Store Fakturownia ID and metadata locally

**Error Handling:**
- Sync errors are stored in `syncError` field
- Failed syncs don't prevent future attempts
- Old sync errors (>7 days) are automatically cleaned up

## Data Transformation

### Local to Fakturownia

The system transforms local invoice data to Fakturownia format:

```typescript
{
  oid: localInvoice.id,                    // Internal reference
  number: localInvoice.invoiceNumber,
  issue_date: "YYYY-MM-DD",
  payment_to: "YYYY-MM-DD",
  buyer_name: localInvoice.customerEmail,
  buyer_email: localInvoice.customerEmail,
  buyer_phone: localInvoice.customerPhone,
  buyer_street: localInvoice.customerAddress,
  total_price_gross: "5000.00",
  currency: "PLN",
  description: localInvoice.description,
  status: "draft", // mapped from local status
  positions: [
    {
      name: "Service Name",
      quantity: "40",
      price_net: "125.00",
      tax: "23"
    }
  ]
}
```

### Fakturownia to Local

Incoming Fakturownia data is transformed to local format:

```typescript
{
  fakturowniaId: 12345,
  fakturowniaNumber: "FV-2024/06/001",
  fakturowniaStatus: "sent",
  status: "SENT", // mapped from Fakturownia status
  amount: 5000.00,
  currency: "PLN",
  customerEmail: "client@example.com",
  lastSyncedAt: new Date(),
  syncError: null
}
```

## Status Mapping

### Local to Fakturownia Status
- `PENDING` → `draft`
- `SENT` → `sent`
- `PAID` → `paid`
- `OVERDUE` → `sent`
- `CANCELED` → `cancelled`

### Fakturownia to Local Status
- `draft` → `PENDING`
- `sent` → `SENT`
- `paid` → `PAID`
- `cancelled` → `CANCELED`
- `partially_paid` → `SENT`

## Error Handling

### Common Errors

1. **Configuration Errors**
   ```json
   {
     "error": "Fakturownia not configured",
     "details": "Missing FAKTUROWNIA_DOMAIN or FAKTUROWNIA_API_TOKEN"
   }
   ```

2. **API Errors**
   ```json
   {
     "error": "Fakturownia API error: Invalid customer data",
     "invoiceId": "local-invoice-123"
   }
   ```

3. **Validation Errors**
   ```json
   {
     "error": "Invoice validation failed",
     "details": "Customer email is required for Fakturownia sync"
   }
   ```

### Error Recovery

- Sync errors are logged and stored in the database
- Failed invoices can be manually synced after fixing issues
- The system continues processing other invoices if one fails
- Automatic retry with exponential backoff (planned feature)

## Best Practices

### Invoice Creation
1. Always include customer email for Fakturownia compatibility
2. Use valid currency codes (PLN, EUR, USD)
3. Include detailed item descriptions
4. Set appropriate tax rates for your jurisdiction

### Sync Management
1. Monitor sync status regularly via the `/sync-status` endpoint
2. Address sync errors promptly
3. Use manual sync for critical invoices
4. Import existing Fakturownia invoices before going live

### Performance
1. Batch operations use delays to respect API rate limits
2. Automatic sync processes organizations sequentially
3. Failed syncs don't block other operations
4. Consider disabling auto-sync for test/draft invoices

## Monitoring and Logging

### Log Levels

The integration uses structured logging:

```typescript
// Info logs
logger.info('Invoice created in Fakturownia', {
  invoiceId: 'local-123',
  fakturowniaId: 456,
  amount: 5000.00
});

// Error logs
logger.error('Failed to sync invoice', {
  invoiceId: 'local-123',
  error: 'Customer validation failed',
  retryCount: 2
});
```

### Metrics to Monitor

1. **Sync Success Rate**: Percentage of successful syncs
2. **Sync Latency**: Time taken for sync operations
3. **Error Rate**: Number of sync errors per hour
4. **Queue Depth**: Number of pending sync operations

## Troubleshooting

### Common Issues

1. **"Invoice not synced with Fakturownia" when sending**
   - Solution: Run manual sync first, then send

2. **Customer validation errors**
   - Solution: Ensure customer email is valid and required fields are filled

3. **Currency mismatch errors**
   - Solution: Check that currency codes match between systems

4. **Rate limiting**
   - Solution: The system includes automatic delays, but reduce batch sizes if needed

### Debug Mode

Enable detailed logging by setting `LOG_LEVEL=debug` in your environment:

```env
LOG_LEVEL=debug
```

This will provide detailed API request/response logging for troubleshooting.

## Security Considerations

1. **API Token Protection**: Store API tokens in environment variables, never in code
2. **HTTPS Only**: All Fakturownia API calls use HTTPS
3. **Rate Limiting**: Respect Fakturownia's rate limits to avoid account suspension
4. **Data Validation**: All data is validated before sending to Fakturownia
5. **Error Exposure**: Sensitive API details are not exposed in user-facing errors

## Migration from Existing Systems

If you have existing invoices in Fakturownia:

1. **Import existing invoices**:
   ```http
   POST /api/v1/invoices/import-from-fakturownia
   {
     "period": "last_12_months",
     "perPage": 100
   }
   ```

2. **Verify import**:
   ```http
   GET /api/v1/invoices/sync-status
   ```

3. **Enable auto-sync** for future invoices by setting `autoSync: true`

## Support

For issues related to:
- **CRM Integration**: Check application logs and sync status endpoint
- **Fakturownia API**: Consult Fakturownia API documentation
- **Configuration**: Verify environment variables and API token validity

## Changelog

### Version 1.0 (Current)
- Initial Fakturownia integration
- Bidirectional invoice sync
- Automatic scheduled syncing
- Email sending via Fakturownia
- Import functionality
- Comprehensive error handling
- Status monitoring and reporting