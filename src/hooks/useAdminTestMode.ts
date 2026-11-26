"use client";
import { useCallback, useSyncExternalStore } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { isAdminTestAccount, loadAdminTestState, resetAdminTestState, saveAdminTestState, subscribeAdminTestState, type AdminTestState } from "@/data/admin-test";

export function useAdminTestMode() {
  const { user, loading } = useAuthUser();
  const active = !!user && isAdminTestAccount(user.email, user.isTestUser);
  const userId = active ? user?.id ?? null : null;
  const subscribe = useCallback((notify: () => void) => userId ? subscribeAdminTestState(userId, notify) : () => {}, [userId]);
  const getSnapshot = useCallback(() => userId ? loadAdminTestState(userId) : null, [userId]);
  const state = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const setState = useCallback((next: AdminTestState | ((current: AdminTestState) => AdminTestState)) => {
    if (!userId) return;
    const current = loadAdminTestState(userId);
    saveAdminTestState(userId, typeof next === "function" ? next(current) : next);
  }, [userId]);
  const reset = useCallback(() => userId ? resetAdminTestState(userId) : null, [userId]);
  return { active, ready: !loading, state: userId && state ? state : null, setState, reset, userId };
}
