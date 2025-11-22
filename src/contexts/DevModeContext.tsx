import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DevModeContextType {
  isDevelopmentMode: boolean;
  toggleMode: () => Promise<void>;
  loading: boolean;
}

const DevModeContext = createContext<DevModeContextType | undefined>(undefined);

const DEV_MODE_KEY = '@sento_dev_mode';

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(true); // Default to dev mode
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevMode();
  }, []);

  const loadDevMode = async () => {
    try {
      const stored = await AsyncStorage.getItem(DEV_MODE_KEY);
      if (stored !== null) {
        setIsDevelopmentMode(stored === 'true');
      }
    } catch (error) {
      console.error('Error loading dev mode:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = async () => {
    try {
      const newMode = !isDevelopmentMode;
      await AsyncStorage.setItem(DEV_MODE_KEY, String(newMode));
      setIsDevelopmentMode(newMode);
    } catch (error) {
      console.error('Error toggling dev mode:', error);
    }
  };

  return (
    <DevModeContext.Provider value={{ isDevelopmentMode, toggleMode, loading }}>
      {children}
    </DevModeContext.Provider>
  );
}

export function useDevMode() {
  const context = useContext(DevModeContext);
  if (context === undefined) {
    throw new Error('useDevMode must be used within a DevModeProvider');
  }
  return context;
}
