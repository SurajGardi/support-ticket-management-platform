export default function StatusBadge({ status }) {
  const styles = {
    open: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-200 text-gray-700",
  };

  const label = status?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {label}
    </span>
  );
}