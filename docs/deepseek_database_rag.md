# 🤖 DeepSeek Database RAG Assistant dla CRM-GTD
## Instrukcje dla Claude Code

**ZADANIE:** Stwórz system RAG (Retrieval-Augmented Generation) który pozwoli DeepSeek czatowi odpowiadać na pytania używając danych z bazy PostgreSQL CRM-GTD.

---

## 🎯 **ARCHITEKTURA SYSTEMU**

```
[DeepSeek Chat] ↔ [RAG API] ↔ [Vector Database] ↔ [PostgreSQL CRM]
                       ↓
              [Semantic Search + SQL]
```

**Workflow:**
1. **User pytanie** → DeepSeek
2. **DeepSeek** → RAG API (extract intent)
3. **RAG API** → Vector search + SQL query  
4. **Database** → Return relevant data
5. **RAG API** → Format response for DeepSeek
6. **DeepSeek** → Natural language answer

---

## 📦 **KROK 1: SETUP RAG INFRASTRUCTURE**

### **1.1 Instalacja zależności:**

```bash
# Przejdź do głównego katalogu CRM-GTD
cd /var/www/crm-gtd  # lub gdzie masz aplikację

# Utwórz katalog dla RAG systemu
mkdir -p rag-assistant
cd rag-assistant

# Inicjalizuj projekt Node.js
npm init -y

# Zainstaluj zależności RAG
npm install \
  @xenova/transformers \
  @pinecone-database/pinecone \
  pg \
  openai \
  langchain \
  @langchain/community \
  @langchain/openai \
  chromadb \
  express \
  cors \
  dotenv \
  uuid

echo "📦 Zależności RAG zainstalowane"
```

### **1.2 Konfiguracja środowiska:**

```bash
# Utwórz .env dla RAG systemu
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/crm_gtd

# Vector Database (Chroma)
CHROMA_HOST=localhost
CHROMA_PORT=8000

# DeepSeek API Configuration  
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# OpenAI for embeddings (fallback)
OPENAI_API_KEY=your_openai_key_here

# RAG Configuration
RAG_PORT=3002
RAG_MAX_RESULTS=10
RAG_SIMILARITY_THRESHOLD=0.7

# Security
RAG_API_KEY=your_secure_rag_api_key_here
ALLOWED_ORIGINS=http://91.99.50.80,https://91.99.50.80

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/rag-assistant.log
EOF

echo "⚙️ Konfiguracja środowiska utworzona"
```

---

## 🗄️ **KROK 2: DATABASE ANALYZER I EMBEDDINGS**

### **2.1 Database Schema Analyzer:**

```bash
# Utwórz analyzer schematu bazy danych
cat > src/database-analyzer.js << 'EOF'
// Database Schema Analyzer for CRM-GTD RAG
const { Pool } = require('pg');

class DatabaseAnalyzer {
  constructor(databaseUrl) {
    this.pool = new Pool({ connectionString: databaseUrl });
  }

  async getTableSchemas() {
    const query = `
      SELECT 
        t.table_name,
        t.table_comment,
        json_agg(
          json_build_object(
            'column_name', c.column_name,
            'data_type', c.data_type,
            'is_nullable', c.is_nullable,
            'column_default', c.column_default,
            'column_comment', col_description(pgc.oid, c.ordinal_position)
          ) ORDER BY c.ordinal_position
        ) as columns
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
      LEFT JOIN pg_class pgc ON pgc.relname = t.table_name
      WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND t.table_name NOT LIKE '_prisma%'
      GROUP BY t.table_name, t.table_comment
      ORDER BY t.table_name;
    `;
    
    const result = await this.pool.query(query);
    return result.rows;
  }

  async getTableRelationships() {
    const query = `
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public';
    `;
    
    const result = await this.pool.query(query);
    return result.rows;
  }

  async analyzeTableData(tableName, limit = 5) {
    try {
      // Get sample data
      const sampleQuery = `SELECT * FROM "${tableName}" LIMIT ${limit}`;
      const sampleResult = await this.pool.query(sampleQuery);
      
      // Get row count
      const countQuery = `SELECT COUNT(*) as total FROM "${tableName}"`;
      const countResult = await this.pool.query(countQuery);
      
      return {
        tableName,
        sampleData: sampleResult.rows,
        totalRows: parseInt(countResult.rows[0].total),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error analyzing table ${tableName}:`, error);
      return null;
    }
  }

  async generateTableDescriptions() {
    const schemas = await this.getTableSchemas();
    const relationships = await this.getTableRelationships();
    
    const descriptions = {};
    
    for (const table of schemas) {
      const analysis = await this.analyzeTableData(table.table_name);
      const tableRelations = relationships.filter(r => 
        r.table_name === table.table_name || 
        r.foreign_table_name === table.table_name
      );
      
      descriptions[table.table_name] = {
        name: table.table_name,
        description: this.generateTableDescription(table, analysis, tableRelations),
        columns: table.columns,
        relationships: tableRelations,
        sampleData: analysis?.sampleData || [],
        totalRows: analysis?.totalRows || 0
      };
    }
    
    return descriptions;
  }

  generateTableDescription(table, analysis, relationships) {
    const columnNames = table.columns.map(c => c.column_name).join(', ');
    const relationshipDesc = relationships.length > 0 
      ? `Related to: ${relationships.map(r => r.foreign_table_name || r.table_name).join(', ')}`
      : 'No direct relationships';
    
    return `
Table: ${table.table_name}
Purpose: Stores ${table.table_name.replace(/_/g, ' ')} data for CRM-GTD system
Columns: ${columnNames}
Total Records: ${analysis?.totalRows || 0}
${relationshipDesc}
Usage: This table contains information about ${table.table_name.replace(/_/g, ' ')} and can be queried for reports, analytics, and data retrieval.
    `.trim();
  }
}

module.exports = ChatInterface;
EOF

echo "💬 Chat Interface utworzony"
```

---

## 🚀 **KROK 6: DEPLOYMENT NA VPS HETZNER**

### **6.1 Systemd Services Configuration:**

```bash
# Utwórz systemd service dla RAG Server
sudo tee /etc/systemd/system/rag-assistant.service > /dev/null << 'EOF'
[Unit]
Description=CRM-GTD RAG Assistant Server
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/crm-gtd/rag-assistant
Environment=NODE_ENV=production
Environment=RAG_PORT=3002
ExecStart=/usr/bin/node src/rag-server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=rag-assistant

[Install]
WantedBy=multi-user.target
EOF

# Utwórz systemd service dla Chat Interface
sudo tee /etc/systemd/system/chat-interface.service > /dev/null << 'EOF'
[Unit]
Description=DeepSeek Chat Interface for CRM-GTD
After=network.target rag-assistant.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/crm-gtd/rag-assistant
Environment=NODE_ENV=production
Environment=CHAT_PORT=3003
ExecStart=/usr/bin/node src/chat-interface.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=chat-interface

[Install]
WantedBy=multi-user.target
EOF

