"use client";

/**
 * useSupervisorProject
 *
 * Membaca detail proyek yang diawasi melalui /api/pengawas/projects/[id].
 * `reload()` mengembalikan data terbaru sehingga pemanggil bisa langsung
 * memakainya tanpa menunggu state tersinkron.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, errorMessage } from "@/lib/api";
import type { SupervisorProject } from "@/data/pengawas";
import { syncTestProject, type PengawasTestState } from "@/data/pengawas-test";

const pathOf = (id: string) => `/api/pengawas/projects/${id}`;

export function useSupervisorProject(id: string, localMode = false, localState: PengawasTestState | null = null) {
  const testMode = { active: localMode, state: localState };
  const [project, setProject] = useState<SupervisorProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const localProject = testMode.active && testMode.state && id === testMode.state.project.id ? syncTestProject(testMode.state) : null;

  /** Muat ulang tanpa menyalakan status loading agar tampilan tidak berkedip. */
  const reload = useCallback(
    () => apiGet<SupervisorProject>(pathOf(id))
      .then((data) => {
        setProject(data);
        setError("");
        return data;
      })
      .catch((caught) => {
        console.error("[useSupervisorProject]", caught);
        setError(errorMessage(caught, "Gagal memuat proyek."));
        return null;
      }),
    [id, setError, setProject],
  );

  useEffect(() => {
    let active = true;
    if (testMode.active) return () => { active = false; };

    apiGet<SupervisorProject>(pathOf(id))
      .then((data) => {
        if (!active) return;
        setProject(data);
        setError("");
      })
      .catch((caught) => {
        if (!active) return;
        console.error("[useSupervisorProject]", caught);
        setError(errorMessage(caught, "Gagal memuat proyek."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, testMode.active]);

  return { project: testMode.active ? localProject : project, loading: testMode.active ? false : loading, error: testMode.active ? "" : error, reload: testMode.active ? () => Promise.resolve(localProject) : reload, testMode };
}
