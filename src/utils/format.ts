export const formatRupiah = (value: number) =>
  `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;

export const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));

/** "2026-10-15 08:35:00+07" -> "15 Okt 2026, 08.35" */
export const formatDateTimeComma = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));

/** "2026-10-15 08:35:00+07" -> "15 Okt 2026 · 08.35" */
export const formatDateTimeDot = (iso: string) => {
  const date = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
    new Date(iso),
  );
  const time = new Intl.DateTimeFormat("id-ID", { timeStyle: "short" }).format(
    new Date(iso),
  );
  return `${date} · ${time}`;
};

/** "2026-10-15" | iso -> "15 Okt" */
export const formatMonthDay = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(
    new Date(iso),
  );

/** "2026-09-02" -> "2 Sep 2026" (aman untuk kolom date-only) */
export const formatDateOnly = (iso: string) => {
  const safe = iso.length === 10 ? `${iso}T00:00:00` : iso;
  return formatDate(safe);
};

