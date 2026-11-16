"use client";

/**
 * useMandorProjects / useMandorProject
 *
 * Membaca data backend alur Mandor -> Pengawas melalui /api/mandor/*.
 * Seluruh pembacaan dijalankan server dengan RLS milik mandor.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, errorMessage } from "@/lib/api";
import type { MandorProject } from "@/data/mandor";

export function useMandorProjects() {
  const [projects, setProjects] = useState<MandorProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /** Muat ulang tanpa menyalakan status loading agar tampilan tidak berkedip. */
  const reload = useCallback(
    () =>
      apiGet<MandorProject[]>("/api/mandor/projects")
        .then((data) => {
          setProjects(data);
          setError("");
        })
        .catch((caught) => {
          console.error("[useMandorProjects]", caught);
          setError(errorMessage(caught, "Gagal memuat proyek Anda."));
        }),
    [],
  );

  useEffect(() => {
    let active = true;

    apiGet<MandorProject[]>("/api/mandor/projects")
      .then((data) => {
        if (!active) return;
        setProjects(data);
        setError("");
      })
      .catch((caught) => {
        if (!active) return;
        console.error("[useMandorProjects]", caught);
        setError(errorMessage(caught, "Gagal memuat proyek Anda."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { projects, loading, error, reload };
}

export function useMandorProject(id: string) {
  const [project, setProject] = useState<MandorProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(
    () =>
      apiGet<MandorProject>(`/api/mandor/projects/${id}`)
        .then((data) => {
          setProject(data);
          setError("");
        })
        .catch((caught) => {
          console.error("[useMandorProject]", caught);
          setError(errorMessage(caught, "Gagal memuat detail proyek."));
        }),
    [id],
  );

  useEffect(() => {
    let active = true;

    apiGet<MandorProject>(`/api/mandor/projects/${id}`)
      .then((data) => {
        if (!active) return;
        setProject(data);
        setError("");
      })
      .catch((caught) => {
        if (!active) return;
        console.error("[useMandorProject]", caught);
        setError(errorMessage(caught, "Gagal memuat detail proyek."));
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
