import { Metadata } from 'next';
import SmartReportsPage from '@/components/smart/SmartReportsPage';

export const metadata: Metadata = {
  title: 'Cele Precyzyjne (RZUT) - STREAMS',
  description: 'Analizuj i ulepszaj cele używając formuły RZUT: Rezultat, Zmierzalność, Ujście, Tło',
};

export default function SmartAnalysisPage() {
  return (
    <div className="p-6">
      <SmartReportsPage />
    </div>
  );
}