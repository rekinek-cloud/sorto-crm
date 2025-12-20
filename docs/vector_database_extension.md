# 🗂️ Vector Database Extension dla RAG System
## Email + Documents Integration

**ZADANIE:** Rozszerz istniejący RAG system o wektorową bazę danych dla emaili i dokumentów.

---

## 📦 **KROK 1: VECTOR DATABASE SETUP**

### **1.1 Wybór Vector Database - Chroma (Local) lub Pinecone (Cloud):**

```bash
# Opcja A: Chroma (Recommended - działa lokalnie na VPS)
cd /var/www/crm-gtd/rag-assistant

# Install Chroma dependencies
npm install chromadb @chromadb/chromadb

# Opcja B: Pinecone (Cloud - jeśli preferujesz cloud)
npm install @pinecone-database/pinecone

echo "📦 Vector database dependencies installed"
```

### **1.2 Setup Chroma Server na VPS:**

```bash
# Install Python i Chroma server
sudo apt update
sudo apt install -y python3 python3-pip

# Install Chroma server
pip3 install chromadb

# Create Chroma service
sudo tee /etc/systemd/system/chroma.service > /dev/null << 'EOF'
[Unit]
Description=Chroma Vector Database
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/chroma-data
Environment=CHROMA_HOST=0.0.0.0
Environment=CHROMA_PORT=8000
ExecStart=/usr/local/bin/chroma run --host 0.0.0.0 --port 8000 --path /var/www/chroma-data
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create data directory
sudo mkdir -p /var/www/chroma-data
sudo chown -R www-data:www-data /var/www/chroma-data

# Start Chroma service
sudo systemctl daemon-reload
sudo systemctl enable chroma
sudo systemctl start chroma

echo "✅ Chroma Vector Database running on port 8000"
```

### **1.3 Update Environment Configuration:**

```bash
# Add vector database config to .env
cat >> /var/www/crm-gtd/rag-assistant/.env << 'EOF'

# Vector Database Configuration
VECTOR_DB_TYPE=chroma
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_COLLECTION_EMAILS=crm_emails
CHROMA_COLLECTION_DOCUMENTS=crm_documents

# Email Processing
EMAIL_PROCESSING_ENABLED=true
EMAIL_BATCH_SIZE=50
EMAIL_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Document Processing  
DOCUMENT_PROCESSING_ENABLED=true
DOCUMENT_SUPPORTED_FORMATS=pdf,docx,txt,md,html
DOCUMENT_MAX_SIZE_MB=10
DOCUMENT_EXTRACT_IMAGES=false

# Hybrid Search (Vector + SQL)
HYBRID_SEARCH_ENABLED=true
VECTOR_SEARCH_WEIGHT=0.7
SQL_SEARCH_WEIGHT=0.3
MAX_VECTOR_RESULTS=20
EOF

echo "⚙️ Vector database configuration added"
```

---

## 📧 **KROK 2: EMAIL PROCESSING SYSTEM**

### **2.1 Email Extractor i Processor:**