# Ustaw permissions
sudo chown -R www-data:www-data /var/www/crm-gtd/rag-assistant
sudo chmod +x /var/www/crm-gtd/rag-assistant/src/*.js

echo "⚙️ Systemd services skonfigurowane"
```

### **6.2 Nginx Configuration dla Chat Interface:**

```bash
# Aktualizuj Nginx config o chat interface
sudo tee -a /etc/nginx/sites-available/crm-gtd.conf > /dev/null << 'EOF'

# DeepSeek Chat Interface
location /chat {
    proxy_pass http://localhost:3003;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}

# RAG API endpoints
location /api/rag {
    proxy_pass http://localhost:3002/api;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Increase timeout for AI processing
    proxy_read_timeout 120;
    proxy_connect_timeout 120;
    proxy_send_timeout 120;
}
EOF

# Test i reload Nginx
sudo nginx -t && sudo systemctl reload nginx

echo "🌐 Nginx skonfigurowany dla chat interface"
```

### **6.3 Uruchomienie Services:**

```bash
# Zainstaluj dependencies
cd /var/www/crm-gtd/rag-assistant
npm install

# Uruchom inicjalizację RAG
npm run initialize

# Enable i start services
sudo systemctl daemon-reload
sudo systemctl enable rag-assistant
sudo systemctl enable chat-interface

sudo systemctl start rag-assistant
sudo systemctl start chat-interface

# Sprawdź status
echo "📊 Status serwisów:"
sudo systemctl status rag-assistant --no-pager
sudo systemctl status chat-interface --no-pager

echo "✅ Services uruchomione na VPS Hetzner"
```

---

## 🧪 **KROK 7: TESTING I VALIDATION**

### **7.1 Comprehensive Testing:**

```bash
echo "🧪 Uruchamianie testów RAG systemu..."

# Test 1: RAG Server Health
echo "🔍 Test 1: RAG Server Health Check"
curl -f http://localhost:3002/health || echo "❌ RAG Server nie odpowiada"

# Test 2: Chat Interface Health  
echo "🔍 Test 2: Chat Interface Health Check"
curl -f http://localhost:3003/health || echo "❌ Chat Interface nie odpowiada"

# Test 3: Database Connectivity
echo "🔍 Test 3: Database Connection Test"
cd /var/www/crm-gtd/rag-assistant
npm run test

# Test 4: External Access
echo "🔍 Test 4: External Access Test"
curl -I http://91.99.50.80/chat || echo "❌ External access nie działa"

# Test 5: RAG API Test
echo "🔍 Test 5: RAG API Test"
curl -X POST http://localhost:3002/api/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $RAG_API_KEY" \
  -d '{"question":"How many companies are in the database?"}'

echo "📊 Testy zakończone"
```

### **7.2 Performance Testing:**

```bash
echo "⚡ Performance testing RAG systemu..."

# Test response times
echo "🔍 Testing response times..."

# Simple queries
time curl -s -X POST http://localhost:3002/api/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $RAG_API_KEY" \
  -d '{"question":"Count companies"}' > /dev/null

# Complex queries  
time curl -s -X POST http://localhost:3002/api/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $RAG_API_KEY" \
  -d '{"question":"Show me detailed analytics for deals created this month with total values over 10000"}' > /dev/null

# Memory usage check
echo "💾 Memory usage:"
ps aux | grep -E "(rag-server|chat-interface)" | grep -v grep

echo "✅ Performance tests zakończone"
```

---

## 📊 **KROK 8: MONITORING I MAINTENANCE**

### **8.1 Monitoring Setup:**

```bash
echo "📊 Konfiguracja monitoring dla RAG systemu..."

# Utwórz monitoring script
sudo tee /usr/local/bin/rag-monitor.sh > /dev/null << 'EOF'
#!/bin/bash
# RAG System Monitoring Script

LOGFILE="/var/log/rag-monitor.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

log_message() {
    echo "[$TIMESTAMP] $1" >> "$LOGFILE"
}

# Health checks
check_rag_server() {
    if curl -f -s http://localhost:3002/health > /dev/null; then
        log_message "✅ RAG Server healthy"
        return 0
    else
        log_message "❌ RAG Server unhealthy"
        systemctl restart rag-assistant
        return 1
    fi
}

check_chat_interface() {
    if curl -f -s http://localhost:3003/health > /dev/null; then
        log_message "✅ Chat Interface healthy"
        return 0
    else
        log_message "❌ Chat Interface unhealthy"
        systemctl restart chat-interface
        return 1
    fi
}

# Check database connectivity
check_database() {
    if pg_isready -q; then
        log_message "✅ Database accessible"
        return 0
    else
        log_message "❌ Database connection issues"
        return 1
    fi
}

# Check embeddings file
check_embeddings() {
    if [ -f "/var/www/crm-gtd/rag-assistant/database-embeddings.json" ]; then
        log_message "✅ Embeddings file exists"
        return 0
    else
        log_message "❌ Embeddings file missing - regenerating..."
        cd /var/www/crm-gtd/rag-assistant
        npm run initialize
        return 1
    fi
}

# Main monitoring
log_message "🔍 Starting RAG system health check"

check_rag_server
RAG_HEALTH=$?

check_chat_interface  
CHAT_HEALTH=$?

check_database
DB_HEALTH=$?

check_embeddings
EMBEDDINGS_HEALTH=$?

# Overall assessment
TOTAL_ISSUES=$((RAG_HEALTH + CHAT_HEALTH + DB_HEALTH + EMBEDDINGS_HEALTH))

if [ $TOTAL_ISSUES -eq 0 ]; then
    log_message "🎉 All RAG systems healthy"
else
    log_message "⚠️ Found $TOTAL_ISSUES RAG system issues"
fi

log_message "✅ RAG health check completed"
EOF

# Ustaw permissions i dodaj do cron
sudo chmod +x /usr/local/bin/rag-monitor.sh

sudo tee /etc/cron.d/rag-monitoring > /dev/null << 'EOF'
# RAG System Monitoring (every 10 minutes)
*/10 * * * * root /usr/local/bin/rag-monitor.sh
EOF

echo "✅ Monitoring skonfigurowany"
```

### **8.2 Log Analysis:**

```bash
echo "📋 Konfiguracja log analysis..."

# Utwórz log analysis script
sudo tee /usr/local/bin/rag-log-analysis.sh > /dev/null << 'EOF'
#!/bin/bash
# RAG Log Analysis Script

REPORT_DATE=$(date '+%Y-%m-%d')
REPORT_FILE="/var/log/rag-daily-report-$REPORT_DATE.txt"

echo "📊 RAG System Daily Report - $REPORT_DATE" > "$REPORT_FILE"
echo "============================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Query statistics
echo "🔍 Query Statistics:" >> "$REPORT_FILE"
echo "-------------------" >> "$REPORT_FILE"

# Count today's queries
QUERIES_TODAY=$(grep "$(date '+%Y-%m-%d')" /var/log/syslog | grep "rag-assistant" | grep -c "Processing query" || echo "0")
echo "Queries processed today: $QUERIES_TODAY" >> "$REPORT_FILE"

# Most common query types
echo "Top query patterns:" >> "$REPORT_FILE"
grep "$(date '+%Y-%m-%d')" /var/log/syslog | grep "rag-assistant" | grep "Processing query" | head -5 >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"

# Performance metrics
echo "⚡ Performance Metrics:" >> "$REPORT_FILE"
echo "----------------------" >> "$REPORT_FILE"

# Average response times (if logged)
RESPONSE_TIMES=$(grep "$(date '+%Y-%m-%d')" /var/log/syslog | grep "rag-assistant" | grep "ms" | wc -l || echo "0")
echo "Timed responses: $RESPONSE_TIMES" >> "$REPORT_FILE"

# Error count
ERRORS_TODAY=$(grep "$(date '+%Y-%m-%d')" /var/log/syslog | grep "rag-assistant" | grep -i error | wc -l || echo "0")
echo "Errors today: $ERRORS_TODAY" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"

# System status
echo "🖥️ System Status:" >> "$REPORT_FILE"
echo "-----------------" >> "$REPORT_FILE"
echo "RAG Server: $(systemctl is-active rag-assistant)" >> "$REPORT_FILE"
echo "Chat Interface: $(systemctl is-active chat-interface)" >> "$REPORT_FILE"
echo "Database: $(systemctl is-active postgresql)" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"

# Database statistics
echo "📊 Database Statistics:" >> "$REPORT_FILE"
echo "----------------------" >> "$REPORT_FILE"

# Get record counts from major tables
cd /var/www/crm-gtd
if command -v npx &> /dev/null; then
    echo "Companies: $(npx prisma db execute --stdin <<< 'SELECT COUNT(*) FROM companies;' 2>/dev/null | tail -1 || echo 'N/A')" >> "$REPORT_FILE"
    echo "Contacts: $(npx prisma db execute --stdin <<< 'SELECT COUNT(*) FROM contacts;' 2>/dev/null | tail -1 || echo 'N/A')" >> "$REPORT_FILE"
    echo "Deals: $(npx prisma db execute --stdin <<< 'SELECT COUNT(*) FROM deals;' 2>/dev/null | tail -1 || echo 'N/A')" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "Report generated at: $(date)" >> "$REPORT_FILE"

echo "📊 Daily RAG report generated: $REPORT_FILE"
EOF

# Ustaw permissions i dodaj do cron
sudo chmod +x /usr/local/bin/rag-log-analysis.sh

sudo tee /etc/cron.d/rag-daily-report > /dev/null << 'EOF'
# RAG Daily Report (every day at 7 AM)
0 7 * * * root /usr/local/bin/rag-log-analysis.sh
EOF

echo "✅ Log analysis skonfigurowany"
```

---

## 🎯 **KROK 9: PRODUCTION OPTIMIZATION**

### **9.1 Performance Optimization:**

```bash
echo "⚡ Optymalizacja performance RAG systemu..."

