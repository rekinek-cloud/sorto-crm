import { Metadata } from 'next';
import SmartReportsPage from '@/components/smart/SmartReportsPage';

export const metadata: Metadata = {
  title: 'SMART Analysis - CRM GTD',
  description: 'Analyze and improve your goals using SMART criteria',
};

export default function SmartAnalysisPage() {
  return (
    <div className="p-6">
      <SmartReportsPage />
    </div>
  );
}