import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixStreamChannels() {
  try {
    console.log('🔍 Sprawdzanie stanu stream_channels...');
    
    const streamChannels = await prisma.streamChannel.findMany();
    console.log(`Stream channels obecnie w bazie: ${streamChannels.length}`);
    
    const streams = await prisma.stream.findMany();
    const channels = await prisma.communicationChannel.findMany();
    
    console.log(`Dostępne streams: ${streams.length}`);
    console.log(`Dostępne communication channels: ${channels.length}`);
    
    if (streamChannels.length === 0 && streams.length > 0 && channels.length > 0) {
      console.log('🔄 Dodaję stream channels...');
      
      // Dodaj pierwszy stream channel
      await prisma.streamChannel.create({
        data: {
          streamId: streams[0].id,
          channelId: channels[0].id,
          autoCreateTasks: true,
          defaultContext: '@office',
          defaultPriority: 'HIGH'
        }
      });
      console.log('✅ Pierwszy stream channel dodany!');
      
      // Jeśli mamy więcej streamów, dodaj kombinacje
      if (streams.length > 1) {
        await prisma.streamChannel.create({
          data: {
            streamId: streams[1].id,
            channelId: channels[0].id,
            autoCreateTasks: false,
            defaultContext: '@computer',
            defaultPriority: 'MEDIUM'
          }
        });
        console.log('✅ Drugi stream channel dodany!');
      }
      
      if (streams.length > 2) {
        await prisma.streamChannel.create({
          data: {
            streamId: streams[2].id,
            channelId: channels[0].id,
            autoCreateTasks: true,
            defaultContext: '@calls',
            defaultPriority: 'LOW'
          }
        });
        console.log('✅ Trzeci stream channel dodany!');
      }
      
    } else if (streamChannels.length > 0) {
      console.log('⏩ Stream channels już istnieją');
      streamChannels.forEach((sc, index) => {
        console.log(`  ${index + 1}. Stream: ${sc.streamId}, Channel: ${sc.channelId}`);
      });
    } else {
      console.log('❌ Brak danych podstawowych (streams lub channels)');
    }
    
    const finalCount = await prisma.streamChannel.count();
    console.log(`🎯 Finalna liczba stream channels: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixStreamChannels();