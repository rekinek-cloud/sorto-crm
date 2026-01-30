'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  CheckCircle,
  Clock,
  ArrowRight,
  Zap,
  Star,
  Target,
  Calendar
} from 'lucide-react';
import { EnhancedCard, MetricCard, ActionCard, FeatureCard } from '@/components/ui/EnhancedCard';

export default function EnhancedCardsDemo() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAction = async () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const handleGenerateReport = () => {
    router.push('/crm/dashboard/reports');
  };

  const handleScheduleMeeting = () => {
    router.push('/crm/dashboard/meetings');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-bold text-gradient-primary mb-4">
          🎴 Enhanced Cards Demo
        </h1>
        <p className="text-xl text-white/70 max-w-2xl mx-auto">
          Nowoczesne komponenty kart z glassmorphism, gradientami i zaawansowanymi animacjami
        </p>
      </motion.div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Aktywni Użytkownicy"
          value="2,847"
          trend={{ value: 12.5, isPositive: true }}
          icon={Users}
          description="W tym miesiącu"
        />
        
        <MetricCard
          title="Przychód"
          value="$45,231"
          trend={{ value: 8.2, isPositive: true }}
          icon={DollarSign}
          description="Ostatnie 30 dni"
        />
        
        <MetricCard
          title="Konwersja"
          value="94.2%"
          trend={{ value: 3.1, isPositive: false }}
          icon={TrendingUp}
          description="Rate optymalizacji"
        />
        
        <MetricCard
          title="Zadania"
          value="186"
          trend={{ value: 15.7, isPositive: true }}
          icon={CheckCircle}
          description="Ukończone dziś"
        />
      </div>

      {/* Action Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ActionCard
          title="Uruchom Analizę AI"
          description="Rozpocznij inteligentną analizę danych"
          icon={Zap}
          onClick={handleAction}
          loading={loading}
        />
        
        <ActionCard
          title="Generuj Raport"
          description="Stwórz szczegółowy raport wydajności"
          icon={TrendingUp}
          onClick={handleGenerateReport}
        />
        
        <ActionCard
          title="Zaplanuj Spotkanie"
          description="Dodaj nowe wydarzenie do kalendarza"
          icon={Calendar}
          onClick={handleScheduleMeeting}
        />
      </div>

      {/* Feature Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <FeatureCard
          title="Smart Analytics"
          description="Zaawansowana analityka z AI"
          icon={Target}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Performance Score</span>
              <span className="text-green-300 font-medium">92%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full" style={{width: '92%'}}></div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-white/60">
              <Clock className="w-4 h-4" />
              <span>Ostatnia aktualizacja: 5 min temu</span>
            </div>
          </div>
        </FeatureCard>

        <FeatureCard
          title="Team Performance"
          description="Wydajność zespołu w czasie rzeczywistym"
          icon={Star}
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full"></div>
                <div>
                  <div className="text-white font-medium">Team Alpha</div>
                  <div className="text-white/60 text-sm">8 członków</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-300 font-medium">98%</div>
                <div className="text-white/60 text-sm">Efektywność</div>
              </div>
            </div>
            <button className="w-full btn-modern flex items-center justify-center space-x-2">
              <span>Zobacz szczegóły</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </FeatureCard>
      </div>

      {/* Custom Variants Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <EnhancedCard
          title="Glass Effect"
          description="Klasyczny glassmorphism"
          icon={Star}
          variant="glass"
          size="sm"
        />
        
        <EnhancedCard
          title="Modern Style"
          description="Współczesny design"
          icon={Zap}
          variant="modern"
          size="sm"
        />
        
        <EnhancedCard
          title="Neon Glow"
          description="Futurystyczny wygląd"
          icon={Target}
          variant="neon"
          size="sm"
        />
        
        <EnhancedCard
          title="Gradient Magic"
          description="Kolorowe gradienty"
          icon={TrendingUp}
          variant="gradient"
          size="sm"
        />
      </div>

      {/* Large Feature Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <EnhancedCard
          title="🚀 Dashboard Overview"
          description="Kompletny przegląd wszystkich metryk i działań"
          variant="gradient"
          size="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="text-center p-4 bg-white/10 rounded-xl">
              <div className="text-2xl font-bold text-gradient-neon">95%</div>
              <div className="text-white/70 text-sm">System Uptime</div>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-xl">
              <div className="text-2xl font-bold text-gradient-success">1.2s</div>
              <div className="text-white/70 text-sm">Avg Response</div>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-xl">
              <div className="text-2xl font-bold text-gradient-primary">99.9%</div>
              <div className="text-white/70 text-sm">Reliability</div>
            </div>
          </div>
        </EnhancedCard>
      </motion.div>

      {/* Footer */}
      <div className="text-center mt-12 pt-8 border-t border-white/10">
        <p className="text-white/50 text-sm">
          ✨ Enhanced Cards - Nowoczesne komponenty UI gotowe do użycia
        </p>
      </div>
    </div>
  );
}