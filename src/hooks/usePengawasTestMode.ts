"use client";
import { useCallback, useSyncExternalStore } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { isPengawasTestAccount, loadPengawasTestState, resetPengawasTestState, savePengawasTestState, type PengawasTestState } from "@/data/pengawas-test";

const cache = new Map<string, PengawasTestState>();
const listeners = new Map<string, Set<() => void>>();
const snapshot = (id: string | null) => {
  if (!id) return null;
  if (!cache.has(id)) cache.set(id, loadPengawasTestState(id));
  return cache.get(id) ?? null;
};

export function usePengawasTestMode() {
  const { user, loading } = useAuthUser();
  const active = !!user && isPengawasTestAccount(user.email, user.isTestUser);
  const userId = active ? user?.id ?? null : null;
  const subscribe = useCallback((notify: () => void) => {
    if (!userId) return () => {};
    const group = listeners.get(userId) ?? new Set<() => void>();
    group.add(notify); listeners.set(userId, group);
    return () => { group.delete(notify); };
  }, [userId]);
  const getSnapshot = useCallback(() => snapshot(userId), [userId]);
  const state = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const setState = useCallback((next: PengawasTestState | ((current: PengawasTestState) => PengawasTestState)) => {
    if (!userId) return;
    const current = snapshot(userId) ?? resetPengawasTestState(userId);
    const updated = typeof next === "function" ? next(current) : next;
    cache.set(userId, updated);
    savePengawasTestState(userId, updated);
    listeners.get(userId)?.forEach((notify) => notify());
  }, [userId]);
  return { active, ready: !loading, state, setState, userId };
}
