'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  Star, 
  Heart,
  ArrowRight,
  Check,
  X,
  Plus
} from 'lucide-react';

export function ModernShowcase() {
  const cards = [
    {
      id: 1,
      title: "Glassmorphism Card",
      description: "Nowoczesny design z blur efektem",
      icon: Sparkles,
      gradient: "bg-gradient-neon",
      className: "glass-card"
    },
    {
      id: 2,
      title: "Animated Button",
      description: "Interaktywny przycisk z hover efektami",
      icon: Zap,
      gradient: "bg-gradient-success",
      className: "card-modern"
    },
    {
      id: 3,
      title: "Floating Elements",
      description: "Subtelne animacje w tle",
      icon: Star,
      gradient: "bg-gradient-aurora",
      className: "card-neon"
    },
    {
      id: 4,
      title: "Enhanced Colors",
      description: "Bogata paleta kolorów z gradientami",
      icon: Heart,
      gradient: "bg-gradient-sunset",
      className: "glass-card-dark"
    }
  ];

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-bold text-gradient-primary mb-4">
          🎨 Modern UI Showcase
        </h1>
        <p className="text-xl text-white/70 max-w-2xl mx-auto">
          Demonstracja nowych możliwości: glassmorphism, gradienty, animacje i nowoczesne efekty
        </p>
      </motion.div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`${card.className} hover-lift cursor-pointer group`}
            >
              <div className="relative">
                {/* Floating icon */}
                <div className="floating mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity" />
                    <Icon className="relative z-10 w-8 h-8 text-blue-300" />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-white/70 text-sm mb-4">
                  {card.description}
                </p>
                
                {/* Action button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-modern flex items-center space-x-2"
                >
                  <span>Sprawdź</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Enhanced Buttons Showcase */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="glass-modal p-8 mb-12"
      >
        <h2 className="text-3xl font-bold text-gradient-neon mb-6">
          🚀 Enhanced Button Collection
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Modern Button */}
          <div className="text-center">
            <h3 className="text-white font-medium mb-4">Modern Gradient</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-modern"
            >
              <Check className="w-4 h-4 mr-2" />
              Success Action
            </motion.button>
          </div>

          {/* Neon Button */}
          <div className="text-center">
            <h3 className="text-white font-medium mb-4">Neon Glow</h3>
            <button className="btn-neon">
              <Zap className="w-4 h-4 mr-2" />
              Electric Effect
            </button>
          </div>

          {/* Glassmorphism Button */}
          <div className="text-center">
            <h3 className="text-white font-medium mb-4">Glass Effect</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glass px-6 py-3 rounded-xl text-white font-medium hover:bg-white/20 transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Loading States Showcase */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="glass-card p-8 mb-12"
      >
        <h2 className="text-3xl font-bold text-gradient-success mb-6">
          ⚡ Loading & Animation States
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Shimmer Effect */}
          <div className="text-center">
            <h3 className="text-white font-medium mb-4">Shimmer</h3>
            <div className="shimmer bg-white/10 h-20 rounded-xl"></div>
          </div>

          {/* Skeleton Wave */}
          <div className="text-center">
            <h3 className="text-white font-medium mb-4">Skeleton</h3>
            <div className="skeleton-modern h-20"></div>
          </div>

          {/* Pulse Glow */}
          <div className="text-center">
            <h3 className="text-white font-medium mb-4">Pulse Glow</h3>
            <div className="pulse-glow bg-blue-500/20 h-20 rounded-xl"></div>
          </div>

          {/* Spinner */}
          <div className="text-center">
            <h3 className="text-white font-medium mb-4">Spinner</h3>
            <div className="flex justify-center">
              <div className="loading-spinner"></div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Typography Showcase */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="card-neon p-8"
      >
        <h2 className="text-3xl font-bold text-gradient-primary mb-6">
          ✨ Enhanced Typography
        </h2>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gradient-neon">
            Hero Heading - Neon Gradient
          </h1>
          <h2 className="text-3xl font-semibold text-gradient-success">
            Display Heading - Success Gradient
          </h2>
          <p className="text-lg text-white/90">
            Regular paragraph text z enhanced readability i proper contrast ratios
          </p>
          <p className="text-sm text-white/70">
            Caption text dla mniejszych informacji i metadata
          </p>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.0 }}
        className="text-center mt-12 pt-8 border-t border-white/10"
      >
        <p className="text-white/50 text-sm">
          🎨 Modern UI Enhancement - Phase 1 Complete ✨
        </p>
      </motion.div>
    </div>
  );
}

export default ModernShowcase;