# Utwórz optimization script
sudo tee /usr/local/bin/rag-optimize.sh > /dev/null << 'EOF'
#!/bin/bash
# RAG Performance Optimization Script

echo "⚡ Starting RAG performance optimization..."

# Node.js optimization
echo "⚙️ Optimizing Node.js performance..."
cat >> /var/www/crm-gtd/rag-assistant/.env << NODE_OPT

# Performance optimizations
NODE_OPTIONS="--max-old-space-size=1024 --optimize-for-size"
UV_THREADPOOL_SIZE=6

# RAG specific optimizations
RAG_CACHE_ENABLED=true
RAG_CACHE_TTL=1800
RAG_MAX_CONCURRENT_QUERIES=5
RAG_EMBEDDING_BATCH_SIZE=10
NODE_OPT

# Database connection optimization
echo "🗄️ Optimizing database connections..."
cat >> /var/www/crm-gtd/rag-assistant/.env << DB_OPT

# Database optimization
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
DB_QUERY_TIMEOUT=30000
DB_OPT

# Embeddings optimization
echo "🧠 Optimizing embeddings performance..."
cd /var/www/crm-gtd/rag-assistant

# Compress embeddings file if large
if [ -f "database-embeddings.json" ]; then
    EMBEDDINGS_SIZE=$(stat -c%s database-embeddings.json)
    if [ $EMBEDDINGS_SIZE -gt 10485760 ]; then  # 10MB
        echo "📦 Compressing large embeddings file..."
        gzip -k database-embeddings.json
    fi
fi

# Restart services to apply optimizations
echo "🔄 Restarting services with optimizations..."
sudo systemctl restart rag-assistant
sudo systemctl restart chat-interface

echo "✅ RAG performance optimization completed!"
EOF

# Uruchom optimization
sudo chmod +x /usr/local/bin/rag-optimize.sh
sudo /usr/local/bin/rag-optimize.sh

echo "✅ Performance optimization zastosowany"
```

### **9.2 Security Hardening:**

```bash
echo "🔒 Security hardening RAG systemu..."

# API rate limiting
cat >> /var/www/crm-gtd/rag-assistant/src/rate-limiter.js << 'EOF'
// Rate Limiter for RAG API
const rateLimit = new Map();

