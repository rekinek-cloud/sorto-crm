const { processMessageContent } = require('./dist/services/messageProcessor');

async function testAnalysis() {
  const messageId = '021572d8-b7de-4d1b-a59f-5a3a73a9d48b';
  const userId = '0c46760b-dfb2-4f6d-a3e4-10e6a47869c4';
  
  // Mock email message structure
  const emailMessage = {
    messageId: 'test-message-id',
    from: { address: 'vitopar@vitopar.pl', name: 'Vitopar' },
    to: [{ address: 'test@example.com' }],
    subject: 'Etykieta PSIA KARMA żwacz wołowy 500g.',
    text: 'Test content about dog food labels and packaging.',
    html: '<p>Test content about dog food labels and packaging.</p>',
    date: new Date()
  };
  
  try {
    console.log('Starting manual AI analysis test...');
    const results = await processMessageContent(messageId, emailMessage, userId);
    
    console.log('Analysis completed successfully!');
    console.log('Results:', JSON.stringify(results, null, 2));
    
    return { success: true, results };
  } catch (error) {
    console.error('Analysis failed:', error);
    return { success: false, error: error.message };
  }
}

testAnalysis();