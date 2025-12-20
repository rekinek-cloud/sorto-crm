# 📧 Smart Mailboxes - iOS-Style Intelligence

**Koncepcja**: Inteligentne skrzynki podobne do iOS Mail dla CRM-GTD Smart

## 🎯 **Główne Korzyści**

### **Produktywność** 
- ⚡ Instant message categorization
- 🎯 Focus na ważnych wiadomościach  
- 📊 Visual progress tracking
- 🔄 Automated GTD processing

### **Integracja z istniejącym systemem**
- 🤖 Wykorzystuje AI urgency analysis
- 📋 Współpracuje z GTD workflow
- 👥 Korzysta z CRM contact data
- 📊 Integruje się z project management

---

## 📧 **Wbudowane Smart Mailboxes**

| Icon | Name | Logic | Count |
|------|------|-------|-------|
| 🔥 | Action Required | `urgency_score > 70 OR status = 'ACTION_NEEDED'` | 12 |
| 📅 | Today | `created_at >= today()` | 5 |
| 👥 | VIP Contacts | `sender_id IN (vip_contacts)` | 3 |
| 📎 | With Attachments | `attachments_count > 0` | 8 |
| 🤖 | AI Analyzed | `ai_processed = true AND urgency_score IS NOT NULL` | 24 |
| ⏰ | Waiting For | `gtd_status = 'WAITING'` | 6 |
| 🎯 | High Priority | `priority = 'HIGH'` | 9 |
| 🌙 | After Hours | `created_at NOT BETWEEN '09:00' AND '17:00'` | 11 |

---

## ✨ **Custom Smart Mailboxes - Przykłady**

### **Business-Focused**
```
💼 Clients
└── sender_type = 'client' OR sender_company IN (client_companies)

🏢 Internal Team  
└── sender_domain = 'ourcompany.com'

📊 Reports & Analytics
└── subject CONTAINS ('report', 'analytics', 'metrics', 'dashboard')

🔄 Project Communications
└── subject CONTAINS project_keywords OR related_project IS NOT NULL
```

### **GTD-Enhanced**
```
📥 Quick Inbox Process
└── gtd_status IS NULL AND urgency_score < 30

✅ Ready to DO  
└── gtd_status = 'DO' AND estimated_time <= 15

⏳ Deferred Items
└── gtd_status = 'DEFER' AND defer_date <= today()

👥 Delegated & Waiting
└── gtd_status IN ('DELEGATE', 'WAITING')
```

### **AI-Powered**
```
😊 Positive Vibes
└── sentiment = 'positive' AND urgency_score < 50

🚨 Urgent Issues  
└── sentiment = 'negative' AND urgency_score > 80

🤔 Needs Analysis
└── ai_processed = false AND created_at < 1 hour ago

💡 Opportunities
└── content CONTAINS ('opportunity', 'proposal', 'partnership')
```

---

## 🎨 **UI Design - iOS Style with Phase 2**

### **Sidebar Layout**
```tsx
<motion.div className="glass-card w-72 p-6 space-y-4">
  {/* Header */}
  <div className="flex items-center justify-between">
    <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
      Smart Mailboxes
    </h2>
    <button className="btn-modern-outline text-sm">
      ➕ New
    </button>
  </div>

  {/* Built-in Mailboxes */}
  <div className="space-y-2">
    <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
      Built-in
    </h3>
    {builtInMailboxes.map(mailbox => (
      <SmartMailboxItem 
        key={mailbox.id}
        icon={mailbox.icon}
        name={mailbox.name}
        count={mailbox.count}
        color={mailbox.color}
        isActive={selectedMailbox === mailbox.id}
        onClick={() => setSelectedMailbox(mailbox.id)}
      />
    ))}
  </div>

  {/* Custom Mailboxes */}
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

### **Individual Mailbox Item**
```tsx
<motion.div 
  className={`
    flex items-center justify-between p-3 rounded-xl 
    transition-all duration-200 cursor-pointer
    ${isActive 
      ? 'bg-blue-500/20 border border-blue-500/30' 
      : 'bg-white/20 hover:bg-white/30 border border-white/20'
    }
  `}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  <div className="flex items-center space-x-3">
    <span className="text-xl">{icon}</span>
    <span className="font-medium text-slate-800 dark:text-white">
      {name}
    </span>
  </div>
  
  {count > 0 && (
    <motion.span 
      className={`
        px-2 py-1 rounded-full text-xs font-medium
        ${color === 'red' ? 'bg-rose-500/20 text-rose-700' :
          color === 'blue' ? 'bg-blue-500/20 text-blue-700' :
          color === 'green' ? 'bg-emerald-500/20 text-emerald-700' :
          'bg-slate-500/20 text-slate-700'
        }
      `}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      key={count}
    >
      {count}
    </motion.span>
  )}
