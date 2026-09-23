import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { reconcileActiveRecordingSchedule } from './recorder';
import { emptySnapshot, getSnapshot, type RecorderSnapshot } from './snapshot';

export function useRecorder() {
  const [snapshot, setSnapshot] = useState<RecorderSnapshot>(emptySnapshot);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const refreshGeneration = useRef(0);
  const refresh = useCallback(async () => {
    const generation = ++refreshGeneration.current;
    try {
      const next = await getSnapshot();
      if (isMounted.current && generation === refreshGeneration.current) { setSnapshot(next); setError(null); }
    } catch (failure) {
      if (isMounted.current && generation === refreshGeneration.current) {
        setError(failure instanceof Error ? failure.message : 'Cannot open the recording store.');
      }
    }
  }, []);
  useEffect(() => {
    isMounted.current = true;
    let isEffectActive = true;
    let isRefreshing = false;
    let refreshInterval: ReturnType<typeof setInterval> | null = null;
    const update = async () => {
      if (isRefreshing || AppState.currentState === 'background') return;
      isRefreshing = true;
      try { await refresh(); }
      finally { isRefreshing = false; }
    };
    const resume = async () => {
      try { await reconcileActiveRecordingSchedule('app-resume'); }
      catch (failure) {
        if (isEffectActive) setError(failure instanceof Error ? failure.message : 'Cannot update recording interval.');
        return;
      }
      if (isEffectActive && AppState.currentState !== 'background') await refresh();
    };
    const startRefreshTimer = () => {
      if (refreshInterval !== null) return;
      refreshInterval = setInterval(() => void update(), 60_000);
    };
    const stopRefreshTimer = () => {
      if (refreshInterval !== null) clearInterval(refreshInterval);
      refreshInterval = null;
    };
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') {
        startRefreshTimer();
        void resume();
      } else stopRefreshTimer();
    });
    if (AppState.currentState !== 'background') {
      startRefreshTimer();
      void resume();
    }
    return () => {
      isEffectActive = false;
      isMounted.current = false;
      refreshGeneration.current++;
      stopRefreshTimer();
      listener.remove();
    };
  }, [refresh]);
  return { snapshot, error, refresh };
}
