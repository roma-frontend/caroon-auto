'use client';

import { useSettings } from '@/hooks/useSettings';
import Image from 'next/image';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 36, className }: LogoProps) {
  const settings = useSettings();

  if (settings?.logoUrl) {
    return <Image src={settings.logoUrl} alt="Logo" width={size} height={size} className={className} style={{ objectFit: 'contain' }} />;
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="7" fill="#0F6CBD" />
      <path d="M10 14 L12 10 L20 10 L22 14 Z" fill="white" />
      <rect x="7" y="14" width="18" height="8" rx="1.5" fill="white" />
      <path d="M11 14 L12.5 11 L19.5 11 L21 14 Z" fill="#0F6CBD" />
      <rect x="8" y="16" width="4" height="2.5" rx="1" fill="#FFD700" />
      <rect x="20" y="16" width="4" height="2.5" rx="1" fill="#FFD700" />
      <rect x="13" y="16.5" width="6" height="2" rx="0.5" fill="#0F6CBD" />
      <circle cx="11" cy="23" r="3" fill="#0F6CBD" stroke="white" strokeWidth="1.5" />
      <circle cx="11" cy="23" r="1.2" fill="white" />
      <circle cx="21" cy="23" r="3" fill="#0F6CBD" stroke="white" strokeWidth="1.5" />
      <circle cx="21" cy="23" r="1.2" fill="white" />
    </svg>
  );
}
