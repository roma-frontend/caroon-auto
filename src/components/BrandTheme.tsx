'use client';

import { useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';

// Injects the admin-chosen accent color into the CSS variables live.
export function BrandTheme() {
  const settings = useSettings();
  const accent = settings?.accentColor;

  useEffect(() => {
    const root = document.documentElement;
    const keys = ['--primary', '--ring', '--sidebar-primary'];
    if (accent) keys.forEach((k) => root.style.setProperty(k, accent));
    else keys.forEach((k) => root.style.removeProperty(k));
  }, [accent]);

  return null;
}
