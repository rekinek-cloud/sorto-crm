# 📧 Smart Mailboxes - Implementation TODO

**Created**: 2025-06-24  
**Status**: PLANNED  
**Estimated Effort**: 8-12 hours  
**Priority**: HIGH  

## 🎯 **Cel: iOS-Style Inteligentne Skrzynki**

Implementacja systemu inteligentnych skrzynek podobnych do iOS Mail z integracją GTD, CRM i AI.

---

## 🚀 **PHASE 1: Core Foundation (4-6h)**

### ✅ **HIGH PRIORITY - Database & Backend**
- [ ] **Database Schema Creation** (30min)
  - [ ] Tabela `smart_mailboxes`
  - [ ] Tabela `smart_mailbox_rules`
  - [ ] Insert wbudowanych mailboxes
  
- [ ] **Backend API Development** (2-3h)
  - [ ] GET `/api/smart-mailboxes` - lista wszystkich skrzynek
  - [ ] GET `/api/smart-mailboxes/:id/messages` - wiadomości w skrzynce
  - [ ] POST `/api/smart-mailboxes` - utworzenie custom mailbox
  - [ ] PUT `/api/smart-mailboxes/:id` - edycja mailbox
  - [ ] DELETE `/api/smart-mailboxes/:id` - usunięcie mailbox
  - [ ] Smart mailbox filtering logic
  - [ ] Real-time counting system

### ✅ **HIGH PRIORITY - Frontend Core**
- [ ] **SmartMailboxList Component** (1-2h)
  - [ ] Glass-card sidebar design (Phase 2 style)
  - [ ] Built-in mailboxes display
  - [ ] Real-time counter updates
  - [ ] Active state management
  
- [ ] **SmartMailboxItem Component** (30min)
  - [ ] iOS-style individual mailbox
  - [ ] Icon, name, counter display
  - [ ] Hover animations
  - [ ] Click handling

### ✅ **HIGH PRIORITY - Wbudowane Skrzynki**
- [ ] **Action Required** (🔥): `urgency_score > 70 OR status = 'ACTION_NEEDED'`
- [ ] **Today** (📅): `created_at >= today()`
- [ ] **VIP Contacts** (👥): `sender_id IN (vip_contacts)`
- [ ] **With Attachments** (📎): `attachments_count > 0`
- [ ] **AI Analyzed** (🤖): `ai_processed = true`
- [ ] **Waiting For** (⏰): `gtd_status = 'WAITING'`
- [ ] **High Priority** (🎯): `priority = 'HIGH'`

---

## 🛠️ **PHASE 2: Custom Mailboxes (3-4h)**

### ✅ **MEDIUM PRIORITY - Builder Interface**
- [ ] **SmartMailboxBuilder Component** (2h)
  - [ ] Modal/dialog interface
  - [ ] Name, icon, color selection
  - [ ] Rule builder interface
  - [ ] Preview functionality
  - [ ] Save/cancel actions
  
- [ ] **RuleBuilder Component** (1h)
  - [ ] Field selection (sender, subject, content, etc.)
  - [ ] Operator selection (contains, equals, greater_than, etc.)
  - [ ] Value input
  - [ ] AND/OR logic operators
  - [ ] Add/remove rules

- [ ] **MailboxPreview Component** (30min)
  - [ ] Show matching messages in real-time
  - [ ] Count display
  - [ ] Sample message list

### ✅ **MEDIUM PRIORITY - CRUD Operations**
- [ ] **Create Custom Mailbox** (30min)
  - [ ] Form validation
  - [ ] Rule validation
  - [ ] Success/error handling
  
- [ ] **Edit Custom Mailbox** (30min)
  - [ ] Load existing rules
  - [ ] Update functionality
  - [ ] Change tracking
  
- [ ] **Delete Custom Mailbox** (15min)
  - [ ] Confirmation dialog
  - [ ] Cascade delete rules

---

## ⚡ **PHASE 3: Advanced Features (2-3h)**

### ✅ **LOW PRIORITY - Real-time & Performance**
- [ ] **WebSocket Integration** (1h)
  - [ ] Real-time counter updates
  - [ ] Live message additions
  - [ ] Connection management
  
- [ ] **Performance Optimization** (30min)
  - [ ] Efficient counting queries
  - [ ] Caching strategies
  - [ ] Lazy loading

### ✅ **LOW PRIORITY - Smart Features**
- [ ] **AI-Powered Suggestions** (1h)
  - [ ] Analyze user patterns
  - [ ] Suggest new mailboxes
  - [ ] Auto-create based on behavior
  
- [ ] **Import/Export** (30min)
  - [ ] Export mailbox configs
  - [ ] Import from JSON
  - [ ] Share between users

---

## 📁 **File Structure**

