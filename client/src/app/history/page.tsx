import { Metadata } from 'next';
import HistoryContent from './history-content';

export const metadata: Metadata = {
  title: 'History | TraceVault',
  description: 'Private chronological log of your reflections across all projects',
};

export default function HistoryPage() {
  return <HistoryContent />;
}