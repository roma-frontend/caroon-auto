'use client';

import React, { createContext, useContext } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Doc } from '../../convex/_generated/dataModel';

type PublicSettings = Omit<Doc<'settings'>, 'telegramBotToken' | 'telegramChatId'> | null | undefined;

const SettingsContext = createContext<PublicSettings>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const settings = useQuery(api.settings.getPublic, {});
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): PublicSettings {
  return useContext(SettingsContext);
}
