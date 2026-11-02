import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { defaultClickFx, gameCustomization, type ClickFx } from '../games/registry';

interface Particle {
  angle: number; // direction of travel, degrees
  dist: number; // px flown outward
  size: number; // px
  color: string;
}

interface Burst {
  id: number;
  x: number;
  y: number;
  particles: Particle[];
}

const COUNT = 8;
const LIFE_MS = 650;

function spawnParticles(colors: string[]): Particle[] {
  return Array.from({ length: COUNT }, (_, i) => ({
    angle: (360 / COUNT) * i + Math.random() * 24,
    dist: 26 + Math.random() * 38,
    size: 9 + Math.random() * 9,
    color: colors[i % colors.length],
  }));
}

/** Radial burst of game-themed glyphs on every click (halos for BA, stars for SS). */
export default function ClickFx() {
  const { pathname } = useLocation();
  const fx: ClickFx = gameCustomization(pathname.split('/')[2] ?? '').clickFx ?? defaultClickFx;
  const [bursts, setBursts] = useState<Burst[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const id = nextId.current++;
      const particles = spawnParticles(fx.colors);
      setBursts((b) => [...b.slice(-4), { id, x: e.clientX, y: e.clientY, particles }]);
      setTimeout(() => setBursts((b) => b.filter((burst) => burst.id !== id)), LIFE_MS);
    };
    window.addEventListener('pointerdown', onDown, { passive: true });
    return () => window.removeEventListener('pointerdown', onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fx colors are frozen at spawn; the glyph renders fresh
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {bursts.map((burst) => (
        <span key={burst.id} className="absolute" style={{ left: burst.x, top: burst.y }}>
          {burst.particles.map((p, i) => (
            <span
              key={i}
              className="fx-particle"
              style={{
                width: p.size,
                height: p.size,
                color: p.color,
                ['--angle' as string]: `${p.angle}deg`,
                ['--dist' as string]: `${p.dist}px`,
              }}
            >
              <fx.Glyph className="size-full" />
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}
