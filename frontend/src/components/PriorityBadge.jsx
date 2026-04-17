export default function PriorityBadge({ priority }) {
  const styles = {
    high: "text-red-600 font-bold",
    medium: "text-yellow-600 font-bold",
    low: "text-green-600 font-bold",
  };

  const icons = {
    high: "🔴",
    medium: "🟡",
    low: "🟢",
  };

  return (
    <span className={styles[priority] || ""}>
      {icons[priority]} {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
    </span>
  );
}