'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface CelebrationAnimationProps {
  trigger: boolean; // Se activa cuando improvement > 15%
  improvement: boolean;
  deltaPercentage: number;
}

export function CelebrationAnimation({ trigger, improvement, deltaPercentage }: CelebrationAnimationProps) {
  useEffect(() => {
    if (trigger && improvement && Math.abs(deltaPercentage) >= 15) {
      // Configuración de confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Lanzar confetti desde ambos lados
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0']
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [trigger, improvement, deltaPercentage]);

  return null; // Este componente no renderiza nada visible
}