```
/opt/crm-gtd-smart/packages/

backend/
├── src/routes/smartMailboxes.ts           # API endpoints
├── src/services/smartMailboxService.ts   # Business logic
├── src/models/SmartMailbox.ts             # Database models
└── prisma/migrations/                     # Database schema

frontend/
├── src/components/communication/smart-mailboxes/
│   ├── SmartMailboxList.tsx              # Main sidebar
│   ├── SmartMailboxItem.tsx              # Individual mailbox
│   ├── SmartMailboxBuilder.tsx           # Create/edit modal
│   ├── RuleBuilder.tsx                   # Rule creation interface
│   ├── MailboxPreview.tsx                # Preview component
│   └── types.ts                          # TypeScript definitions
├── src/lib/api/smartMailboxes.ts         # API client
└── src/app/dashboard/communication/      # Updated page
```

---

## 🗄️ **Database Schema**

```sql
-- Smart Mailboxes Table
CREATE TABLE smart_mailboxes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(50) DEFAULT '📧',
  color VARCHAR(50) DEFAULT 'blue',
  is_built_in BOOLEAN DEFAULT false,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Smart Mailbox Rules Table
CREATE TABLE smart_mailbox_rules (
  id SERIAL PRIMARY KEY,
  mailbox_id INTEGER REFERENCES smart_mailboxes(id) ON DELETE CASCADE,
  field VARCHAR(100) NOT NULL,
  operator VARCHAR(50) NOT NULL,
  value TEXT NOT NULL,
  logic_operator VARCHAR(10) DEFAULT 'AND',
  rule_order INTEGER DEFAULT 0
);

-- Built-in Mailboxes Data
INSERT INTO smart_mailboxes (name, icon, color, is_built_in, user_id) VALUES
('Action Required', '🔥', 'red', true, NULL),
('Today', '📅', 'blue', true, NULL),
('VIP Contacts', '👥', 'yellow', true, NULL),
('With Attachments', '📎', 'gray', true, NULL),
('AI Analyzed', '🤖', 'purple', true, NULL),
('Waiting For', '⏰', 'orange', true, NULL),
('High Priority', '🎯', 'red', true, NULL);

-- Sample Rules for Built-in Mailboxes
INSERT INTO smart_mailbox_rules (mailbox_id, field, operator, value) VALUES
(1, 'urgency_score', 'greater_than', '70'),
(1, 'status', 'equals', 'ACTION_NEEDED'),
(2, 'created_at', 'equals', 'today'),
(3, 'sender_id', 'in', 'vip_contacts'),
(4, 'attachments_count', 'greater_than', '0'),
(5, 'ai_processed', 'equals', 'true'),
(6, 'gtd_status', 'equals', 'WAITING'),
(7, 'priority', 'equals', 'HIGH');
```

---

## 🔌 **API Endpoints**

```typescript
// GET /api/smart-mailboxes
interface SmartMailboxResponse {
  id: number;
  name: string;
  icon: string;
  color: string;
  isBuiltIn: boolean;
  count: number;
  rules: SmartMailboxRule[];
}

// GET /api/smart-mailboxes/:id/messages?page=1&limit=20
interface SmartMailboxMessagesResponse {
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// POST /api/smart-mailboxes
interface CreateSmartMailboxRequest {
  name: string;
  icon: string;
  color: string;
  rules: {
    field: string;
    operator: string;
    value: string;
    logicOperator?: 'AND' | 'OR';
    order?: number;
  }[];
}

// PUT /api/smart-mailboxes/:id
interface UpdateSmartMailboxRequest extends CreateSmartMailboxRequest {}

// DELETE /api/smart-mailboxes/:id
// Returns: { success: boolean; message: string; }
```

---

## 🎨 **UI Components Design**

### **SmartMailboxList (Sidebar)**
```tsx
<motion.div className="glass-card w-72 p-6 space-y-4">
  <div className="flex items-center justify-between">
    <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
      Smart Mailboxes
    </h2>
    <button 
      onClick={() => setShowBuilder(true)}
      className="btn-modern-outline text-sm"
    >
      ➕ New
    </button>
  </div>

  {/* Built-in Section */}
  <div className="space-y-2">
    <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
      Built-in
    </h3>
    {builtInMailboxes.map(mailbox => (
      <SmartMailboxItem key={mailbox.id} {...mailbox} />
    ))}
  </div>

  {/* Custom Section */}
  <div className="space-y-2">
    <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
      Custom
    </h3>
    {customMailboxes.map(mailbox => (
      <SmartMailboxItem 
        key={mailbox.id} 
        {...mailbox} 
        isCustom={true}
        onEdit={() => editMailbox(mailbox)}
        onDelete={() => deleteMailbox(mailbox.id)}
      />
    ))}
  </div>
</motion.div>
```

