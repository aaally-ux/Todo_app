export function getToday() {
  return formatDate(new Date());
}

export function getTomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return formatDate(date);
}

export function getDateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getCurrentTimeString() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function isWithinNext7Days(dateStr) {
  if (!dateStr) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const limit = new Date();
  limit.setDate(limit.getDate() + 7);
  limit.setHours(23, 59, 59, 999);

  const date = new Date(dateStr);
  return date >= tomorrow && date <= limit;
}

export function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

export function escapeHTML(value) {
  if (!value) return "";
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}