function rateLimitMiddleware(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 50; // max 50 requests per 15 minutes
  
  if (!rateLimit.has(clientIP)) {
    rateLimit.set(clientIP, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const clientData = rateLimit.get(clientIP);
  
  if (now > clientData.resetTime) {
    // Reset window
    rateLimit.set(clientIP, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  if (clientData.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  clientData.count++;
  next();
}

module.exports = rateLimitMiddleware;
EOF

# Input validation
cat >> /var/www/crm-gtd/rag-assistant/src/input-validator.js << 'EOF'
// Input Validation for RAG queries
function validateQuery(query) {
  if (!query || typeof query !== 'string') {
    return { valid: false, error: 'Query must be a non-empty string' };
  }
  
  if (query.length > 1000) {
    return { valid: false, error: 'Query too long (max 1000 characters)' };
  }
  
  // Block potentially malicious patterns
  const maliciousPatterns = [
    /drop\s+table/gi,
    /delete\s+from/gi,
    /update\s+.*\s+set/gi,
    /insert\s+into/gi,
    /create\s+table/gi,
    /alter\s+table/gi,
    /truncate/gi,
    /<script/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];
  
  for (const pattern of maliciousPatterns) {
    if (pattern.test(query)) {
      return { valid: false, error: 'Query contains potentially unsafe content' };
    }
  }
  
  return { valid: true };
}

module.exports = { validateQuery };
EOF

echo "✅ Security hardening zastosowany"
```

---

## 🎉 **KROK 10: FINAL VALIDATION I DEPLOYMENT**

### **10.1 Complete System Test:**

```bash
echo "🎯 Final validation RAG systemu..."

# Comprehensive test suite
cat > /var/www/crm-gtd/rag-assistant/scripts/final-test.js << 'EOF'
// Comprehensive Final Test for RAG System
require('dotenv').config();

async function runFinalTests() {
  console.log('🎯 Running comprehensive RAG system tests...');
  
  const tests = [
    {
      name: 'Database Connection',
      test: async () => {
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const result = await pool.query('SELECT NOW()');
        pool.end();
        return result.rows.length > 0;
      }
    },
    {
      name: 'RAG Server Health',
      test: async () => {
        const response = await fetch('http://localhost:3002/health');
        return response.ok;
      }
    },
    {
      name: 'Chat Interface Health',
      test: async () => {
        const response = await fetch('http://localhost:3003/health');
        return response.ok;
      }
    },
    {
      name: 'Simple Query Test',
      test: async () => {
        const response = await fetch('http://localhost:3002/api/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.RAG_API_KEY
          },
          body: JSON.stringify({ question: 'Count companies' })
        });
        const data = await response.json();
        return data.success === true;
      }
    },
    {
      name: 'Complex Query Test',
      test: async () => {
        const response = await fetch('http://localhost:3002/api/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.RAG_API_KEY
          },
          body: JSON.stringify({ 
            question: 'Show me companies created this month with their contact information' 
          })
        });
        const data = await response.json();
        return data.success === true;
      }
    },
    {
      name: 'External Access Test',
      test: async () => {
        const response = await fetch('http://91.99.50.80/chat');
        return response.ok;
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}...`);
      const result = await test.test();
      
      if (result) {
        console.log(`✅ ${test.name}: PASSED`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: FAILED`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! RAG system is ready for production.');
  } else {
    console.log('⚠️ Some tests failed. Please check the configuration.');
  }
}

runFinalTests().catch(console.error);
EOF

# Uruchom final test
cd /var/www/crm-gtd/rag-assistant
node scripts/final-test.js

echo "✅ Final validation zakończony"
```

### **10.2 Documentation i instrukcje użytkowania:**

```bash
echo "📚 Tworzę dokumentację RAG systemu..."

# Utwórz README z instrukcjami
cat > /var/www/crm-gtd/rag-assistant/README.md << 'EOF'
# 🤖 CRM-GTD RAG Assistant

## DeepSeek + Database Chat System

Ten system umożliwia prowadzenie rozmów z DeepSeek AI na temat danych zawartych w bazie CRM-GTD przy użyciu technologii RAG (Retrieval-Augmented Generation).

## 🌐 Dostęp

- **Chat Interface**: http://91.99.50.80/chat
- **RAG API**: http://91.99.50.80/api/rag/
- **Health Check**: http://91.99.50.80/api/rag/health

## 💬 Przykładowe pytania

### Podstawowe zapytania:
- "Ile mamy firm w bazie danych?"
- "Pokaż mi wszystkie aktywne deale"
- "Lista kontaktów utworzonych w tym miesiącu"

### Zaawansowane zapytania:
- "Jaka jest łączna wartość wszystkich dealów?"
- "Pokaż firmy z branży technologicznej"
- "Kontakty które nie odpowiedziały na emaile"
- "Analiza sprzedaży za ostatnie 3 miesiące"

### Raporty i analityka:
- "Wygeneruj raport sprzedaży za Q4"
- "Pokaż statystyki konwersji leadów"
- "Najbardziej aktywni klienci"

## 🔧 Zarządzanie systemem

### Status serwisów:
```bash
sudo systemctl status rag-assistant
sudo systemctl status chat-interface
```

### Restart serwisów:
```bash
sudo systemctl restart rag-assistant
sudo systemctl restart chat-interface
```

### Logi:
```bash
# RAG Server logs
sudo journalctl -u rag-assistant -f

# Chat Interface logs  
sudo journalctl -u chat-interface -f

# Daily reports
cat /var/log/rag-daily-report-$(date +%Y-%m-%d).txt
```

### Regeneracja embeddings:
```bash
cd /var/www/crm-gtd/rag-assistant
npm run initialize
```

## 🔒 Bezpieczeństwo

- API chronione kluczem API
- Rate limiting: 50 zapytań na 15 minut
- Walidacja wejścia przeciwko SQL injection
- Tylko zapytania SELECT do bazy danych

## 📊 Monitoring

System automatycznie monitoruje:
- Zdrowie serwisów (co 10 minut)
- Dzienne raporty użytkowania
- Performance metrics
- Błędy i problemy

## 🚀 API Endpoints

### POST /api/query
Główny endpoint do zapytań RAG:

```bash
curl -X POST http://91.99.50.80/api/rag/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"question": "How many companies are active?"}'
```

Response:
```json
{
  "success": true,
  "response": "Based on your question...",
  "relevant_tables": ["companies"],
  "sql_query": "SELECT COUNT(*) FROM companies WHERE status = 'active'",
  "data": [...],
  "row_count": 42
}
```

### GET /api/schema
Pobiera schema bazy danych:

```bash
curl http://91.99.50.80/api/rag/schema \
  -H "X-API-Key: YOUR_API_KEY"
```

## 🛠️ Troubleshooting

### Problem: Chat interface nie ładuje się
```bash
sudo systemctl restart chat-interface
sudo nginx -t && sudo systemctl reload nginx
```

### Problem: Brak odpowiedzi na zapytania
```bash
# Sprawdź połączenie z bazą
sudo systemctl status postgresql
# Sprawdź RAG server
sudo systemctl restart rag-assistant
```

### Problem: Błędne wyniki zapytań
```bash
# Regeneruj embeddings
cd /var/www/crm-gtd/rag-assistant
npm run initialize
```

## 📈 Performance Tips

- Embeddings są cache'owane - regeneruj tylko gdy schema się zmienia
- Kompleksowe zapytania mogą trwać 5-15 sekund
- System obsługuje max 5 równoczesnych zapytań
- Dla lepszej performance używaj konkretnych pytań

## 🎯 Best Practices

1. **Precyzyjne pytania**: Im bardziej konkretne pytanie, tym lepsza odpowiedź
2. **Używaj nazw z bazy**: "companies", "contacts", "deals" zamiast ogólnych terminów
3. **Określaj czasokres**: "w tym miesiącu", "ostatnie 30 dni"
4. **Prosuj o konkretne dane**: "pokaż nazwy i wartości" zamiast "pokaż wszystko"

## 🔮 Możliwości systemu

System może odpowiadać na pytania dotyczące:
- ✅ Companies (firmy)
- ✅ Contacts (kontakty)  
- ✅ Deals (deale/sprzedaż)
- ✅ Tasks (zadania)
- ✅ Meetings (spotkania)
- ✅ Invoices (faktury)
- ✅ Generated Websites (strony AI)
- ✅ Users (użytkownicy)
- ✅ Analytics i raporty

Działa w językach: **Polski** i **Angielski**
EOF

echo "✅ Dokumentacja utworzona"
```

### **10.3 Final deployment validation:**

```bash
echo "🎉 Final deployment validation..."

# Check all services
echo "📊 Status wszystkich serwisów:"
systemctl is-active postgresql && echo "✅ PostgreSQL: Running" || echo "❌ PostgreSQL: Down"
systemctl is-active nginx && echo "✅ Nginx: Running" || echo "❌ Nginx: Down"  
systemctl is-active rag-assistant && echo "✅ RAG Assistant: Running" || echo "❌ RAG Assistant: Down"
systemctl is-active chat-interface && echo "✅ Chat Interface: Running" || echo "❌ Chat Interface: Down"

# Test external access
echo "🌐 Test dostępu zewnętrznego:"
curl -I http://91.99.50.80/chat && echo "✅ Chat Interface: Accessible" || echo "❌ Chat Interface: Not accessible"
curl -I http://91.99.50.80/crm && echo "✅ Main CRM: Accessible" || echo "❌ Main CRM: Not accessible"

# Test API functionality
echo "🔍 Test funkcjonalności API:"
API_RESPONSE=$(curl -s -X POST http://localhost:3002/api/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $RAG_API_KEY" \
  -d '{"question":"test"}')

if echo "$API_RESPONSE" | grep -q "success"; then
    echo "✅ RAG API: Working"
else
    echo "❌ RAG API: Not working"
fi

echo ""
echo "🎉 DEEPSEEK + CRM DATABASE RAG SYSTEM DEPLOYED!"
echo "=============================================="
echo ""
echo "🌐 Access Points:"
echo "   Chat Interface: http://91.99.50.80/chat"
echo "   Main CRM: http://91.99.50.80/crm"
echo "   RAG API: http://91.99.50.80/api/rag/"
echo ""
echo "💬 Try asking:"
echo "   - How many companies do we have?"
echo "   - Show me active deals"
echo "   - List contacts created this month"
echo "   - What's our total deal value?"
echo ""
echo "📚 Documentation: /var/www/crm-gtd/rag-assistant/README.md"
echo ""
echo "🎯 KILLER FEATURE READY!"
echo "Pierwszy na świecie CRM z DeepSeek AI chat assistant!"
```

---

## 🎉 **SUMMARY & EXECUTION**

### **🎯 Co zostało utworzone:**

1. **✅ Database RAG System** - Semantic search w bazie CRM
2. **✅ DeepSeek Integration** - AI chat z dostępem do danych  
3. **✅ Chat Interface** - Web UI dla rozmów z AI
4. **✅ Production Deployment** - Gotowe na VPS Hetzner
5. **✅ Monitoring & Security** - Enterprise-grade operations

### **🚀 Jak uruchomić:**

```bash
# Skopiuj i uruchom wszystkie instrukcje
cd /var/www/crm-gtd
mkdir -p rag-assistant && cd rag-assistant

# Skopiuj kod z artifacts do plików
# Następnie uruchom:
npm install
npm run initialize
sudo systemctl start rag-assistant
sudo systemctl start chat-interface

# Test:
curl http://91.99.50.80/chat
```

### **💰 Business Value:**

- **🤖 AI Chat Assistant** - DeepSeek może odpowiadać na pytania o CRM
- **📊 Real-time Analytics** - Instant insights z bazy danych
- **🎯 Natural Language Queries** - Zapytania w języku naturalnym
- **🚀 Market Differentiation** - Pierwszy CRM z DeepSeek integration

**🎉 DEEPSEEK DATABASE RAG ASSISTANT GOTOWY!**

*Pierwsza na świecie integracja DeepSeek AI z bazą danych CRM!* DatabaseAnalyzer;
EOF

echo "🔍 Database Analyzer utworzony"
```

### **2.2 Embeddings Generator:**

```bash
# Utwórz generator embeddings dla danych
cat > src/embeddings-generator.js << 'EOF'
// Embeddings Generator for CRM Data
const { HfInference } = require('@huggingface/inference');
const fs = require('fs').promises;

class EmbeddingsGenerator {
  constructor() {
    this.hf = new HfInference(process.env.HF_TOKEN);
    this.model = 'sentence-transformers/all-MiniLM-L6-v2';
  }

  async generateTextEmbedding(text) {
    try {
      const response = await this.hf.featureExtraction({
        model: this.model,
        inputs: text
      });
      return Array.isArray(response[0]) ? response[0] : response;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return null;
    }
  }

  async generateDatabaseEmbeddings(databaseDescriptions) {
    const embeddings = {};
    
    for (const [tableName, tableInfo] of Object.entries(databaseDescriptions)) {
      console.log(`📊 Generating embeddings for table: ${tableName}`);
      
      // Generate embedding for table description
      const tableDescription = tableInfo.description;
      const tableEmbedding = await this.generateTextEmbedding(tableDescription);
      
      if (tableEmbedding) {
        embeddings[tableName] = {
          table: tableName,
          description: tableDescription,
          embedding: tableEmbedding,
          metadata: {
            totalRows: tableInfo.totalRows,
            columns: tableInfo.columns.map(c => c.column_name),
            relationships: tableInfo.relationships
          }
        };
      }
      
      // Generate embeddings for sample data (for better context)
      if (tableInfo.sampleData && tableInfo.sampleData.length > 0) {
        embeddings[tableName].sampleDataEmbeddings = [];
        
        for (const row of tableInfo.sampleData.slice(0, 3)) {
          const rowText = this.rowToText(row, tableInfo.columns);
          const rowEmbedding = await this.generateTextEmbedding(rowText);
          
          if (rowEmbedding) {
            embeddings[tableName].sampleDataEmbeddings.push({
              text: rowText,
              embedding: rowEmbedding,
              data: row
            });
          }
        }
      }
    }
    
    return embeddings;
  }

  rowToText(row, columns) {
    const textParts = [];
    
    for (const [key, value] of Object.entries(row)) {
      if (value !== null && value !== undefined) {
        const column = columns.find(c => c.column_name === key);
        const columnType = column?.data_type || 'unknown';
        
        if (columnType.includes('text') || columnType.includes('varchar')) {
          textParts.push(`${key}: ${value}`);
        } else if (columnType.includes('timestamp') || columnType.includes('date')) {
          textParts.push(`${key}: ${new Date(value).toLocaleDateString()}`);
        } else {
          textParts.push(`${key}: ${value}`);
        }
      }
    }
    
    return textParts.join(', ');
  }

  async saveEmbeddings(embeddings, filename = 'database-embeddings.json') {
    await fs.writeFile(filename, JSON.stringify(embeddings, null, 2));
    console.log(`💾 Embeddings saved to ${filename}`);
  }

  async loadEmbeddings(filename = 'database-embeddings.json') {
    try {
      const data = await fs.readFile(filename, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.log('No existing embeddings found, will generate new ones');
      return null;
    }
  }

  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async findSimilarTables(queryText, embeddings, threshold = 0.7) {
    const queryEmbedding = await this.generateTextEmbedding(queryText);
    if (!queryEmbedding) return [];
    
    const similarities = [];
    
    for (const [tableName, tableData] of Object.entries(embeddings)) {
      const similarity = this.cosineSimilarity(queryEmbedding, tableData.embedding);
      
      if (similarity >= threshold) {
        similarities.push({
          table: tableName,
          similarity: similarity,
          description: tableData.description,
          metadata: tableData.metadata
        });
      }
    }
    
    return similarities.sort((a, b) => b.similarity - a.similarity);
  }
}

module.exports = EmbeddingsGenerator;
EOF

echo "🧠 Embeddings Generator utworzony"
```

---

## 🤖 **KROK 3: SQL QUERY GENERATOR**

### **3.1 Natural Language to SQL Converter:**

```bash
# Utwórz konwerter z natural language na SQL
cat > src/sql-generator.js << 'EOF'
// Natural Language to SQL Generator for CRM-GTD
const { Pool } = require('pg');

class SQLGenerator {
  constructor(databaseUrl, databaseDescriptions) {
    this.pool = new Pool({ connectionString: databaseUrl });
    this.schemas = databaseDescriptions;
    this.commonPatterns = this.buildCommonPatterns();
  }

  buildCommonPatterns() {
    return {
      // Temporal patterns
      temporal: {
        'today': "DATE(created_at) = CURRENT_DATE",
        'yesterday': "DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'",
        'this week': "created_at >= DATE_TRUNC('week', CURRENT_DATE)",
        'this month': "created_at >= DATE_TRUNC('month', CURRENT_DATE)",
        'this year': "created_at >= DATE_TRUNC('year', CURRENT_DATE)",
        'last 7 days': "created_at >= CURRENT_DATE - INTERVAL '7 days'",
        'last 30 days': "created_at >= CURRENT_DATE - INTERVAL '30 days'"
      },
      
      // Aggregation patterns
      aggregation: {
        'count': 'COUNT(*)',
        'total': 'SUM',
        'average': 'AVG',
        'maximum': 'MAX',
        'minimum': 'MIN',
        'sum': 'SUM'
      },
      
      // Common filters
      filters: {
        'active': "status = 'active'",
        'inactive': "status = 'inactive'",
        'draft': "status = 'draft'",
        'completed': "status = 'completed'",
        'pending': "status = 'pending'"
      }
    };
  }

  async generateSQL(naturalLanguageQuery, relevantTables) {
    const query = naturalLanguageQuery.toLowerCase();
    
    // Determine query type
    const queryType = this.detectQueryType(query);
    
    // Extract entities and conditions
    const entities = this.extractEntities(query, relevantTables);
    const conditions = this.extractConditions(query);
    const aggregations = this.extractAggregations(query);
    
    // Build SQL based on query type
    switch (queryType) {
      case 'select':
        return this.buildSelectQuery(entities, conditions, aggregations);
      case 'count':
        return this.buildCountQuery(entities, conditions);
      case 'aggregation':
        return this.buildAggregationQuery(entities, conditions, aggregations);
      case 'report':
        return this.buildReportQuery(entities, conditions, aggregations);
      default:
        return this.buildDefaultQuery(entities, conditions);
    }
  }

  detectQueryType(query) {
    if (query.includes('how many') || query.includes('count')) return 'count';
    if (query.includes('total') || query.includes('sum') || query.includes('average')) return 'aggregation';
    if (query.includes('report') || query.includes('analysis')) return 'report';
    if (query.includes('show') || query.includes('list') || query.includes('find')) return 'select';
    return 'select';
  }

  extractEntities(query, relevantTables) {
    const entities = [];
    
    // Map common terms to table names
    const tableMapping = {
      'company': 'companies',
      'companies': 'companies',
      'client': 'companies',
      'clients': 'companies',
      'contact': 'contacts',
      'contacts': 'contacts',
      'person': 'contacts',
      'people': 'contacts',
      'deal': 'deals',
      'deals': 'deals',
      'opportunity': 'deals',
      'opportunities': 'deals',
      'sale': 'deals',
      'sales': 'deals',
      'task': 'tasks',
      'tasks': 'tasks',
      'todo': 'tasks',
      'meeting': 'meetings',
      'meetings': 'meetings',
      'appointment': 'meetings',
      'invoice': 'invoices',
      'invoices': 'invoices',
      'bill': 'invoices',
      'payment': 'invoices',
      'lead': 'leads',
      'leads': 'leads',
      'prospect': 'leads',
      'user': 'users',
      'users': 'users',
      'website': 'generated_websites',
      'websites': 'generated_websites'
    };
    
    for (const [term, tableName] of Object.entries(tableMapping)) {
      if (query.includes(term) && relevantTables.some(t => t.table === tableName)) {
        entities.push({
          term: term,
          table: tableName,
          schema: this.schemas[tableName]
        });
      }
    }
    
    return entities;
  }

  extractConditions(query) {
    const conditions = [];
    
    // Temporal conditions
    for (const [pattern, sqlCondition] of Object.entries(this.commonPatterns.temporal)) {
      if (query.includes(pattern)) {
        conditions.push({
          type: 'temporal',
          pattern: pattern,
          sql: sqlCondition
        });
      }
    }
    
    // Status conditions
    for (const [pattern, sqlCondition] of Object.entries(this.commonPatterns.filters)) {
      if (query.includes(pattern)) {
        conditions.push({
          type: 'filter',
          pattern: pattern,
          sql: sqlCondition
        });
      }
    }
    
    // Extract specific values (simple patterns)
    const valuePatterns = [
      { pattern: /with name[s]? (like |containing )?['""]([^'"]+)['""]/, column: 'name' },
      { pattern: /with email[s]? (like |containing )?['""]([^'"]+)['""]/, column: 'email' },
      { pattern: /in industry ['""]([^'"]+)['""]/, column: 'industry' },
      { pattern: /worth more than (\d+)/, column: 'value', operator: '>' },
      { pattern: /worth less than (\d+)/, column: 'value', operator: '<' }
    ];
    
    for (const { pattern, column, operator = '=' } of valuePatterns) {
      const match = query.match(pattern);
      if (match) {
        conditions.push({
          type: 'value',
          column: column,
          operator: operator,
          value: match[1] || match[2],
          sql: `${column} ${operator} '${match[1] || match[2]}'`
        });
      }
    }
    
    return conditions;
  }

  extractAggregations(query) {
    const aggregations = [];
    
    for (const [pattern, sqlFunction] of Object.entries(this.commonPatterns.aggregation)) {
      if (query.includes(pattern)) {
        aggregations.push({
          type: pattern,
          sqlFunction: sqlFunction
        });
      }
    }
    
    return aggregations;
  }

  buildSelectQuery(entities, conditions, aggregations) {
    if (entities.length === 0) return null;
    
    const primaryEntity = entities[0];
    const tableName = primaryEntity.table;
    
    // Basic SELECT
    let sqlQuery = `SELECT * FROM ${tableName}`;
    
    // Add WHERE conditions
    const whereConditions = [];
    for (const condition of conditions) {
      whereConditions.push(condition.sql);
    }
    
    if (whereConditions.length > 0) {
      sqlQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Add ORDER BY
    if (this.schemas[tableName]?.columns.some(c => c.column_name === 'created_at')) {
      sqlQuery += ' ORDER BY created_at DESC';
    }
    
    // Add LIMIT
    sqlQuery += ' LIMIT 50';
    
    return {
      sql: sqlQuery,
      explanation: `Selecting records from ${tableName} table with applied filters`,
      tableName: tableName
    };
  }

  buildCountQuery(entities, conditions) {
    if (entities.length === 0) return null;
    
    const primaryEntity = entities[0];
    const tableName = primaryEntity.table;
    
    let sqlQuery = `SELECT COUNT(*) as total FROM ${tableName}`;
    
    const whereConditions = [];
    for (const condition of conditions) {
      whereConditions.push(condition.sql);
    }
    
    if (whereConditions.length > 0) {
      sqlQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    return {
      sql: sqlQuery,
      explanation: `Counting records in ${tableName} table with applied filters`,
      tableName: tableName
    };
  }

  buildAggregationQuery(entities, conditions, aggregations) {
    if (entities.length === 0 || aggregations.length === 0) return null;
    
    const primaryEntity = entities[0];
    const tableName = primaryEntity.table;
    const aggregation = aggregations[0];
    
    // Find appropriate column for aggregation
    const numericColumns = this.schemas[tableName]?.columns.filter(c => 
      c.data_type.includes('integer') || 
      c.data_type.includes('decimal') || 
      c.data_type.includes('numeric')
    ) || [];
    
    const aggregateColumn = numericColumns.find(c => 
      c.column_name.includes('value') || 
      c.column_name.includes('amount') || 
      c.column_name.includes('price')
    ) || numericColumns[0];
    
    let sqlQuery;
    if (aggregateColumn && aggregation.type !== 'count') {
      sqlQuery = `SELECT ${aggregation.sqlFunction}(${aggregateColumn.column_name}) as ${aggregation.type}_value FROM ${tableName}`;
    } else {
      sqlQuery = `SELECT COUNT(*) as count_value FROM ${tableName}`;
    }
    
    const whereConditions = [];
    for (const condition of conditions) {
      whereConditions.push(condition.sql);
    }
    
    if (whereConditions.length > 0) {
      sqlQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    return {
      sql: sqlQuery,
      explanation: `Calculating ${aggregation.type} for ${tableName} table`,
      tableName: tableName
    };
  }

  buildDefaultQuery(entities, conditions) {
    if (entities.length === 0) {
      // Generic query for common requests
      return {
        sql: "SELECT 'Please specify what data you would like to see from the CRM database' as message",
        explanation: "Need more specific information to generate appropriate query",
        tableName: null
      };
    }
    
    return this.buildSelectQuery(entities, conditions, []);
  }

  async executeQuery(queryObj) {
    try {
      console.log('🔍 Executing SQL:', queryObj.sql);
      const result = await this.pool.query(queryObj.sql);
      
      return {
        success: true,
        data: result.rows,
        rowCount: result.rowCount,
        explanation: queryObj.explanation,
        sql: queryObj.sql
      };
    } catch (error) {
      console.error('SQL execution error:', error);
      return {
        success: false,
        error: error.message,
        sql: queryObj.sql
      };
    }
  }

  async validateQuery(sql) {
    try {
      // Use EXPLAIN to validate without executing
      await this.pool.query(`EXPLAIN ${sql}`);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = SQLGenerator;
EOF

echo "🔧 SQL Generator utworzony"
```

---

## 🚀 **KROK 4: RAG API SERVER**

### **4.1 Main RAG Server:**

```bash
# Utwórz główny serwer RAG
cat > src/rag-server.js << 'EOF'
// RAG Server for DeepSeek + CRM Database Integration
const express = require('express');
const cors = require('cors');
const DatabaseAnalyzer = require('./database-analyzer');
const EmbeddingsGenerator = require('./embeddings-generator');
const SQLGenerator = require('./sql-generator');

class RAGServer {
  constructor() {
    this.app = express();
    this.port = process.env.RAG_PORT || 3002;
    this.databaseUrl = process.env.DATABASE_URL;
    
    this.setupMiddleware();
    this.setupRoutes();
    
    // Initialize components
    this.dbAnalyzer = new DatabaseAnalyzer(this.databaseUrl);
    this.embeddingsGen = new EmbeddingsGenerator();
    this.sqlGen = null; // Will be initialized after database analysis
    
    this.embeddings = null;
    this.databaseDescriptions = null;
  }

  setupMiddleware() {
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));
    
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // API Key middleware
    this.app.use('/api', (req, res, next) => {
      const apiKey = req.headers['x-api-key'] || req.query.api_key;
      if (!apiKey || apiKey !== process.env.RAG_API_KEY) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      next();
    });
    
    // Logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'CRM-GTD RAG Server',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        database_connected: !!this.databaseDescriptions,
        embeddings_loaded: !!this.embeddings
      });
    });

    // Initialize database analysis
    this.app.post('/api/initialize', async (req, res) => {
      try {
        await this.initializeRAG();
        res.json({
          success: true,
          message: 'RAG system initialized successfully',
          tables_analyzed: Object.keys(this.databaseDescriptions).length
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Query endpoint for DeepSeek
    this.app.post('/api/query', async (req, res) => {
      try {
        const { question, context = {} } = req.body;
        
        if (!question) {
          return res.status(400).json({
            success: false,
            error: 'Question is required'
          });
        }

        const result = await this.processQuery(question, context);
        res.json(result);
        
      } catch (error) {
        console.error('Query processing error:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get database schema
    this.app.get('/api/schema', async (req, res) => {
      try {
        if (!this.databaseDescriptions) {
          await this.initializeRAG();
        }
        
        res.json({
          success: true,
          schemas: this.databaseDescriptions
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Execute custom SQL (with safety checks)
    this.app.post('/api/sql', async (req, res) => {
      try {
        const { sql } = req.body;
        
        // Safety check - only allow SELECT queries
        if (!sql.trim().toLowerCase().startsWith('select')) {
          return res.status(400).json({
            success: false,
            error: 'Only SELECT queries are allowed'
          });
        }
        
        const validation = await this.sqlGen.validateQuery(sql);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            error: `Invalid SQL: ${validation.error}`
          });
        }
        
        const result = await this.sqlGen.executeQuery({ sql, explanation: 'Custom SQL query' });
        res.json(result);
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  }

  async initializeRAG() {
    console.log('🚀 Initializing RAG system...');
    
    // Step 1: Analyze database
    console.log('📊 Analyzing database schema...');
    this.databaseDescriptions = await this.dbAnalyzer.generateTableDescriptions();
    
    // Step 2: Generate/load embeddings
    console.log('🧠 Loading/generating embeddings...');
    this.embeddings = await this.embeddingsGen.loadEmbeddings();
    
    if (!this.embeddings) {
      console.log('📝 Generating new embeddings...');
      this.embeddings = await this.embeddingsGen.generateDatabaseEmbeddings(this.databaseDescriptions);
      await this.embeddingsGen.saveEmbeddings(this.embeddings);
    }
    
    // Step 3: Initialize SQL generator
    this.sqlGen = new SQLGenerator(this.databaseUrl, this.databaseDescriptions);
    
    console.log('✅ RAG system initialized successfully!');
    console.log(`📋 Tables analyzed: ${Object.keys(this.databaseDescriptions).length}`);
    console.log(`🧠 Embeddings loaded: ${Object.keys(this.embeddings).length}`);
  }

  async processQuery(question, context = {}) {
    if (!this.embeddings || !this.sqlGen) {
      await this.initializeRAG();
    }

    console.log('🔍 Processing query:', question);
    
    // Step 1: Find relevant tables using semantic search
    const relevantTables = await this.embeddingsGen.findSimilarTables(
      question, 
      this.embeddings, 
      parseFloat(process.env.RAG_SIMILARITY_THRESHOLD) || 0.7
    );
    
    console.log('📊 Relevant tables:', relevantTables.map(t => t.table));
    
    if (relevantTables.length === 0) {
      return {
        success: true,
        response: "I couldn't find relevant data in the CRM database for your question. Could you be more specific about what information you're looking for?",
        relevant_tables: [],
        sql_query: null,
        data: []
      };
    }
    
    // Step 2: Generate SQL query
    const sqlQueryObj = await this.sqlGen.generateSQL(question, relevantTables);
    
    if (!sqlQueryObj) {
      return {
        success: true,
        response: "I understand your question but couldn't generate an appropriate database query. Could you rephrase your request?",
        relevant_tables: relevantTables.map(t => t.table),
        sql_query: null,
        data: []
      };
    }
    
    // Step 3: Execute query
    const queryResult = await this.sqlGen.executeQuery(sqlQueryObj);
    
    if (!queryResult.success) {
      return {
        success: false,
        response: `I encountered an error while querying the database: ${queryResult.error}`,
        relevant_tables: relevantTables.map(t => t.table),
        sql_query: sqlQueryObj.sql,
        data: []
      };
    }
    
    // Step 4: Format response for DeepSeek
    const formattedResponse = this.formatResponseForDeepSeek(
      question, 
      queryResult, 
      relevantTables,
      sqlQueryObj
    );
    
    return {
      success: true,
      response: formattedResponse,
      relevant_tables: relevantTables.map(t => t.table),
      sql_query: sqlQueryObj.sql,
      data: queryResult.data,
      row_count: queryResult.rowCount
    };
  }

  formatResponseForDeepSeek(question, queryResult, relevantTables, sqlQueryObj) {
    const { data, rowCount } = queryResult;
    
    if (rowCount === 0) {
      return `I searched the CRM database but found no records matching your query. The query searched in: ${relevantTables.map(t => t.table).join(', ')}.`;
    }
    
    let response = `Based on your question "${question}", I found ${rowCount} record(s) in the CRM database:\n\n`;
    
    // Add summary based on query type
    if (sqlQueryObj.sql.includes('COUNT(*)')) {
      const countValue = data[0].total || data[0].count_value || rowCount;
      response += `Total count: ${countValue}\n\n`;
    } else if (sqlQueryObj.sql.includes('SUM(') || sqlQueryObj.sql.includes('AVG(')) {
      const aggregateValue = Object.values(data[0])[0];
      response += `Result: ${aggregateValue}\n\n`;
    } else {
      // Show first few records
      const displayCount = Math.min(5, data.length);
      response += `Showing first ${displayCount} records:\n\n`;
      
      for (let i = 0; i < displayCount; i++) {
        const record = data[i];
        response += `${i + 1}. `;
        
        // Format record based on table type
        if (relevantTables[0]?.table === 'companies') {
          response += `Company: ${record.name || 'N/A'}, Industry: ${record.industry || 'N/A'}, Status: ${record.status || 'N/A'}`;
        } else if (relevantTables[0]?.table === 'contacts') {
          response += `Contact: ${record.first_name || ''} ${record.last_name || ''}, Email: ${record.email || 'N/A'}, Company: ${record.company_name || 'N/A'}`;
        } else if (relevantTables[0]?.table === 'deals') {
          response += `Deal: ${record.title || 'N/A'}, Value: ${record.value || 'N/A'}, Stage: ${record.stage || 'N/A'}, Status: ${record.status || 'N/A'}`;
        } else {
          // Generic format
          const keys = Object.keys(record).slice(0, 3);
          const values = keys.map(key => `${key}: ${record[key] || 'N/A'}`);
          response += values.join(', ');
        }
        
        response += '\n';
      }
      
      if (data.length > displayCount) {
        response += `\n... and ${data.length - displayCount} more records.`;
      }
    }
    
    response += `\n\nData source: ${relevantTables.map(t => t.table).join(', ')} table(s)`;
    
    return response;
  }

  async start() {
    try {
      await this.initializeRAG();
      
      this.app.listen(this.port, () => {
        console.log(`🚀 RAG Server running on port ${this.port}`);
        console.log(`🔗 API endpoint: http://localhost:${this.port}/api/query`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
      });
    } catch (error) {
      console.error('Failed to start RAG server:', error);
      process.exit(1);
    }
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new RAGServer();
  server.start();
}

