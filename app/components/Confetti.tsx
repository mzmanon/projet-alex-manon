'use client';

import { useEffect, useRef } from 'react';

interface ConfettiProps {
  active: boolean;
  duration?: number; // duration in ms, default 3000 (3s max)
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  shape: 'rect' | 'circle';
}

const COLORS = [
  '#a855f7', // purple
  '#06b6d4', // cyan
  '#34d399', // emerald
  '#fbbf24', // amber/gold
  '#ec4899', // pink
  '#38bdf8', // sky
  '#f43f5e', // rose
];

export default function Confetti({ active, duration = 3000, onComplete }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Spawn particles from two blast points (left & right or center)
    const count = 140;
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      // Half from left cannon, half from right cannon
      const fromLeft = i % 2 === 0;
      const originX = fromLeft ? width * 0.2 : width * 0.8;
      const originY = height * 0.45;

      const angle = fromLeft
        ? (Math.PI * -0.25) + (Math.random() * 0.5 - 0.25)
        : (Math.PI * -0.75) + (Math.random() * 0.5 - 0.25);

      const speed = 14 + Math.random() * 18;

      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed + (Math.random() * 4 - 2),
        vy: Math.sin(angle) * speed - (Math.random() * 5 + 3),
        size: Math.random() * 8 + 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.random() * 0.1 + 0.05,
        shape: Math.random() > 0.3 ? 'rect' : 'circle',
      });
    }

    const startTime = performance.now();
    let animId: number;

    const render = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed >= duration) {
        ctx.clearRect(0, 0, width, height);
        if (onComplete) onComplete();
        return;
      }

      // Smooth fade out in the last 700ms of the 3s window
      const fadeStart = duration - 700;
      const globalAlpha = elapsed > fadeStart ? Math.max(0, 1 - (elapsed - fadeStart) / 700) : 1;

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.globalAlpha = globalAlpha;

      for (const p of particles) {
        // Physics update
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.42; // gravity
        p.vx *= 0.985; // drag
        p.vy *= 0.985;
        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.scale(Math.sin(p.wobble), 1);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (canvas) {
        const c = canvas.getContext('2d');
        if (c) c.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [active, duration, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
