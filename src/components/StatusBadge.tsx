const styles: Record<string, string> = {
  pending: "bg-zinc-100 text-zinc-700",
  fetched: "bg-sky-50 text-sky-800",
  failed: "bg-red-50 text-red-800",
  adapting: "bg-amber-50 text-amber-800",
  adapted: "bg-emerald-50 text-emerald-800",
  downloaded: "bg-violet-50 text-violet-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.pending}`}
    >
      {status}
    </span>
  );
}
