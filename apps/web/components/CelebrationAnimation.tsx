'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface CelebrationAnimationProps {
  trigger: boolean; // Se activa cuando improvement > 15%
  improvement: boolean;
  deltaPercentage: number;
}

export function CelebrationAnimation({ trigger, improvement, deltaPercentage }: CelebrationAnimationProps) {
  const [hasCelebrated, setHasCelebrated] = useState(false);

  useEffect(() => {
    // Verificar si ya celebramos en esta sesión
    const celebrationKey = `celebrated_${Math.abs(deltaPercentage).toFixed(1)}`;
    const alreadyCelebrated = sessionStorage.getItem(celebrationKey);

    if (trigger && improvement && Math.abs(deltaPercentage) >= 15 && !alreadyCelebrated && !hasCelebrated) {
      // Marcar como celebrado
      setHasCelebrated(true);
      sessionStorage.setItem(celebrationKey, 'true');

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
  }, [trigger, improvement, deltaPercentage, hasCelebrated]);

  return null; // Este componente no renderiza nada visible
}
