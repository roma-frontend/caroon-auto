'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';

interface Props {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  sizes?: string;
  className?: string;
}

export function ProductImageZoom({ src, alt, width, height, priority, sizes, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lensStyle, setLensStyle] = useState<React.CSSProperties>({ display: 'none' });
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ display: 'none' });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const lensSize = 100;
    const lensLeft = Math.max(0, Math.min(rect.width - lensSize, e.clientX - rect.left - lensSize / 2));
    const lensTop = Math.max(0, Math.min(rect.height - lensSize, e.clientY - rect.top - lensSize / 2));

    setLensStyle({
      display: 'block',
      left: lensLeft,
      top: lensTop,
      width: lensSize,
      height: lensSize,
    });
    setZoomStyle({
      display: 'block',
      backgroundImage: `url(${src})`,
      backgroundSize: `${rect.width * 2}px ${rect.height * 2}px`,
      backgroundPosition: `-${x * 2 - 50}% -${y * 2 - 50}%`,
    });
  }, [src]);

  const handleMouseLeave = useCallback(() => {
    setLensStyle({ display: 'none' });
    setZoomStyle({ display: 'none' });
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden cursor-crosshair ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Image src={src} alt={alt} width={width} height={height} priority={priority} sizes={sizes} className="h-full w-full object-cover select-none" draggable={false} />
      <div className="pointer-events-none absolute border-2 border-primary/40 bg-white/10" style={lensStyle} />
      <div className="pointer-events-none fixed z-[9999] h-72 w-72 rounded-xl border-2 border-border bg-white shadow-2xl dark:bg-neutral-900" style={zoomStyle} />
    </div>
  );
}
