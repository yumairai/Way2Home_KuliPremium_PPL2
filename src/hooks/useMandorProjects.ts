"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, errorMessage } from "@/lib/api";
import type { MandorProject } from "@/data/mandor";
import { loadMandorTestState, saveMandorTestState } from "@/data/mandor-test";
import { useAuthUser } from "@/hooks/useAuthUser";

export function isMandorTestUser(user: ReturnType<typeof useAuthUser>["user"]) {
  return (
    !!user &&
    user.role === "mandor" &&
    user.isTestUser &&
    [
      "mandor-testing-1@way2home.test",
      "mandor-testing-2@way2home.test",
      "mandor-testing-3@way2home.test",
    ].includes(user.email.toLowerCase())
  );
}

export function useMandorTestMode() {
  const { user, loading } = useAuthUser();
  const isTestMode = isMandorTestUser(user);
  return { isTestMode, loading, userId: user?.id ?? "", user };
}

export function useMandorProjects() {
  const { isTestMode, loading: authLoading, userId } = useMandorTestMode();
  const [projects, setProjects] = useState<MandorProject[]>(() =>
    isTestMode && userId ? [loadMandorTestState(userId).project] : [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isTestMode || !userId) return;
    const sync = () => setProjects([loadMandorTestState(userId).project]);
    window.addEventListener("w2h:mandor-test-updated", sync);
    return () => window.removeEventListener("w2h:mandor-test-updated", sync);
  }, [isTestMode, userId]);

  const reload = useCallback(async () => {
    if (isTestMode && userId) {
      setProjects([loadMandorTestState(userId).project]);
      setError("");
      return;
    }
    try {
      setProjects(await apiGet<MandorProject[]>("/api/mandor/projects"));
      setError("");
    } catch (caught) {
      console.error("[useMandorProjects]", caught);
      setError(errorMessage(caught, "Gagal memuat proyek Anda."));
    }
  }, [isTestMode, userId]);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    if (isTestMode && userId) {
      Promise.resolve().then(() => {
        if (!active) return;
        setProjects([loadMandorTestState(userId).project]);
        setError("");
      });
      return () => {
        active = false;
      };
    }
    apiGet<MandorProject[]>("/api/mandor/projects")
      .then((data) => {
        if (active) {
          setProjects(data);
          setError("");
        }
      })
      .catch((caught) => {
        if (active) {
          console.error("[useMandorProjects]", caught);
          setError(errorMessage(caught, "Gagal memuat proyek Anda."));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authLoading, isTestMode, userId]);

  return {
    projects,
    loading: authLoading || (!isTestMode && loading),
    error,
    reload,
    isTestMode,
    userId,
  };
}

export function useMandorProject(id: string) {
  const { isTestMode, loading: authLoading, userId } = useMandorTestMode();
  const [project, setProject] = useState<MandorProject | null>(() => {
    if (!isTestMode || !userId) return null;
    const localProject = loadMandorTestState(userId).project;
    return id === localProject.id ? localProject : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (isTestMode && userId) {
      const localProject = loadMandorTestState(userId).project;
      setProject(id === localProject.id ? localProject : null);
      return;
    }
    try {
      setProject(await apiGet<MandorProject>(`/api/mandor/projects/${id}`));
      setError("");
    } catch (caught) {
      console.error("[useMandorProject]", caught);
      setError(errorMessage(caught, "Gagal memuat detail proyek."));
    }
  }, [id, isTestMode, userId]);

  useEffect(() => {
    if (!isTestMode || !userId) return;
    const sync = () => {
      const nextProject = loadMandorTestState(userId).project;
      setProject(id === nextProject.id ? nextProject : null);
    };
    window.addEventListener("w2h:mandor-test-updated", sync);
    return () => window.removeEventListener("w2h:mandor-test-updated", sync);
  }, [id, isTestMode, userId]);

  const updateLocalProject = useCallback(
    (updater: (current: MandorProject) => MandorProject) => {
      if (!isTestMode || !userId) return false;
      const current = loadMandorTestState(userId).project;
      const next = updater(current);
      saveMandorTestState(userId, { project: next });
      setProject(next);
      return true;
    },
    [isTestMode, userId],
  );

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    if (isTestMode && userId) {
      Promise.resolve().then(() => {
        if (!active) return;
        const localProject = loadMandorTestState(userId).project;
        setProject(id === localProject.id ? localProject : null);
        setError("");
      });
      return () => {
        active = false;
      };
    }
    apiGet<MandorProject>(`/api/mandor/projects/${id}`)
      .then((data) => {
        if (active) {
          setProject(data);
          setError("");
        }
      })
      .catch((caught) => {
        if (active) {
          console.error("[useMandorProject]", caught);
          setError(errorMessage(caught, "Gagal memuat detail proyek."));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, authLoading, isTestMode, userId]);

  const resolvedProject =
    isTestMode && userId
      ? (() => {
          const localProject = loadMandorTestState(userId).project;
          return id === localProject.id ? localProject : null;
        })()
      : project;

  return {
    project: resolvedProject,
    loading: authLoading || (!isTestMode && loading),
    error,
    reload,
    isTestMode,
    userId,
    updateLocalProject,
  };
}
