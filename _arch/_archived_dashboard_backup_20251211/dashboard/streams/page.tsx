import { Metadata } from 'next';
import StreamsList from '@/components/gtd/StreamsList';

export const metadata: Metadata = {
  title: 'Strumienie - STREAMS',
  description: 'Zarządzaj strumieniami pracy - płynącymi i zamrożonymi',
};

export default function StreamsPage() {
  return (
    <div className="p-6">
      <StreamsList />
    </div>
  );
}