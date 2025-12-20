const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function check97Tables() {
  console.log('📊 Sprawdzanie wszystkich 97 tabel przez Prisma modele...\n');

  try {
    const filled = [];
    const empty = [];

    // Lista wszystkich dostępnych modeli Prisma
    const models = [
      // Core
      'organization', 'user', 'task', 'project', 'contact', 'company', 'deal', 'context',
      
      // GTD
      'nextAction', 'waitingFor', 'somedayMaybe', 'habit', 'meeting', 'weeklyReview',
      'delegatedTask', 'recurringTask', 'inboxItem', 'focusMode',
      
      // Business
      'product', 'service', 'lead', 'order', 'invoice', 'offer',
      'orderItem', 'invoiceItem', 'offerItem',
      
      // Knowledge  
      'document', 'folder', 'wikiPage', 'wikiCategory', 'searchIndex',
      
      // AI System
      'aIProvider', 'aIModel', 'aIRule', 'aIExecution', 'aIPromptTemplate', 
      'aIKnowledgeBase', 'aIKnowledgeDocument', 'aIUsageStats',
      
      // Communication
      'message', 'communicationChannel', 'messageAttachment', 'messageProcessingResult',
      'emailRule', 'emailTemplate', 'emailLog', 'emailAnalysis', 'smartMailbox',
      'autoReply', 'processingRule',
      
      // CRM Extended
      'subscription', 'stream', 'streamChannel', 'streamPermission', 'streamRelation',
      'streamAccessLog', 'activity', 'timeline', 'bugReport',
      
      // Management
      'tag', 'userRelation', 'userPermission', 'userAccessLog', 'errorLog',
      'file', 'metadata', 'refreshToken',
      
      // GTD Extended
      'habitEntry', 'gtdBucket', 'gtdHorizon', 'areaOfResponsibility', 'sMARTTemplate',
      'completeness', 'smartAnalysisDetail', 'smartImprovement',
      
      // Dependencies & Relations
      'dependency', 'projectDependency', 'taskRelationship', 'criticalPath',
      'taskHistory',
      
      // Advanced Features
      'complaint', 'info', 'unimportant', 'recommendation',
      'unifiedRule', 'unifiedRuleExecution',
      
      // Vector & Search
      'vectorDocument', 'vectorSearchResult', 'vectorCache',
      
      // Document Management
      'documentComment', 'documentLink', 'documentShare',
      'wikiPageLink',
      
      // Smart Systems
      'smart', 'smartMailboxRule'
    ];

    console.log(`🔍 Sprawdzanie ${models.length} modeli Prisma...\n`);

    for (const modelName of models) {
      try {
        // Dynamiczny dostęp do modelu
        const model = prisma[modelName];
        if (model && typeof model.count === 'function') {
          const count = await model.count();
          if (count > 0) {
            filled.push({ name: modelName, count });
            console.log(`✅ ${modelName}: ${count} rekordów`);
          } else {
            empty.push(modelName);
            console.log(`🔴 ${modelName}: pusta`);
          }
        } else {
          empty.push(modelName);
          console.log(`⚠️  ${modelName}: model nie istnieje`);
        }
      } catch (error) {
        empty.push(modelName);
        console.log(`❌ ${modelName}: błąd (${error.message.substring(0, 40)}...)`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 PODSUMOWANIE WSZYSTKICH MODELI:');
    console.log('='.repeat(80));

    console.log('\n✅ TABELE WYPEŁNIONE:');
    filled
      .sort((a, b) => b.count - a.count)
      .forEach((table, index) => {
        console.log(`${index + 1}. ${table.name} (${table.count} rekordów)`);
      });

    console.log('\n🔴 TABELE PUSTE:');
    empty.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });

    const totalChecked = filled.length + empty.length;
    const fillPercentage = ((filled.length / totalChecked) * 100).toFixed(1);
    const totalRecords = filled.reduce((sum, table) => sum + table.count, 0);

    console.log('\n' + '='.repeat(80));
    console.log('📈 STATYSTYKI:');
    console.log(`🗄️  Sprawdzonych modeli: ${totalChecked}`);
    console.log(`✅ Tabele wypełnione: ${filled.length} (${fillPercentage}%)`);
    console.log(`🔴 Tabele puste: ${empty.length} (${(100 - fillPercentage).toFixed(1)}%)`);
    console.log(`📋 Łączna liczba rekordów: ${totalRecords}`);
    console.log('='.repeat(80));

    // Cel 90% z 97 tabel
    const tablesNeededFor90 = Math.ceil(97 * 0.9) - filled.length;
    console.log(`\n🎯 Do osiągnięcia 90% z 97 tabel: trzeba wypełnić jeszcze ${tablesNeededFor90} tabel`);
    console.log(`📊 Cel: ${Math.ceil(97 * 0.9)} wypełnionych tabel (90% z 97)`);

    // Zwróć listę pustych do wypełnienia
    console.log(`\n📋 PRIORYTETOWE PUSTE TABELE DO WYPEŁNIENIA:`);
    const priorityEmpty = empty.slice(0, Math.min(20, tablesNeededFor90));
    priorityEmpty.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check97Tables();