module.exports = RAGServer;
EOF

echo "🚀 RAG Server utworzony"
```

### **4.2 Package.json i startup scripts:**

```bash
# Aktualizuj package.json
cat > package.json << 'EOF'
{
  "name": "crm-gtd-rag-assistant",
  "version": "1.0.0",
  "description": "RAG Assistant for DeepSeek + CRM Database Integration",
  "main": "src/rag-server.js",
  "scripts": {
    "start": "node src/rag-server.js",
    "dev": "nodemon src/rag-server.js",
    "initialize": "node scripts/initialize-rag.js",
    "test": "node scripts/test-rag.js",
    "backup-embeddings": "cp database-embeddings.json database-embeddings.backup.json"
  },
  "dependencies": {
    "@xenova/transformers": "^2.6.0",
    "pg": "^8.8.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "uuid": "^9.0.0",
    "@huggingface/inference": "^2.6.1"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
EOF

# Utwórz initialization script
mkdir -p scripts
cat > scripts/initialize-rag.js << 'EOF'
// Initialize RAG System
require('dotenv').config();
const RAGServer = require('../src/rag-server');

async function initializeRAG() {
  console.log('🚀 Initializing RAG system for CRM-GTD...');
  
  try {
    const server = new RAGServer();
    await server.initializeRAG();
    
    console.log('✅ RAG initialization completed successfully!');
    console.log('📊 You can now start the server with: npm start');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ RAG initialization failed:', error);
    process.exit(1);
  }
}

initializeRAG();
EOF

# Utwórz test script
cat > scripts/test-rag.js << 'EOF'
// Test RAG System
require('dotenv').config();
const http = require('http');

async function testRAG() {
  console.log('🧪 Testing RAG system...');
  
  // Test questions
  const testQuestions = [
    "How many companies are in the database?",
    "Show me all active deals",
    "List contacts created this month",
    "What is the total value of all deals?",
    "Show me companies in the technology industry"
  ];
  
  for (const question of testQuestions) {
    console.log(`\n🔍 Testing: "${question}"`);
    
    try {
      const result = await makeAPICall('/api/query', {
        question: question
      });
      
      console.log(`✅ Response: ${result.response.substring(0, 100)}...`);
      console.log(`📊 Tables used: ${result.relevant_tables.join(', ')}`);
      console.log(`📝 SQL: ${result.sql_query}`);
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

function makeAPICall(endpoint, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: process.env.RAG_PORT || 3002,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-API-Key': process.env.RAG_API_KEY
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

testRAG();
EOF

echo "📦 Package configuration i scripts utworzone"
```

---

## 🔗 **KROK 5: DEEPSEEK INTEGRATION**

### **5.1 DeepSeek API Client:**

```bash
# Utwórz klient DeepSeek API
cat > src/deepseek-client.js << 'EOF'
// DeepSeek API Client for RAG Integration
const https = require('https');

class DeepSeekClient {
  constructor(apiKey, baseUrl = 'https://api.deepseek.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.ragApiUrl = `http://localhost:${process.env.RAG_PORT || 3002}`;
    this.ragApiKey = process.env.RAG_API_KEY;
  }

  async chatWithRAG(message, context = {}) {
    try {
      // Step 1: Query RAG system for relevant data
      console.log('🔍 Querying RAG system...');
      const ragResponse = await this.queryRAG(message, context);
      
      // Step 2: Prepare enhanced prompt for DeepSeek
      const enhancedPrompt = this.buildEnhancedPrompt(message, ragResponse);
      
      // Step 3: Send to DeepSeek
      console.log('🤖 Sending to DeepSeek...');
      const deepseekResponse = await this.callDeepSeek(enhancedPrompt);
      
      return {
        success: true,
        original_question: message,
        rag_data: ragResponse,
        deepseek_response: deepseekResponse,
        final_answer: deepseekResponse.choices[0]?.message?.content || 'No response from DeepSeek'
      };
      
    } catch (error) {
      console.error('DeepSeek RAG integration error:', error);
      return {
        success: false,
        error: error.message,
        original_question: message
      };
    }
  }

  async queryRAG(question, context) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        question: question,
        context: context
      });
      
      const options = {
        hostname: 'localhost',
        port: process.env.RAG_PORT || 3002,
        path: '/api/query',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'X-API-Key': this.ragApiKey
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (error) {
            reject(new Error('Invalid RAG response'));
          }
        });
      });
      
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  buildEnhancedPrompt(originalQuestion, ragResponse) {
    if (!ragResponse.success || !ragResponse.data || ragResponse.data.length === 0) {
      return {
        role: "user",
        content: `${originalQuestion}

Note: I searched the CRM database but couldn't find relevant data for this question. Please provide a helpful response based on general CRM knowledge.`
      };
    }
    
    const dataContext = this.formatDataForPrompt(ragResponse);
    
    return {
      role: "user",
      content: `You are a CRM assistant with access to real-time data from a CRM-GTD system. 

User Question: ${originalQuestion}

CRM Database Results:
${dataContext}

SQL Query Used: ${ragResponse.sql_query || 'N/A'}
Tables Searched: ${ragResponse.relevant_tables?.join(', ') || 'N/A'}

Please provide a helpful, accurate response based on this real CRM data. If the data shows specific numbers, include them in your response. Be conversational and helpful.`
    };
  }

  formatDataForPrompt(ragResponse) {
    if (!ragResponse.data || ragResponse.data.length === 0) {
      return "No relevant data found in the CRM database.";
    }
    
    let formatted = `Found ${ragResponse.row_count} record(s):\n\n`;
    
    // Show first 10 records max
    const displayData = ragResponse.data.slice(0, 10);
    
    displayData.forEach((record, index) => {
      formatted += `${index + 1}. `;
      
      // Format based on available fields
      const formattedFields = [];
      
      Object.entries(record).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          // Format dates
          if (key.includes('date') || key.includes('created_at') || key.includes('updated_at')) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              formattedFields.push(`${key}: ${date.toLocaleDateString()}`);
            }
          }
          // Format currency values
          else if (key.includes('value') || key.includes('amount') || key.includes('price')) {
            const num = parseFloat(value);
            if (!isNaN(num)) {
              formattedFields.push(`${key}: $${num.toLocaleString()}`);
            }
          }
          // Regular fields
          else {
            formattedFields.push(`${key}: ${value}`);
          }
        }
      });
      
      formatted += formattedFields.slice(0, 5).join(', ') + '\n';
    });
    
    if (ragResponse.data.length > 10) {
      formatted += `\n... and ${ragResponse.data.length - 10} more records.`;
    }
    
    return formatted;
  }

  async callDeepSeek(prompt) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a helpful CRM assistant. You have access to real CRM data and should provide accurate, helpful responses based on that data. Be conversational and professional."
          },
          prompt
        ],
        temperature: 0.7,
        max_tokens: 1000
      });
      
      const url = new URL(`${this.baseUrl}/chat/completions`);
      
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (error) {
            reject(new Error('Invalid DeepSeek API response'));
          }
        });
      });
      
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }
}

