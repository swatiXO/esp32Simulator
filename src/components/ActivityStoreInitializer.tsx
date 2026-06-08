// components/ActivityStoreInitializer.tsx

'use client';

import { useEffect } from 'react';
import { useActivityStore } from '@/store/useActivityStore';

export default function ActivityStoreInitializer() {
  const initialize = useActivityStore((s) => s.initialize);
  const initialized = useActivityStore((s) => s.isIntialized);

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  return null;
}