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

const pathOf = (id: string) => `/api/pengawas/projects/${id}`;

export function useSupervisorProject(id: string) {
  const [project, setProject] = useState<SupervisorProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /** Muat ulang tanpa menyalakan status loading agar tampilan tidak berkedip. */
  const reload = useCallback(
    () =>
      apiGet<SupervisorProject>(pathOf(id))
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
    [id],
  );

  useEffect(() => {
    let active = true;

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
  }, [id]);

  return { project, loading, error, reload };
}
