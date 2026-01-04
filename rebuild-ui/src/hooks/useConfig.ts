import { createContext, useContext } from 'react';
import type { AppConfig } from '@/lib/config-source';

// Config context
export const ConfigContext = createContext<AppConfig | null>(null);

export const useConfig = () => useContext(ConfigContext);
