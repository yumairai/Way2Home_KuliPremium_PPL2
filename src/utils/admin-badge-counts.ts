export const ADMIN_BADGE_COUNTS_REFRESH_EVENT = "admin-badge-counts-refresh";

export function refreshAdminBadgeCounts() {
  window.dispatchEvent(new Event(ADMIN_BADGE_COUNTS_REFRESH_EVENT));
}
