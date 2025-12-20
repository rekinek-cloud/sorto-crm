import { useState } from 'react';
import MobileLayout from './components/layout/MobileLayout';
import Header from './components/common/Header';
import ComparisonView from './components/comparison/ComparisonView';
import CTASection from './components/cta/CTASection';
import MainView from './views/MainView';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showFullApp, setShowFullApp] = useState(false);

  const handleInstall = async () => {
    setIsLoading(true);
    // Simulate installation process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsInstalled(true);
    setIsLoading(false);
    
    // Auto-switch to full app after installation
    setTimeout(() => {
      setShowFullApp(true);
    }, 1000);
  };

  const handleBack = () => {
    if (showFullApp) {
      setShowFullApp(false);
    } else {
      console.log('Navigate back');
    }
  };

  const handleMenu = () => {
    console.log('Open menu');
  };

  // Show full application if "installed"
  if (showFullApp) {
    return <MainView />;
  }

  // Show landing page by default
  return (
    <MobileLayout>
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600">
        <Header 
          title="SmartNotes AI"
          subtitle="Inteligentne notatki głosowe"
          onBack={handleBack}
          onMenu={handleMenu}
        />
      </div>
      
      <ComparisonView />
      
      <CTASection 
        onInstall={handleInstall}
        loading={isLoading}
        installed={isInstalled}
      />
      
      {/* Quick access to full app */}
      {isInstalled && (
        <div className="p-4 text-center">
          <button
            onClick={() => setShowFullApp(true)}
            className="text-indigo-600 underline text-sm"
          >
            Otwórz aplikację →
          </button>
        </div>
      )}
    </MobileLayout>
  );
}

export default App;