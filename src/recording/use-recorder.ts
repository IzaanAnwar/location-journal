import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { emptySnapshot, getSnapshot, type RecorderSnapshot } from './snapshot';

export function useRecorder() {
  const [snapshot, setSnapshot] = useState<RecorderSnapshot>(emptySnapshot);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try { setSnapshot(await getSnapshot()); setError(null); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Cannot open the recording store.'); }
  }, []);
  useEffect(() => {
    let isMounted = true;
    let isRefreshing = false;
    const update = async () => {
      if (isRefreshing || AppState.currentState === 'background') return;
      isRefreshing = true;
      try {
        const next = await getSnapshot();
        if (isMounted) { setSnapshot(next); setError(null); }
      } catch (failure) {
        if (isMounted) setError(failure instanceof Error ? failure.message : 'Cannot open the recording store.');
      } finally { isRefreshing = false; }
    };
    void update();
    const interval = setInterval(() => void update(), 5_000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void update(); });
    return () => { isMounted = false; clearInterval(interval); listener.remove(); };
  }, []);
  return { snapshot, error, refresh };
}
