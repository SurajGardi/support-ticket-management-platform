export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  // Ensure UTC is parsed correctly by appending Z if not present
  const utcStr = dateStr.endsWith("Z") ? dateStr : dateStr + "Z";
  const date = new Date(utcStr);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const utcStr = dateStr.endsWith("Z") ? dateStr : dateStr + "Z";
  const date = new Date(utcStr);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}