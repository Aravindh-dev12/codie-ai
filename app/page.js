"use client";
import React, { useEffect, useState, Suspense } from 'react';
import Hero from '@/components/custom/Hero';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Code, Laptop, Rocket, Sparkles, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import CommandPalette from "@/components/custom/CommandPalette";

// Lazy load components that aren't needed immediately
const SocialProof = React.lazy(() => import('@/components/custom/SocialProof'));
const FeatureHighlights = React.lazy(() => import('@/components/custom/FeatureHighlights'));

// Loading fallback component with skeleton UI
const SkeletonLoader = () => (
  <div className="w-full animate-pulse">
    <div className="h-8 bg-gray-800/50 rounded-lg w-1/3 mb-4"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-gray-800/30 rounded-xl p-6 h-64"></div>
      ))}
    </div>
  </div>
);

export default function Home() {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // Check if this is user's first visit
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    if (!hasVisitedBefore) {
      setIsFirstVisit(true);
      setShowWelcomeModal(true);
      localStorage.setItem('hasVisitedBefore', 'true');
    }
    
    // Prefetch commonly accessed pages for faster navigation
    const prefetchLinks = ['/features', '/templates', '/pricing'];
    prefetchLinks.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    });
  }, []);
  
  // Define welcome tooltip content
  const welcomeSteps = [
    { 
      title: "AI-Powered Development", 
      description: "webly.io turns your ideas into clean, optimized code with cutting-edge AI technology.",
      icon: <Terminal className="text-blue-400" />
    },
    { 
      title: "One-Click Deployment", 
      description: "Deploy your projects instantly to production with a single click.",
      icon: <Rocket className="text-purple-400" />
    },
    { 
      title: "Ready-to-Use Templates",
      description: "Start with professionally designed templates or create your own from scratch.",
      icon: <Laptop className="text-pink-400" />
    }
  ];

  return (
    <main className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Main hero section */}
      <Hero />
 
      
     
    </main>
  );
}
