import { Metadata } from 'next';
import StreamManager from '@/components/streams/StreamManager';

export const metadata: Metadata = {
  title: 'Strumienie - Zarządzanie strumieniami',
  description: 'Zarządzaj swoimi strumieniami pracy w nowoczesny sposób',
};

export default function StreamsPage() {
  return <StreamManager />;
}
