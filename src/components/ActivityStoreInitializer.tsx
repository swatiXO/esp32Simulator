// components/ActivityStoreInitializer.tsx

'use client';

import { useEffect } from 'react';
import { useActivityStore } from '@/store/useActivityStore';
import { useAppStore } from '@/store/useAppStore';
import { useSimulatorStore } from '@/store/useSimulatorStore';
import { createClient } from '@/utils/supabase/client';

/**
 * Coordinates initialization and reset of stores based on authentication state.
 *
 * Initializes the activity store on mount if not already initialized. Subscribes to
 * Supabase authentication state changes, resetting all relevant stores on sign out
 * and reinitializing them on sign in.
 */
export default function ActivityStoreInitializer() {
  const initialize = useActivityStore((s) => s.initialize);
  const initialized = useActivityStore((s) => s.isInitialized);
  const resetActivityStore = useActivityStore((s) => s.resetStore);

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  useEffect(() => {
    const supabase = createClient();
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        resetActivityStore();
        useAppStore.getState().resetStore();
        useSimulatorStore.getState().resetSimulation();
      } else if (event === 'SIGNED_IN') {
        initialize();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [initialize, resetActivityStore]);

  return null;
}