</motion.div>
```

---

## 🔧 **Technical Implementation**

### **Database Schema**
```sql
-- Smart Mailboxes
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

-- Smart Mailbox Rules  
CREATE TABLE smart_mailbox_rules (
  id SERIAL PRIMARY KEY,
  mailbox_id INTEGER REFERENCES smart_mailboxes(id) ON DELETE CASCADE,
  field VARCHAR(100) NOT NULL, -- 'sender', 'subject', 'urgency_score', etc.
  operator VARCHAR(50) NOT NULL, -- 'contains', 'equals', 'greater_than', etc.
  value TEXT NOT NULL,
  logic_operator VARCHAR(10) DEFAULT 'AND', -- 'AND', 'OR'
  rule_order INTEGER DEFAULT 0
);

-- Built-in mailboxes data
INSERT INTO smart_mailboxes (name, icon, color, is_built_in) VALUES
('Action Required', '🔥', 'red', true),
('Today', '📅', 'blue', true),
('VIP Contacts', '👥', 'yellow', true),
('With Attachments', '📎', 'gray', true),
('AI Analyzed', '🤖', 'purple', true),
('Waiting For', '⏰', 'orange', true),
('High Priority', '🎯', 'red', true);
```

### **Backend API**
```typescript
// GET /api/smart-mailboxes
interface SmartMailboxResponse {
  id: number;
  name: string;
  icon: string;
  color: string;
  isBuiltIn: boolean;
  count: number; // Real-time message count
  rules: SmartMailboxRule[];
}

// GET /api/smart-mailboxes/:id/messages
interface SmartMailboxMessages {
  messages: Message[];
  pagination: PaginationInfo;
  totalCount: number;
}

// POST /api/smart-mailboxes - Create custom mailbox
interface CreateSmartMailboxRequest {
  name: string;
  icon: string;
  color: string;
  rules: SmartMailboxRule[];
}
```

### **Frontend Components**
```
src/components/communication/smart-mailboxes/
├── SmartMailboxList.tsx          // Main sidebar
├── SmartMailboxItem.tsx          // Individual mailbox
├── SmartMailboxBuilder.tsx       // Create/edit modal
├── RuleBuilder.tsx               // Rule creation interface
├── MailboxPreview.tsx            // Preview messages matching rules
└── types.ts                      // TypeScript definitions
```

---

## 📱 **Smart Mailbox Builder - Rule Interface**

### **Visual Rule Builder**
```tsx
<div className="glass-card p-6">
  <h3 className="text-lg font-semibold mb-4">Create Smart Mailbox</h3>
  
  {/* Basic Info */}
  <div className="grid grid-cols-3 gap-4 mb-6">
    <input placeholder="Mailbox Name" className="modern-input" />
    <select className="modern-select">
      <option>📧 Default</option>
      <option>🔥 Action</option>
      <option>👥 People</option>
      <option>📊 Reports</option>
    </select>
    <ColorPicker />
  </div>
  
  {/* Rules */}
  <div className="space-y-3">
    <h4 className="font-medium">Include messages where:</h4>
    {rules.map((rule, index) => (
      <div key={index} className="flex items-center space-x-2">
        {index > 0 && (
          <select className="w-20">
            <option>AND</option>
            <option>OR</option>
          </select>
        )}
        
        <select className="flex-1">
          <option value="sender">Sender</option>
          <option value="subject">Subject</option>
          <option value="content">Content</option>
          <option value="urgency_score">Urgency Score</option>
          <option value="priority">Priority</option>
          <option value="gtd_status">GTD Status</option>
        </select>
        
        <select className="w-32">
          <option value="contains">contains</option>
          <option value="equals">equals</option>
          <option value="starts_with">starts with</option>
          <option value="greater_than">greater than</option>
        </select>
        
        <input className="flex-1" placeholder="Value" />
        
        <button onClick={() => removeRule(index)}>🗑️</button>
      </div>
    ))}
    
    <button onClick={addRule} className="btn-modern-outline">
      ➕ Add Rule
    </button>
  </div>
  
  {/* Preview */}
  <div className="mt-6 p-4 bg-white/10 rounded-xl">
    <h4 className="font-medium mb-2">Preview (3 messages match)</h4>
    <div className="space-y-2">
      {previewMessages.map(msg => (
        <div key={msg.id} className="text-sm p-2 bg-white/20 rounded">
          {msg.subject}
        </div>
      ))}
    </div>
  </div>
