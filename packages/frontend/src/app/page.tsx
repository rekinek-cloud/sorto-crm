import { permanentRedirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to default locale
  permanentRedirect('/pl');
}
