import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode } from '../types';

interface ThemeState {
  primaryColor: string;
  borderRadius: number;
  mode: ThemeMode;
  setTheme: (config: Partial<{ primaryColor: string; borderRadius: number; mode: ThemeMode }>) => void;
  setMode: (mode: ThemeMode) => void;
  cycleMode: () => void;
  getEffectiveMode: () => 'light' | 'dark';
  // Legacy compatibility
  darkMode: boolean;
  toggleDarkMode: () => void;
}

// Get system preference
const getSystemPreference = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// Apply theme to document
const applyTheme = (mode: ThemeMode) => {
  if (typeof document === 'undefined') return;

  const effectiveMode = mode === 'system' ? getSystemPreference() : mode;

  if (effectiveMode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      primaryColor: '#1677ff',
      borderRadius: 6,
      mode: 'system' as ThemeMode,
      setTheme: (config) => {
        set((state) => ({ ...state, ...config }));
        if (config.mode) {
          applyTheme(config.mode);
        }
      },
      setMode: (mode) => {
        set({ mode });
        applyTheme(mode);
      },
      cycleMode: () => {
        const modes: ThemeMode[] = ['light', 'dark', 'system'];
        const currentIndex = modes.indexOf(get().mode);
        const nextIndex = (currentIndex + 1) % modes.length;
        const newMode = modes[nextIndex];
        set({ mode: newMode });
        applyTheme(newMode);
      },
      getEffectiveMode: () => {
        const mode = get().mode;
        if (mode === 'system') {
          return getSystemPreference();
        }
        return mode;
      },
      // Legacy compatibility - computed property
      get darkMode() {
        const mode = get().mode;
        if (mode === 'system') {
          return getSystemPreference() === 'dark';
        }
        return mode === 'dark';
      },
      toggleDarkMode: () => {
        get().cycleMode();
      },
    }),
    {
      name: 'rebuild-theme',
      // Only persist these fields
      partialize: (state) => ({
        primaryColor: state.primaryColor,
        borderRadius: state.borderRadius,
        mode: state.mode,
      }),
      // Apply theme on rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.mode);
        }
      },
    }
  )
);

// Apply theme immediately on load (before React hydration)
if (typeof window !== 'undefined') {
  // Try to get stored theme
  const stored = localStorage.getItem('rebuild-theme');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const mode = parsed.state?.mode || 'system';
      applyTheme(mode);
    } catch {
      applyTheme('system');
    }
  } else {
    applyTheme('system');
  }

  // Subscribe to system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const store = useThemeStore.getState();
    if (store.mode === 'system') {
      applyTheme('system');
    }
  });
}
