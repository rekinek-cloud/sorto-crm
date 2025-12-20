const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeDatabaseContent() {
  console.log('=== ANALIZA ZAWARTOŚCI BAZY DANYCH CRM-GTD SMART ===\n');
  
  const tables = [
    'Organization', 'User', 'Task', 'Project', 'Contact', 'Company', 'Deal',
    'Message', 'EmailAccount', 'CommunicationChannel', 'Stream', 'InboxItem',
    'NextAction', 'WaitingFor', 'SomedayMaybe', 'GTDBucket', 'GTDHorizon',
    'Context', 'Tag', 'Product', 'Service', 'Invoice', 'Order', 'Offer',
    'Meeting', 'RecurringTask', 'WeeklyReview', 'Sprint', 'Timeline',
    'Activity', 'Document', 'WikiPage', 'Folder', 'File', 'SearchIndex',
    'AIProvider', 'AIModel', 'AIRule', 'AIExecution', 'AIKnowledgeBase',
    'EmailTemplate', 'AutoReply', 'EmailRule', 'ProcessingRule', 'UnifiedRule',
    'SmartMailbox', 'UserRelation', 'TaskRelationship', 'Dependency',
    'ProjectDependency', 'StreamChannel', 'StreamPermission', 'UserPermission',
    'AreaOfResponsibility', 'FocusMode', 'Habit', 'SMARTTemplate',
    'Recommendation', 'Lead', 'Complaint', 'Subscription', 'BugReport',
    'VectorDocument', 'VectorCache', 'VectorSearchResult', 'EmailAnalysis',
    'EmailLog', 'ErrorLog', 'UserAccessLog', 'StreamAccessLog',
    'UnifiedRuleExecution', 'Unimportant', 'KnowledgeBase', 'WikiCategory',
    'Info', 'DelegatedTask', 'TaskTemplate', 'WorkSession', 'WorkBreak',
    'EnergyTimeBlock', 'ScheduledTask', 'EnergyPattern', 'EnergyAnalytics',
    'PerformanceMetrics', 'UserPattern', 'WeeklyTemplate', 'DayTemplate',
    'AutoScheduleConfig', 'FocusSession', 'TaskDistributionStrategy',
    'TaskPlacement', 'DayPlannerAnalytics', 'TaskRescheduling',
    'FocusModeUsage', 'ProductivityInsight', 'BestPractice',
    'EnergyOptimization', 'FocusTimeRecommendation'
  ];

  const results = {};
  const emptyTables = [];
  const lowDataTables = [];
  const wellPopulatedTables = [];
  
  for (const table of tables) {
    try {
      const count = await prisma[table.charAt(0).toLowerCase() + table.slice(1)].count();
      results[table] = count;
      
      if (count === 0) {
        emptyTables.push(table);
      } else if (count < 10) {
        lowDataTables.push({ table, count });
      } else {
        wellPopulatedTables.push({ table, count });
      }
      
      console.log(`${table}: ${count} rekordów`);
    } catch (error) {
      console.log(`${table}: BŁĄD lub tabela nie istnieje`);
      results[table] = 'ERROR';
    }
  }
  
  console.log('\n=== PODSUMOWANIE ===');
  console.log(`\nTabele puste (${emptyTables.length}):`);
  emptyTables.forEach(t => console.log(`  - ${t}`));
  
  console.log(`\nTabele z małą ilością danych (<10 rekordów) (${lowDataTables.length}):`);
  lowDataTables.forEach(({ table, count }) => console.log(`  - ${table}: ${count} rekordów`));
  
  console.log(`\nTabele dobrze wypełnione (≥10 rekordów) (${wellPopulatedTables.length}):`);
  wellPopulatedTables.forEach(({ table, count }) => console.log(`  - ${table}: ${count} rekordów`));
  
  // Sprawdzenie dat istniejących rekordów
  console.log('\n=== ANALIZA ZAKRESU DAT ===');
  
  // Sprawdzenie zadań
  const tasks = await prisma.task.findMany({
    select: { createdAt: true, dueDate: true },
    orderBy: { createdAt: 'asc' }
  });
  
  if (tasks.length > 0) {
    const oldestTask = tasks[0].createdAt;
    const newestTask = tasks[tasks.length - 1].createdAt;
    console.log(`\nZadania:`);
    console.log(`  - Najstarsze: ${oldestTask}`);
    console.log(`  - Najnowsze: ${newestTask}`);
    
    const tasksWithDueDate = tasks.filter(t => t.dueDate);
    if (tasksWithDueDate.length > 0) {
      const dueDates = tasksWithDueDate.map(t => t.dueDate).sort();
      console.log(`  - Najwcześniejszy termin: ${dueDates[0]}`);
      console.log(`  - Najpóźniejszy termin: ${dueDates[dueDates.length - 1]}`);
    }
  }
  
  // Sprawdzenie projektów
  const projects = await prisma.project.findMany({
    select: { createdAt: true, startDate: true, endDate: true },
    orderBy: { createdAt: 'asc' }
  });
  
  if (projects.length > 0) {
    console.log(`\nProjekty:`);
    console.log(`  - Ilość: ${projects.length}`);
    const projectsWithDates = projects.filter(p => p.startDate && p.endDate);
    console.log(`  - Z datami start/end: ${projectsWithDates.length}`);
  }
  
  // Sprawdzenie wiadomości
  const messages = await prisma.message.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' }
  });
  
  if (messages.length > 0) {
    console.log(`\nWiadomości:`);
    console.log(`  - Najstarsza: ${messages[0].createdAt}`);
    console.log(`  - Najnowsza: ${messages[messages.length - 1].createdAt}`);
  }
  
  // Sprawdzenie spotkań
  const meetings = await prisma.meeting.findMany({
    select: { startDate: true, endDate: true },
    orderBy: { startDate: 'asc' }
  });
  
  if (meetings.length > 0) {
    console.log(`\nSpotkania:`);
    console.log(`  - Ilość: ${meetings.length}`);
    const futureMeetings = meetings.filter(m => m.startDate > new Date());
    console.log(`  - Przyszłe spotkania: ${futureMeetings.length}`);
  }
  
  console.log('\n=== KONIEC ANALIZY ===');
  
  await prisma.$disconnect();
}

analyzeDatabaseContent().catch(console.error);