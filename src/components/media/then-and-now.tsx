'use client';

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ThenAndNowProps {
  childhoodSrc: string;
  currentSrc: string;
  name: string;
  className?: string;
}

export function ThenAndNow({ childhoodSrc, currentSrc, name, className }: ThenAndNowProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.min(Math.max((x / rect.width) * 100, 5), 95);
    setPosition(pct);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative aspect-[3/4] rounded-2xl overflow-hidden select-none touch-none cursor-col-resize',
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Current photo (right / full) */}
      <img
        src={currentSrc}
        alt={`${name} now`}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Childhood photo (left, clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img
          src={childhoodSrc}
          alt={`${name} then`}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: `${containerRef.current?.offsetWidth || 300}px` }}
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-3 bg-warm-gray rounded-full" />
            <div className="w-0.5 h-3 bg-warm-gray rounded-full" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-3 left-3 bg-night/70 backdrop-blur-sm px-2.5 py-1 rounded-lg">
        <span className="text-white text-xs font-medium">Then</span>
      </div>
      <div className="absolute bottom-3 right-3 bg-night/70 backdrop-blur-sm px-2.5 py-1 rounded-lg">
        <span className="text-white text-xs font-medium">Now</span>
      </div>
    </div>
  );
}