```bash
# Create email processing module
cat > src/email-processor.js << 'EOF'
// Email Processing for Vector Database Integration
const { ChromaApi, OpenAIEmbeddingFunction } = require('chromadb');
const fs = require('fs').promises;
const path = require('path');

class EmailProcessor {
  constructor() {
    this.chroma = new ChromaApi({
      path: `http://${process.env.CHROMA_HOST}:${process.env.CHROMA_PORT}`
    });
    
    this.embedder = new OpenAIEmbeddingFunction({
      openai_api_key: process.env.OPENAI_API_KEY,
      openai_model: "text-embedding-ada-002"
    });
    
    this.emailCollection = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Get or create email collection
      this.emailCollection = await this.chroma.getOrCreateCollection({
        name: process.env.CHROMA_COLLECTION_EMAILS || 'crm_emails',
        embeddingFunction: this.embedder,
        metadata: {
          description: "CRM-GTD Email Archive with Vector Search",
          created_at: new Date().toISOString()
        }
      });
      
      this.initialized = true;
      console.log('✅ Email processor initialized');
    } catch (error) {
      console.error('Failed to initialize email processor:', error);
      throw error;
    }
  }

  async processEmail(emailData) {
    await this.initialize();
    
    try {
      // Extract meaningful content from email
      const emailContent = this.extractEmailContent(emailData);
      const emailMetadata = this.extractEmailMetadata(emailData);
      
      // Generate unique ID for email
      const emailId = this.generateEmailId(emailData);
      
      // Add to vector database
      await this.emailCollection.add({
        ids: [emailId],
        documents: [emailContent],
        metadatas: [emailMetadata]
      });
      
      console.log(`📧 Processed email: ${emailId}`);
      return { success: true, id: emailId };
      
    } catch (error) {
      console.error('Error processing email:', error);
      return { success: false, error: error.message };
    }
  }

  extractEmailContent(emailData) {
    // Combine subject, body, and relevant headers for better search
    const parts = [];
    
    if (emailData.subject) {
      parts.push(`Subject: ${emailData.subject}`);
    }
    
    if (emailData.from) {
      parts.push(`From: ${emailData.from}`);
    }
    
    if (emailData.to) {
      parts.push(`To: ${emailData.to}`);
    }
    
    if (emailData.body) {
      // Clean HTML and extract text
      const cleanBody = this.cleanEmailBody(emailData.body);
      parts.push(`Body: ${cleanBody}`);
    }
    
    if (emailData.attachments && emailData.attachments.length > 0) {
      const attachmentNames = emailData.attachments.map(a => a.filename).join(', ');
      parts.push(`Attachments: ${attachmentNames}`);
    }
    
    return parts.join('\n\n');
  }

  extractEmailMetadata(emailData) {
    return {
      message_id: emailData.messageId || emailData.id,
      from: emailData.from || '',
      to: emailData.to || '',
      cc: emailData.cc || '',
      bcc: emailData.bcc || '',
      subject: emailData.subject || '',
      date: emailData.date || new Date().toISOString(),
      thread_id: emailData.threadId || '',
      labels: emailData.labels || [],
      folder: emailData.folder || 'inbox',
      has_attachments: !!(emailData.attachments && emailData.attachments.length > 0),
      attachment_count: emailData.attachments ? emailData.attachments.length : 0,
      company_id: emailData.companyId || '',
      contact_id: emailData.contactId || '',
      deal_id: emailData.dealId || '',
      email_type: this.classifyEmailType(emailData),
      importance: this.calculateEmailImportance(emailData),
      processed_at: new Date().toISOString()
    };
  }

  cleanEmailBody(body) {
    if (!body) return '';
    
    // Remove HTML tags
    let cleanBody = body.replace(/<[^>]*>/g, ' ');
    
    // Remove excessive whitespace
    cleanBody = cleanBody.replace(/\s+/g, ' ').trim();
    
    // Remove email signatures (basic pattern)
    cleanBody = cleanBody.replace(/--\s*\n.*$/s, '');
    
    // Remove quoted content (basic pattern)
    cleanBody = cleanBody.replace(/^>.*$/gm, '');
    
    // Limit length for better embedding quality
    if (cleanBody.length > 2000) {
      cleanBody = cleanBody.substring(0, 2000) + '...';
    }
    
    return cleanBody;
  }

  classifyEmailType(emailData) {
    const subject = (emailData.subject || '').toLowerCase();
    const body = (emailData.body || '').toLowerCase();
    
    if (subject.includes('invoice') || subject.includes('bill') || subject.includes('payment')) {
      return 'billing';
    }
    
    if (subject.includes('meeting') || subject.includes('calendar') || subject.includes('appointment')) {
      return 'meeting';
    }
    
    if (subject.includes('proposal') || subject.includes('quote') || subject.includes('offer')) {
      return 'sales';
    }
    
    if (subject.includes('support') || subject.includes('issue') || subject.includes('problem')) {
      return 'support';
    }
    
    if (subject.includes('newsletter') || subject.includes('update') || subject.includes('news')) {
      return 'marketing';
    }
    
    return 'general';
  }

  calculateEmailImportance(emailData) {
    let score = 1; // Base importance
    
    // High importance indicators
    if (emailData.subject && emailData.subject.toLowerCase().includes('urgent')) score += 3;
    if (emailData.subject && emailData.subject.toLowerCase().includes('important')) score += 2;
    if (emailData.attachments && emailData.attachments.length > 0) score += 1;
    
    // VIP senders (could be configured)
    const vipDomains = ['enterprise.com', 'bigclient.com'];
    if (emailData.from && vipDomains.some(domain => emailData.from.includes(domain))) {
      score += 2;
    }
    
    return Math.min(score, 5); // Cap at 5
  }

  generateEmailId(emailData) {
    // Generate consistent ID based on email content
    const crypto = require('crypto');
    const idString = `${emailData.messageId || ''}${emailData.from || ''}${emailData.subject || ''}${emailData.date || ''}`;
    return crypto.createHash('md5').update(idString).digest('hex');
  }

  async searchEmails(query, filters = {}, limit = 10) {
    await this.initialize();
    
    try {
      // Build where clause for filtering
      const whereClause = this.buildEmailWhereClause(filters);
      
      // Perform vector search
      const results = await this.emailCollection.query({
        queryTexts: [query],
        nResults: limit,
        where: whereClause
      });
      
      // Format results
      const formattedResults = this.formatEmailSearchResults(results);
      
      return {
        success: true,
        results: formattedResults,
        total: results.ids[0].length
      };
      
    } catch (error) {
      console.error('Email search error:', error);
      return { success: false, error: error.message };
    }
  }

  buildEmailWhereClause(filters) {
    const where = {};
    
    if (filters.from) {
      where.from = { $contains: filters.from };
    }
    
    if (filters.to) {
      where.to = { $contains: filters.to };
    }
    
    if (filters.company_id) {
      where.company_id = filters.company_id;
    }
    
    if (filters.contact_id) {
      where.contact_id = filters.contact_id;
    }
    
    if (filters.email_type) {
      where.email_type = filters.email_type;
    }
    
    if (filters.date_from) {
      where.date = { $gte: filters.date_from };
    }
    
    if (filters.has_attachments !== undefined) {
      where.has_attachments = filters.has_attachments;
    }
    
    return Object.keys(where).length > 0 ? where : undefined;
  }

  formatEmailSearchResults(results) {
    if (!results.ids[0] || results.ids[0].length === 0) {
      return [];
    }
    
    return results.ids[0].map((id, index) => ({
      id: id,
      content: results.documents[0][index],
      metadata: results.metadatas[0][index],
      similarity: results.distances ? (1 - results.distances[0][index]) : 0,
      excerpt: this.generateEmailExcerpt(results.documents[0][index])
    }));
  }

  generateEmailExcerpt(content, maxLength = 200) {
    // Extract first meaningful sentence from email body
    const bodyMatch = content.match(/Body: (.*?)(?:\n\n|$)/s);
    if (!bodyMatch) return content.substring(0, maxLength) + '...';
    
    const body = bodyMatch[1];
    if (body.length <= maxLength) return body;
    
    return body.substring(0, maxLength) + '...';
  }

  async batchProcessEmails(emails) {
    const results = { success: 0, failed: 0, errors: [] };
    
    for (const email of emails) {
      const result = await this.processEmail(email);
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(`Email ${email.id || 'unknown'}: ${result.error}`);
      }
    }
    
    return results;
  }

  async getEmailStats() {
    await this.initialize();
    
    try {
      const count = await this.emailCollection.count();
      
      return {
        total_emails: count,
        collection_name: this.emailCollection.name,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = EmailProcessor;
EOF

echo "📧 Email processor utworzony"
```

### **2.2 Document Processor:**

```bash
# Create document processing module
cat > src/document-processor.js << 'EOF'
// Document Processing for Vector Database Integration
const { ChromaApi, OpenAIEmbeddingFunction } = require('chromadb');
const fs = require('fs').promises;
const path = require('path');

class DocumentProcessor {
  constructor() {
    this.chroma = new ChromaApi({
      path: `http://${process.env.CHROMA_HOST}:${process.env.CHROMA_PORT}`
    });
    
    this.embedder = new OpenAIEmbeddingFunction({
      openai_api_key: process.env.OPENAI_API_KEY,
      openai_model: "text-embedding-ada-002"
    });
    
    this.documentCollection = null;
    this.initialized = false;
    
    // Supported file processors
    this.processors = {
      '.pdf': this.processPDF.bind(this),
      '.docx': this.processDOCX.bind(this),
      '.txt': this.processTXT.bind(this),
      '.md': this.processMarkdown.bind(this),
      '.html': this.processHTML.bind(this)
    };
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      this.documentCollection = await this.chroma.getOrCreateCollection({
        name: process.env.CHROMA_COLLECTION_DOCUMENTS || 'crm_documents',
        embeddingFunction: this.embedder,
        metadata: {
          description: "CRM-GTD Document Archive with Vector Search",
          created_at: new Date().toISOString()
        }
      });
      
      this.initialized = true;
      console.log('✅ Document processor initialized');
    } catch (error) {
      console.error('Failed to initialize document processor:', error);
      throw error;
    }
  }

  async processDocument(documentPath, metadata = {}) {
    await this.initialize();
    
    try {
      // Check if file exists and get stats
      const stats = await fs.stat(documentPath);
      const fileExtension = path.extname(documentPath).toLowerCase();
      
      // Check file size limit
      const maxSizeMB = parseInt(process.env.DOCUMENT_MAX_SIZE_MB) || 10;
      if (stats.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`File too large: ${stats.size} bytes (max: ${maxSizeMB}MB)`);
      }
      
      // Check if processor exists for this file type
      if (!this.processors[fileExtension]) {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }
      
      // Extract text content
      const textContent = await this.processors[fileExtension](documentPath);
      
      if (!textContent || textContent.trim().length === 0) {
        throw new Error('No text content extracted from document');
      }
      
      // Prepare document metadata
      const docMetadata = this.prepareDocumentMetadata(documentPath, stats, metadata);
      
      // Split long documents into chunks for better embedding
      const chunks = this.splitDocumentIntoChunks(textContent);
      
      // Process each chunk
      const chunkResults = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = this.generateDocumentChunkId(documentPath, i);
        const chunkMetadata = {
          ...docMetadata,
          chunk_index: i,
          total_chunks: chunks.length,
          chunk_id: chunkId
        };
        
        await this.documentCollection.add({
          ids: [chunkId],
          documents: [chunks[i]],
          metadatas: [chunkMetadata]
        });
        
        chunkResults.push(chunkId);
      }
      
      console.log(`📄 Processed document: ${path.basename(documentPath)} (${chunks.length} chunks)`);
      
      return {
        success: true,
        document_path: documentPath,
        chunks_created: chunks.length,
        chunk_ids: chunkResults
      };
      
    } catch (error) {
      console.error('Error processing document:', error);
      return { success: false, error: error.message };
    }
  }

  async processPDF(filePath) {
    // Note: This requires pdf-parse package
    // npm install pdf-parse
    try {
      const pdf = require('pdf-parse');
      const buffer = await fs.readFile(filePath);
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      console.error('PDF processing error:', error);
      return `PDF document: ${path.basename(filePath)} (text extraction failed)`;
    }
  }

  async processDOCX(filePath) {
    // Note: This requires mammoth package
    // npm install mammoth
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.error('DOCX processing error:', error);
      return `DOCX document: ${path.basename(filePath)} (text extraction failed)`;
    }
  }

  async processTXT(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  }

  async processMarkdown(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    // Basic markdown cleanup - remove markdown syntax for better embedding
    return content
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Convert links to text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`(.*?)`/g, '$1'); // Remove inline code
  }

  async processHTML(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    // Basic HTML cleanup
    return content
      .replace(/<script[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[\s\S]*?<\/style>/gi, '') // Remove styles
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  prepareDocumentMetadata(filePath, stats, additionalMetadata = {}) {
    return {
      file_name: path.basename(filePath),
      file_path: filePath,
      file_extension: path.extname(filePath).toLowerCase(),
      file_size_bytes: stats.size,
      file_created: stats.birthtime.toISOString(),
      file_modified: stats.mtime.toISOString(),
      processed_at: new Date().toISOString(),
      document_type: this.classifyDocumentType(filePath),
      company_id: additionalMetadata.company_id || '',
      contact_id: additionalMetadata.contact_id || '',
      deal_id: additionalMetadata.deal_id || '',
      project_id: additionalMetadata.project_id || '',
      category: additionalMetadata.category || 'general',
      tags: additionalMetadata.tags || [],
      ...additionalMetadata
    };
  }

  classifyDocumentType(filePath) {
    const fileName = path.basename(filePath).toLowerCase();
    
    if (fileName.includes('invoice') || fileName.includes('bill')) return 'invoice';
    if (fileName.includes('contract') || fileName.includes('agreement')) return 'contract';
    if (fileName.includes('proposal') || fileName.includes('quote')) return 'proposal';
    if (fileName.includes('report') || fileName.includes('analysis')) return 'report';
    if (fileName.includes('presentation') || fileName.includes('slide')) return 'presentation';
    if (fileName.includes('manual') || fileName.includes('guide')) return 'documentation';
    if (fileName.includes('email') || fileName.includes('message')) return 'communication';
    
    return 'document';
  }

  splitDocumentIntoChunks(text, maxChunkSize = 1000, overlap = 100) {
    if (text.length <= maxChunkSize) {
      return [text];
    }
    
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + maxChunkSize;
      
      // Try to find a good breaking point (sentence end)
      if (end < text.length) {
        const sentenceEnd = text.lastIndexOf('.', end);
        const questionEnd = text.lastIndexOf('?', end);
        const exclamationEnd = text.lastIndexOf('!', end);
        
        const bestEnd = Math.max(sentenceEnd, questionEnd, exclamationEnd);
        if (bestEnd > start + maxChunkSize * 0.5) {
          end = bestEnd + 1;
        }
      }
      
      chunks.push(text.slice(start, end).trim());
      start = end - overlap;
    }
    
    return chunks.filter(chunk => chunk.length > 50); // Filter out very short chunks
  }

  generateDocumentChunkId(filePath, chunkIndex) {
    const crypto = require('crypto');
    const idString = `${filePath}_chunk_${chunkIndex}`;
    return crypto.createHash('md5').update(idString).digest('hex');
  }

  async searchDocuments(query, filters = {}, limit = 10) {
    await this.initialize();
    
    try {
      const whereClause = this.buildDocumentWhereClause(filters);
      
      const results = await this.documentCollection.query({
        queryTexts: [query],
        nResults: limit,
        where: whereClause
      });
      
      const formattedResults = this.formatDocumentSearchResults(results);
      
      return {
        success: true,
        results: formattedResults,
        total: results.ids[0].length
      };
      
    } catch (error) {
      console.error('Document search error:', error);
      return { success: false, error: error.message };
    }
  }

  buildDocumentWhereClause(filters) {
    const where = {};
    
    if (filters.file_extension) {
      where.file_extension = filters.file_extension;
    }
    
    if (filters.document_type) {
      where.document_type = filters.document_type;
    }
    
    if (filters.company_id) {
      where.company_id = filters.company_id;
    }
    
    if (filters.category) {
      where.category = filters.category;
    }
    
    if (filters.date_from) {
      where.processed_at = { $gte: filters.date_from };
    }
    
    return Object.keys(where).length > 0 ? where : undefined;
  }

  formatDocumentSearchResults(results) {
    if (!results.ids[0] || results.ids[0].length === 0) {
      return [];
    }
    
    return results.ids[0].map((id, index) => ({
      id: id,
      content: results.documents[0][index],
      metadata: results.metadatas[0][index],
      similarity: results.distances ? (1 - results.distances[0][index]) : 0,
      excerpt: this.generateDocumentExcerpt(results.documents[0][index])
    }));
  }

  generateDocumentExcerpt(content, maxLength = 200) {
    if (content.length <= maxLength) return content;
    
    // Try to find a good breaking point
    const truncated = content.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  async batchProcessDocuments(documentPaths, commonMetadata = {}) {
    const results = { success: 0, failed: 0, errors: [] };
    
    for (const docPath of documentPaths) {
      const result = await this.processDocument(docPath, commonMetadata);
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(`Document ${docPath}: ${result.error}`);
      }
    }
    
    return results;
  }

  async getDocumentStats() {
    await this.initialize();
    
    try {
      const count = await this.documentCollection.count();
      
      return {
        total_documents: count,
        collection_name: this.documentCollection.name,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = DocumentProcessor;
EOF

echo "📄 Document processor utworzony"
```

---

## 🔗 **KROK 3: HYBRID SEARCH INTEGRATION**

### **3.1 Enhanced RAG Server z Vector Search:**

```bash
# Update RAG server z hybrid search
cat > src/hybrid-rag-server.js << 'EOF'
// Enhanced RAG Server with Vector Database Integration
const express = require('express');
const DatabaseAnalyzer = require('./database-analyzer');
const EmbeddingsGenerator = require('./embeddings-generator');
const SQLGenerator = require('./sql-generator');
const EmailProcessor = require('./email-processor');
const DocumentProcessor = require('./document-processor');

class HybridRAGServer {
  constructor() {
    this.app = express();
    this.port = process.env.RAG_PORT || 3002;
    this.databaseUrl = process.env.DATABASE_URL;
    
    this.setupMiddleware();
    this.setupRoutes();
    
    // Initialize components
    this.dbAnalyzer = new DatabaseAnalyzer(this.databaseUrl);
    this.embeddingsGen = new EmbeddingsGenerator();
    this.sqlGen = null;
    this.emailProcessor = new EmailProcessor();
    this.documentProcessor = new DocumentProcessor();
    
    this.embeddings = null;
    this.databaseDescriptions = null;
  }

  setupMiddleware() {
    this.app.use(express.json({ limit: '10mb' }));
    
    // API Key middleware
    this.app.use('/api', (req, res, next) => {
      const apiKey = req.headers['x-api-key'] || req.query.api_key;
      if (!apiKey || apiKey !== process.env.RAG_API_KEY) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'Hybrid RAG Server (Database + Vector)',
        version: '2.0.0',
        components: {
          database: !!this.databaseDescriptions,
          embeddings: !!this.embeddings,
          email_processor: this.emailProcessor.initialized,
          document_processor: this.documentProcessor.initialized
        }
      });
    });

    // Enhanced query endpoint with hybrid search
    this.app.post('/api/query', async (req, res) => {
      try {
        const { question, context = {}, search_type = 'hybrid' } = req.body;
        
        if (!question) {
          return res.status(400).json({ error: 'Question is required' });
        }

        const result = await this.processHybridQuery(question, context, search_type);
        res.json(result);
        
      } catch (error) {
        console.error('Hybrid query error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Email search endpoint
    this.app.post('/api/search/emails', async (req, res) => {
      try {
        const { query, filters = {}, limit = 10 } = req.body;
        const result = await this.emailProcessor.searchEmails(query, filters, limit);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Document search endpoint
    this.app.post('/api/search/documents', async (req, res) => {
      try {
        const { query, filters = {}, limit = 10 } = req.body;
        const result = await this.documentProcessor.searchDocuments(query, filters, limit);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Bulk email processing
    this.app.post('/api/process/emails', async (req, res) => {
      try {
        const { emails } = req.body;
        if (!emails || !Array.isArray(emails)) {
          return res.status(400).json({ error: 'Emails array is required' });
        }
        
        const result = await this.emailProcessor.batchProcessEmails(emails);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Bulk document processing
    this.app.post('/api/process/documents', async (req, res) => {
      try {
        const { document_paths, metadata = {} } = req.body;
        if (!document_paths || !Array.isArray(document_paths)) {
          return res.status(400).json({ error: 'Document paths array is required' });
        }
        
        const result = await this.documentProcessor.batchProcessDocuments(document_paths, metadata);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get vector database statistics
    this.app.get('/api/stats', async (req, res) => {
      try {
        const [emailStats, docStats] = await Promise.all([
          this.emailProcessor.getEmailStats(),
          this.documentProcessor.getDocumentStats()
        ]);
        
        res.json({
          email_archive: emailStats,
          document_archive: docStats,
          database_tables: this.databaseDescriptions ? Object.keys(this.databaseDescriptions).length : 0
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  async processHybridQuery(question, context, searchType) {
    // Initialize if needed
    if (!this.embeddings || !this.sqlGen) {
      await this.initializeRAG();
    }

    console.log(`🔍 Processing hybrid query: ${question}`);
    
    const results = {
      database: null,
      emails: null,
      documents: null,
      final_response: ''
    };

    // Determine what to search based on question content
    const searchTargets = this.analyzeSearchTargets(question);
    
    // 1. Database search (if relevant)
    if (searchTargets.database && (searchType === 'hybrid' || searchType === 'database')) {
      console.log('📊 Searching database...');
      results.database = await this.searchDatabase(question);
    }

    // 2. Email search (if relevant)
    if (searchTargets.emails && (searchType === 'hybrid' || searchType === 'emails')) {
      console.log('📧 Searching emails...');
      results.emails = await this.emailProcessor.searchEmails(question, {}, 5);
    }

    // 3. Document search (if relevant)
    if (searchTargets.documents && (searchType === 'hybrid' || searchType === 'documents')) {
      console.log('📄 Searching documents...');
      results.documents = await this.documentProcessor.searchDocuments(question, {}, 5);
    }

    // 4. Synthesize final response
    results.final_response = this.synthesizeHybridResponse(question, results);

    return {
      success: true,
      query: question,
      search_targets: searchTargets,
      results: results,
      response: results.final_response
    };
  }

  analyzeSearchTargets(question) {
    const lower = question.toLowerCase();
    
    return {
      database: this.shouldSearchDatabase(lower),
      emails: this.shouldSearchEmails(lower),
      documents: this.shouldSearchDocuments(lower)
    };
  }

  shouldSearchDatabase(question) {
    const dbKeywords = [
      'how many', 'count', 'total', 'sum', 'average', 'statistics',
      'companies', 'contacts', 'deals', 'tasks', 'meetings',
      'revenue', 'sales', 'customers', 'clients', 'leads'
    ];
    
    return dbKeywords.some(keyword => question.includes(keyword));
  }

  shouldSearchEmails(question) {
    const emailKeywords = [
      'email', 'message', 'communication', 'correspondence',
      'conversation', 'thread', 'replied', 'sent', 'received',
      'discussion', 'talked about', 'mentioned in'
    ];
    
    return emailKeywords.some(keyword => question.includes(keyword));
  }

  shouldSearchDocuments(question) {
    const docKeywords = [
      'document', 'file', 'report', 'contract', 'agreement',
      'proposal', 'invoice', 'manual', 'guide', 'presentation',
      'attachment', 'uploaded', 'document contains'
    ];
    
    return docKeywords.some(keyword => question.includes(keyword));
  }

  async searchDatabase(question) {
    try {
      // Use existing database search logic
      const relevantTables = await this.embeddingsGen.findSimilarTables(
        question, 
        this.embeddings, 
        0.7
      );
      
      if (relevantTables.length === 0) return null;
      
      const sqlQueryObj = await this.sqlGen.generateSQL(question, relevantTables);
      if (!sqlQueryObj) return null;
      
      const queryResult = await this.sqlGen.executeQuery(sqlQueryObj);
      
      return {
        success: queryResult.success,
        tables: relevantTables.map(t => t.table),
        sql: sqlQueryObj.sql,
        data: queryResult.data || [],
        count: queryResult.rowCount || 0
      };
    } catch (error) {
      console.error('Database search error:', error);
      return { success: false, error: error.message };
    }
  }

  synthesizeHybridResponse(question, results) {
    const responseParts = [];
    
    // Add database results
    if (results.database && results.database.success && results.database.data.length > 0) {
      responseParts.push(this.formatDatabaseResponse(results.database));
    }
    
    // Add email results
    if (results.emails && results.emails.success && results.emails.results.length > 0) {
      responseParts.push(this.formatEmailResponse(results.emails));
    }
    
    // Add document results
    if (results.documents && results.documents.success && results.documents.results.length > 0) {
      responseParts.push(this.formatDocumentResponse(results.documents));
    }
    
    if (responseParts.length === 0) {
      return `I searched the CRM database, email archive, and document library but couldn't find relevant information for: "${question}". Could you be more specific?`;
    }
    
    return responseParts.join('\n\n');
  }

  formatDatabaseResponse(dbResult) {
    let response = `📊 **Database Results:**\n`;
    response += `Found ${dbResult.count} records from tables: ${dbResult.tables.join(', ')}\n\n`;
    
    // Show first few records
    const displayCount = Math.min(3, dbResult.data.length);
    for (let i = 0; i < displayCount; i++) {
      const record = dbResult.data[i];
      const keyValues = Object.entries(record).slice(0, 3);
      response += `${i + 1}. ${keyValues.map(([k, v]) => `${k}: ${v}`).join(', ')}\n`;
    }
    
    if (dbResult.data.length > displayCount) {
      response += `... and ${dbResult.data.length - displayCount} more records`;
    }
    
    return response;
  }

  formatEmailResponse(emailResult) {
    let response = `📧 **Related Emails:**\n`;
    response += `Found ${emailResult.results.length} relevant emails:\n\n`;
    
    emailResult.results.slice(0, 3).forEach((email, index) => {
      response += `${index + 1}. **From:** ${email.metadata.from}\n`;
      response += `   **Subject:** ${email.metadata.subject}\n`;
      response += `   **Date:** ${new Date(email.metadata.date).toLocaleDateString()}\n`;
      response += `   **Excerpt:** ${email.excerpt}\n\n`;
    });
    
    return response;
  }

  formatDocumentResponse(docResult) {
    let response = `📄 **Related Documents:**\n`;
    response += `Found ${docResult.results.length} relevant documents:\n\n`;
    
    docResult.results.slice(0, 3).forEach((doc, index) => {
      response += `${index + 1}. **File:** ${doc.metadata.file_name}\n`;
      response += `   **Type:** ${doc.metadata.document_type}\n`;
      response += `   **Content:** ${doc.excerpt}\n\n`;
    });
    
    return response;
  }

  async initializeRAG() {
    console.log('🚀 Initializing Hybrid RAG system...');
    
    // Initialize database components
    this.databaseDescriptions = await this.dbAnalyzer.generateTableDescriptions();
    this.embeddings = await this.embeddingsGen.loadEmbeddings();
    
    if (!this.embeddings) {
      this.embeddings = await this.embeddingsGen.generateDatabaseEmbeddings(this.databaseDescriptions);
      await this.embeddingsGen.saveEmbeddings(this.embeddings);
    }
    
    this.sqlGen = new SQLGenerator(this.databaseUrl, this.databaseDescriptions);
    
    // Initialize vector components
    await this.emailProcessor.initialize();
    await this.documentProcessor.initialize();
    
    console.log('✅ Hybrid RAG system initialized!');
  }

  async start() {
    try {
      await this.initializeRAG();
      
      this.app.listen(this.port, () => {
        console.log(`🚀 Hybrid RAG Server running on port ${this.port}`);
        console.log(`🔗 Enhanced with Email + Document search`);
      });
    } catch (error) {
      console.error('Failed to start Hybrid RAG server:', error);
      process.exit(1);
    }
  }
}

module.exports = HybridRAGServer;
EOF

echo "🔗 Hybrid RAG Server utworzony"
```

---

## 📧 **KROK 4: EMAIL IMPORT SYSTEM**

### **4.1 Email Import z różnych źródeł:**

```bash
# Create email import system
cat > scripts/import-emails.js << 'EOF'
// Email Import System for Vector Database
const EmailProcessor = require('../src/email-processor');
const fs = require('fs').promises;
const path = require('path');

class EmailImporter {
  constructor() {
    this.emailProcessor = new EmailProcessor();
  }

  async importFromMbox(mboxPath) {
    console.log('📧 Importing emails from MBOX file...');
    
    // Note: Requires 'node-mbox' package
    // npm install node-mbox
    try {
      const Mbox = require('node-mbox');
      const mbox = new Mbox(mboxPath);
      
      const emails = [];
      let count = 0;
      
      mbox.on('message', (msg) => {
        emails.push(this.convertMboxMessage(msg));
        count++;
        
        if (count % 100 === 0) {
          console.log(`📈 Processed ${count} emails...`);
        }
      });
      
      return new Promise((resolve, reject) => {
        mbox.on('end', async () => {
          console.log(`✅ Parsed ${emails.length} emails from MBOX`);
          const result = await this.emailProcessor.batchProcessEmails(emails);
          resolve(result);
        });
        
        mbox.on('error', reject);
      });
      
    } catch (error) {
      console.error('MBOX import error:', error);
      return { success: 0, failed: 1, errors: [error.message] };
    }
  }

  async importFromEmlFiles(directoryPath) {
    console.log('📧 Importing emails from EML files...');
    
    try {
      const files = await this.findEmlFiles(directoryPath);
      console.log(`📁 Found ${files.length} EML files`);
      
      const emails = [];
      
      for (const file of files) {
        try {
          const emailContent = await fs.readFile(file, 'utf-8');
          const parsedEmail = this.parseEmlContent(emailContent, file);
          emails.push(parsedEmail);
        } catch (error) {
          console.error(`Error processing ${file}:`, error.message);
        }
      }
      
      return await this.emailProcessor.batchProcessEmails(emails);
      
    } catch (error) {
      console.error('EML import error:', error);
      return { success: 0, failed: 1, errors: [error.message] };
    }
  }

  async importFromOutlook(outlookDataPath) {
    console.log('📧 Importing emails from Outlook export...');
    
    // This would require outlook export in PST format
    // and pst-extractor or similar tool
    // For now, placeholder implementation
    
    return { success: 0, failed: 0, errors: ['Outlook import not yet implemented'] };
  }

  async importFromGmail(gmailExportPath) {
    console.log('📧 Importing emails from Gmail Takeout...');
    
    try {
      // Gmail Takeout creates MBOX files
      const mboxFiles = await this.findMboxFiles(gmailExportPath);
      
      let totalResults = { success: 0, failed: 0, errors: [] };
      
      for (const mboxFile of mboxFiles) {
        console.log(`📂 Processing: ${path.basename(mboxFile)}`);
        const result = await this.importFromMbox(mboxFile);
        
        totalResults.success += result.success;
        totalResults.failed += result.failed;
        totalResults.errors.push(...result.errors);
      }
      
      return totalResults;
      
    } catch (error) {
      console.error('Gmail import error:', error);
      return { success: 0, failed: 1, errors: [error.message] };
    }
  }

  convertMboxMessage(msg) {
    return {
      messageId: msg.headers['message-id'],
      from: msg.headers.from,
      to: msg.headers.to,
      cc: msg.headers.cc,
      subject: msg.headers.subject,
      date: msg.headers.date,
      body: msg.body,
      attachments: this.extractAttachments(msg)
    };
  }

  parseEmlContent(content, filePath) {
    // Basic EML parsing - for production use a proper email parser
    const lines = content.split('\n');
    const headers = {};
    let body = '';
    let inHeaders = true;
    
    for (const line of lines) {
      if (inHeaders) {
        if (line.trim() === '') {
          inHeaders = false;
          continue;
        }
        
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).toLowerCase();
          const value = line.substring(colonIndex + 1).trim();
          headers[key] = value;
        }
      } else {
        body += line + '\n';
      }
    }
    
    return {
      messageId: headers['message-id'] || path.basename(filePath),
      from: headers.from || '',
      to: headers.to || '',
      cc: headers.cc || '',
      subject: headers.subject || '',
      date: headers.date || '',
      body: body.trim(),
      attachments: []
    };
  }

  extractAttachments(msg) {
    // Extract attachment information from message
    const attachments = [];
    
    if (msg.attachments) {
      msg.attachments.forEach(att => {
        attachments.push({
          filename: att.filename,
          contentType: att.contentType,
          size: att.size
        });
      });
    }
    
    return attachments;
  }

  async findEmlFiles(directory) {
    const files = [];
    
    async function scanDirectory(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.name.toLowerCase().endsWith('.eml')) {
          files.push(fullPath);
        }
      }
    }
    
    await scanDirectory(directory);
    return files;
  }

  async findMboxFiles(directory) {
    const files = [];
    
    async function scanDirectory(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.name.toLowerCase().includes('mbox') || entry.name.toLowerCase().endsWith('.mbox')) {
          files.push(fullPath);
        }
      }
    }
    
    await scanDirectory(directory);
    return files;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node import-emails.js <type> <path>');
    console.log('Types: mbox, eml, gmail, outlook');
    console.log('Example: node import-emails.js gmail /path/to/takeout');
    process.exit(1);
  }
  
  const [type, sourcePath] = args;
  const importer = new EmailImporter();
  
  console.log(`🚀 Starting ${type} email import from: ${sourcePath}`);
  
  let result;
  
  switch (type.toLowerCase()) {
    case 'mbox':
      result = await importer.importFromMbox(sourcePath);
      break;
    case 'eml':
      result = await importer.importFromEmlFiles(sourcePath);
      break;
    case 'gmail':
      result = await importer.importFromGmail(sourcePath);
      break;
    case 'outlook':
      result = await importer.importFromOutlook(sourcePath);
      break;
    default:
      console.error(`Unknown import type: ${type}`);
      process.exit(1);
  }
  
  console.log('\n📊 Import Results:');
  console.log(`✅ Successfully processed: ${result.success} emails`);
  console.log(`❌ Failed: ${result.failed} emails`);
  
  if (result.errors.length > 0) {
    console.log('\n🚨 Errors:');
    result.errors.slice(0, 5).forEach(error => console.log(`  - ${error}`));
    if (result.errors.length > 5) {
      console.log(`  ... and ${result.errors.length - 5} more errors`);
    }
  }
  
  console.log('\n🎉 Email import completed!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = EmailImporter;
EOF

echo "📧 Email import system utworzony"
```

---

## 📄 **KROK 5: DOCUMENT IMPORT SYSTEM**

### **5.1 Document Scanner i Importer:**

```bash
# Create document import system
cat > scripts/import-documents.js << 'EOF'
// Document Import System for Vector Database
const DocumentProcessor = require('../src/document-processor');
const fs = require('fs').promises;
const path = require('path');

class DocumentImporter {
  constructor() {
    this.documentProcessor = new DocumentProcessor();
    this.supportedExtensions = ['.pdf', '.docx', '.txt', '.md', '.html'];
  }

  async scanAndImportDirectory(directoryPath, options = {}) {
    console.log(`📂 Scanning directory: ${directoryPath}`);
    
    const {
      recursive = true,
      associateWithCRM = true,
      defaultMetadata = {}
    } = options;
    
    try {
      const documents = await this.findDocuments(directoryPath, recursive);
      console.log(`📄 Found ${documents.length} documents`);
      
      const results = { success: 0, failed: 0, errors: [] };
      
      for (const doc of documents) {
        try {
          console.log(`🔄 Processing: ${path.basename(doc.path)}`);
          
          // Prepare metadata
          const metadata = await this.prepareDocumentMetadata(doc, defaultMetadata, associateWithCRM);
          
          // Process document
          const result = await this.documentProcessor.processDocument(doc.path, metadata);
          
          if (result.success) {
            results.success++;
            console.log(`✅ Successfully processed: ${path.basename(doc.path)}`);
          } else {
            results.failed++;
            results.errors.push(`${doc.path}: ${result.error}`);
            console.log(`❌ Failed to process: ${path.basename(doc.path)}`);
          }
          
        } catch (error) {
          results.failed++;
          results.errors.push(`${doc.path}: ${error.message}`);
          console.log(`❌ Error processing ${path.basename(doc.path)}: ${error.message}`);
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('Directory import error:', error);
      return { success: 0, failed: 1, errors: [error.message] };
    }
  }

  async findDocuments(directory, recursive = true) {
    const documents = [];
    
    async function scanDirectory(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && recursive) {
            await scanDirectory(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            
            if (this.supportedExtensions.includes(ext)) {
              const stats = await fs.stat(fullPath);
              
              documents.push({
                path: fullPath,
                name: entry.name,
                extension: ext,
                size: stats.size,
                modified: stats.mtime,
                created: stats.birthtime
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not scan directory ${dir}: ${error.message}`);
      }
    }
    
    await scanDirectory.call(this, directory);
    return documents;
  }

  async prepareDocumentMetadata(doc, defaultMetadata, associateWithCRM) {
    const metadata = { ...defaultMetadata };
    
    // Try to extract metadata from filename and path
    const extracted = this.extractMetadataFromPath(doc.path);
    Object.assign(metadata, extracted);
    
    // Associate with CRM entities if enabled
    if (associateWithCRM) {
      const crmAssociations = await this.findCRMAssociations(doc);
      Object.assign(metadata, crmAssociations);
    }
    
    // Add document classification
    metadata.category = metadata.category || this.classifyDocument(doc);
    
    return metadata;
  }

  extractMetadataFromPath(filePath) {
    const metadata = {};
    const pathParts = filePath.split(path.sep);
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // Look for patterns in path and filename
    for (const part of pathParts) {
      const lower = part.toLowerCase();
      
      // Company folders
      if (lower.includes('company') || lower.includes('client')) {
        metadata.category = 'company';
      }
      
      // Contract folders
      if (lower.includes('contract') || lower.includes('agreement')) {
        metadata.document_type = 'contract';
      }
      
      // Invoice folders
      if (lower.includes('invoice') || lower.includes('billing')) {
        metadata.document_type = 'invoice';
      }
      
      // Proposal folders
      if (lower.includes('proposal') || lower.includes('quote')) {
        metadata.document_type = 'proposal';
      }
    }
    
    // Extract dates from filename
    const dateMatch = fileName.match(/(\d{4}[-_]\d{2}[-_]\d{2})/);
    if (dateMatch) {
      metadata.document_date = dateMatch[1].replace(/_/g, '-');
    }
    
    // Extract company names (basic pattern)
    const companyMatch = fileName.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Inc|LLC|Corp|Ltd))?)/);
    if (companyMatch) {
      metadata.company_name = companyMatch[1];
    }
    
    return metadata;
  }

  async findCRMAssociations(doc) {
    const associations = {};
    
    try {
      // This would require database access to match document content/metadata with CRM entities
      // For now, basic implementation based on filename patterns
      
      const fileName = path.basename(doc.path).toLowerCase();
      
      // Look for patterns that might indicate CRM associations
      if (fileName.includes('proposal') || fileName.includes('quote')) {
        associations.stage = 'proposal';
      }
      
      if (fileName.includes('contract') || fileName.includes('signed')) {
        associations.stage = 'contract';
      }
      
      if (fileName.includes('invoice') || fileName.includes('bill')) {
        associations.stage = 'billing';
      }
      
    } catch (error) {
      console.warn('CRM association lookup failed:', error.message);
    }
    
    return associations;
  }

  classifyDocument(doc) {
    const fileName = doc.name.toLowerCase();
    const filePath = doc.path.toLowerCase();
    
    // Document type classification
    if (fileName.includes('contract') || fileName.includes('agreement')) return 'legal';
    if (fileName.includes('invoice') || fileName.includes('bill')) return 'billing';
    if (fileName.includes('proposal') || fileName.includes('quote')) return 'sales';
    if (fileName.includes('report') || fileName.includes('analysis')) return 'reports';
    if (fileName.includes('manual') || fileName.includes('guide')) return 'documentation';
    if (fileName.includes('presentation') || fileName.includes('slide')) return 'presentations';
    if (fileName.includes('email') || fileName.includes('correspondence')) return 'communication';
    
    // Path-based classification
    if (filePath.includes('legal')) return 'legal';
    if (filePath.includes('finance') || filePath.includes('accounting')) return 'financial';
    if (filePath.includes('hr') || filePath.includes('human')) return 'hr';
    if (filePath.includes('marketing')) return 'marketing';
    if (filePath.includes('technical') || filePath.includes('development')) return 'technical';
    
    return 'general';
  }

  async importFromCRMUploads(uploadsDirectory) {
    console.log('📎 Importing documents from CRM uploads...');
    
    const options = {
      recursive: true,
      associateWithCRM: true,
      defaultMetadata: {
        source: 'crm_upload',
        category: 'crm_document'
      }
    };
    
    return await this.scanAndImportDirectory(uploadsDirectory, options);
  }

  async importFromEmailAttachments(attachmentsDirectory) {
    console.log('📧 Importing email attachments...');
    
    const options = {
      recursive: true,
      associateWithCRM: true,
      defaultMetadata: {
        source: 'email_attachment',
        category: 'attachment'
      }
    };
    
    return await this.scanAndImportDirectory(attachmentsDirectory, options);
  }

  async importFromSharedDrive(driveDirectory) {
    console.log('💾 Importing from shared drive...');
    
    const options = {
      recursive: true,
      associateWithCRM: false,
      defaultMetadata: {
        source: 'shared_drive',
        category: 'shared'
      }
    };
    
    return await this.scanAndImportDirectory(driveDirectory, options);
  }

  async generateImportReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_processed: results.success + results.failed,
        successful: results.success,
        failed: results.failed,
        success_rate: results.success + results.failed > 0 
          ? ((results.success / (results.success + results.failed)) * 100).toFixed(1) + '%'
          : '0%'
      },
      errors: results.errors.slice(0, 20), // First 20 errors
      recommendations: []
    };
    
    // Add recommendations based on results
    if (results.failed > 0) {
      report.recommendations.push('Review failed documents and check file permissions');
    }
    
    if (results.errors.some(e => e.includes('too large'))) {
      report.recommendations.push('Consider increasing DOCUMENT_MAX_SIZE_MB limit');
    }
    
    if (results.errors.some(e => e.includes('unsupported'))) {
      report.recommendations.push('Add support for additional file formats if needed');
    }
    