</div>
```

---

## ⚡ **Advanced Features**

### **Real-time Updates**
```typescript
// WebSocket dla live counter updates
useEffect(() => {
  const ws = new WebSocket('/ws/smart-mailboxes');
  
  ws.onmessage = (event) => {
    const { mailboxId, newCount } = JSON.parse(event.data);
    updateMailboxCount(mailboxId, newCount);
  };
  
  return () => ws.close();
}, []);
```

### **Smart Suggestions**
```typescript
// AI-powered mailbox suggestions
const suggestSmartMailboxes = async (userId: number) => {
  const userMessages = await getRecentMessages(userId, 100);
  const analysis = await analyzeMessagePatterns(userMessages);
  
  return [
    {
      name: `${analysis.topSender} Messages`,
      rules: [{ field: 'sender', operator: 'equals', value: analysis.topSender }]
    },
    {
      name: 'High Urgency This Week',
      rules: [
        { field: 'urgency_score', operator: 'greater_than', value: '80' },
        { field: 'created_at', operator: 'within_days', value: '7' }
      ]
    }
  ];
};
```

---

## 🚀 **Implementation Roadmap**

### **Phase 1: Core Foundation (4-6h)**
- [x] Database schema
- [x] Built-in mailboxes setup
- [x] Basic API endpoints
- [x] SmartMailboxList component
- [x] Real-time counting

### **Phase 2: Custom Mailboxes (3-4h)**
- [ ] SmartMailboxBuilder interface
- [ ] Rule builder with drag-drop
- [ ] Preview functionality
- [ ] CRUD operations

### **Phase 3: Advanced Features (2-3h)**
- [ ] WebSocket real-time updates
- [ ] Smart suggestions
- [ ] Import/export mailbox configs
- [ ] Mailbox analytics

---

## 💡 **Unique CRM-GTD Integration**

### **GTD-Powered Mailboxes**
```
📥 Inbox Zero Ready
└── ai_processed = true AND gtd_status IS NULL

✅ 2-Minute Tasks  
└── estimated_time <= 2 AND urgency_score > 60

📋 Weekly Review Items
└── gtd_status = 'SOMEDAY' AND last_reviewed < 7 days ago

🎯 Context-Based
└── recommended_context = user_current_context
```

### **CRM-Enhanced Intelligence**
```
💰 Sales Opportunities
└── sender IN (prospects) AND content CONTAINS sales_keywords

🤝 Client Relationship  
└── sender IN (clients) AND sentiment != 'negative'

📈 Performance Reports
└── sender IN (team) AND subject CONTAINS report_keywords
```

---

## 🎯 **Expected Impact**

### **Productivity Gains**
- ⚡ **50% faster** message processing
- 🎯 **80% reduction** in cognitive load
- 📊 **100% automated** categorization
- 🔄 **Real-time** priority management

### **User Experience**
- 🍎 **Familiar iOS-style** interaction
- 🎨 **Beautiful Phase 2** aesthetics  
- 📱 **Mobile-optimized** interface
- ⚡ **Instant visual** feedback

**To byłby game-changing feature który podniosłby CRM-GTD Smart na nowy poziom organizacji komunikacji!** 🚀