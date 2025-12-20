const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Lista wszystkich pustych tabel do analizy
const emptyTables = [
  'knowledgeBase', 'emailAnalysis', 'delegatedTask', 'timeline', 'areaOfResponsibility',
  'lead', 'order', 'invoice', 'complaint', 'info', 'unimportant', 'recommendation',
  'file', 'processingRule', 'offer', 'bugReport', 'wikiPage', 'wikiCategory',
  'searchIndex', 'emailTemplate', 'emailLog', 'vectorDocument', 'vectorSearchResult', 'vectorCache'
];

async function analyzeTableStructures() {
  console.log('Analizowanie struktur pustych tabel...\n');
  
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  const analysis = {};

  for (const tableName of emptyTables) {
    console.log(`📋 Analizowanie: ${tableName}`);
    
    // Znajdź model w schema.prisma
    const modelRegex = new RegExp(`model\\s+${tableName.charAt(0).toUpperCase() + tableName.slice(1)}\\s*{([^}]+)}`, 'i');
    const match = schema.match(modelRegex);
    
    if (match) {
      const modelContent = match[1];
      
      // Wyciągnij pola
      const fields = [];
      const relations = [];
      const required = [];
      const optional = [];
      
      const lines = modelContent.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('@@')) {
          if (trimmed.includes('@relation')) {
            relations.push(trimmed);
          } else if (trimmed.includes('String') || trimmed.includes('Int') || trimmed.includes('Boolean') || trimmed.includes('DateTime')) {
            fields.push(trimmed);
            if (!trimmed.includes('?') && !trimmed.includes('@default') && !trimmed.includes('@id')) {
              required.push(trimmed.split(/\s+/)[0]);
            } else {
              optional.push(trimmed.split(/\s+/)[0]);
            }
          }
        }
      }
      
      analysis[tableName] = {
        fields,
        relations,
        required: required.filter(f => f !== 'id' && f !== 'organizationId' && f !== 'createdAt' && f !== 'updatedAt'),
        optional: optional.filter(f => f !== 'id' && f !== 'organizationId' && f !== 'createdAt' && f !== 'updatedAt'),
        complexity: relations.length > 0 ? 'HIGH' : required.length > 3 ? 'MEDIUM' : 'LOW'
      };
      
      console.log(`  ✅ Pola wymagane: ${analysis[tableName].required.join(', ') || 'brak'}`);
      console.log(`  📝 Relacje: ${relations.length}`);
      console.log(`  🎯 Złożoność: ${analysis[tableName].complexity}\n`);
    } else {
      console.log(`  ❌ Nie znaleziono modelu\n`);
    }
  }

  // Sortuj według złożoności
  const byComplexity = {
    LOW: [],
    MEDIUM: [],
    HIGH: []
  };

  for (const [table, data] of Object.entries(analysis)) {
    byComplexity[data.complexity].push(table);
  }

  console.log('📊 REKOMENDOWANA KOLEJNOŚĆ SEEDOWANIA:\n');
  console.log('🟢 PROSTE (bez relacji):');
  byComplexity.LOW.forEach(table => console.log(`  - ${table}`));
  
  console.log('\n🟡 ŚREDNIE (kilka pól wymaganych):');
  byComplexity.MEDIUM.forEach(table => console.log(`  - ${table}`));
  
  console.log('\n🔴 ZŁOŻONE (z relacjami):');
  byComplexity.HIGH.forEach(table => console.log(`  - ${table}`));

  // Zapisz analizę do pliku
  fs.writeFileSync('table-analysis.json', JSON.stringify(analysis, null, 2));
  console.log('\n💾 Analiza zapisana do table-analysis.json');

  return analysis;
}

analyzeTableStructures().catch(console.error);