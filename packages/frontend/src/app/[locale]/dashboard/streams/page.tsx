import { Metadata } from 'next';
import GTDStreamManager from '@/components/streams/GTDStreamManager';

export const metadata: Metadata = {
  title: 'STREAMS - Zarządzanie strumieniami',
  description: 'Zarządzaj swoimi strumieniami pracy w nowoczesny sposób',
};

export default function StreamsPage() {
  return (
    <div className="p-6">
      <GTDStreamManager />
    </div>
  );
}