### **SmartMailboxItem**
```tsx
<motion.div 
  className={`
    flex items-center justify-between p-3 rounded-xl 
    transition-all duration-200 cursor-pointer group
    ${isActive 
      ? 'bg-blue-500/20 border border-blue-500/30' 
      : 'bg-white/20 hover:bg-white/30 border border-white/20'
    }
  `}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  onClick={() => onSelect(mailbox.id)}
>
  <div className="flex items-center space-x-3">
    <span className="text-xl">{icon}</span>
    <span className="font-medium text-slate-800 dark:text-white">
      {name}
    </span>
  </div>
  
  <div className="flex items-center space-x-2">
    {count > 0 && (
      <motion.span 
        className={`
          px-2 py-1 rounded-full text-xs font-medium
          ${getColorClasses(color)}
        `}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        key={count}
      >
        {count}
      </motion.span>
    )}
    
    {isCustom && (
      <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
        <button onClick={() => onEdit()} className="p-1 hover:bg-white/20 rounded">
          ✏️
        </button>
        <button onClick={() => onDelete()} className="p-1 hover:bg-white/20 rounded">
          🗑️
        </button>
      </div>
    )}
  </div>
</motion.div>
```

---

## 🧪 **Testing Plan**

### **Unit Tests**
- [ ] SmartMailboxService logic
- [ ] Rule filtering algorithms
- [ ] API endpoint responses
- [ ] Component rendering

### **Integration Tests**
- [ ] Database queries performance
- [ ] Real-time counting accuracy
- [ ] WebSocket connections
- [ ] Cross-browser compatibility

### **User Testing**
- [ ] Mailbox creation flow
- [ ] Rule builder usability
- [ ] Mobile responsiveness
- [ ] Performance on large datasets

---

## 📊 **Success Metrics**

### **Technical Metrics**
- [ ] API response time < 200ms
- [ ] Real-time updates < 1s delay
- [ ] 99.9% uptime
- [ ] Mobile-responsive design

### **User Experience Metrics**
- [ ] 50% faster message processing
- [ ] 80% reduction in cognitive load
- [ ] 100% automated categorization
- [ ] iOS-like smooth interactions

### **Business Impact**
- [ ] Increased user engagement
- [ ] Reduced support tickets
- [ ] Improved productivity scores
- [ ] Higher feature adoption

---

## 🎯 **Implementation Checklist**

### **Before Starting**
- [ ] Review existing communication code
- [ ] Understand current message structure
- [ ] Plan database migration strategy
- [ ] Design mobile-first interface

### **Phase 1 Completion Criteria**
- [ ] All built-in mailboxes working
- [ ] Real-time counters functional
- [ ] Glass-card UI implemented
- [ ] Basic API endpoints tested

### **Phase 2 Completion Criteria**
- [ ] Custom mailbox creation working
- [ ] Rule builder functional
- [ ] Preview system accurate
- [ ] CRUD operations tested

### **Phase 3 Completion Criteria**
- [ ] WebSocket real-time updates
- [ ] Performance optimized
- [ ] Smart suggestions working
- [ ] Full mobile support

---

## 🚀 **Quick Start Commands**

```bash
# Backend Development
cd /opt/crm-gtd-smart/packages/backend
npm run db:migrate                    # Apply database schema
npm run dev                          # Start backend server

# Frontend Development  
cd /opt/crm-gtd-smart/packages/frontend
npm run dev                          # Start frontend server

# Testing
npm run test                         # Run unit tests
npm run test:integration            # Run integration tests

# Database
npm run db:seed                      # Seed built-in mailboxes
npm run db:reset                     # Reset database

# Production
docker restart crm-frontend-v1      # Restart frontend
docker restart crm-backend-v1       # Restart backend
```

---

## 📝 **Notes & Considerations**

### **Performance**
- Index na `smart_mailbox_rules.mailbox_id`
- Cache popular mailbox counts
- Lazy load message lists
- Optimize complex rule queries

### **Security**
- User isolation for custom mailboxes
- Input validation for rule values
- Rate limiting on API endpoints
- XSS protection in rule builder

### **Scalability**
- Pagination for large message lists
- Background job for count calculations
- Database sharding considerations
- CDN for static assets

### **User Experience**
- Smooth animations (iOS-like)
- Keyboard shortcuts
- Drag & drop for rule reordering
- Undo/redo for mailbox changes

---

## 🎯 **Ready to Start?**

**Recommended Starting Point**: Phase 1 - Database Schema + Basic API

**Estimated Time to MVP**: 4-6 hours  
**Full Feature Complete**: 8-12 hours

**Next Steps:**
1. Create database migration
2. Implement basic API endpoints
3. Build SmartMailboxList component
4. Test with built-in mailboxes

**This will be a game-changing feature! 🚀**