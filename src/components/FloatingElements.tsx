import React from 'react';
import { Brain, TrendingUp, Target, Zap } from 'lucide-react';

export const FloatingElements: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Floating Icons */}
      <div className="absolute top-1/4 left-1/4 animate-float opacity-10">
        <Brain className="w-12 h-12 text-primary" style={{ animationDelay: '0s' }} />
      </div>
      
      <div className="absolute top-1/3 right-1/4 animate-float opacity-10">
        <TrendingUp className="w-10 h-10 text-accent" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="absolute bottom-1/3 left-1/3 animate-float opacity-10">
        <Target className="w-8 h-8 text-success" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="absolute bottom-1/4 right-1/3 animate-float opacity-10">
        <Zap className="w-14 h-14 text-warning" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-1/5 left-1/5 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-float opacity-30" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-2/3 right-1/5 w-24 h-24 bg-accent/20 rounded-full blur-3xl animate-float opacity-30" style={{ animationDelay: '2.5s' }} />
      <div className="absolute bottom-1/5 left-2/3 w-20 h-20 bg-success/20 rounded-full blur-3xl animate-float opacity-30" style={{ animationDelay: '1.8s' }} />
    </div>
  );
};