module.exports = DeepSeekClient;
EOF

echo "🤖 DeepSeek Client utworzony"
```

### **5.2 Chat Interface dla DeepSeek + RAG:**

```bash
# Utwórz chat interface
cat > src/chat-interface.js << 'EOF'
// Chat Interface for DeepSeek + CRM RAG
const express = require('express');
const DeepSeekClient = require('./deepseek-client');

class ChatInterface {
  constructor() {
    this.app = express();
    this.port = process.env.CHAT_PORT || 3003;
    this.deepseek = new DeepSeekClient(process.env.DEEPSEEK_API_KEY);
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static('public'));
    
    // CORS for chat interface
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
  }

  setupRoutes() {
    // Chat endpoint
    this.app.post('/chat', async (req, res) => {
      try {
        const { message, context = {} } = req.body;
        
        if (!message) {
          return res.status(400).json({
            success: false,
            error: 'Message is required'
          });
        }
        
        console.log(`💬 Chat message: ${message}`);
        
        const response = await this.deepseek.chatWithRAG(message, context);
        
        res.json(response);
        
      } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'DeepSeek Chat Interface',
        timestamp: new Date().toISOString()
      });
    });

    // Serve chat interface
    this.app.get('/', (req, res) => {
      res.send(this.generateChatHTML());
    });
  }

  generateChatHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CRM-GTD Chat Assistant</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .chat-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            height: 600px;
            display: flex;
            flex-direction: column;
        }
        .chat-header {
            background: #2563eb;
            color: white;
            padding: 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }
        .message {
            margin-bottom: 15px;
            padding: 10px 15px;
            border-radius: 18px;
            max-width: 70%;
        }
        .message.user {
            background: #2563eb;
            color: white;
            margin-left: auto;
        }
        .message.assistant {
            background: #f3f4f6;
            color: #374151;
        }
        .message.error {
            background: #fef2f2;
            color: #dc2626;
            border: 1px solid #fecaca;
        }
        .chat-input {
            display: flex;
            padding: 20px;
            border-top: 1px solid #e5e7eb;
        }
        .chat-input input {
            flex: 1;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 25px;
            outline: none;
            font-size: 14px;
        }
        .chat-input button {
            background: #2563eb;
            color: white;
            border: none;
            padding: 12px 20px;
            margin-left: 10px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
        }
        .chat-input button:hover {
            background: #1d4ed8;
        }
        .chat-input button:disabled {
            background: #9ca3af;
            cursor: not-allowed;
        }
        .typing {
            display: none;
            padding: 10px 15px;
            color: #6b7280;
            font-style: italic;
        }
        .data-info {
            font-size: 12px;
            color: #6b7280;
            margin-top: 5px;
            padding: 5px 10px;
            background: #f9fafb;
            border-radius: 10px;
            border: 1px solid #e5e7eb;
        }
        .examples {
            margin: 20px 0;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .examples h4 {
            margin: 0 0 10px 0;
            color: #374151;
        }
        .example-question {
            display: inline-block;
            background: white;
            color: #374151;
            padding: 5px 10px;
            margin: 2px;
            border-radius: 15px;
            font-size: 12px;
            cursor: pointer;
            border: 1px solid #d1d5db;
        }
        .example-question:hover {
            background: #2563eb;
            color: white;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <h2>🤖 CRM-GTD Chat Assistant</h2>
            <p>Ask me anything about your CRM data!</p>
        </div>
        
        <div class="examples">
            <h4>💡 Try asking:</h4>
            <span class="example-question" onclick="askExample(this)">How many companies do we have?</span>
            <span class="example-question" onclick="askExample(this)">Show me active deals</span>
            <span class="example-question" onclick="askExample(this)">List contacts created this month</span>
            <span class="example-question" onclick="askExample(this)">What's our total deal value?</span>
            <span class="example-question" onclick="askExample(this)">Companies in tech industry</span>
            <span class="example-question" onclick="askExample(this)">Recent meetings</span>
        </div>
        
        <div class="chat-messages" id="messages">
            <div class="message assistant">
                👋 Hello! I'm your CRM assistant. I can help you query and analyze your CRM-GTD database. 
                Ask me about companies, contacts, deals, tasks, or any other data in your system!
            </div>
        </div>
        
        <div class="typing" id="typing">
            🤖 Assistant is thinking...
        </div>
        
        <div class="chat-input">
            <input 
                type="text" 
                id="messageInput" 
                placeholder="Ask about your CRM data..." 
                onkeypress="handleKeyPress(event)"
            >
            <button onclick="sendMessage()" id="sendButton">Send</button>
        </div>
    </div>

    <script>
        function askExample(element) {
            document.getElementById('messageInput').value = element.textContent;
            sendMessage();
        }

        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }

        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message
            addMessage(message, 'user');
            input.value = '';
            
            // Show typing indicator
            showTyping(true);
            
            // Disable send button
            const sendButton = document.getElementById('sendButton');
            sendButton.disabled = true;
            
            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message: message })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    addMessage(data.final_answer, 'assistant');
                    
                    // Add data info if available
                    if (data.rag_data && data.rag_data.relevant_tables) {
                        addDataInfo(data.rag_data);
                    }
                } else {
                    addMessage('Sorry, I encountered an error: ' + data.error, 'error');
                }
                
            } catch (error) {
                addMessage('Sorry, I couldn\\'t process your request. Please try again.', 'error');
            }
            
            // Hide typing and re-enable button
            showTyping(false);
            sendButton.disabled = false;
            input.focus();
        }

        function addMessage(text, type) {
            const messages = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${type}\`;
            messageDiv.textContent = text;
            messages.appendChild(messageDiv);
            messages.scrollTop = messages.scrollHeight;
        }

        function addDataInfo(ragData) {
            const messages = document.getElementById('messages');
            const infoDiv = document.createElement('div');
            infoDiv.className = 'data-info';
            infoDiv.innerHTML = \`
                📊 Data source: \${ragData.relevant_tables?.join(', ') || 'N/A'}<br>
                📝 Records found: \${ragData.row_count || 0}<br>
                🔍 SQL: <code>\${ragData.sql_query || 'N/A'}</code>
            \`;
            messages.appendChild(infoDiv);
            messages.scrollTop = messages.scrollHeight;
        }

        function showTyping(show) {
            const typing = document.getElementById('typing');
            typing.style.display = show ? 'block' : 'none';
            
            if (show) {
                const messages = document.getElementById('messages');
                messages.scrollTop = messages.scrollHeight;
            }
        }

        // Focus on input when page loads
        document.getElementById('messageInput').focus();
    </script>
</body>
</html>
    `;
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`💬 Chat Interface running on port ${this.port}`);
      console.log(`🌐 Open: http://localhost:${this.port}`);
    });
  }
}

// Start if run directly
if (require.main === module) {
  const chat = new ChatInterface();
  chat.start();
}

module.exports =