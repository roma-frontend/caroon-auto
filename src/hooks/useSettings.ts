'use client';

import { useSettings as useContextSettings } from '@/components/SettingsProvider';

export function useSettings() {
  return useContextSettings();
}
