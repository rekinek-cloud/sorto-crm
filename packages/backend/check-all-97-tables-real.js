const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAll97Tables() {
  console.log('📊 Sprawdzanie WSZYSTKICH 97 tabel w bazie danych...\n');

  try {
    // Lista wszystkich rzeczywistych tabel z bazy
    const realTables = [
      'activities', 'ai_executions', 'ai_knowledge_bases', 'ai_knowledge_documents', 'ai_models',
      'ai_prompt_templates', 'ai_providers', 'ai_rules', 'ai_usage_stats', 'areas_of_responsibility',
      'auto_replies', 'bug_reports', 'communication_channels', 'companies', 'complaints',
      'completeness', 'contacts', 'contexts', 'critical_path', 'deals',
      'delegated_tasks', 'dependencies', 'document_comments', 'document_links', 'document_shares',
      'documents', 'email_analysis', 'email_logs', 'email_rules', 'email_templates',
      'error_logs', 'files', 'focus_modes', 'folders', 'gtd_buckets',
      'gtd_horizons', 'habit_entries', 'habits', 'inbox_items', 'info',
      'invoice_items', 'invoices', 'knowledge_base', 'leads', 'meetings',
      'message_attachments', 'message_processing_results', 'messages', 'metadata', 'next_actions',
      'offer_items', 'offers', 'order_items', 'orders', 'organizations',
      'processing_rules', 'products', 'project_dependencies', 'projects', 'recommendations',
      'recurring_tasks', 'refresh_tokens', 'search_index', 'services', 'smart',
      'smart_analysis_details', 'smart_improvements', 'smart_mailbox_rules', 'smart_mailboxes', 'smart_templates',
      'someday_maybe', 'stream_access_logs', 'stream_channels', 'stream_permissions', 'stream_relations',
      'streams', 'subscriptions', 'tags', 'task_history', 'task_relationships',
      'tasks', 'timeline', 'unified_rule_executions', 'unified_rules', 'unimportant',
      'user_access_logs', 'user_permissions', 'user_relations', 'users', 'vector_cache',
      'vector_documents', 'vector_search_results', 'waiting_for', 'weekly_reviews', 'wiki_categories',
      'wiki_page_links', 'wiki_pages'
    ];

    const emptyTables = [];
    const populatedTables = [];
    const errorTables = [];

    console.log('🔍 Sprawdzanie każdej tabeli...\n');

    for (const tableName of realTables) {
      try {
        // Używamy raw SQL aby sprawdzić każdą tabelę
        const result = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM ${prisma.$queryRawUnsafe(`"${tableName}"`)}
        `;
        
        const count = parseInt(result[0].count);
        
        if (count === 0) {
          emptyTables.push(tableName);
          console.log(`🔴 ${tableName} (0 rekordów)`);
        } else {
          populatedTables.push({ name: tableName, count });
          console.log(`✅ ${tableName} (${count} rekordów)`);
        }
      } catch (error) {
        errorTables.push(tableName);
        console.log(`❌ ${tableName} (błąd: ${error.message.substring(0, 50)}...)`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 PODSUMOWANIE WSZYSTKICH 97 TABEL:');
    console.log('='.repeat(80));

    console.log('\n🔴 TABELE PUSTE:');
    if (emptyTables.length > 0) {
      emptyTables.forEach((table, index) => {
        console.log(`${index + 1}. ${table}`);
      });
    } else {
      console.log('Brak pustych tabel!');
    }

    console.log('\n✅ TABELE WYPEŁNIONE:');
    populatedTables
      .sort((a, b) => b.count - a.count)
      .forEach((table, index) => {
        console.log(`${index + 1}. ${table.name} (${table.count} rekordów)`);
      });

    if (errorTables.length > 0) {
      console.log('\n❌ TABELE Z BŁĘDAMI:');
      errorTables.forEach((table, index) => {
        console.log(`${index + 1}. ${table}`);
      });
    }

    const totalRecords = populatedTables.reduce((sum, table) => sum + table.count, 0);
    const fillPercentage = ((populatedTables.length / realTables.length) * 100).toFixed(1);

    console.log('\n' + '='.repeat(80));
    console.log('📈 STATYSTYKI FINALNE:');
    console.log(`🗄️  Łączna liczba tabel: ${realTables.length}`);
    console.log(`✅ Tabele wypełnione: ${populatedTables.length} (${fillPercentage}%)`);
    console.log(`🔴 Tabele puste: ${emptyTables.length} (${(100 - fillPercentage).toFixed(1)}%)`);
    console.log(`❌ Tabele z błędami: ${errorTables.length}`);
    console.log(`📋 Łączna liczba rekordów: ${totalRecords}`);
    console.log('='.repeat(80));

    // Cele do osiągnięcia 90%
    const tablesNeededFor90 = Math.ceil(realTables.length * 0.9) - populatedTables.length;
    console.log(`\n🎯 Do osiągnięcia 90%: trzeba wypełnić jeszcze ${tablesNeededFor90} tabel`);

  } catch (error) {
    console.error('❌ Błąd podczas sprawdzania tabel:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAll97Tables();