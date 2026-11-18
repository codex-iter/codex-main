import React, { useEffect, useRef, useState } from 'react';
import './HoloCard.css';

export interface HoloCardProps {
  image?: string;
  fallbackImage?: string;
  alt?: string;
  width?: number | string;
  radius?: number;
  tiltMax?: number;
  hoverScale?: number;
  shadow?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const PERSPECTIVE = 1100;

function spring(pos: number, vel: number, target: number, stiff: number, damp: number, dt: number): [number, number] {
  const f = -stiff * (pos - target) - damp * vel;
  const nVel = vel + f * dt;
  const nPos = pos + nVel * dt;
  return [nPos, nVel];
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export default function HoloCard({
  image,
  fallbackImage,
  alt = '',
  width = 320,
  radius = 16,
  tiltMax = 14,
  hoverScale = 1.04,
  shadow = true,
  className = '',
  style,
  children
}: HoloCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const rotorRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLSpanElement>(null);

  const [imgSrc, setImgSrc] = useState<string | undefined>(image || fallbackImage);
  const [ratio, setRatio] = useState<number>(1);

  const pointerRef = useRef({ x: 0.5, y: 0.5, inside: false });
  const wakeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setImgSrc(image || fallbackImage);
  }, [image, fallbackImage]);

  // Automatically adjust aspect ratio to fit the picture
  useEffect(() => {
    if (!imgSrc) return;
    let active = true;
    const img = new Image();
    img.onload = () => {
      if (!active) return;
      if (img.naturalWidth && img.naturalHeight) {
        setRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.onerror = () => {
      if (!active) return;
      if (fallbackImage && imgSrc !== fallbackImage) {
        setImgSrc(fallbackImage);
      }
    };
    img.src = imgSrc;
    return () => {
      active = false;
    };
  }, [imgSrc, fallbackImage]);

  // 3D Perspective tilt & hover physics
  useEffect(() => {
    const root = rootRef.current;
    const rotor = rotorRef.current;
    if (!root || !rotor) return undefined;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const state = {
      tiltX: 0,
      tiltY: 0,
      tiltVX: 0,
      tiltVY: 0,
      lift: 1,
      liftV: 0
    };
    let raf = 0;
    let last = 0;
    let visible = true;
    let alive = true;
    let calm = 0;

    const wake = () => {
      calm = 0;
      if (!raf && alive && visible) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    wakeRef.current = wake;

    const loop = (now: number) => {
      raf = 0;
      if (!alive || !visible) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const pointer = pointerRef.current;
      let targetX = 0;
      let targetY = 0;
      let lift = 1;

      if (pointer.inside && !reduce) {
        targetX = -(pointer.y - 0.5) * tiltMax;
        targetY = (pointer.x - 0.5) * tiltMax;
        lift = hoverScale;
      }

      const steps = Math.ceil(dt / (1 / 240));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        [state.tiltX, state.tiltVX] = spring(state.tiltX, state.tiltVX, targetX, 150, 16, h);
        [state.tiltY, state.tiltVY] = spring(state.tiltY, state.tiltVY, targetY, 150, 16, h);
        [state.lift, state.liftV] = spring(state.lift, state.liftV, lift, 320, 30, h);
      }

      rotor.style.transform = `perspective(${PERSPECTIVE}px) scale(${state.lift}) rotateX(${state.tiltX}deg) rotateY(${state.tiltY}deg)`;
      if (shadowRef.current) {
        shadowRef.current.style.transform = `translate(${-state.tiltY * 0.7}px, ${state.tiltX * 0.7}px) scale(${0.9 + (state.lift - 1) * 1.5})`;
      }

      const motion =
        Math.abs(state.tiltVX) +
        Math.abs(state.tiltVY) +
        Math.abs(state.liftV) * 40 +
        Math.abs(state.tiltX - targetX) +
        Math.abs(state.tiltY - targetY);

      if (motion < 0.005) {
        calm++;
        if (calm > 30 && !pointer.inside) {
          state.tiltX = targetX;
          state.tiltY = targetY;
          state.tiltVX = 0;
          state.tiltVY = 0;
          state.lift = lift;
          state.liftV = 0;
          rotor.style.transform = `perspective(${PERSPECTIVE}px) scale(${state.lift}) rotateX(${state.tiltX}deg) rotateY(${state.tiltY}deg)`;
          return;
        }
      } else {
        calm = 0;
      }
      raf = requestAnimationFrame(loop);
    };

    const visibility = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) wake();
    });
    visibility.observe(root);
    wake();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      visibility.disconnect();
    };
  }, [tiltMax, hoverScale]);

  const track = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' && e.type === 'pointermove' && !e.buttons) return;
    const rect = e.currentTarget.getBoundingClientRect();
    pointerRef.current = {
      x: clamp((e.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((e.clientY - rect.top) / rect.height, 0, 1),
      inside: true
    };
    wakeRef.current?.();
  };

  const leave = () => {
    pointerRef.current = { ...pointerRef.current, inside: false };
    wakeRef.current?.();
  };

  return (
    <div
      ref={rootRef}
      className={`holo-card${className ? ` ${className}` : ''}`}
      role="img"
      aria-label={alt || undefined}
      onPointerEnter={track}
      onPointerMove={track}
      onPointerDown={track}
      onPointerLeave={leave}
      onPointerCancel={leave}
      style={{
        // @ts-expect-error CSS custom properties
        '--hc-w': typeof width === 'number' ? `${width}px` : width,
        '--hc-ratio': ratio,
        '--hc-radius': `${radius}px`,
        ...style
      }}
    >
      {shadow ? <span ref={shadowRef} className="holo-card__shadow" aria-hidden="true" /> : null}
      <div ref={rotorRef} className="holo-card__rotor">
        <div className="holo-card__face holo-card__face--front">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={alt || ''}
              draggable={false}
              onError={() => {
                if (fallbackImage && imgSrc !== fallbackImage) {
                  setImgSrc(fallbackImage);
                }
              }}
            />
          ) : null}
          {children && (
            <div className="holo-card__content">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
